import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke } },
}));

import { mapsCredentialsService } from './mapsCredentials.service';

describe('mapsCredentialsService', () => {
  beforeEach(() => {
    mapsCredentialsService.clear();
    invoke.mockReset();
  });

  it('maps internal primary and secondary slots to the documented maps-key payload', async () => {
    invoke
      .mockResolvedValueOnce({ data: { apiKey: 'primary-key', userId: 'user-1' }, error: null })
      .mockResolvedValueOnce({ data: { apiKey: 'secondary-key', userId: 'user-1' }, error: null });

    await expect(mapsCredentialsService.getKey('primary')).resolves.toBe('primary-key');
    await expect(mapsCredentialsService.getKey('secondary')).resolves.toBe('secondary-key');

    expect(invoke).toHaveBeenNthCalledWith(1, 'maps-key', { body: { errokey: false } });
    expect(invoke).toHaveBeenNthCalledWith(2, 'maps-key', { body: { errokey: true } });
  });
});
