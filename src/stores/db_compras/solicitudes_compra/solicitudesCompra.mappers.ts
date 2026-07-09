import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraListItem,
  SolicitudCompraListRpcRow,
  SolicitudCompraRoleCodigo,
} from './solicitudesCompra.types';
import {
  calcularDestinosVisibles,
  formatFolioSol,
  normalizarTextoVacio,
  safeArrayText,
} from './solicitudesCompra.helpers';

const FALLBACK_ROLE: SolicitudCompraRoleCodigo = 'operativo';
const FALLBACK_GRUPO: SolicitudCompraGrupoListado = 'en_proceso';

const ROLE_CODES: SolicitudCompraRoleCodigo[] = [
  'admin',
  'gerencia',
  'almacen',
  'secretaria',
  'operativo',
];

const GRUPO_CODES: SolicitudCompraGrupoListado[] = [
  'en_proceso',
  'completadas',
  'descartadas',
];

const toRoleCodigo = (value: string | null): SolicitudCompraRoleCodigo =>
  ROLE_CODES.includes(value as SolicitudCompraRoleCodigo)
    ? (value as SolicitudCompraRoleCodigo)
    : FALLBACK_ROLE;

const toGrupoListado = (value: SolicitudCompraListRpcRow['grupo_listado']): SolicitudCompraGrupoListado =>
  value && GRUPO_CODES.includes(value) ? value : FALLBACK_GRUPO;

export const mapSolicitudCompraListRowToItem = (
  row: SolicitudCompraListRpcRow
): SolicitudCompraListItem => {
  const foliosOc = safeArrayText(row.folios_oc);
  const ordenesCompraResumenParts = safeArrayText(row.ordenes_compra_resumen);
  const destinosItems = safeArrayText(row.destinos);
  const destinosTotal = Math.max(row.destinos_total, 0);
  const { visibles, ocultos } = calcularDestinosVisibles(destinosItems);
  const seguimientoCodigo = normalizarTextoVacio(row.seguimiento?.codigo) ?? 'sin_seguimiento';
  const seguimientoLabel = normalizarTextoVacio(row.seguimiento?.label) ?? 'Sin seguimiento';
  const prioridadCodigo = normalizarTextoVacio(row.prioridad_codigo) ?? 'sin_prioridad';
  const prioridadNombre = normalizarTextoVacio(row.prioridad_nombre) ?? 'Sin prioridad';
  const cantidadAdjuntos = Math.max(row.cantidad_adjuntos, 0);
  const cantidadDiferencias = Math.max(row.cantidad_diferencias, 0);
  const cantidadOc = Math.max(row.cantidad_oc, 0);
  const productosTotal = Math.max(row.productos_total, 0);
  const productosActivos = Math.max(row.productos_activos, 0);
  const serviciosTotal = Math.max(row.servicios_total, 0);

  return {
    id: row.id,
    viewerRoleCodigo: toRoleCodigo(row.viewer_role_codigo),
    viewerAreaCodigo: normalizarTextoVacio(row.viewer_area_codigo),
    folio: {
      folioSol: normalizarTextoVacio(row.folio_sol),
      folioSolLabel: formatFolioSol(row.folio_sol),
      folioOcPrincipal: normalizarTextoVacio(row.folio_oc_principal),
      foliosOc,
    },
    observacion: normalizarTextoVacio(row.observacion),
    seguimiento: {
      codigo: seguimientoCodigo,
      label: seguimientoLabel,
      tipo: normalizarTextoVacio(row.seguimiento?.tipo),
      fecha: normalizarTextoVacio(row.seguimiento?.fecha),
      fechaLabel: normalizarTextoVacio(row.seguimiento?.fecha_label),
      origen: normalizarTextoVacio(row.seguimiento?.origen),
      alcanceCodigo: normalizarTextoVacio(row.seguimiento?.alcance_codigo),
    },
    prioridad: {
      codigo: prioridadCodigo,
      nombre: prioridadNombre,
    },
    destinos: {
      loading: false,
      items: destinosItems,
      visibles,
      ocultos: Math.max(destinosTotal - visibles.length, ocultos, 0),
      error: null,
      source: 'destinos',
    },
    area: {
      codigo: normalizarTextoVacio(row.area_solicitante_codigo),
      nombre: normalizarTextoVacio(row.area_solicitante_nombre),
    },
    solicitante: {
      nombre: normalizarTextoVacio(row.solicitante_nombre),
    },
    fechaEntrega: {
      fecha: normalizarTextoVacio(row.fecha_entrega_mostrada),
      origen: row.fecha_entrega_origen,
    },
    indicadores: {
      bloqueado: {
        visible: row.bloqueada === true,
        lockedByEmail: normalizarTextoVacio(row.locked_by_email),
        lockedAt: normalizarTextoVacio(row.locked_at),
      },
      adjuntos: {
        visible: row.tiene_adjuntos === true && cantidadAdjuntos > 0,
        cantidad: cantidadAdjuntos,
      },
      diferenciaOc: {
        visible:
          row.tiene_diferencia_oc === true &&
          cantidadDiferencias > 0 &&
          cantidadOc > 0,
        cantidad: cantidadDiferencias,
      },
    },
    grupoListado: toGrupoListado(row.grupo_listado),
    conteos: {
      productosTotal,
      productosActivos,
      serviciosTotal,
      cantidadOc,
    },
    ocResumen: {
      estadoOcPrincipal: normalizarTextoVacio(row.estado_oc_principal),
      evaluacionPrincipal: normalizarTextoVacio(row.evaluacion_principal),
      recepcionPrincipal: normalizarTextoVacio(row.recepcion_principal),
      proveedorPrincipal: normalizarTextoVacio(row.proveedor_principal),
      ordenesCompraResumen:
        ordenesCompraResumenParts.length > 0
          ? ordenesCompraResumenParts.join(', ')
          : null,
    },
    accionRol: row.accion_rol
      ? {
        key: normalizarTextoVacio(row.accion_rol.key),
        label: normalizarTextoVacio(row.accion_rol.label),
        fecha: normalizarTextoVacio(row.accion_rol.fecha),
        actorEmail: normalizarTextoVacio(row.accion_rol.actor_email),
        roleCodigo: normalizarTextoVacio(row.accion_rol.role_codigo),
      }
      : null,
    badgeDelegacion: row.badge_delegacion?.codigo
      ? {
        codigo: normalizarTextoVacio(row.badge_delegacion.codigo) ?? 'sin_delegacion',
        label: normalizarTextoVacio(row.badge_delegacion.label) ?? 'Delegada',
        tipoDelegacion: normalizarTextoVacio(row.badge_delegacion.tipo_delegacion),
        solicitudOrigenId: normalizarTextoVacio(row.badge_delegacion.solicitud_origen_id),
        creadaPorEmail: normalizarTextoVacio(row.badge_delegacion.creada_por_email),
        creadaParaEmail: normalizarTextoVacio(row.badge_delegacion.creada_para_email),
      }
      : null,
    esDelegada: row.es_delegada === true,
    tipoDelegacion: normalizarTextoVacio(row.tipo_delegacion),
    esMia: row.es_mia === true,
  };
};

export const mapSolicitudCompraListRowsToItems = (
  rows: SolicitudCompraListRpcRow[]
): SolicitudCompraListItem[] => rows.map(mapSolicitudCompraListRowToItem);
