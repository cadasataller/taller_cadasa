import { supabaseEquipos } from "@/lib/supabase";
import {
  mapCatalogoTipoFiltroGuardarResponse,
  mapCatalogoTiposFiltroListarResponse,
} from "./tiposFiltroCatalogo.mappers";
import {
  CatalogoTiposFiltroError,
  normalizarCatalogoTiposFiltroError,
} from "./tiposFiltroCatalogo.errors";
import type {
  CatalogoTipoFiltroGuardarInput,
  CatalogoTipoFiltroGuardarResultado,
  CatalogoTipoFiltroItem,
  CatalogoTiposFiltroResumen,
} from "./tiposFiltroCatalogo.types";

const schema = () => supabaseEquipos.schema("engrase");

export const tiposFiltroCatalogoService = {
  async listar(): Promise<{
    items: CatalogoTipoFiltroItem[];
    resumen: CatalogoTiposFiltroResumen;
  }> {
    const { data, error } = await schema().rpc("rpc_catalogo_tipos_filtro_listar");
    if (error) throw normalizarCatalogoTiposFiltroError(error, "TRANSPORTE");
    try {
      return mapCatalogoTiposFiltroListarResponse(data);
    } catch (error) {
      throw normalizarCatalogoTiposFiltroError(error, "RESPUESTA_INVALIDA");
    }
  },

  async guardar(
    input: CatalogoTipoFiltroGuardarInput,
  ): Promise<CatalogoTipoFiltroGuardarResultado> {
    const pData: CatalogoTipoFiltroGuardarInput = {
      id: input.id,
      nombre: input.nombre.trim(),
      activo: input.activo,
    };
    const { data, error } = await schema().rpc("rpc_catalogo_tipo_filtro_guardar", {
      p_data: pData,
    });
    if (error) throw normalizarCatalogoTiposFiltroError(error, "TRANSPORTE");
    if (typeof data === "object" && data !== null && "ok" in data && data.ok === false) {
      throw normalizarCatalogoTiposFiltroError(data);
    }
    try {
      return mapCatalogoTipoFiltroGuardarResponse(data);
    } catch (error) {
      if (error instanceof CatalogoTiposFiltroError) throw error;
      throw normalizarCatalogoTiposFiltroError(error, "RESPUESTA_INVALIDA");
    }
  },
};
