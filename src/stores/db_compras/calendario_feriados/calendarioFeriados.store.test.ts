import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedCalendarioResponses = vi.hoisted(() => ({
  byYear: new Map<number, { year: number; holidays: string[] }>(),
}));

vi.mock('./calendarioFeriados.service', () => ({
  calendarioFeriadosService: {
    obtenerPorAnio: vi.fn(async (year: number) => (
      mockedCalendarioResponses.byYear.get(year) ?? { year, holidays: [] }
    )),
  },
}));

import { useCalendarioFeriadosStore } from './calendarioFeriados.store';

describe('calendarioFeriados.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockedCalendarioResponses.byYear.clear();
  });

  it('guarda en el bucket del año real cuando un feriado observado cruza de año', async () => {
    mockedCalendarioResponses.byYear.set(2028, {
      year: 2028,
      holidays: ['2029-01-01'],
    });
    const store = useCalendarioFeriadosStore();

    await store.ensureYear(2028);

    expect(store.getHolidaysForYear(2028)).toEqual([]);
    expect(store.getHolidaysForYear(2029)).toEqual(['2029-01-01']);
  });
});
