import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { reporteEquiposService } from "./reporteEquipos.service";
import type {
  EquipmentContext,
  EquipmentListItem,
  EquipmentMasterDetail,
  EquipmentOperators,
  OperatorDetail,
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
    const operators = shallowRef<EquipmentOperators | null>(null);
    const operatorDetail = shallowRef<OperatorDetail | null>(null);
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
    let operatorsRequestId = 0;
    let operatorDetailRequestId = 0;
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
      if (key === "equipmentList") initialError.value = error.message;
    };
    function invalidateStops(): void {
      ++stopsRequestId;
      stops.value = null;
      updateState("stops", "idle");
      errors.value = { ...errors.value, stops: null };
    }
    function invalidateOperators(): void {
      ++operatorsRequestId;
      ++operatorDetailRequestId;
      selectedOperatorId.value = null;
      operators.value = null;
      operatorDetail.value = null;
      updateState("operators", "idle");
      updateState("operatorDetail", "idle");
      errors.value = { ...errors.value, operators: null, operatorDetail: null };
    }
    async function selectEquipment(code: string): Promise<void> {
      const currentRequest = ++requestId;
      selectedEquipmentCode.value = code;
      invalidateOperators();
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
      if (activeTab.value === "operadores") void loadOperators();
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
      if (tab === "operadores") void loadOperators();
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
    async function loadOperators(force = false): Promise<void> {
      const code = selectedEquipmentCode.value;
      if (
        !code ||
        (!force && loadStates.value.operators === "ready" && operators.value)
      )
        return;
      const currentRequest = ++operatorsRequestId;
      operators.value = null;
      updateState("operators", "loading");
      errors.value = { ...errors.value, operators: null };
      try {
        const loadedOperators = await reporteEquiposService.loadOperators(
          code,
          filters.value,
        );
        if (
          currentRequest !== operatorsRequestId ||
          code !== selectedEquipmentCode.value
        )
          return;
        operators.value = loadedOperators;
        updateState(
          "operators",
          loadedOperators.operators.length ? "ready" : "empty",
        );
      } catch (error) {
        if (currentRequest !== operatorsRequestId) return;
        setFailure(
          "operators",
          error instanceof Error
            ? error
            : new Error("No se pudo cargar los operadores del equipo."),
        );
      }
    }
    async function selectOperator(operatorId: string): Promise<void> {
      const code = selectedEquipmentCode.value;
      if (
        !code ||
        !operators.value?.operators.some((row) => row.operatorId === operatorId)
      )
        return;
      const currentRequest = ++operatorDetailRequestId;
      selectedOperatorId.value = operatorId;
      operatorDetail.value = null;
      updateState("operatorDetail", "loading");
      errors.value = { ...errors.value, operatorDetail: null };
      const startDate = filters.value.startDate;
      const endDate = filters.value.endDate;
      try {
        const detail = await reporteEquiposService.loadOperatorDetail(
          code,
          operatorId,
          filters.value,
        );
        if (
          currentRequest !== operatorDetailRequestId ||
          code !== selectedEquipmentCode.value ||
          operatorId !== selectedOperatorId.value ||
          startDate !== filters.value.startDate ||
          endDate !== filters.value.endDate
        )
          return;
        operatorDetail.value = detail;
        updateState(
          "operatorDetail",
          detail.history.length ||
            detail.classificationDistribution.length ||
            detail.mainStops.length
            ? "ready"
            : "empty",
        );
      } catch (error) {
        if (currentRequest !== operatorDetailRequestId) return;
        setFailure(
          "operatorDetail",
          error instanceof Error
            ? error
            : new Error("No se pudo cargar el detalle del operador."),
        );
      }
    }
    async function retryOperatorDetail(): Promise<void> {
      if (selectedOperatorId.value)
        await selectOperator(selectedOperatorId.value);
    }
    async function refreshSelectedEquipmentRange(code: string): Promise<void> {
      const currentRequest = ++requestId;
      invalidateOperators();
      context.value = null;
      summary.value = null;
      errors.value = {
        ...errors.value,
        context: null,
        summary: null,
        stops: null,
      };
      updateState("context", "loading");
      updateState("summary", "loading");
      invalidateStops();
      const results = await Promise.allSettled([
        reporteEquiposService.loadContext(code, filters.value),
        reporteEquiposService.loadSummary(code, filters.value),
      ]);
      if (currentRequest !== requestId || code !== selectedEquipmentCode.value)
        return;
      const [contextResult, summaryResult] = results;
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
      if (activeTab.value === "operadores") void loadOperators();
    }
    async function setDateRange(
      startDate: string,
      endDate: string,
    ): Promise<void> {
      filters.value = { ...filters.value, startDate, endDate };
      const code = selectedEquipmentCode.value;
      if (!code) {
        await loadInitial();
        return;
      }
      await refreshSelectedEquipmentRange(code);
    }
    async function setSearch(search: string): Promise<void> {
      invalidateOperators();
      filters.value = { ...filters.value, search };
      await loadInitial();
    }
    async function clearFilters(): Promise<void> {
      invalidateStops();
      invalidateOperators();
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
      operators,
      operatorDetail,
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
      loadOperators,
      selectOperator,
      retryOperatorDetail,
    };
  },
);
