import type { TareasSeguimientoFilters } from "./tareasSeguimiento.types";

export const createInitialTareasSeguimientoFilters =
  (): TareasSeguimientoFilters => ({
    scheduledDate: null,
    areaId: null,
    assignedUserId: null,
    sourceId: null,
    types: [],
    statuses: [],
    search: "",
  });

export const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;
