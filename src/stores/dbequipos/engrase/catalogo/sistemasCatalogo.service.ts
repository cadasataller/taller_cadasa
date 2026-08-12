import { supabaseEquipos } from "@/lib/supabase";
import { mapCatalogoSistemaGuardarResponse, mapCatalogoSistemasListarResponse } from "./sistemasCatalogo.mappers";
import { CatalogoSistemasError, normalizarCatalogoSistemasError } from "./sistemasCatalogo.errors";
import type { CatalogoSistemaGuardarInput, CatalogoSistemaGuardarResultado, CatalogoSistemaItem, CatalogoSistemasResumen } from "./sistemasCatalogo.types";
const schema = () => supabaseEquipos.schema("engrase");
export const sistemasCatalogoService = {
  async listar(): Promise<{ items: CatalogoSistemaItem[]; resumen: CatalogoSistemasResumen }> { const { data, error } = await schema().rpc("rpc_catalogo_sistemas_listar"); if (error) throw normalizarCatalogoSistemasError(error, "TRANSPORTE"); try { return mapCatalogoSistemasListarResponse(data); } catch (error) { throw normalizarCatalogoSistemasError(error, "RESPUESTA_INVALIDA"); } },
  async guardar(input: CatalogoSistemaGuardarInput): Promise<CatalogoSistemaGuardarResultado> { const pData = { id: input.id, nombre: input.nombre.trim(), activo: input.activo }; const { data, error } = await schema().rpc("rpc_catalogo_sistema_guardar", { p_data: pData }); if (error) throw normalizarCatalogoSistemasError(error, "TRANSPORTE"); if (typeof data === "object" && data !== null && "ok" in data && data.ok === false) throw normalizarCatalogoSistemasError(data); try { return mapCatalogoSistemaGuardarResponse(data); } catch (error) { if (error instanceof CatalogoSistemasError) throw error; throw normalizarCatalogoSistemasError(error, "RESPUESTA_INVALIDA"); } },
};
