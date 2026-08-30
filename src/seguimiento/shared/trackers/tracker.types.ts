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
}

export interface TrackerCurrentLocation {
  sourceId: number;
  trackerId: number | null;
  trackerLabel: string | null;
  latitude: number;
  longitude: number;
  capturedAt: string | null;
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
