import type {
  SeguimientoTaskStatus,
  SeguimientoTaskType,
} from "@/seguimiento/shared/seguimiento.types";
import type {
  SeguimientoTracker,
  TrackerOperationalStatus,
} from "@/seguimiento/shared/trackers/tracker.types";
import type {
  TareaRastreoDetalleDto,
  TareaRastreoListadoDto,
  TareaSeguimientoDetail,
  TareaSeguimientoListItem,
} from "./tareasSeguimiento.types";

const mapTaskType = (
  type: TareaRastreoListadoDto["tipo_tarea"],
): SeguimientoTaskType => (type === "duda_automatica" ? "duda" : type);

const mapTaskStatus = (
  operationalStatus: TareaRastreoListadoDto["estado_operativo_codigo"],
  administrativeStatus: string,
): SeguimientoTaskStatus => {
  if (administrativeStatus === "cancelada") return "cancelada";
  if (operationalStatus === "en_ruta") return "en_ruta";
  if (operationalStatus === "en_ubicacion") return "activa";
  if (operationalStatus === "visitada") return "visitada";
  return "pendiente";
};

const mapRoutePoint = (latitude: number | null, longitude: number | null) =>
  latitude === null || longitude === null ? null : { latitude, longitude };

export function mapTareaSeguimientoListItem(
  row: TareaRastreoListadoDto,
): TareaSeguimientoListItem {
  return {
    id: row.id,
    type: mapTaskType(row.tipo_tarea),
    status: mapTaskStatus(row.estado_operativo_codigo, row.estado_tarea_codigo),
    areaId: row.area_id,
    assignedUserId: row.usuario_asignado_id,
    locationId: row.ubicacion_id,
    scheduledDate: row.fecha_programada,
    instructions: row.indicaciones,
    priorityId: row.prioridad_id,
    estimatedMinutes: row.tiempo_estimado_minutos,
    trackerId: row.tracker_id,
    sourceId: row.source_id,
    trackerLabel: row.tracker_label,
    routePoint: mapRoutePoint(row.punto_latitud, row.punto_longitud),
    routeOrder: row.orden_ruta,
  };
}

export function mapTareaSeguimientoDetail(
  response: TareaRastreoDetalleDto,
): TareaSeguimientoDetail {
  const { tarea, asignacion, estado } = response;
  return {
    id: tarea.id,
    type: mapTaskType(tarea.tipo_tarea),
    status: mapTaskStatus(estado.operativo_codigo, estado.tarea_codigo),
    areaId: tarea.area_id,
    assignedUserId: asignacion.usuario_asignado_id,
    locationId: tarea.ubicacion_id,
    scheduledDate: tarea.fecha_programada,
    instructions: tarea.indicaciones,
    priorityId: tarea.prioridad_id,
    estimatedMinutes: tarea.tiempo_estimado_minutos,
    trackerId: asignacion.tracker_id,
    sourceId: asignacion.source_id,
    trackerLabel: asignacion.tracker_label,
    companionName: asignacion.acompanante_nombre,
    routePoint: mapRoutePoint(tarea.punto_latitud, tarea.punto_longitud),
    routeOrder: tarea.orden_ruta,
    controlLine: tarea.linea_control_geojson,
    controlZones: tarea.zonas_control_geojson,
    operationalStatusLabel: estado.operativo_nombre,
    time: response.tiempo,
    visits: response.visitas,
    route: response.ruta,
    permissions: response.permisos,
    updatedAt: tarea.actualizado_en,
  };
}

export function mapSeguimientoTracker(
  row: TareaRastreoListadoDto,
): SeguimientoTracker | null {
  if (row.tracker_id === null || row.source_id === null) return null;
  const status: TrackerOperationalStatus =
    row.estado_operativo_codigo === "en_ubicacion"
      ? "at_task"
      : row.estado_operativo_codigo === "en_ruta"
        ? "en_route"
        : "available";
  return {
    id: row.tracker_id,
    sourceId: row.source_id,
    label: row.tracker_label ?? `Tracker ${row.tracker_id}`,
    position: null,
    capturedAt: null,
    status,
    currentTaskId:
      row.estado_operativo_codigo === "en_ubicacion" ? row.id : null,
  };
}
