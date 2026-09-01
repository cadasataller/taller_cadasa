import { supabaseRastreoTareas } from "@/lib/supabase";
import { z } from "zod";
import type {
  CrearTareaV2Params,
  ProcesarRutaPendientePayload,
  ProcesarRutaPendienteRespuesta,
  TareaCreacionRespuestaRpc,
} from "./tareaCreacion.types";

const tareaCreacionRespuestaSchema = z
  .object({
    id: z.string().uuid(),
    version: z.number().int(),
    area_id: z.string().uuid(),
    tipo: z.enum(["finca", "zona"]),
    usuario_asignado_id: z.string().uuid(),
    tracker_id: z.number().int(),
    source_id: z.number().int(),
    tracker_label: z.string(),
    fecha_programada: z.string(),
    ubicacion_id: z.string().uuid().nullable(),
    zona_control_ids: z.array(z.string().uuid()),
    orden_ruta: z.number().int(),
    estado_tarea_id: z.number().int(),
    estado_operativo_tarea_id: z.number().int(),
    requiere_procesar_ruta: z.boolean(),
    solicitud_recalculo_ruta_id: z.string().uuid().nullable(),
    creado_en: z.string(),
    actualizado_en: z.string(),
  })
  .passthrough();

const procesarRutaCalculadaSchema = z.object({
  solicitud_id: z.string().uuid(),
  ruta_id: z.string().uuid(),
  paradas: z.number().int().nonnegative(),
  tracker_id: z.number().int(),
  source_id: z.number().int(),
  origen_tipo: z.enum(["ubicacion_tracker", "resguardo"]),
  origen_capturada_en: z.string().nullable(),
  recorrido_tracker_id: z.string().uuid().nullable(),
  motor: z.literal("v2_orden_supervisor"),
});
const procesarRutaSinTareasSchema = z.object({
  solicitud_id: z.string().uuid(),
  ruta_id: z.string().uuid().nullable(),
  paradas: z.literal(0),
  codigo: z.enum(["ruta_eliminada_sin_tareas", "sin_tareas_activas"]),
  motor: z.literal("v2"),
});
const procesarRutaOrigenNoDisponibleSchema = z.object({
  solicitud_id: z.string().uuid(),
  estado: z.literal("pendiente"),
  codigo: z.literal("origen_no_disponible"),
  motivo: z.string().min(1),
  origen_tipo: z.enum(["ubicacion_tracker", "resguardo"]),
  recorrido_tracker_id: z.string().uuid().nullable(),
});
const procesarRutaPendienteRespuestaSchema = z.union([
  procesarRutaCalculadaSchema,
  procesarRutaSinTareasSchema,
  procesarRutaOrigenNoDisponibleSchema,
]);

/** Frontera única de mutación: no usa tablas ni SQL directo desde Vue. */
export const tareaCreacionService = {
  async create(params: CrearTareaV2Params): Promise<TareaCreacionRespuestaRpc> {
    const { data, error } = await supabaseRastreoTareas.rpc(
      "crear_tarea_v2",
      params,
    );
    if (error) throw error;
    return tareaCreacionRespuestaSchema.parse(data);
  },

  async processPendingRoute(
    payload: ProcesarRutaPendientePayload,
  ): Promise<ProcesarRutaPendienteRespuesta> {
    const { data, error } =
      await supabaseRastreoTareas.functions.invoke<ProcesarRutaPendienteRespuesta>(
        "procesar-ruta-pendiente",
        { body: payload },
      );
    if (error) throw error;
    return procesarRutaPendienteRespuestaSchema.parse(data);
  },
};
