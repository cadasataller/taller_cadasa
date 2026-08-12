import { supabaseEquipos } from "@/lib/supabase";
import { crearErrorEdicionEquipo } from "./equipoEngraseEdicion.errors";
import {
  mapAdministrarImagenEquipo,
  mapActualizarEquipoCompleto,
  mapAuxiliaresEdicionEquipo,
  mapBusquedaFiltroOriginal,
  mapEquipoParaEdicion,
} from "./equipoEngraseEdicion.mappers";
import type {
  AdministrarImagenEquipoDto,
  AdministrarImagenEquipoEntrada,
  AdministrarImagenEquipoRespuesta,
  ActualizarEquipoCompletoArgumento,
  ActualizarEquipoCompletoDto,
  ActualizarEquipoCompletoRespuesta,
  AuxiliaresEdicionEquipo,
  BuscarFiltroOriginalDto,
  CambiosEquipoPayload,
  EquipoParaEdicion,
  ObtenerAuxiliaresEdicionDto,
  ObtenerEquipoParaEdicionDto,
  ResultadoBusquedaFiltroOriginal,
} from "./equipoEngraseEdicion.types";

const RPC_OBTENER_EQUIPO = "rpc_obtener_equipo_para_edicion";
const RPC_OBTENER_AUXILIARES = "rpc_obtener_auxiliares_edicion_equipo";
const RPC_BUSCAR_FILTRO = "rpc_buscar_filtro_original_para_asignar";
const RPC_ACTUALIZAR_EQUIPO = "rpc_actualizar_equipo_completo";
const RPC_ADMINISTRAR_IMAGEN = "rpc_administrar_imagen_equipo";

interface ObtenerEquipoParametros {
  p_codigo: string;
}
interface BuscarFiltroParametros {
  p_codigo: string;
  p_codigo_equipo?: string;
}
interface ActualizarEquipoParametros {
  p_codigo_equipo: string;
  p_cambios: CambiosEquipoPayload;
}
interface AdministrarImagenParametros {
  p_codigo_equipo: string;
  p_operacion: AdministrarImagenEquipoEntrada["operacion"];
  p_storage_path: AdministrarImagenEquipoEntrada["storagePath"];
  p_descripcion: AdministrarImagenEquipoEntrada["descripcion"];
}

const callDbEngrase = () => supabaseEquipos.schema("engrase");
const asegurarSinError = (
  error: { message: string } | null,
  mensaje: string,
): void => {
  if (error) throw crearErrorEdicionEquipo(error.message || mensaje);
};
const asegurarDatos = <T>(data: T | null, mensaje: string): T => {
  if (data === null) throw crearErrorEdicionEquipo(mensaje);
  return data;
};

export const equipoEngraseEdicionService = {
  async obtenerEquipoParaEdicion(codigo: string): Promise<EquipoParaEdicion> {
    const parametros: ObtenerEquipoParametros = { p_codigo: codigo };
    const { data, error } = await callDbEngrase().rpc(RPC_OBTENER_EQUIPO, parametros);
    asegurarSinError(error, "No se pudo obtener el equipo.");
    return mapEquipoParaEdicion(
      asegurarDatos(
        data as ObtenerEquipoParaEdicionDto | null,
        "La RPC no devolvió datos del equipo.",
      ),
    );
  },
  async obtenerAuxiliaresEdicionEquipo(): Promise<AuxiliaresEdicionEquipo> {
    const { data, error } = await callDbEngrase().rpc(RPC_OBTENER_AUXILIARES, {});
    asegurarSinError(error, "No se pudieron obtener los auxiliares.");
    return mapAuxiliaresEdicionEquipo(
      asegurarDatos(
        data as ObtenerAuxiliaresEdicionDto | null,
        "La RPC no devolvió auxiliares.",
      ),
    );
  },
  async buscarFiltroOriginalParaAsignar(
    codigo: string,
    codigoEquipo?: string,
  ): Promise<ResultadoBusquedaFiltroOriginal> {
    const parametros: BuscarFiltroParametros =
      codigoEquipo === undefined
        ? { p_codigo: codigo }
        : { p_codigo: codigo, p_codigo_equipo: codigoEquipo };
    const { data, error } = await callDbEngrase().rpc(RPC_BUSCAR_FILTRO, parametros);
    asegurarSinError(error, "No se pudo buscar el filtro.");
    return mapBusquedaFiltroOriginal(
      asegurarDatos(
        data as BuscarFiltroOriginalDto | null,
        "La RPC no devolvió el filtro.",
      ),
    );
  },
  async actualizarEquipoCompleto(
    argumento: ActualizarEquipoCompletoArgumento,
  ): Promise<ActualizarEquipoCompletoRespuesta> {
    const parametros: ActualizarEquipoParametros = {
      p_codigo_equipo: argumento.codigoOriginal,
      p_cambios: argumento.cambios,
    };
    const { data, error } = await callDbEngrase().rpc(RPC_ACTUALIZAR_EQUIPO, parametros);
    asegurarSinError(error, "No se pudo actualizar el equipo.");
    return mapActualizarEquipoCompleto(
      asegurarDatos(
        data as ActualizarEquipoCompletoDto | null,
        "La RPC no devolvió la actualización.",
      ),
    );
  },
  async administrarImagenEquipo(
    entrada: AdministrarImagenEquipoEntrada,
  ): Promise<AdministrarImagenEquipoRespuesta> {
    const parametros: AdministrarImagenParametros = {
      p_codigo_equipo: entrada.codigoEquipo,
      p_operacion: entrada.operacion,
      p_storage_path: entrada.storagePath,
      p_descripcion: entrada.descripcion,
    };
    const { data, error } = await callDbEngrase().rpc(RPC_ADMINISTRAR_IMAGEN, parametros);
    asegurarSinError(error, "No se pudo administrar la imagen.");
    return mapAdministrarImagenEquipo(
      asegurarDatos(
        data as AdministrarImagenEquipoDto | null,
        "La RPC no devolvió la imagen.",
      ),
    );
  },
};
