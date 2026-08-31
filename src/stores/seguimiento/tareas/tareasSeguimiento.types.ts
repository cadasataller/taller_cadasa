import type {
  SeguimientoCoordinates,
  SeguimientoTaskStatus,
  SeguimientoTaskType,
} from "@/seguimiento/shared/seguimiento.types";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";

/** `create` comparte el panel derecho del workspace; no abre una pantalla aislada. */
export type SeguimientoTaskPanelMode = "closed" | "view" | "create";
export type SeguimientoMapStatus = "idle" | "ready" | "error";
export type SeguimientoMapTool = "tasks" | "trackers" | "zones" | "route";
export type TareaRastreoTipoCodigo = "finca" | "zona" | "duda_automatica";
export type TareaRastreoEstadoOperativoCodigo =
  "sin_iniciar" | "en_ruta" | "en_ubicacion" | "visitada";

export interface TareasSeguimientoFilters {
  scheduledDate: string | null;
  areaId: string | null;
  assignedUserId: string | null;
  sourceId: number | null;
  types: SeguimientoTaskType[];
  statuses: SeguimientoTaskStatus[];
  search: string;
}

/** Filtro visual aplicado sobre las tareas ya cargadas, sin consultar el RPC. */
export interface SeguimientoCrossFilter {
  workerId: string | null;
  sourceId: number | null;
}

export interface ListarTareasRastreoV2Params {
  p_area_id: string | null;
  p_fecha: string | null;
  p_usuario_asignado_id: string | null;
  p_source_id: number | null;
  p_estado_operativo_codigo: TareaRastreoEstadoOperativoCodigo | null;
  p_incluir_canceladas: boolean;
}

/** DTO tabular de public.listar_tareas_rastreo_v2. */
export interface TareaRastreoListadoDto {
  id: string;
  version: number;
  area_id: string;
  fecha_programada: string;
  indicaciones: string | null;
  tipo_tarea: TareaRastreoTipoCodigo;
  ubicacion_id: string | null;
  usuario_asignado_id: string | null;
  source_id: number | null;
  tracker_id: number | null;
  tracker_label: string | null;
  prioridad_id: number | null;
  estado_tarea_codigo: string;
  estado_operativo_codigo: TareaRastreoEstadoOperativoCodigo | null;
  tiempo_estimado_minutos: number | null;
  cantidad_visitas: number;
  segundos_totales: number;
  segundos_visita_actual: number;
  visita_abierta: boolean;
  entrada_actual_en: string | null;
  primera_entrada_en: string | null;
  ultima_salida_en: string | null;
  orden_ruta: number | null;
  punto_latitud: number | null;
  punto_longitud: number | null;
  cancelada_en: string | null;
  eliminado_en: string | null;
  actualizado_en: string;
}

export interface SeguimientoLineGeometry {
  type: "MultiLineString";
  coordinates: number[][][];
}
export interface SeguimientoZoneGeometry {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export interface SeguimientoTaskWorkerOption {
  id: string;
  label: string;
}
export interface SeguimientoTaskAreaOption {
  id: string;
  label: string;
  workers: SeguimientoTaskWorkerOption[];
  companions: string[];
}
export interface SeguimientoTaskCatalog {
  areas: SeguimientoTaskAreaOption[];
}
export interface SeguimientoOperationalGeography {
  areaId: string;
  farms: Array<{
    id: string;
    name: string;
    boundary: SeguimientoZoneGeometry | null;
    roadNetwork: SeguimientoLineGeometry | null;
  }>;
  shelters: Array<{
    id: string;
    name: string;
    boundary: SeguimientoZoneGeometry | null;
    routePoint: SeguimientoCoordinates | null;
  }>;
}
export interface SeguimientoMapConfiguration {
  latitude: number;
  longitude: number;
  zoom: number;
}
export interface ConfiguracionInicialTrackersDto {
  areas: Array<{
    area_id: string;
    area_nombre: string;
    grupos_tracker: Array<{ group_id: number }>;
  }>;
}

/** DTO JSON de public.obtener_tarea_detalle_v2. */
export interface TareaRastreoDetalleDto {
  tarea: {
    id: string;
    version: number;
    area_id: string;
    fecha_programada: string;
    indicaciones: string | null;
    tipo_codigo: TareaRastreoTipoCodigo;
    ubicacion_id: string | null;
    tiempo_estimado_minutos: number | null;
    orden_ruta: number | null;
    punto_enrutado: { lat: number; lng: number } | null;
    linea_control: SeguimientoLineGeometry | null;
    zonas_control: Array<{
      id: string;
      geom: SeguimientoZoneGeometry;
    }>;
    actualizado_en: string;
  };
  asignacion: {
    usuario_id: string | null;
    usuario_nombre: string | null;
    source_id: number | null;
    tracker_id: number | null;
    tracker_label: string | null;
    acompanantes: Array<{ id: string; nombre: string }>;
  };
  estado: {
    prioridad_id: number | null;
    prioridad_nombre: string | null;
    estado_tarea_codigo: string;
    estado_tarea_nombre: string | null;
    estado_operativo_codigo: TareaRastreoEstadoOperativoCodigo | null;
    estado_operativo_nombre: string | null;
  };
  tiempo: {
    cantidad_visitas: number;
    segundos_totales: number;
    segundos_visita_abierta: number;
    segundos_sin_datos: number;
    visita_abierta: boolean;
    llegada_actual_en: string | null;
    primera_llegada_en: string | null;
    ultima_salida_en: string | null;
  };
  visitas: Array<{ id: string; entrada_en: string; salida_en: string | null }>;
  ruta: { id: string | null; estado_calculo: string | null } | null;
  permisos: {
    puede_editar: boolean;
    puede_editar_punto: boolean;
    puede_editar_geometria_control: boolean;
    puede_reordenar: boolean;
    geometria_bloqueada: boolean;
    puede_cancelar: boolean;
    puede_eliminar: boolean;
  };
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
  sourceId: number | null;
  trackerLabel: string | null;
  elapsedSeconds: number;
  currentVisitSeconds: number;
  hasOpenVisit: boolean;
  routePoint: SeguimientoCoordinates | null;
  routeOrder: number | null;
}

export interface TareaSeguimientoDetail extends TareaSeguimientoListItem {
  assignedUserName: string | null;
  companionNames: string[];
  controlLine: SeguimientoLineGeometry | null;
  controlZones: SeguimientoZoneGeometry[];
  administrativeStatusLabel: string | null;
  operationalStatusLabel: string | null;
  priorityLabel: string | null;
  time: TareaRastreoDetalleDto["tiempo"];
  visits: TareaRastreoDetalleDto["visitas"];
  route: TareaRastreoDetalleDto["ruta"];
  permissions: TareaRastreoDetalleDto["permisos"];
  updatedAt: string;
}

export interface TareaSeguimientoWorkspaceData {
  tasks: TareaSeguimientoListItem[];
  trackers: SeguimientoTracker[];
  trackerLoadObservations: string[];
  catalog: SeguimientoTaskCatalog;
  geography: SeguimientoOperationalGeography[];
  mapConfiguration: SeguimientoMapConfiguration | null;
}
export interface SeguimientoMapToolState {
  tool: SeguimientoMapTool;
  enabled: boolean;
}
