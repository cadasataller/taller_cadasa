import type { TareasSeguimientoFilters } from "./tareasSeguimiento.types";

export const getSeguimientoToday = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const createInitialTareasSeguimientoFilters =
  (): TareasSeguimientoFilters => ({
    scheduledDate: getSeguimientoToday(),
    areaId: null,
    assignedUserId: null,
    sourceId: null,
    types: [],
    statuses: [],
    search: "",
  });

export const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;
