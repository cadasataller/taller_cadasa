export type SeguimientoTaskType = 'finca' | 'zona' | 'duda';

export type SeguimientoTaskStatus =
  | 'pendiente'
  | 'en_ruta'
  | 'activa'
  | 'visitada'
  | 'cancelada'
  | 'duda_detectada';

export interface SeguimientoCoordinates {
  latitude: number;
  longitude: number;
}

export interface SeguimientoControlLine {
  type: 'MultiLineString';
  coordinates: number[][][];
}

export interface SeguimientoControlZone {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface SeguimientoTaskCapabilities {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canCancelOrDelete: boolean;
  canRenderMap: boolean;
}

export interface SeguimientoTask {
  id: string;
  type: SeguimientoTaskType;
  status: SeguimientoTaskStatus;
  areaId: string;
  assignedUserId: string | null;
  locationId: string | null;
  scheduledDate: string;
  instructions: string | null;
  priorityId: number | null;
  estimatedMinutes: number | null;
  trackerId: number | null;
  trackerLabel: string | null;
  routePoint: SeguimientoCoordinates | null;
  controlLine: SeguimientoControlLine | null;
  controlZone: SeguimientoControlZone | null;
  routeOrder: number | null;
}

export const SEGUIMIENTO_TASK_CAPABILITIES: Record<
  SeguimientoTaskType,
  SeguimientoTaskCapabilities
> = {
  finca: { canView: true, canCreate: true, canEdit: true, canCancelOrDelete: true, canRenderMap: true },
  zona: { canView: true, canCreate: true, canEdit: true, canCancelOrDelete: true, canRenderMap: true },
  duda: { canView: true, canCreate: false, canEdit: false, canCancelOrDelete: false, canRenderMap: true },
};
