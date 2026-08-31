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
  ): Promise<ProcesarRutaPendienteRespuesta | null> {
    const { data, error } =
      await supabaseRastreoTareas.functions.invoke<ProcesarRutaPendienteRespuesta>(
        "procesar-ruta-pendiente",
        { body: payload },
      );
    if (error) throw error;
    return data;
  },
};
