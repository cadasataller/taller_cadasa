import type { TareasSeguimientoFilters } from './tareasSeguimiento.types';
import type { SeguimientoTaskStatus, SeguimientoTaskType } from '@/seguimiento/shared/seguimiento.types';

export const createInitialTareasSeguimientoFilters = (): TareasSeguimientoFilters => ({
  scheduledDate: null,
  areaId: null,
  assignedUserId: null,
  trackerId: null,
  types: [],
  statuses: [],
  search: '',
});

export const isSeguimientoTaskType = (value: unknown): value is SeguimientoTaskType =>
  value === 'finca' || value === 'zona' || value === 'duda';

export const toSeguimientoTaskStatus = (value: unknown): SeguimientoTaskStatus => {
  const statuses: SeguimientoTaskStatus[] = [
    'pendiente', 'en_ruta', 'activa', 'visitada', 'cancelada', 'duda_detectada',
  ];
  return statuses.includes(value as SeguimientoTaskStatus)
    ? value as SeguimientoTaskStatus
    : 'pendiente';
};

export const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;
