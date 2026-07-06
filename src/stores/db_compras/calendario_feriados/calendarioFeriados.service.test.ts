import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedGetSession = vi.hoisted(() => vi.fn(async () => ({
  data: {
    session: {
      access_token: 'token-test',
    },
  },
})));

vi.mock('@/lib/supabase', () => ({
  supabaseCompras: {
    auth: {
      getSession: mockedGetSession,
    },
  },
  supabaseComprasAnonKey: 'anon-test',
  supabaseComprasUrl: 'https://compras.test.supabase.co',
}));

import { calendarioFeriadosService } from './calendarioFeriados.service';

describe('calendarioFeriados.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mueve al lunes los feriados que caen domingo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        year: 2027,
        holidays: ['2027-12-19'],
      }),
    })));

    const response = await calendarioFeriadosService.obtenerPorAnio(2027);

    expect(response.holidays).toEqual(['2027-12-20']);
  });
});
