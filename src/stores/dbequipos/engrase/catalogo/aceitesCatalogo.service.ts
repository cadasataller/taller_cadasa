import { supabaseEquipos } from "@/lib/supabase";
import { mapCatalogoAceiteGuardarResponse, mapCatalogoAceitesListarResponse } from "./aceitesCatalogo.mappers";
import { CatalogoAceitesError, normalizarCatalogoAceitesError } from "./aceitesCatalogo.errors";
import type { CatalogoAceiteGuardarInput, CatalogoAceiteGuardarResultado, CatalogoAceiteItem, CatalogoAceitesResumen } from "./aceitesCatalogo.types";
const schema = () => supabaseEquipos.schema("engrase");
export const aceitesCatalogoService = {
  async listar(): Promise<{ items: CatalogoAceiteItem[]; resumen: CatalogoAceitesResumen }> { const { data, error } = await schema().rpc("rpc_catalogo_aceites_listar"); if (error) throw normalizarCatalogoAceitesError(error, "TRANSPORTE"); try { return mapCatalogoAceitesListarResponse(data); } catch (error) { throw normalizarCatalogoAceitesError(error, "RESPUESTA_INVALIDA"); } },
  async guardar(input: CatalogoAceiteGuardarInput): Promise<CatalogoAceiteGuardarResultado> { const pData = { id: input.id, nombre: input.nombre.trim(), activo: input.activo }; const { data, error } = await schema().rpc("rpc_catalogo_aceite_guardar", { p_data: pData }); if (error) throw normalizarCatalogoAceitesError(error, "TRANSPORTE"); if (typeof data === "object" && data !== null && "ok" in data && data.ok === false) throw normalizarCatalogoAceitesError(data); try { return mapCatalogoAceiteGuardarResponse(data); } catch (error) { if (error instanceof CatalogoAceitesError) throw error; throw normalizarCatalogoAceitesError(error, "RESPUESTA_INVALIDA"); } },
};
