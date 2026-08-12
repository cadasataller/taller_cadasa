import { supabaseEquipos } from "@/lib/supabase";
import { mapCatalogoFiltroGuardarResponse, mapCatalogoFiltrosListarResponse } from "./filtrosCatalogo.mappers";
import { CatalogoFiltrosError, normalizarCatalogoFiltrosError } from "./filtrosCatalogo.errors";
import type {
  CatalogoFiltroGuardarInput, CatalogoFiltroGuardarResultado, CatalogoFiltroItem, CatalogoFiltrosResumen,
} from "./filtrosCatalogo.types";

const schema = () => supabaseEquipos.schema("engrase");

export const filtrosCatalogoService = {
  async listar(): Promise<{ items: CatalogoFiltroItem[]; resumen: CatalogoFiltrosResumen }> {
    const { data, error } = await schema().rpc("rpc_catalogo_filtros_listar");
    if (error) throw normalizarCatalogoFiltrosError(error, "TRANSPORTE");
    try { return mapCatalogoFiltrosListarResponse(data); }
    catch (error) { throw normalizarCatalogoFiltrosError(error, "RESPUESTA_INVALIDA"); }
  },

  async guardar(input: CatalogoFiltroGuardarInput): Promise<CatalogoFiltroGuardarResultado> {
    const pData: CatalogoFiltroGuardarInput = {
      id: input.id,
      codigo: input.codigo.trim(),
      esta_en_lista_compras: input.esta_en_lista_compras,
      activo: input.activo,
    };
    const { data, error } = await schema().rpc("rpc_catalogo_filtro_guardar", { p_data: pData });
    if (error) throw normalizarCatalogoFiltrosError(error, "TRANSPORTE");
    if (typeof data === "object" && data !== null && "ok" in data && data.ok === false) {
      throw normalizarCatalogoFiltrosError(data);
    }
    try { return mapCatalogoFiltroGuardarResponse(data); }
    catch (error) {
      if (error instanceof CatalogoFiltrosError) throw error;
      throw normalizarCatalogoFiltrosError(error, "RESPUESTA_INVALIDA");
    }
  },
};
