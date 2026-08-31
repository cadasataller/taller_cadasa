import type {
  SeguimientoTaskStatus,
  SeguimientoTaskType,
} from "@/seguimiento/shared/seguimiento.types";
import type {
  SeguimientoTracker,
  TrackerOperationalStatus,
} from "@/seguimiento/shared/trackers/tracker.types";
import { z } from "zod";
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

const coordinateSchema = z.number().finite();

const mapRoutePoint = (latitude: unknown, longitude: unknown) => {
  const parsedLatitude = coordinateSchema.safeParse(latitude);
  const parsedLongitude = coordinateSchema.safeParse(longitude);
  if (!parsedLatitude.success || !parsedLongitude.success) return null;
  return {
    latitude: parsedLatitude.data,
    longitude: parsedLongitude.data,
  };
};

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
    elapsedSeconds: row.segundos_totales,
    currentVisitSeconds: row.segundos_visita_actual,
    hasOpenVisit: row.visita_abierta,
    routePoint: mapRoutePoint(row.punto_latitud, row.punto_longitud),
    routeOrder: row.orden_ruta,
  };
}

export function mapTareaSeguimientoDetail(
  response: TareaRastreoDetalleDto,
): TareaSeguimientoDetail {
  const { tarea, asignacion, estado } = response;
  const routePoint = tarea.punto_enrutado;
  return {
    id: tarea.id,
    type: mapTaskType(tarea.tipo_codigo),
    status: mapTaskStatus(
      estado.estado_operativo_codigo,
      estado.estado_tarea_codigo,
    ),
    areaId: tarea.area_id,
    assignedUserId: asignacion.usuario_id,
    locationId: tarea.ubicacion_id,
    scheduledDate: tarea.fecha_programada,
    instructions: tarea.indicaciones,
    priorityId: estado.prioridad_id,
    estimatedMinutes: tarea.tiempo_estimado_minutos,
    trackerId: asignacion.tracker_id,
    sourceId: asignacion.source_id,
    trackerLabel: asignacion.tracker_label,
    elapsedSeconds: response.tiempo.segundos_totales,
    currentVisitSeconds: 0,
    hasOpenVisit: response.tiempo.visita_abierta,
    assignedUserName: asignacion.usuario_nombre,
    companionNames: asignacion.acompanantes.map(
      (companion) => companion.nombre,
    ),
    routePoint: mapRoutePoint(routePoint?.lat, routePoint?.lng),
    routeOrder: tarea.orden_ruta,
    controlLine: tarea.linea_control,
    controlZones: tarea.zonas_control.map((zone) => zone.geom),
    operationalStatusLabel: estado.estado_operativo_nombre,
    time: response.tiempo,
    visits: response.visitas,
    route: response.ruta ?? { id: null, estado_calculo: null },
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
    movementStatus: null,
    movementStatusUpdatedAt: null,
    connectionStatus: null,
    ignition: null,
    ignitionUpdatedAt: null,
    speed: null,
  };
}
