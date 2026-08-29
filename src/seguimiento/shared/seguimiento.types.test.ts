import { describe, expect, it } from 'vitest';
import { SEGUIMIENTO_TASK_CAPABILITIES } from './seguimiento.types';

describe('Seguimiento task capabilities', () => {
  it('keeps automatically-generated questions read-only', () => {
    expect(SEGUIMIENTO_TASK_CAPABILITIES.duda).toEqual({
      canView: true,
      canCreate: false,
      canEdit: false,
      canCancelOrDelete: false,
      canRenderMap: true,
    });
  });
});
