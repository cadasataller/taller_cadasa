import type { SeguimientoCoordinates } from "../seguimiento.types";

export type TrackerOperationalStatus =
  "available" | "en_route" | "at_task" | "stopped" | "without_data";

export interface SeguimientoTracker {
  id: number;
  sourceId: number;
  label: string;
  position: SeguimientoCoordinates | null;
  capturedAt: string | null;
  status: TrackerOperationalStatus;
  currentTaskId: string | null;
  movementStatus: string | null;
  movementStatusUpdatedAt: string | null;
  connectionStatus: string | null;
  ignition: boolean | null;
  ignitionUpdatedAt: string | null;
  speed: number | null;
}

export interface TrackerLocationBroadcast {
  tipo: "ubicacion_tracker_actualizada";
  source_id: number;
  tracker_id?: number;
  tracker_label?: string;
  latitud: number;
  longitud: number;
  precision_metros?: number;
  capturada_en: string;
  recibida_en: string;
  tarea_actual_id?: string;
  tarea_candidata_id?: string;
  estado_geocerca_tarea: string;
  estado_candidato_tarea?: string;
  estado_geocerca_taller: string;
  estado_candidato_taller?: string;
  ultima_distancia_tarea_metros?: number;
  ultima_distancia_taller_metros?: number;
  ultimo_evento_clave: string;
  ultimo_resultado?: string;
  actualizado_en: string;
  movement_status?: string | null;
  movement_status_update?: string | null;
  connection_status?: string | null;
  ignition?: boolean | null;
  ignition_update?: string | null;
  velocidad?: number | null;
}

export interface TrackerCurrentLocation {
  sourceId: number;
  trackerId: number | null;
  trackerLabel: string | null;
  latitude: number;
  longitude: number;
  capturedAt: string | null;
  currentTaskId: string | null;
  movementStatus?: string | null;
  movementStatusUpdatedAt?: string | null;
  connectionStatus?: string | null;
  ignition?: boolean | null;
  ignitionUpdatedAt?: string | null;
  speed?: number | null;
}

export interface SeguimientoTrackerHistoryPoint {
  latitude: number;
  longitude: number;
  capturedAt: string;
  parking: boolean | null;
  parkingStartedAt?: string | null;
  isLiveParking?: boolean;
  speed: number | null;
  heading: number | null;
  precisionMeters: number | null;
}

export interface TrackerVisitSummary {
  taskId: string;
  trackerId: number;
  visits: number;
  totalSeconds: number;
  hasOpenVisit: boolean;
  lastUpdatedAt: string | null;
}
