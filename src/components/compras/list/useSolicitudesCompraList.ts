import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount } from 'vue';

import { useSolicitudesCompraStore } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.store';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraListFilters,
  SolicitudCompraListItem,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const SEARCH_DEBOUNCE_MS = 350;

export const useSolicitudesCompraList = () => {
  const store = useSolicitudesCompraStore();
  const {
    items,
    baseItems,
    loading,
    loadingMore,
    searching,
    error,
    filters,
    pagination,
    baseEmpty,
    initialized,
    configAvailable,
    visibleGroups,
    seguimientoOptions,
    canUseCreatedByMeFilter,
    uiMessage,
    configWarningToken,
  } = storeToRefs(store);

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const activeGrupo = computed(() => filters.value.grupoListado);
  const hasMore = computed(() => pagination.value.hasMore);
  const clearSearchDebounce = (): void => {
    if (searchDebounceTimer !== null) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
  };

  const runStoreAction = async (action: () => Promise<void>): Promise<void> => {
    try {
      await action();
    } catch {
      // El store ya expone el error para el estado visual del listado.
    }
  };

  const loadInitial = async (): Promise<void> => {
    clearSearchDebounce();
    await runStoreAction(() => store.cargarInicial());
  };

  const loadMore = async (): Promise<void> => {
    if (loading.value || loadingMore.value || !hasMore.value) {
      return;
    }

    await runStoreAction(() => store.cargarMas());
  };

  const scheduleFilterUpdate = (
    partialFilters: Partial<SolicitudCompraListFilters>
  ): void => {
    clearSearchDebounce();

    searchDebounceTimer = setTimeout(() => {
      searchDebounceTimer = null;
      void runStoreAction(() => store.actualizarFiltro(partialFilters));
    }, SEARCH_DEBOUNCE_MS);
  };

  const onSearchChange = (value: string): void => {
    scheduleFilterUpdate({ busqueda: value });
  };

  const onGrupoChange = async (grupo: SolicitudCompraGrupoListado): Promise<void> => {
    clearSearchDebounce();
    await runStoreAction(() => store.cambiarGrupoListado(grupo));
  };

  const onFilterChange = async (
    partialFilters: Partial<SolicitudCompraListFilters>
  ): Promise<void> => {
    if (partialFilters.busqueda !== undefined) {
      scheduleFilterUpdate(partialFilters);
      return;
    }

    clearSearchDebounce();
    await runStoreAction(() => store.actualizarFiltro(partialFilters));
  };

  const onRetry = async (): Promise<void> => {
    await loadInitial();
  };

  const onRowClick = (item: SolicitudCompraListItem): void => {
    store.prepararAbrirDetalle(item.id);
  };

  const onCardClick = (item: SolicitudCompraListItem): void => {
    store.prepararAbrirDetalle(item.id);
  };

  onBeforeUnmount(() => {
    clearSearchDebounce();
  });

  return {
    items,
    baseItems,
    loading,
    loadingMore,
    searching,
    error,
    filters,
    activeGrupo,
    hasMore,
    baseEmpty,
    initialized,
    configAvailable,
    visibleGroups,
    seguimientoOptions,
    canUseCreatedByMeFilter,
    uiMessage,
    configWarningToken,
    loadInitial,
    loadMore,
    onSearchChange,
    onGrupoChange,
    onFilterChange,
    onRetry,
    onRowClick,
    onCardClick,
  };
};
