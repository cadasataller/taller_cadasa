export type SolicitudCompraRoleCodigo =
  | 'admin'
  | 'gerencia'
  | 'almacen'
  | 'secretaria'
  | 'operativo';

export type SolicitudCompraGrupoListado =
  | 'en_proceso'
  | 'completadas'
  | 'descartadas';

export type SolicitudCompraColumnKey =
  | 'folio'
  | 'observacion'
  | 'seguimiento'
  | 'prioridad'
  | 'destinos'
  | 'area'
  | 'solicitante'
  | 'fechaEntrega'
  | 'indicadores'
  | 'bloqueado';

export type SolicitudCompraFechaEntregaOrigen =
  | 'proveedor'
  | 'sistema'
  | 'solicitud';

export interface SolicitudCompraListRpcParams {
  p_busqueda: string | null;
  p_grupo_listado: SolicitudCompraGrupoListado | null;
  p_prioridad_codigo: string | null;
  p_fecha_desde: string | null;
  p_fecha_hasta: string | null;
  p_solo_bloqueadas: boolean;
  p_solo_diferencia_oc: boolean;
  p_limit: number | null;
  p_offset: number | null;
}

export interface SolicitudCompraListRpcRow {
  id: string | number;
  viewer_email: string | null;
  viewer_role_codigo: string | null;
  viewer_area_codigo: string | null;
  folio_sol: string | null;
  folio_oc_principal: string | null;
  folios_oc: string[] | null;
  observacion: string | null;
  seguimiento: SolicitudCompraSeguimientoRpc | null;
  badge_codigo: string | null;
  badge_label: string | null;
  prioridad_codigo: string | null;
  prioridad_nombre: string | null;
  area_solicitante_codigo: string | null;
  area_solicitante_nombre: string | null;
  solicitante_nombre: string | null;
  fecha_entrega_mostrada: string | null;
  fecha_entrega_origen: SolicitudCompraFechaEntregaOrigen | null;
  grupo_listado: SolicitudCompraGrupoListado | null;
  bloqueada: boolean;
  locked_by_email: string | null;
  locked_at: string | null;
  cantidad_adjuntos: number;
  tiene_adjuntos: boolean;
  cantidad_oc: number;
  ordenes_compra_resumen: unknown[] | null;
  estado_oc_principal: string | null;
  evaluacion_principal: string | null;
  recepcion_principal: string | null;
  proveedor_principal: string | null;
  cantidad_diferencias: number;
  tiene_diferencia_oc: boolean;
  productos_total: number;
  productos_activos: number;
  servicios_total: number;
  total_count: number;
  destinos: string[] | null;
  destinos_total: number;
  accion_rol: SolicitudCompraAccionRolRpc | null;
  badge_delegacion: SolicitudCompraBadgeDelegacionRpc | null;
  es_delegada: boolean;
  tipo_delegacion: string | null;
  es_mia: boolean;
}

export interface SolicitudCompraFolioUi {
  folioSol: string | null;
  folioSolLabel: string | null;
  folioOcPrincipal: string | null;
  foliosOc: string[];
}

export interface SolicitudCompraSeguimientoRpc {
  tipo: string | null;
  codigo: string | null;
  label: string | null;
  fecha: string | null;
  fecha_label: string | null;
  origen: string | null;
  alcance_codigo: string | null;
}

export interface SolicitudCompraAccionRolRpc {
  key: string | null;
  label: string | null;
  fecha: string | null;
  actor_email: string | null;
  role_codigo: string | null;
}

export interface SolicitudCompraBadgeDelegacionRpc {
  codigo: string | null;
  label: string | null;
  tipo_delegacion: string | null;
  solicitud_origen_id: string | null;
  creada_por_email: string | null;
  creada_para_email: string | null;
}

export interface SolicitudCompraSeguimientoUi {
  codigo: string;
  label: string;
  tipo: string | null;
  fecha: string | null;
  fechaLabel: string | null;
  origen: string | null;
  alcanceCodigo: string | null;
}

export interface SolicitudCompraSeguimientoFilterOption {
  value: string | null;
  label: string;
}

export interface SolicitudCompraGrupoOption {
  value: SolicitudCompraGrupoListado;
  label: string;
}

export interface SolicitudCompraPrioridadUi {
  codigo: string;
  nombre: string;
}

export interface SolicitudCompraAreaUi {
  codigo: string | null;
  nombre: string | null;
}

export interface SolicitudCompraSolicitanteUi {
  nombre: string | null;
}

export interface SolicitudCompraFechaEntregaUi {
  fecha: string | null;
  origen: SolicitudCompraFechaEntregaOrigen | null;
}

export interface SolicitudCompraDestinoPreview {
  loading: boolean;
  items: string[];
  visibles: string[];
  ocultos: number;
  error: string | null;
  source: 'destinos';
}

export interface SolicitudCompraIndicadores {
  bloqueado: {
    visible: boolean;
    lockedByEmail: string | null;
    lockedAt: string | null;
  };
  adjuntos: {
    visible: boolean;
    cantidad: number;
  };
  diferenciaOc: {
    visible: boolean;
    cantidad: number;
  };
}

export interface SolicitudCompraConteosUi {
  productosTotal: number;
  productosActivos: number;
  serviciosTotal: number;
  cantidadOc: number;
}

export interface SolicitudCompraOcResumenUi {
  estadoOcPrincipal: string | null;
  evaluacionPrincipal: string | null;
  recepcionPrincipal: string | null;
  proveedorPrincipal: string | null;
  ordenesCompraResumen: string | null;
}

export interface SolicitudCompraAccionRolUi {
  key: string | null;
  label: string | null;
  fecha: string | null;
  actorEmail: string | null;
  roleCodigo: string | null;
}

export interface SolicitudCompraBadgeDelegacionUi {
  codigo: string;
  label: string;
  tipoDelegacion: string | null;
  solicitudOrigenId: string | null;
  creadaPorEmail: string | null;
  creadaParaEmail: string | null;
}

export interface SolicitudCompraListItem {
  id: string | number;
  viewerRoleCodigo: SolicitudCompraRoleCodigo;
  viewerAreaCodigo: string | null;
  folio: SolicitudCompraFolioUi;
  observacion: string | null;
  seguimiento: SolicitudCompraSeguimientoUi;
  prioridad: SolicitudCompraPrioridadUi;
  destinos: SolicitudCompraDestinoPreview;
  area: SolicitudCompraAreaUi;
  solicitante: SolicitudCompraSolicitanteUi;
  fechaEntrega: SolicitudCompraFechaEntregaUi;
  indicadores: SolicitudCompraIndicadores;
  grupoListado: SolicitudCompraGrupoListado;
  conteos: SolicitudCompraConteosUi;
  ocResumen: SolicitudCompraOcResumenUi;
  accionRol: SolicitudCompraAccionRolUi | null;
  badgeDelegacion: SolicitudCompraBadgeDelegacionUi | null;
  esDelegada: boolean;
  tipoDelegacion: string | null;
  esMia: boolean;
}

export interface SolicitudCompraListFilters {
  busqueda: string;
  grupoListado: SolicitudCompraGrupoListado;
  seguimientoCodigo: string | null;
  prioridadCodigo: string | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
  soloBloqueadas: boolean;
  soloCreadasPorMi: boolean;
  soloDiferenciaOc: boolean;
  badgeDelegacionCodigo: string | null;
}

export interface SolicitudCompraPagination {
  pageSize: number;
  localVisibleCount: number;
  totalCount: number;
  hasMore: boolean;
}

export interface SolicitudCompraListState {
  baseRows: SolicitudCompraListRpcRow[];
  baseItems: SolicitudCompraListItem[];
  items: SolicitudCompraListItem[];
  loading: boolean;
  loadingMore: boolean;
  searching: boolean;
  error: string | null;
  filters: SolicitudCompraListFilters;
  pagination: SolicitudCompraPagination;
  baseEmpty: boolean;
  lastRequestKey: string | null;
  initialized: boolean;
  config: import('./solicitudesCompra.config.types').SolicitudCompraListConfigRpc | null;
  configAvailable: boolean;
  configLoadFailed: boolean;
  configWarningToken: number;
  uiMessage: string | null;
}
