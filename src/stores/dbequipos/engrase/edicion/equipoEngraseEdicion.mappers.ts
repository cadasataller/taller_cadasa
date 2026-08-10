import type { EquipoEngraseListItem } from "../filtrosEngrase.types";
import { crearErrorEdicionEquipo } from "./equipoEngraseEdicion.errors";
import type {
  AdministrarImagenEquipoDto,
  AdministrarImagenEquipoRespuesta,
  ActualizarEquipoCompletoDto,
  ActualizarEquipoCompletoRespuesta,
  AuxiliaresEdicionEquipo,
  BuscarFiltroOriginalDto,
  CambiosDetalleEquipo,
  EquipoParaEdicion,
  ObtenerAuxiliaresEdicionDto,
  ObtenerEquipoParaEdicionDto,
  ResultadoBusquedaFiltroOriginal,
  ResumenOperacionesEquipo,
} from "./equipoEngraseEdicion.types";

const asegurarExito = (
  ok: boolean,
  codigo: string | undefined,
  mensaje: string | undefined,
): void => {
  if (!ok)
    throw crearErrorEdicionEquipo(
      mensaje ?? codigo ?? "La operación de edición no fue exitosa.",
      codigo,
    );
};
const catalogo = (dto: { id: number; nombre: string }) => ({
  id: dto.id,
  nombre: dto.nombre,
});

export const mapEquipoParaEdicion = (
  dto: ObtenerEquipoParaEdicionDto,
): EquipoParaEdicion => {
  asegurarExito(dto.ok, dto.codigo, dto.mensaje);
  if (!dto.equipo)
    throw crearErrorEdicionEquipo(
      dto.mensaje ?? "Respuesta sin equipo.",
      dto.codigo,
    );
  return {
    equipo: {
      id: dto.equipo.id,
      codigo: dto.equipo.codigo,
      tipoEquipoId: dto.equipo.tipo_equipo_id,
      tipoEquipo: dto.equipo.tipo_equipo,
      subtipo: dto.equipo.subtipo ?? "",
      estado: dto.equipo.estado,
    },
    etapas: (dto.etapas ?? []).map(catalogo),
    filtros: (dto.filtros ?? []).map((filtro) => ({
      id: filtro.id,
      equipoId: filtro.equipo_id,
      tipoFiltro: catalogo(filtro.tipoFiltro),
      filtro: {
        id: filtro.filtro.id,
        codigo: filtro.filtro.codigo,
        estaEnListaCompras: filtro.filtro.esta_en_lista_compras,
      },
      cantidad: filtro.cantidad,
      cantidadEquivalencias: filtro.cantidad_equivalencias,
    })),
    aceites: (dto.aceites ?? []).map((aceite) => ({
      equipoAceiteId: aceite.equipo_aceite_id,
      sistema: catalogo(aceite.sistema),
      aceite: catalogo(aceite.aceite),
    })),
    imagen: {
      mainStoragePath: dto.equipo.main_storage_path,
      tieneImagenMain: dto.equipo.tiene_imagen_main,
      imagenActualizadaEn: dto.equipo.imagen_actualizada_en,
    },
  };
};
export const mapAuxiliaresEdicionEquipo = (
  dto: ObtenerAuxiliaresEdicionDto,
): AuxiliaresEdicionEquipo => {
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
export const mapBusquedaFiltroOriginal = (
  dto: BuscarFiltroOriginalDto,
): ResultadoBusquedaFiltroOriginal => {
  asegurarExito(dto.ok, dto.codigo, dto.mensaje);
  if (!dto.encontrado)
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
  if (!dto.filtro)
    throw crearErrorEdicionEquipo(
      "Respuesta de filtro encontrada sin filtro.",
      dto.codigo,
    );
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
const mapEquipoLista = (
  dto: NonNullable<ActualizarEquipoCompletoDto["equipo_lista"]>,
): EquipoEngraseListItem => ({
  id: dto.id,
  codigo: dto.codigo,
  tipo_equipo_id: dto.tipo_equipo_id,
  tipo_equipo: dto.tipo_equipo,
  subtipo: dto.subtipo,
  estado: dto.estado,
  main_storage_path: dto.main_storage_path,
  tiene_imagen_main: dto.tiene_imagen_main,
  imagen_actualizada_en: dto.imagen_actualizada_en,
  etapas: dto.etapas.map(catalogo),
});
export const mapActualizarEquipoCompleto = (
  dto: ActualizarEquipoCompletoDto,
): ActualizarEquipoCompletoRespuesta => {
  asegurarExito(dto.ok, dto.codigo, dto.mensaje);
  if (!dto.equipo_lista || !dto.cambios_detalle || !dto.resumen_operaciones)
    throw crearErrorEdicionEquipo(
      "Respuesta de actualización incompleta.",
      dto.codigo,
    );
  const detalle: CambiosDetalleEquipo = {
    datosEquipoCambiaron: dto.cambios_detalle.datos_equipo_cambiaron,
    etapasCambiaron: dto.cambios_detalle.etapas_cambiaron,
    filtrosCambiaron: dto.cambios_detalle.filtros_cambiaron,
    aceitesCambiaron: dto.cambios_detalle.aceites_cambiaron,
  };
  const resumen: ResumenOperacionesEquipo = {
    etapasAgregadas: dto.resumen_operaciones.etapas_agregadas,
    etapasEliminadas: dto.resumen_operaciones.etapas_eliminadas,
    filtrosAgregados: dto.resumen_operaciones.filtros_agregados,
    filtrosActualizados: dto.resumen_operaciones.filtros_actualizados,
    filtrosEliminados: dto.resumen_operaciones.filtros_eliminados,
    historialesFiltroCreados:
      dto.resumen_operaciones.historiales_filtro_creados,
    aceitesAgregados: dto.resumen_operaciones.aceites_agregados,
    aceitesActualizados: dto.resumen_operaciones.aceites_actualizados,
    aceitesEliminados: dto.resumen_operaciones.aceites_eliminados,
  };
  return {
    codigo: dto.codigo,
    mensaje: dto.mensaje,
    equipoLista: mapEquipoLista(dto.equipo_lista),
    cambiosDetalle: detalle,
    resumenOperaciones: resumen,
  };
};
export const mapAdministrarImagenEquipo = (
  dto: AdministrarImagenEquipoDto,
): AdministrarImagenEquipoRespuesta => {
  asegurarExito(dto.ok, dto.codigo, dto.mensaje);
  if (dto.equipo_id === undefined || !dto.operacion || !dto.imagen)
    throw crearErrorEdicionEquipo(
      "Respuesta de imagen incompleta.",
      dto.codigo,
    );
  return {
    codigo: dto.codigo,
    equipoId: dto.equipo_id,
    operacion: dto.operacion,
    imagen: {
      mainStoragePath: dto.imagen.main_storage_path,
      tieneImagenMain: dto.imagen.tiene_imagen_main,
      imagenActualizadaEn: dto.imagen.imagen_actualizada_en,
    },
    storagePathAnterior: dto.storage_path_anterior ?? null,
  };
};
