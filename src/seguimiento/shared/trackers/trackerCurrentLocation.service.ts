import { supabaseRastreoTareas } from "@/lib/supabase";
import type { TrackerCurrentLocation } from "./tracker.types";

interface TrackerCurrentLocationDto {
  source_id: number;
  tracker_id: number | null;
  tracker_label: string | null;
  latitud: number;
  longitud: number;
  capturada_en: string | null;
  tarea_actual_id: string | null;
  movement_status: string | null;
  movement_status_update: string | null;
  connection_status: string | null;
  ignition: boolean | null;
  ignition_update: string | null;
  velocidad: number | null;
}

function isValidSourceId(sourceId: number): boolean {
  return Number.isSafeInteger(sourceId) && sourceId > 0;
}

function mapCurrentLocation(
  location: TrackerCurrentLocationDto,
): TrackerCurrentLocation | null {
  if (
    !isValidSourceId(location.source_id) ||
    !Number.isFinite(location.latitud) ||
    !Number.isFinite(location.longitud)
  )
    return null;
  return {
    sourceId: location.source_id,
    trackerId: location.tracker_id,
    trackerLabel: location.tracker_label,
    latitude: location.latitud,
    longitude: location.longitud,
    capturedAt: location.capturada_en,
    currentTaskId: location.tarea_actual_id,
    movementStatus: location.movement_status,
    movementStatusUpdatedAt: location.movement_status_update,
    connectionStatus: location.connection_status,
    ignition: location.ignition,
    ignitionUpdatedAt: location.ignition_update,
    speed: location.velocidad,
  };
}

export const trackerCurrentLocationService = {
  async load(sourceIds: readonly number[]): Promise<TrackerCurrentLocation[]> {
    const validSourceIds = [...new Set(sourceIds.filter(isValidSourceId))];
    if (!validSourceIds.length) return [];
    const { data, error } = await supabaseRastreoTareas.rpc(
      "obtener_ubicaciones_actuales_trackers_v2",
      { p_source_ids: validSourceIds },
    );
    if (error) throw error;
    return ((data ?? []) as TrackerCurrentLocationDto[])
      .map(mapCurrentLocation)
      .filter(
        (location): location is TrackerCurrentLocation => location !== null,
      );
  },
};
