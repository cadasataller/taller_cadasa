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
  controlZone: SeguimientoControlZone | null;
}

export type TareaCreacionModoGeometria = "point" | "line" | "zone" | null;
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
  p_zona_control_geojson: SeguimientoControlZone | null;
  p_orden_ruta: number | null;
}

/**
 * `crear_tarea_v2` devuelve jsonb y la documentación no fija su forma interna.
 * Se conserva el resultado sin inventar columnas; el spec de integración decidirá
 * cómo incorporarlo al workspace una vez confirmado el payload real del RPC.
 */
export type TareaCreacionRespuestaRpc = Record<string, unknown>;

export interface TareaCreacionErrorRemoto {
  message: string;
  code: string | null;
  details: string | null;
  hint: string | null;
}
