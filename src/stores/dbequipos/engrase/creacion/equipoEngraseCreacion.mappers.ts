import { mapEquipoEngraseListItem } from "../shared/equipoEngraseListItem.mapper";
import { crearErrorCreacionEquipo } from "./equipoEngraseCreacion.remote-errors";
import type {
  BuscarFiltroOriginalDto,
  CrearEquipoCompletoDto,
  ObtenerAuxiliaresEquipoDto,
  ValidarCodigoEquipoCreacionDto,
} from "./equipoEngraseCreacion.dto";
import type {
  AuxiliaresEquipoEngrase,
  CrearEquipoCompletoRespuesta,
  ResultadoBusquedaFiltroOriginal,
  ValidacionCodigoEquipoRespuesta,
} from "./equipoEngraseCreacion.types";

const asegurarExito = (
  ok: boolean,
  codigo: string | undefined,
  mensaje: string | undefined,
): void => {
  if (!ok) {
    throw crearErrorCreacionEquipo(
      mensaje ?? codigo ?? "La operación de creación no fue exitosa.",
      codigo,
    );
  }
};

const catalogo = (dto: { id: number; nombre: string }) => ({
  id: dto.id,
  nombre: dto.nombre,
});

export const mapAuxiliaresEquipo = (
  dto: ObtenerAuxiliaresEquipoDto,
): AuxiliaresEquipoEngrase => {
  asegurarExito(dto.ok, dto.codigo, dto.mensaje);
  return {
    tiposEquipo: (dto.tipos_equipo ?? []).map((tipo) => ({
      ...catalogo(tipo),
      subtiposSugeridos: tipo.subtipos_sugeridos,
    })),
    etapas: (dto.etapas ?? []).map(catalogo),
    tiposFiltro: (dto.tipos_filtro ?? []).map((tipo) => ({
      ...catalogo(tipo),
      tiposEquipoQueLoUsan: tipo.tipos_equipo_que_lo_usan,
    })),
    sistemasAceite: (dto.sistemas_aceite ?? []).map(catalogo),
    aceites: (dto.aceites ?? []).map(catalogo),
  };
};

export const mapValidacionCodigoEquipo = (
  dto: ValidarCodigoEquipoCreacionDto,
): ValidacionCodigoEquipoRespuesta => {
  if (!("puede_crearse" in dto)) {
    throw crearErrorCreacionEquipo("La respuesta de validación es incompleta.");
  }
  if (dto.puede_crearse) return { puedeCrearse: true };
  return {
    puedeCrearse: false,
    modeloExistente: dto.modelo ?? null,
    activoExistente: dto.activo ?? null,
  };
};

export const mapBusquedaFiltroOriginalParaCreacion = (
  dto: BuscarFiltroOriginalDto,
): ResultadoBusquedaFiltroOriginal => {
  asegurarExito(dto.ok, dto.codigo, dto.mensaje);
  if (!dto.encontrado) {
    return {
      encontrado: false,
      coincidenciaExacta: false,
      codigo: dto.codigo,
      codigoBuscado: dto.codigo_buscado ?? "",
      puedeCrearse: dto.puede_crearse === true,
      sugerencias: (dto.sugerencias ?? []).map((sugerencia) => ({
        id: sugerencia.id,
        codigo: sugerencia.codigo,
        estaEnListaCompras: sugerencia.esta_en_lista_compras,
      })),
    };
  }
  if (!dto.filtro) {
    throw crearErrorCreacionEquipo(
      "Respuesta de filtro encontrada sin filtro.",
      dto.codigo,
    );
  }
  return {
    encontrado: true,
    coincidenciaExacta: true,
    codigo: dto.codigo,
    filtro: {
      id: dto.filtro.id,
      codigo: dto.filtro.codigo,
      estaEnListaCompras: dto.filtro.esta_en_lista_compras,
    },
    requiereSeleccionarTipo: dto.requiere_seleccionar_tipo === true,
    sinTiposRegistrados: dto.sin_tipos_registrados === true,
    tiposPosibles: (dto.tipos_posibles ?? []).map((tipo) => ({
      tipoFiltro: catalogo(tipo.tipo_filtro),
      tiposEquipoQueLoUsan: tipo.tipos_equipo_que_lo_usan,
      yaAsignadoAlEquipo: tipo.ya_asignado_al_equipo,
      equipoFiltroActual: tipo.equipo_filtro_actual
        ? {
            equipoFiltroId: tipo.equipo_filtro_actual.equipo_filtro_id,
            codigo: tipo.equipo_filtro_actual.codigo,
            cantidad: tipo.equipo_filtro_actual.cantidad,
          }
        : null,
    })),
  };
};

export const mapBusquedaFiltroOriginal = mapBusquedaFiltroOriginalParaCreacion;

export const mapCrearEquipoCompleto = (
  dto: CrearEquipoCompletoDto,
): CrearEquipoCompletoRespuesta => {
  asegurarExito(dto.ok, dto.codigo, dto.mensaje);
  if (!dto.equipo_lista || !dto.resumen_operaciones) {
    throw crearErrorCreacionEquipo(
      "Respuesta de creación incompleta.",
      "RESPUESTA_CREACION_INCOMPLETA",
    );
  }
  return {
    codigo: dto.codigo,
    mensaje: dto.mensaje,
    equipoLista: mapEquipoEngraseListItem(dto.equipo_lista),
    resumenOperaciones: {
      etapasAgregadas: dto.resumen_operaciones.etapas_agregadas,
      filtrosAgregados: dto.resumen_operaciones.filtros_agregados,
      aceitesAgregados: dto.resumen_operaciones.aceites_agregados,
    },
  };
};
