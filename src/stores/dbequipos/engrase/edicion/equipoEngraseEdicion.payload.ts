import { crearMotivoCambioFiltro } from "./equipoEngraseFiltroMotivo";
import type {
  AceiteActualizadoPayload,
  CambiosEquipoPayload,
  EntidadNombrePayload,
  EquipoAceiteDraft,
  EquipoEdicionDraft,
  EquipoEdicionSnapshot,
  EquipoFiltroDraft,
  FiltroCatalogoPayload,
} from "./equipoEngraseEdicion.types";

const normalizarTexto = (valor: string): string => valor.trim().replace(/\s+/gu, " ");

const entidadPayload = (
  referencia: EquipoAceiteDraft["sistemaReferencia"] | EquipoFiltroDraft["tipoFiltroReferencia"] | EquipoEdicionDraft["tipoEquipoReferencia"],
): EntidadNombrePayload => referencia.estado === "existente"
  ? { estado: "existente", id: referencia.id, nombre: normalizarTexto(referencia.nombre) }
  : { estado: "nuevo", id: null, temp_id: referencia.tempId, nombre: normalizarTexto(referencia.nombre) };

const filtroPayload = (filtro: EquipoFiltroDraft): FiltroCatalogoPayload =>
  filtro.filtroReferencia.estado === "existente"
    ? {
        estado: "existente",
        id: filtro.filtroReferencia.id,
        codigo: normalizarTexto(filtro.filtroReferencia.codigo),
        esta_en_lista_compras: filtro.filtroReferencia.estaEnListaCompras,
      }
    : {
        estado: "nuevo",
        id: null,
        temp_id: filtro.filtroReferencia.tempId,
        codigo: normalizarTexto(filtro.filtroReferencia.codigo),
        esta_en_lista_compras: filtro.filtroReferencia.estaEnListaCompras,
      };

const mismaEntidad = (
  referencia: EquipoAceiteDraft["sistemaReferencia"],
  idOriginal: number,
): boolean => referencia.estado === "existente" && referencia.id === idOriginal;

export const construirCambiosEquipo = (
  original: EquipoEdicionSnapshot,
  draft: EquipoEdicionDraft,
): CambiosEquipoPayload => {
  const cambios: CambiosEquipoPayload = {};
  const datos: NonNullable<CambiosEquipoPayload["datos_equipo"]> = {
    estado_operacion: "actualizado",
  };
  if (normalizarTexto(draft.equipo.codigo) !== normalizarTexto(original.equipo.codigo))
    datos.codigo_nuevo = normalizarTexto(draft.equipo.codigo);
  if (normalizarTexto(draft.equipo.subtipo) !== normalizarTexto(original.equipo.subtipo))
    datos.subtipo = normalizarTexto(draft.equipo.subtipo);
  if (draft.equipo.estado !== original.equipo.estado) datos.estado = draft.equipo.estado;
  if (draft.tipoEquipoReferencia.estado === "nuevo" || draft.tipoEquipoReferencia.id !== original.equipo.tipoEquipoId)
    datos.tipo_equipo = entidadPayload(draft.tipoEquipoReferencia);
  if (Object.keys(datos).length > 1) cambios.datos_equipo = datos;

  const idsOriginales = new Set(original.etapas.map((etapa) => etapa.id));
  const idsDraft = new Set(draft.etapas.map((etapa) => etapa.id));
  const agregadas = [...idsDraft].filter((id) => !idsOriginales.has(id)).map((id) => ({ estado_operacion: "nuevo" as const, etapa_id: id }));
  const eliminadas = [...idsOriginales].filter((id) => !idsDraft.has(id)).map((id) => ({ estado_operacion: "eliminado" as const, etapa_id: id }));
  if (agregadas.length || eliminadas.length) cambios.etapas = {
    ...(agregadas.length ? { agregadas } : {}),
    ...(eliminadas.length ? { eliminadas } : {}),
  };

  const nuevos = draft.filtros
    .filter((filtro) => filtro.estadoOperacion === "nuevo")
    .map((filtro) => ({
      estado_operacion: "nuevo" as const,
      temp_id: filtro.draftId,
      tipo_filtro: entidadPayload(filtro.tipoFiltroReferencia),
      filtro: filtroPayload(filtro),
      cantidad: filtro.cantidad,
    }));
  const actualizados = draft.filtros.flatMap((filtro) => {
    if (!filtro.id || filtro.estadoOperacion === "nuevo" || filtro.estadoOperacion === "pendiente_eliminacion") return [];
    const anterior = original.filtros.find((item) => item.id === filtro.id);
    if (!anterior) return [];
    const motivo = crearMotivoCambioFiltro(anterior, filtro);
    if (!motivo) return [];
    return [{
      estado_operacion: "actualizado" as const,
      equipo_filtro_id: filtro.id,
      tipo_filtro: entidadPayload(filtro.tipoFiltroReferencia),
      filtro: filtroPayload(filtro),
      cantidad: filtro.cantidad,
      motivo_cambio: motivo,
    }];
  });
  const eliminados = draft.filtros
    .filter((filtro) => filtro.id > 0 && filtro.estadoOperacion === "pendiente_eliminacion")
    .map((filtro) => ({ estado_operacion: "eliminado" as const, equipo_filtro_id: filtro.id }));
  if (nuevos.length || actualizados.length || eliminados.length) cambios.filtros = {
    ...(nuevos.length ? { nuevos } : {}),
    ...(actualizados.length ? { actualizados } : {}),
    ...(eliminados.length ? { eliminados } : {}),
  };

  const aceitesNuevos = draft.aceites
    .filter((aceite) => aceite.estadoOperacion === "nuevo")
    .map((aceite) => ({
      estado_operacion: "nuevo" as const,
      temp_id: aceite.draftId,
      sistema: entidadPayload(aceite.sistemaReferencia),
      aceite: entidadPayload(aceite.aceiteReferencia),
    }));
  const aceitesActualizados = draft.aceites.flatMap((aceite): AceiteActualizadoPayload[] => {
    if (!aceite.equipoAceiteId || aceite.estadoOperacion === "nuevo" || aceite.estadoOperacion === "pendiente_eliminacion") return [];
    const anterior = original.aceites.find((item) => item.equipoAceiteId === aceite.equipoAceiteId);
    if (!anterior || (mismaEntidad(aceite.sistemaReferencia, anterior.sistema.id) && mismaEntidad(aceite.aceiteReferencia, anterior.aceite.id))) return [];
    return [{
      estado_operacion: "actualizado",
      equipo_aceite_id: aceite.equipoAceiteId,
      sistema: entidadPayload(aceite.sistemaReferencia),
      aceite: entidadPayload(aceite.aceiteReferencia),
    }];
  });
  const aceitesEliminados = draft.aceites
    .filter((aceite) => aceite.equipoAceiteId > 0 && aceite.estadoOperacion === "pendiente_eliminacion")
    .map((aceite) => ({ estado_operacion: "eliminado" as const, equipo_aceite_id: aceite.equipoAceiteId }));
  if (aceitesNuevos.length || aceitesActualizados.length || aceitesEliminados.length) cambios.aceites = {
    ...(aceitesNuevos.length ? { nuevos: aceitesNuevos } : {}),
    ...(aceitesActualizados.length ? { actualizados: aceitesActualizados } : {}),
    ...(aceitesEliminados.length ? { eliminados: aceitesEliminados } : {}),
  };
  return cambios;
};

export const hayCambiosEquipo = (cambios: CambiosEquipoPayload): boolean => Object.keys(cambios).length > 0;
