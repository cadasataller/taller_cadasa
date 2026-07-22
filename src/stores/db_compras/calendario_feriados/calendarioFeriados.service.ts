import {
  supabaseCompras,
  supabaseComprasAnonKey,
  supabaseComprasUrl,
} from '@/lib/supabase';

import type { CalendarioFeriadosResponse } from './calendarioFeriados.types';

const EDGE_FUNCTION_NAME = 'dias_feriado';
const EDGE_FUNCTION_PATH = `${supabaseComprasUrl}/functions/v1/${EDGE_FUNCTION_NAME}`;

const parseIsoDate = (value: string): Date | null => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateForDb = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const normalizeObservedHoliday = (value: string): string | null => {
  const parsedDate = parseIsoDate(value);

  if (!parsedDate) {
    return null;
  }

  if (parsedDate.getDay() !== 0) {
    return value;
  }

  const observedDate = new Date(parsedDate);
  observedDate.setDate(observedDate.getDate() + 1);
  return formatDateForDb(observedDate);
};

const normalizeCalendarioFeriadosResponse = (
  payload: unknown,
  fallbackYear: number
): CalendarioFeriadosResponse => {
  if (!payload || typeof payload !== 'object') {
    return {
      year: fallbackYear,
      holidays: [],
    };
  }

  const maybeYear = 'year' in payload && typeof payload.year === 'number'
    ? payload.year
    : fallbackYear;
  const maybeHolidays = 'holidays' in payload && Array.isArray(payload.holidays)
    ? payload.holidays
      .filter((item): item is string => typeof item === 'string')
      .map((item) => normalizeObservedHoliday(item))
      .filter((item): item is string => typeof item === 'string')
    : [];

  return {
    year: maybeYear,
    holidays: [...new Set(maybeHolidays)].sort(),
  };
};

export const calendarioFeriadosService = {
  async obtenerPorAnio(year: number): Promise<CalendarioFeriadosResponse> {
    const { data: sessionData } = await supabaseCompras.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const requestUrl = new URL(EDGE_FUNCTION_PATH);
    requestUrl.searchParams.set('year', String(year));

    const response = await fetch(requestUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        apikey: supabaseComprasAnonKey,
        Authorization: `Bearer ${accessToken || supabaseComprasAnonKey}`,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = payload
        && typeof payload === 'object'
        && 'error' in payload
        && typeof payload.error === 'string'
        ? payload.error
        : `No se pudieron obtener los feriados de ${year}`;

      throw new Error(errorMessage);
    }

    return normalizeCalendarioFeriadosResponse(payload, year);
  },
};
