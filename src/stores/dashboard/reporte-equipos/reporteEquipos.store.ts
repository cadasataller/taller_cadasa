import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { reporteEquiposService } from "./reporteEquipos.service";
import type {
  EquipmentContext,
  EquipmentListItem,
  EquipmentMasterDetail,
  EquipmentSummary,
  EquipmentStops,
  ReportFilters,
  ReportLoadState,
  ReportLoadStates,
  ReportTab,
} from "./reporteEquipos.types";

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);
const initialFilters = (): ReportFilters => {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 1);
  return {
    startDate: formatDate(start),
    endDate: formatDate(today),
    search: "",
  };
};
const initialStates = (): ReportLoadStates => ({
  equipmentList: "idle",
  equipmentDetail: "idle",
  context: "idle",
  summary: "idle",
  stops: "idle",
  operators: "idle",
  operatorDetail: "idle",
});

export const useReporteEquiposStore = defineStore(
  "dashboard_reporte_equipos",
  () => {
    const filters = ref<ReportFilters>(initialFilters());
    const equipment = ref<EquipmentListItem[]>([]);
    const selectedEquipmentCode = shallowRef<string | null>(null);
    const activeTab = shallowRef<ReportTab>("resumen");
    const selectedOperatorId = shallowRef<string | null>(null);
    const masterDetail = shallowRef<EquipmentMasterDetail | null>(null);
    const context = shallowRef<EquipmentContext | null>(null);
    const summary = shallowRef<EquipmentSummary | null>(null);
    const stops = shallowRef<EquipmentStops | null>(null);
    const loadStates = ref<ReportLoadStates>(initialStates());
    const initialError = shallowRef<string | null>(null);
    const errors = ref<Record<keyof ReportLoadStates, string | null>>({
      equipmentList: null,
      equipmentDetail: null,
      context: null,
      summary: null,
      stops: null,
      operators: null,
      operatorDetail: null,
    });
    const selectedEquipment = computed(
      () =>
        equipment.value.find(
          (item) => item.code === selectedEquipmentCode.value,
        ) ?? null,
    );
    let requestId = 0;
    let stopsRequestId = 0;
    const stopsCache = new Map<string, EquipmentStops>();
    const stopsCacheKey = (code: string): string =>
      `${code}:${filters.value.startDate}:${filters.value.endDate}`;
    const updateState = (
      key: keyof ReportLoadStates,
      value: ReportLoadState,
    ): void => {
      loadStates.value = { ...loadStates.value, [key]: value };
    };
    const setFailure = (key: keyof ReportLoadStates, error: Error): void => {
      updateState(key, "error");
      errors.value = { ...errors.value, [key]: error.message };
      initialError.value = error.message;
    };
    function invalidateStops(): void {
      ++stopsRequestId;
      stops.value = null;
      updateState("stops", "idle");
      errors.value = { ...errors.value, stops: null };
    }
    async function selectEquipment(code: string): Promise<void> {
      const currentRequest = ++requestId;
      selectedEquipmentCode.value = code;
      selectedOperatorId.value = null;
      masterDetail.value = null;
      context.value = null;
      summary.value = null;
      errors.value = {
        ...errors.value,
        equipmentDetail: null,
        context: null,
        summary: null,
        stops: null,
      };
      updateState("equipmentDetail", "loading");
      updateState("context", "loading");
      updateState("summary", "loading");
      invalidateStops();
      const results = await Promise.allSettled([
        reporteEquiposService.loadMasterDetail(code),
        reporteEquiposService.loadContext(code, filters.value),
        reporteEquiposService.loadSummary(code, filters.value),
      ]);
      if (currentRequest !== requestId) return;
      const [detailResult, contextResult, summaryResult] = results;
      if (detailResult.status === "fulfilled") {
        masterDetail.value = detailResult.value;
        updateState("equipmentDetail", detailResult.value ? "ready" : "empty");
      } else
        setFailure(
          "equipmentDetail",
          detailResult.reason instanceof Error
            ? detailResult.reason
            : new Error("No se pudo cargar el detalle del equipo."),
        );
      if (contextResult.status === "fulfilled") {
        context.value = contextResult.value;
        updateState("context", "ready");
      } else
        setFailure(
          "context",
          contextResult.reason instanceof Error
            ? contextResult.reason
            : new Error("No se pudo cargar el contexto del equipo."),
        );
      if (summaryResult.status === "fulfilled") {
        summary.value = summaryResult.value;
        updateState("summary", "ready");
      } else
        setFailure(
          "summary",
          summaryResult.reason instanceof Error
            ? summaryResult.reason
            : new Error("No se pudo cargar el resumen del equipo."),
        );
      if (activeTab.value === "paradas") void loadStops();
    }
    async function loadInitial(): Promise<void> {
      const currentRequest = ++requestId;
      updateState("equipmentList", "loading");
      initialError.value = null;
      try {
        const rows = await reporteEquiposService.loadEquipmentList(
          filters.value,
        );
        if (currentRequest !== requestId) return;
        equipment.value = rows;
        updateState("equipmentList", rows.length ? "ready" : "empty");
        if (rows[0]) await selectEquipment(rows[0].code);
      } catch (error) {
        if (currentRequest !== requestId) return;
        setFailure(
          "equipmentList",
          error instanceof Error
            ? error
            : new Error("No se pudo cargar el listado de equipos."),
        );
      }
    }
    function setTab(tab: ReportTab): void {
      activeTab.value = tab;
      if (tab === "paradas") void loadStops();
    }
    async function loadStops(force = false): Promise<void> {
      const code = selectedEquipmentCode.value;
      if (!code) return;
      const key = stopsCacheKey(code);
      if (!force) {
        const cachedStops = stopsCache.get(key);
        if (cachedStops) {
          stops.value = cachedStops;
          updateState(
            "stops",
            cachedStops.metrics.stopCount === 0 ? "empty" : "ready",
          );
          return;
        }
      }
      const currentRequest = ++stopsRequestId;
      stops.value = null;
      updateState("stops", "loading");
      errors.value = { ...errors.value, stops: null };
      try {
        const loadedStops = await reporteEquiposService.loadStops(
          code,
          filters.value,
        );
        if (
          currentRequest !== stopsRequestId ||
          code !== selectedEquipmentCode.value ||
          key !== stopsCacheKey(code)
        )
          return;
        stopsCache.set(key, loadedStops);
        stops.value = loadedStops;
        updateState(
          "stops",
          loadedStops.metrics.stopCount === 0 ? "empty" : "ready",
        );
      } catch (error) {
        if (currentRequest !== stopsRequestId) return;
        setFailure(
          "stops",
          error instanceof Error
            ? error
            : new Error("No se pudo cargar las paradas del equipo."),
        );
      }
    }
    async function retryStops(): Promise<void> {
      await loadStops(true);
    }
    async function setDateRange(
      startDate: string,
      endDate: string,
    ): Promise<void> {
      invalidateStops();
      filters.value = { ...filters.value, startDate, endDate };
      await loadInitial();
    }
    async function setSearch(search: string): Promise<void> {
      filters.value = { ...filters.value, search };
      await loadInitial();
    }
    async function clearFilters(): Promise<void> {
      invalidateStops();
      filters.value = initialFilters();
      await loadInitial();
    }
    async function retrySummary(): Promise<void> {
      const code = selectedEquipmentCode.value;
      if (!code) return;
      updateState("summary", "loading");
      errors.value = { ...errors.value, summary: null };
      try {
        summary.value = await reporteEquiposService.loadSummary(
          code,
          filters.value,
        );
        updateState("summary", "ready");
      } catch (error) {
        setFailure(
          "summary",
          error instanceof Error
            ? error
            : new Error("No se pudo cargar el resumen del equipo."),
        );
      }
    }
    return {
      filters,
      equipment,
      selectedEquipmentCode,
      selectedEquipment,
      selectedOperatorId,
      activeTab,
      masterDetail,
      context,
      summary,
      stops,
      loadStates,
      initialError,
      errors,
      loadInitial,
      selectEquipment,
      setTab,
      setDateRange,
      setSearch,
      clearFilters,
      retrySummary,
      retryStops,
    };
  },
);
