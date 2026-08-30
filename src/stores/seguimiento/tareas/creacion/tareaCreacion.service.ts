import { supabaseRastreoTareas } from "@/lib/supabase";
import type {
  CrearTareaV2Params,
  TareaCreacionRespuestaRpc,
} from "./tareaCreacion.types";

/** Frontera única de mutación: no usa tablas ni SQL directo desde Vue. */
export const tareaCreacionService = {
  async create(params: CrearTareaV2Params): Promise<TareaCreacionRespuestaRpc> {
    const { data, error } = await supabaseRastreoTareas.rpc(
      "crear_tarea_v2",
      params,
    );
    if (error) throw error;
    return (data ?? {}) as TareaCreacionRespuestaRpc;
  },
};
