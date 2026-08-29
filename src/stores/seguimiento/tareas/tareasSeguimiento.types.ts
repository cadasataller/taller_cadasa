import type {
  SeguimientoCoordinates,
  SeguimientoTaskStatus,
  SeguimientoTaskType,
} from '@/seguimiento/shared/seguimiento.types';
import type { SeguimientoTracker } from '@/seguimiento/shared/trackers/tracker.types';

export type SeguimientoTaskPanelMode = 'closed' | 'view';
export type SeguimientoMapStatus = 'idle' | 'ready' | 'error';
export type SeguimientoMapTool = 'tasks' | 'trackers' | 'zones' | 'route';

export interface TareasSeguimientoFilters {
  scheduledDate: string | null;
  areaId: string | null;
  assignedUserId: string | null;
  trackerId: number | null;
  types: SeguimientoTaskType[];
  statuses: SeguimientoTaskStatus[];
  search: string;
}

export interface TareaSeguimientoListItem {
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
  routeOrder: number | null;
}

export interface SeguimientoLineGeometry {
  type: 'MultiLineString';
  coordinates: number[][][];
}

export interface SeguimientoZoneGeometry {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface TareaSeguimientoDetail extends TareaSeguimientoListItem {
  controlLine: SeguimientoLineGeometry | null;
  controlZone: SeguimientoZoneGeometry | null;
  operationalStatusLabel: string | null;
  updatedAt: string | null;
}

export interface TareaSeguimientoWorkspaceData {
  tasks: TareaSeguimientoListItem[];
  trackers: SeguimientoTracker[];
  trackerError: string | null;
}

export interface SeguimientoMapToolState {
  tool: SeguimientoMapTool;
  enabled: boolean;
}
