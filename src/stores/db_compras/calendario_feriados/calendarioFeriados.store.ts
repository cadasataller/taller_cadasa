import { defineStore } from 'pinia';

import { calendarioFeriadosService } from './calendarioFeriados.service';
import type { CalendarioFeriadosState } from './calendarioFeriados.types';

const pendingRequestsByYear = new Map<number, Promise<string[]>>();

const createInitialState = (): CalendarioFeriadosState => ({
  holidaysByYear: {},
  loadingYears: [],
  errorByYear: {},
});

const getHolidayYearKey = (value: string): string => {
  const year = value.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : '';
};

export const useCalendarioFeriadosStore = defineStore('calendarioFeriados', {
  state: (): CalendarioFeriadosState => createInitialState(),

  getters: {
    getHolidaysForYear: (state) => (year: number): string[] => state.holidaysByYear[String(year)] ?? [],
    hasYearLoaded: (state) => (year: number): boolean => Array.isArray(state.holidaysByYear[String(year)]),
    isYearLoading: (state) => (year: number): boolean => state.loadingYears.includes(String(year)),
  },

  actions: {
    async ensureYear(year: number): Promise<string[]> {
      if (this.hasYearLoaded(year)) {
        return this.getHolidaysForYear(year);
      }

      const pendingRequest = pendingRequestsByYear.get(year);
      if (pendingRequest) {
        return pendingRequest;
      }

      const yearKey = String(year);
      this.loadingYears = [...new Set([...this.loadingYears, yearKey])];
      this.errorByYear = {
        ...this.errorByYear,
        [yearKey]: null,
      };

      const request = calendarioFeriadosService
        .obtenerPorAnio(year)
        .then((response) => {
          const nextHolidaysByYear = { ...this.holidaysByYear };

          if (!nextHolidaysByYear[yearKey]) {
            nextHolidaysByYear[yearKey] = [];
          }

          response.holidays.forEach((holiday) => {
            const holidayYearKey = getHolidayYearKey(holiday);

            if (!holidayYearKey) {
              return;
            }

            nextHolidaysByYear[holidayYearKey] = [
              ...new Set([
                ...(nextHolidaysByYear[holidayYearKey] ?? []),
                holiday,
              ]),
            ].sort();
          });

          this.holidaysByYear = nextHolidaysByYear;

          return this.holidaysByYear[yearKey] ?? [];
        })
        .catch((error) => {
          const message = error instanceof Error
            ? error.message
            : `No se pudieron obtener los feriados de ${year}`;

          this.errorByYear = {
            ...this.errorByYear,
            [yearKey]: message,
          };

          throw error;
        })
        .finally(() => {
          this.loadingYears = this.loadingYears.filter((item) => item !== yearKey);
          pendingRequestsByYear.delete(year);
        });

      pendingRequestsByYear.set(year, request);
      return request;
    },

    async ensureYears(years: number[]): Promise<void> {
      const uniqueYears = [...new Set(years)];
      await Promise.all(uniqueYears.map((year) => this.ensureYear(year)));
    },

    reset(): void {
      Object.assign(this, createInitialState());
      pendingRequestsByYear.clear();
    },
  },
});
