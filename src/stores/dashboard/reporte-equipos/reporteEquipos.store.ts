import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { reporteEquiposService } from "./reporteEquipos.service";
import type {
  EquipmentContext,
  EquipmentListItem,
  EquipmentMasterDetail,
  EquipmentSummary,
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
    const loadStates = ref<ReportLoadStates>(initialStates());
    const initialError = shallowRef<string | null>(null);
    const selectedEquipment = computed(
      () =>
        equipment.value.find(
          (item) => item.code === selectedEquipmentCode.value,
        ) ?? null,
    );
    let requestId = 0;
    const updateState = (
      key: keyof ReportLoadStates,
      value: ReportLoadState,
    ): void => {
      loadStates.value = { ...loadStates.value, [key]: value };
    };
    const setFailure = (key: keyof ReportLoadStates, error: Error): void => {
      updateState(key, "error");
      initialError.value = error.message;
    };
    async function selectEquipment(code: string): Promise<void> {
      const currentRequest = ++requestId;
      selectedEquipmentCode.value = code;
      selectedOperatorId.value = null;
      masterDetail.value = null;
      context.value = null;
      summary.value = null;
      updateState("equipmentDetail", "loading");
      updateState("context", "loading");
      updateState("summary", "loading");
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
    }
    async function setDateRange(
      startDate: string,
      endDate: string,
    ): Promise<void> {
      filters.value = { ...filters.value, startDate, endDate };
      await loadInitial();
    }
    async function setSearch(search: string): Promise<void> {
      filters.value = { ...filters.value, search };
      await loadInitial();
    }
    async function clearFilters(): Promise<void> {
      filters.value = initialFilters();
      await loadInitial();
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
      loadStates,
      initialError,
      loadInitial,
      selectEquipment,
      setTab,
      setDateRange,
      setSearch,
      clearFilters,
    };
  },
);
