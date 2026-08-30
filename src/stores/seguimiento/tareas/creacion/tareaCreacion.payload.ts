import type {
  CrearTareaV2Params,
  TareaCreacionBorrador,
} from "./tareaCreacion.types";
import { validateTareaCreacionDraft } from "./tareaCreacion.validation";

export const toCrearTareaV2Params = (
  draft: TareaCreacionBorrador,
): CrearTareaV2Params => {
  const validation = validateTareaCreacionDraft(draft);
  if (
    !validation.isValid ||
    !draft.areaId ||
    !draft.type ||
    !draft.worker ||
    !draft.tracker ||
    !draft.details.scheduledDate ||
    draft.details.priorityId === null ||
    draft.details.estimatedMinutes === null ||
    !draft.geometry.routePoint
  ) {
    throw new Error(
      "El borrador de creación no es válido para crear_tarea_v2.",
    );
  }

  return {
    p_area_id: draft.areaId,
    p_tipo_codigo: draft.type,
    p_usuario_asignado_id: draft.worker.id,
    p_tracker_id: draft.tracker.id,
    p_source_id: draft.tracker.sourceId,
    p_tracker_label: draft.tracker.label,
    p_acompanante_nombre: draft.companion?.name ?? null,
    p_indicaciones: draft.details.instructions.trim(),
    p_fecha_programada: draft.details.scheduledDate,
    p_prioridad_id: draft.details.priorityId,
    p_tiempo_estimado_minutos: draft.details.estimatedMinutes,
    p_ubicacion_id: draft.type === "finca" ? draft.geometry.locationId : null,
    p_punto_latitud: draft.geometry.routePoint.latitude,
    p_punto_longitud: draft.geometry.routePoint.longitude,
    p_linea_control_geojson:
      draft.type === "finca" ? draft.geometry.controlLine : null,
    p_zona_control_geojson:
      draft.type === "zona" ? draft.geometry.controlZone : null,
    p_orden_ruta: draft.route.order,
  };
};
