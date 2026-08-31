import type {
  SeguimientoCoordinates,
  SeguimientoControlLine,
  SeguimientoControlZone,
} from "@/seguimiento/shared/seguimiento.types";

/** Los únicos tipos que el flujo manual puede crear. */
export type TareaCreacionTipo = "finca" | "zona";

export type TareaCreacionEstadoEnvio =
  "idle" | "validating" | "submitting" | "success" | "error";
export type TareaCreacionEstadoFlujo =
  "idle" | "editing" | "validating" | "submitting" | "success" | "error";

export interface TareaCreacionTrabajadorSeleccionado {
  id: string;
  label: string;
}

export interface TareaCreacionTrackerSeleccionado {
  id: number;
  sourceId: number;
  label: string;
}

/** Cada nombre se persiste como un acompañante activo de la tarea. */
export interface TareaCreacionAcompananteSeleccionado {
  name: string;
}

export interface TareaCreacionDetalles {
  instructions: string;
  scheduledDate: string | null;
  priorityId: number | null;
  estimatedMinutes: number | null;
}

export interface TareaCreacionGeometria {
  locationId: string | null;
  routePoint: SeguimientoCoordinates | null;
  controlLine: SeguimientoControlLine | null;
  /** Una zona lógica para `zona`; zonas independientes para `finca`. */
  controlZones: SeguimientoControlZone[];
}

export type TareaCreacionModoGeometria =
  "point" | "line" | "zone" | "zone-edit" | null;
export type TareaCreacionEstadoEspacial =
  | "idle"
  | "selecting-route-point"
  | "drawing-first-zone"
  | "drawing-extra-zone"
  | "ready";
export type TareaCreacionPasoWizard =
  | "ready"
  | "selecting-control-point"
  | "drawing-initial-zone"
  | "details-pending"
  | "editing-details"
  | "drawing-extra-zone";
export type TareaCreacionEstadoGeometria =
  "empty" | "captured" | "editing" | "invalid" | "remote-error";

export interface TareaCreacionRuta {
  order: number | null;
}

export interface TareaCreacionBloquesValidos {
  type: boolean;
  assignment: boolean;
  details: boolean;
  geometry: boolean;
  route: boolean;
}

/** Estado local: nunca se envía directamente a Supabase. */
export interface TareaCreacionBorrador {
  areaId: string | null;
  type: TareaCreacionTipo | null;
  worker: TareaCreacionTrabajadorSeleccionado | null;
  tracker: TareaCreacionTrackerSeleccionado | null;
  companions: TareaCreacionAcompananteSeleccionado[];
  details: TareaCreacionDetalles;
  geometry: TareaCreacionGeometria;
  route: TareaCreacionRuta;
  validBlocks: TareaCreacionBloquesValidos;
  submitStatus: TareaCreacionEstadoEnvio;
}

export type TareaCreacionCampo = keyof TareaCreacionBloquesValidos;

/** Campos visibles que pueden informar un error junto a su control. */
export type TareaCreacionCampoError =
  | "type"
  | "worker"
  | "tracker"
  | "instructions"
  | "scheduledDate"
  | "priority"
  | "estimatedMinutes"
  | "location"
  | "routePoint"
  | "controlLine"
  | "controlZone"
  | "route";

export interface TareaCreacionErrorValidacion {
  field: TareaCreacionCampoError;
  message: string;
}

export interface TareaCreacionResultadoValidacion {
  isValid: boolean;
  errors: TareaCreacionErrorValidacion[];
  validBlocks: TareaCreacionBloquesValidos;
}

/** Parámetros exactos de public.crear_tarea_v2 documentados para Vue. */
export interface CrearTareaV2Params {
  p_area_id: string;
  p_tipo_codigo: TareaCreacionTipo;
  p_usuario_asignado_id: string;
  p_tracker_id: number;
  p_source_id: number;
  p_tracker_label: string;
  p_acompanantes: string[];
  p_indicaciones: string;
  p_fecha_programada: string;
  p_prioridad_id: number;
  p_tiempo_estimado_minutos: number;
  p_ubicacion_id: string | null;
  p_punto_latitud: number;
  p_punto_longitud: number;
  p_linea_control_geojson: SeguimientoControlLine | null;
  p_zona_control_geojson: SeguimientoControlZone | SeguimientoControlZone[];
  p_orden_ruta: number | null;
}

/** Respuesta de `crear_tarea_v2` después de persistir la tarea y encolar su ruta. */
export interface TareaCreacionRespuestaRpc {
  id: string;
  version: number;
  area_id: string;
  tipo: TareaCreacionTipo;
  usuario_asignado_id: string;
  tracker_id: number;
  source_id: number;
  tracker_label: string;
  fecha_programada: string;
  ubicacion_id: string | null;
  zona_control_ids: string[];
  orden_ruta: number;
  estado_tarea_id: number;
  estado_operativo_tarea_id: number;
  requiere_procesar_ruta: boolean;
  solicitud_recalculo_ruta_id: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Único contrato que Vue envía a `procesar-ruta-pendiente`. */
export interface ProcesarRutaPendientePayload {
  solicitud_id: string;
}

export interface ProcesarRutaPendienteRespuesta {
  solicitud_id: string;
  ruta_id?: string | null;
  paradas?: number;
  codigo?:
    "ruta_eliminada_sin_tareas" | "sin_tareas_activas" | "origen_no_disponible";
  motor?: "v2" | "v2_orden_supervisor";
}

export interface TareaCreacionErrorRemoto {
  message: string;
  code: string | null;
  details: string | null;
  hint: string | null;
}
