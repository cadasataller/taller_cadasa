import { computed, reactive, shallowRef, watch } from "vue";
import { jornadaEventosService } from "@/stores/dashboard/reporte-equipos/jornadaEventos.service";
import type {
  JornadaEventoDetalle,
  JornadaEventoFilters,
  JornadaEventosCursor,
  JornadaEventosListaResponse,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

interface JornadaEventosContext {
  equipos: string[] | null;
  desde: string | null;
  hasta: string | null;
}

const initialFilters = (): JornadaEventoFilters => ({
  tipoEvento: null,
});

export function useJornadaEventos(context: () => JornadaEventosContext) {
  const filters = reactive<JornadaEventoFilters>(initialFilters());
  const response = shallowRef<JornadaEventosListaResponse | null>(null);
  const cursorHistory = shallowRef<(JornadaEventosCursor | null)[]>([null]);
  const snapshotRegistradoEn = shallowRef<string | null>(null);
  const isLoading = shallowRef(false);
  const error = shallowRef<string | null>(null);
  const selectedDetail = shallowRef<JornadaEventoDetalle | null>(null);
  const isDetailLoading = shallowRef(false);
  const detailError = shallowRef<string | null>(null);
  let requestId = 0;
  let detailRequestId = 0;

  const items = computed(() => response.value?.items ?? []);
  const canGoPrevious = computed(() => cursorHistory.value.length > 1);
  const canGoNext = computed(() => response.value?.hasMore ?? false);
  const currentPage = computed(() => cursorHistory.value.length);

  function resetPagination(): void {
    cursorHistory.value = [null];
    snapshotRegistradoEn.value = null;
  }

  async function loadPage(cursor: JornadaEventosCursor | null): Promise<void> {
    const currentRequest = ++requestId;
    isLoading.value = true;
    error.value = null;
    try {
      const loaded = await jornadaEventosService.loadList({
        ...context(),
        cursor,
        snapshotRegistradoEn: snapshotRegistradoEn.value,
        filters: { ...filters },
      });
      if (currentRequest !== requestId) return;
      response.value = loaded;
      snapshotRegistradoEn.value = loaded.snapshotRegistradoEn;
    } catch (loadError) {
      if (currentRequest !== requestId) return;
      error.value =
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el historial de eventos.";
      response.value = null;
    } finally {
      if (currentRequest === requestId) isLoading.value = false;
    }
  }

  async function refresh(): Promise<void> {
    resetPagination();
    await loadPage(null);
  }

  async function goToNextPage(): Promise<void> {
    const cursor = response.value?.nextCursor;
    if (!cursor) return;
    cursorHistory.value = [...cursorHistory.value, cursor];
    await loadPage(cursor);
  }

  async function goToPreviousPage(): Promise<void> {
    if (!canGoPrevious.value) return;
    const history = cursorHistory.value.slice(0, -1);
    cursorHistory.value = history;
    await loadPage(history.at(-1) ?? null);
  }

  async function selectEvent(eventoId: string): Promise<void> {
    const currentRequest = ++detailRequestId;
    selectedDetail.value = null;
    detailError.value = null;
    isDetailLoading.value = true;
    try {
      const detail = await jornadaEventosService.loadDetail(eventoId);
      if (currentRequest === detailRequestId) selectedDetail.value = detail;
    } catch (loadError) {
      if (currentRequest !== detailRequestId) return;
      detailError.value =
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el detalle del evento.";
    } finally {
      if (currentRequest === detailRequestId) isDetailLoading.value = false;
    }
  }

  function closeDetail(): void {
    ++detailRequestId;
    selectedDetail.value = null;
    detailError.value = null;
    isDetailLoading.value = false;
  }

  watch(
    () => filters.tipoEvento,
    () => void refresh(),
  );
  watch(
    () => {
      const value = context();
      return [
        value.equipos?.join(",") ?? null,
        value.desde,
        value.hasta,
      ] as const;
    },
    () => void refresh(),
    { immediate: true },
  );
  return {
    filters,
    items,
    isLoading,
    error,
    selectedDetail,
    isDetailLoading,
    detailError,
    canGoPrevious,
    canGoNext,
    currentPage,
    refresh,
    goToNextPage,
    goToPreviousPage,
    selectEvent,
    closeDetail,
  };
}
