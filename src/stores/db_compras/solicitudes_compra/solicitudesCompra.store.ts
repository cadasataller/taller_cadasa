import { defineStore } from 'pinia';

import {
  getSeguimientoOptionsForGrupo,
  getVisibleSolicitudCompraGroups,
  isSeguimientoAllowedForGrupo,
} from './solicitudesCompra.config.helpers';
import { solicitudesCompraService } from './solicitudesCompra.service';
import {
  canShowMoreLocal,
  getDefaultDateRange,
  getInitialPagination,
  matchesSolicitudBusqueda,
  normalizarBusqueda,
} from './solicitudesCompra.helpers';
import { mapSolicitudCompraListRowsToItems } from './solicitudesCompra.mappers';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraListFilters,
  SolicitudCompraListItem,
  SolicitudCompraListRpcParams,
  SolicitudCompraListRpcRow,
  SolicitudCompraListState,
} from './solicitudesCompra.types';

const REMOTE_PAGE_SIZE = 200;

const createInitialFilters = (): SolicitudCompraListFilters => ({
  busqueda: '',
  grupoListado: 'en_proceso',
  seguimientoCodigo: null,
  prioridadCodigo: null,
  ...getDefaultDateRange(),
  soloBloqueadas: false,
  soloCreadasPorMi: false,
  soloDiferenciaOc: false,
  badgeDelegacionCodigo: null,
});

const createInitialState = (): SolicitudCompraListState => ({
  baseRows: [],
  baseItems: [],
  items: [],
  loading: false,
  loadingMore: false,
  searching: false,
  error: null,
  filters: createInitialFilters(),
  pagination: getInitialPagination(),
  baseEmpty: false,
  lastRequestKey: null,
  initialized: false,
  config: null,
  configAvailable: false,
  configLoadFailed: false,
  configWarningToken: 0,
  uiMessage: null,
});

const createBaseRpcParams = (
  filters: SolicitudCompraListFilters,
  offset: number
): SolicitudCompraListRpcParams => ({
  p_busqueda: null,
  p_grupo_listado: null,
  p_prioridad_codigo: null,
  p_fecha_desde: filters.fechaDesde,
  p_fecha_hasta: filters.fechaHasta,
  p_solo_bloqueadas: false,
  p_solo_diferencia_oc: false,
  p_limit: REMOTE_PAGE_SIZE,
  p_offset: offset,
});

const createRequestKey = (
  scope: string,
  filters: SolicitudCompraListFilters
): string =>
  JSON.stringify({
    scope,
    fechaDesde: filters.fechaDesde,
    fechaHasta: filters.fechaHasta,
  });

const filterVisibleItems = (
  items: SolicitudCompraListItem[],
  filters: SolicitudCompraListFilters,
  configAvailable: boolean
): SolicitudCompraListItem[] => items.filter((item) => {
  if (configAvailable && item.grupoListado !== filters.grupoListado) {
    return false;
  }

  if (
    configAvailable
    && filters.seguimientoCodigo
    && item.seguimiento.codigo !== filters.seguimientoCodigo
  ) {
    return false;
  }

  if (filters.prioridadCodigo && item.prioridad.codigo !== filters.prioridadCodigo) {
    return false;
  }

  if (filters.soloBloqueadas && !item.indicadores.bloqueado.visible) {
    return false;
  }

  if (configAvailable && filters.soloCreadasPorMi && !item.esMia) {
    return false;
  }

  if (filters.soloDiferenciaOc && !item.indicadores.diferenciaOc.visible) {
    return false;
  }

  if (
    configAvailable
    && filters.badgeDelegacionCodigo
    && item.badgeDelegacion?.codigo !== filters.badgeDelegacionCodigo
  ) {
    return false;
  }

  return matchesSolicitudBusqueda(item, filters.busqueda);
});

const getSafeTotalCount = (
  rows: SolicitudCompraListRpcRow[],
  fallback = 0
): number => {
  const totalCount = rows[0]?.total_count;
  return typeof totalCount === 'number' && Number.isFinite(totalCount)
    ? Math.max(totalCount, 0)
    : fallback;
};

export const useSolicitudesCompraStore = defineStore('solicitudesCompraList', {
  state: (): SolicitudCompraListState => createInitialState(),

  getters: {
    visibleGroups: (state) => getVisibleSolicitudCompraGroups(state.config),

    seguimientoOptions: (state) => getSeguimientoOptionsForGrupo(
      getVisibleSolicitudCompraGroups(state.config),
      state.filters.grupoListado
    ),

    canUseCreatedByMeFilter: (state) => {
      if (!state.configAvailable) {
        return false;
      }

      const role = state.config?.viewer.role_codigo ?? null;

      return role === 'admin' || role === 'gerencia' || role === 'secretaria';
    },
  },

  actions: {
    async cargarConfigRemota(): Promise<void> {
      try {
        const config = await solicitudesCompraService.obtenerConfigListado();
        const visibleGroups = getVisibleSolicitudCompraGroups(config);
        const currentGroupIsVisible = visibleGroups
          .some((group) => group.codigo === this.filters.grupoListado);

        this.config = config;
        this.configAvailable = true;
        this.configLoadFailed = false;
        this.uiMessage = visibleGroups.length === 0
          ? 'Usuario no tiene permitido ver solicitudes'
          : null;

        if (visibleGroups.length > 0 && !currentGroupIsVisible) {
          this.filters = {
            ...this.filters,
            grupoListado: visibleGroups[0].codigo,
            seguimientoCodigo: null,
          };
        }
      } catch {
        this.config = null;
        this.configAvailable = false;
        this.configLoadFailed = true;
        this.configWarningToken += 1;
        this.uiMessage = 'No pudimos cargar la configuracion del listado. Mostraremos una vista reducida.';
        this.filters = {
          ...this.filters,
          seguimientoCodigo: null,
          soloCreadasPorMi: false,
          badgeDelegacionCodigo: null,
        };
      }
    },

    applyVisibleItems(): void {
      if (this.configAvailable && this.visibleGroups.length === 0) {
        this.items = [];
        this.pagination = {
          ...this.pagination,
          localVisibleCount: this.pagination.pageSize,
          totalCount: 0,
          hasMore: false,
        };
        return;
      }

      const filteredItems = filterVisibleItems(
        this.baseItems,
        this.filters,
        this.configAvailable
      );
      const nextVisibleCount = Math.max(
        this.pagination.pageSize,
        Math.min(this.pagination.localVisibleCount, filteredItems.length || this.pagination.pageSize)
      );

      this.items = filteredItems.slice(0, nextVisibleCount);
      this.pagination = {
        ...this.pagination,
        localVisibleCount: nextVisibleCount,
        totalCount: filteredItems.length,
        hasMore: canShowMoreLocal(filteredItems.length, nextVisibleCount),
      };
    },

    resetVisibleItems(): void {
      this.pagination = getInitialPagination();
      this.applyVisibleItems();
    },

    async cargarInicial(): Promise<void> {
      const requestKey = createRequestKey('cargarInicial', this.filters);

      this.loading = true;
      this.loadingMore = false;
      this.searching = false;
      this.error = null;
      this.lastRequestKey = requestKey;

      try {
        await this.cargarConfigRemota();

        if (this.lastRequestKey !== requestKey) {
          return;
        }

        let allRows: SolicitudCompraListRpcRow[] = [];
        let offset = 0;
        let totalCount = 0;

        while (true) {
          const rows = await solicitudesCompraService.obtenerSolicitudesListaPagina(
            createBaseRpcParams(this.filters, offset)
          );

          if (this.lastRequestKey !== requestKey) {
            return;
          }

          totalCount = getSafeTotalCount(rows, totalCount);
          allRows = [...allRows, ...rows];

          if (rows.length < REMOTE_PAGE_SIZE || allRows.length >= totalCount) {
            break;
          }

          offset += REMOTE_PAGE_SIZE;
        }

        const baseItems = mapSolicitudCompraListRowsToItems(allRows);

        this.baseRows = allRows;
        this.baseItems = baseItems;
        this.baseEmpty = baseItems.length === 0;
        this.pagination = getInitialPagination();
        this.resetVisibleItems();
      } catch (error) {
        if (this.lastRequestKey !== requestKey) {
          return;
        }

        const message = error instanceof Error
          ? error.message
          : 'No se pudieron obtener las solicitudes';

        this.error = message;
        throw error;
      } finally {
        if (this.lastRequestKey === requestKey) {
          this.loading = false;
          this.initialized = true;
        }
      }
    },

    async cargarMas(): Promise<void> {
      if (this.loadingMore || !this.pagination.hasMore) {
        return;
      }

      this.loadingMore = true;

      try {
        const nextVisibleCount =
          this.pagination.localVisibleCount + this.pagination.pageSize;
        const filteredItems = filterVisibleItems(
          this.baseItems,
          this.filters,
          this.configAvailable
        );

        this.items = filteredItems.slice(0, nextVisibleCount);
        this.pagination = {
          ...this.pagination,
          localVisibleCount: nextVisibleCount,
          totalCount: filteredItems.length,
          hasMore: canShowMoreLocal(filteredItems.length, nextVisibleCount),
        };
      } finally {
        this.loadingMore = false;
      }
    },

    async actualizarFiltro(
      partialFilters: Partial<SolicitudCompraListFilters>
    ): Promise<void> {
      const normalizedBusqueda = partialFilters.busqueda !== undefined
        ? normalizarBusqueda(partialFilters.busqueda)
        : this.filters.busqueda;
      const nextFilters = {
        ...this.filters,
        ...partialFilters,
        busqueda: normalizedBusqueda,
      };
      const shouldReloadBase =
        partialFilters.fechaDesde !== undefined
        || partialFilters.fechaHasta !== undefined;
      const visibleGroups = getVisibleSolicitudCompraGroups(this.config);
      const shouldWarnInvalidSeguimiento =
        this.configAvailable
        && nextFilters.seguimientoCodigo !== null
        && !isSeguimientoAllowedForGrupo(
          visibleGroups,
          nextFilters.grupoListado,
          nextFilters.seguimientoCodigo
        );

      if (shouldWarnInvalidSeguimiento) {
        nextFilters.seguimientoCodigo = null;
        this.uiMessage = 'El seguimiento seleccionado ya no aplica para este grupo.';
      }

      this.filters = nextFilters;

      if (shouldReloadBase) {
        await this.cargarInicial();
        return;
      }

      this.resetVisibleItems();
    },

    async limpiarFiltros(): Promise<void> {
      this.filters = {
        ...createInitialFilters(),
        fechaDesde: this.filters.fechaDesde,
        fechaHasta: this.filters.fechaHasta,
      };
      this.resetVisibleItems();
    },

    async cambiarGrupoListado(
      grupo: SolicitudCompraGrupoListado
    ): Promise<void> {
      const visibleGroups = getVisibleSolicitudCompraGroups(this.config);
      const seguimientoCodigo = isSeguimientoAllowedForGrupo(
        visibleGroups,
        grupo,
        this.filters.seguimientoCodigo
      )
        ? this.filters.seguimientoCodigo
        : null;

      if (this.configAvailable && this.filters.seguimientoCodigo && !seguimientoCodigo) {
        this.uiMessage = 'El seguimiento seleccionado ya no aplica para este grupo.';
      }

      this.filters = {
        ...this.filters,
        grupoListado: grupo,
        seguimientoCodigo,
      };
      this.resetVisibleItems();
    },

    async refrescar(): Promise<void> {
      await this.cargarInicial();
    },

    prepararAbrirDetalle(itemId: string | number): void {
      void itemId;
      // TODO: conectar con la futura ruta de detalle cuando exista.
    },

    prepararCrearSolicitud(): void {
      // TODO: conectar con el futuro flujo de creación cuando exista.
    },
  },
});
