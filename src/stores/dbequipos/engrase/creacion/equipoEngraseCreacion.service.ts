import { supabaseEquipos } from "@/lib/supabase";
import { normalizarCodigoCreacion } from "./equipoEngraseCreacion.draft";
import type {
  BuscarFiltroOriginalDto,
  CrearEquipoCompletoDto,
  ObtenerAuxiliaresEquipoDto,
  ValidarCodigoEquipoCreacionDto,
} from "./equipoEngraseCreacion.dto";
import {
  mapAuxiliaresEquipo,
  mapBusquedaFiltroOriginalParaCreacion,
  mapCrearEquipoCompleto,
  mapValidacionCodigoEquipo,
} from "./equipoEngraseCreacion.mappers";
import { crearErrorCreacionEquipo } from "./equipoEngraseCreacion.remote-errors";
import type {
  AuxiliaresEquipoEngrase,
  CrearEquipoCompletoArgumento,
  CrearEquipoCompletoRespuesta,
  ResultadoBusquedaFiltroOriginal,
  ValidacionCodigoEquipoRespuesta,
} from "./equipoEngraseCreacion.types";

const RPC_OBTENER_AUXILIARES = "rpc_obtener_auxiliares_edicion_equipo";
const RPC_VALIDAR_CODIGO = "rpc_validar_codigo_equipo_para_creacion";
const RPC_BUSCAR_FILTRO = "rpc_buscar_filtro_original_para_asignar";
const RPC_CREAR_EQUIPO = "rpc_crear_equipo_completo";

interface ValidarCodigoParametros { p_codigo: string; }
interface BuscarFiltroParametros { p_codigo: string; }
interface CrearEquipoParametros {
  p_datos: CrearEquipoCompletoArgumento["datos"];
}

const schemaEngrase = () => supabaseEquipos.schema("engrase");

const asegurarSinError = (
  error: { message: string } | null,
  mensaje: string,
): void => {
  if (error) throw crearErrorCreacionEquipo(error.message || mensaje);
};

const asegurarDatos = <T>(data: T | null, mensaje: string): T => {
  if (data === null) throw crearErrorCreacionEquipo(mensaje);
  return data;
};

export const equipoEngraseCreacionService = {
  async obtenerAuxiliaresEquipo(): Promise<AuxiliaresEquipoEngrase> {
    const { data, error } = await schemaEngrase().rpc(RPC_OBTENER_AUXILIARES, {});
    asegurarSinError(error, "No se pudieron obtener los auxiliares.");
    return mapAuxiliaresEquipo(
      asegurarDatos(
        data as ObtenerAuxiliaresEquipoDto | null,
        "La RPC no devolvió auxiliares.",
      ),
    );
  },

  async validarCodigoEquipoParaCreacion(
    codigo: string,
  ): Promise<ValidacionCodigoEquipoRespuesta> {
    const parametros: ValidarCodigoParametros = {
      p_codigo: normalizarCodigoCreacion(codigo),
    };
    const { data, error } = await schemaEngrase().rpc(RPC_VALIDAR_CODIGO, parametros);
    asegurarSinError(error, "No se pudo validar el código del equipo.");
    return mapValidacionCodigoEquipo(
      asegurarDatos(
        data as ValidarCodigoEquipoCreacionDto | null,
        "La RPC no devolvió la validación del código.",
      ),
    );
  },

  async buscarFiltroOriginalParaCreacion(
    codigo: string,
  ): Promise<ResultadoBusquedaFiltroOriginal> {
    const parametros: BuscarFiltroParametros = {
      p_codigo: normalizarCodigoCreacion(codigo),
    };
    const { data, error } = await schemaEngrase().rpc(RPC_BUSCAR_FILTRO, parametros);
    asegurarSinError(error, "No se pudo buscar el filtro.");
    return mapBusquedaFiltroOriginalParaCreacion(
      asegurarDatos(
        data as BuscarFiltroOriginalDto | null,
        "La RPC no devolvió el resultado de búsqueda.",
      ),
    );
  },

  async crearEquipoCompleto(
    argumento: CrearEquipoCompletoArgumento,
  ): Promise<CrearEquipoCompletoRespuesta> {
    const parametros: CrearEquipoParametros = { p_datos: argumento.datos };
    const { data, error } = await schemaEngrase().rpc(RPC_CREAR_EQUIPO, parametros);
    asegurarSinError(error, "No se pudo crear el equipo.");
    return mapCrearEquipoCompleto(
      asegurarDatos(
        data as CrearEquipoCompletoDto | null,
        "La RPC no devolvió la creación del equipo.",
      ),
    );
  },
};
