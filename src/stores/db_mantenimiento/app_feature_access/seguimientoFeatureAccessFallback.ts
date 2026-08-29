import { ALL_SEGUIMIENTO_FEATURES } from '@/seguimiento/shared/seguimiento.permissions';
import type { FuncionalidadPermitida } from './featureAccess.types';

const DEVELOPMENT_EMAIL = 'testjl@cadasa.com';

/**
 * Temporary, centralized bridge until Seguimiento is returned by the permissions RPC.
 * Remove this module once the official matrix includes the module.
 */
export const applySeguimientoDevelopmentFallback = (
  features: FuncionalidadPermitida[],
  userEmail: string | null | undefined,
): FuncionalidadPermitida[] => {
  const hasOfficialSeguimientoMatrix = features.some((feature) =>
    ALL_SEGUIMIENTO_FEATURES.includes(feature as (typeof ALL_SEGUIMIENTO_FEATURES)[number]),
  );

  if (userEmail?.toLowerCase() !== DEVELOPMENT_EMAIL || hasOfficialSeguimientoMatrix) {
    return features;
  }

  return [...new Set([...features, ...ALL_SEGUIMIENTO_FEATURES])];
};
