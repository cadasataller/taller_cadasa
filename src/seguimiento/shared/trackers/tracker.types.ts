import type { SeguimientoCoordinates } from '../seguimiento.types';

export type TrackerOperationalStatus = 'available' | 'en_route' | 'at_task' | 'stopped' | 'without_data';

export interface SeguimientoTracker {
  id: number;
  sourceId: number;
  label: string;
  position: SeguimientoCoordinates | null;
  capturedAt: string | null;
  status: TrackerOperationalStatus;
  currentTaskId: string | null;
}

export interface TrackerVisitSummary {
  taskId: string;
  trackerId: number;
  visits: number;
  totalSeconds: number;
  hasOpenVisit: boolean;
  lastUpdatedAt: string | null;
}
