import { describe, expect, it } from 'vitest';
import { SEGUIMIENTO_FEATURES } from '@/seguimiento/shared/seguimiento.permissions';
import { applySeguimientoDevelopmentFallback } from './seguimientoFeatureAccessFallback';

describe('applySeguimientoDevelopmentFallback', () => {
  it('grants only Seguimiento features to the documented development user when the matrix is absent', () => {
    const result = applySeguimientoDevelopmentFallback(['module_dashboard'], 'erickq@cadasa.com');

    expect(result).toContain('module_dashboard');
    expect(result).toContain(SEGUIMIENTO_FEATURES.module);
    expect(result).toContain(SEGUIMIENTO_FEATURES.editTasks);
  });

  it('does not grant the fallback to a different user or override an official matrix', () => {
    expect(applySeguimientoDevelopmentFallback([], 'other@cadasa.com')).toEqual([]);
    expect(applySeguimientoDevelopmentFallback([SEGUIMIENTO_FEATURES.viewTasks], 'erickq@cadasa.com'))
      .toEqual([SEGUIMIENTO_FEATURES.viewTasks]);
  });
});
