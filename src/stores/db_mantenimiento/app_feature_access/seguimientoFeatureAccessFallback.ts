import {
  ALL_SEGUIMIENTO_FEATURES,
  SEGUIMIENTO_FEATURES,
} from "@/seguimiento/shared/seguimiento.permissions";
import type { FuncionalidadPermitida } from "./featureAccess.types";

const DEVELOPMENT_EMAIL = "testjl@cadasa.com";

/**
 * Temporary, centralized bridge until Seguimiento is returned by the permissions RPC.
 * Remove this module once the official matrix includes the module.
 */
export const applySeguimientoDevelopmentFallback = (
  features: FuncionalidadPermitida[],
  userEmail: string | null | undefined,
): FuncionalidadPermitida[] => {
  const isDevelopmentUser = userEmail?.toLowerCase() === DEVELOPMENT_EMAIL;
  const hasPartialSeguimientoAccess =
    features.includes(SEGUIMIENTO_FEATURES.module) ||
    features.includes(SEGUIMIENTO_FEATURES.viewTasks);

  if (!isDevelopmentUser && !hasPartialSeguimientoAccess) {
    return features;
  }

  const fallbackFeatures = isDevelopmentUser
    ? ALL_SEGUIMIENTO_FEATURES
    : [SEGUIMIENTO_FEATURES.viewMap];

  return [...new Set([...features, ...fallbackFeatures])];
};
