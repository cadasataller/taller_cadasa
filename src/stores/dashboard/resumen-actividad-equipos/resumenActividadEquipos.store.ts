import { computed, shallowRef } from "vue";
import { defineStore } from "pinia";
import { activityTeamsSummaryService } from "./resumenActividadEquipos.service";
import type {
  ActivityTeamsFilters,
  ActivityTeamsLoadState,
  ActivityTeamsReport,
  ActivityTeamsTypePerformance,
} from "./resumenActividadEquipos.types";

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialFilters(): ActivityTeamsFilters {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  return { startDate: toIsoDate(startDate), endDate: toIsoDate(endDate) };
}

export const useActivityTeamsSummaryStore = defineStore(
  "dashboard_resumen_actividad_equipos",
  () => {
    const filters = shallowRef<ActivityTeamsFilters>(initialFilters());
    const report = shallowRef<ActivityTeamsReport | null>(null);
    const state = shallowRef<ActivityTeamsLoadState>("idle");
    const error = shallowRef<string | null>(null);
    let requestId = 0;

    const typePerformance = computed<ActivityTeamsTypePerformance[]>(() => {
      if (!report.value) return [];
      const grouped = new Map<
        string,
        {
          effectiveSeconds: number;
          stoppedSeconds: number;
          totalSeconds: number;
        }
      >();
      report.value.equipmentPerformance.forEach((performance) => {
        const type = performance.type ?? "Sin tipo";
        const current = grouped.get(type) ?? {
          effectiveSeconds: 0,
          stoppedSeconds: 0,
          totalSeconds: 0,
        };
        grouped.set(type, {
          effectiveSeconds:
            current.effectiveSeconds + performance.effectiveSeconds,
          stoppedSeconds: current.stoppedSeconds + performance.stoppedSeconds,
          totalSeconds: current.totalSeconds + performance.totalSeconds,
        });
      });
      return [...grouped.entries()].map(([label, metrics]) => ({
        label,
        value: `${metrics.totalSeconds ? ((metrics.effectiveSeconds / metrics.totalSeconds) * 100).toFixed(1) : "0.0"}%`,
        percentage: metrics.totalSeconds
          ? (metrics.effectiveSeconds / metrics.totalSeconds) * 100
          : 0,
        secondary: null,
      }));
    });

    async function load(): Promise<void> {
      const currentRequest = ++requestId;
      state.value = "loading";
      error.value = null;
      try {
        const nextReport = await activityTeamsSummaryService.loadReport(
          filters.value,
        );
        if (currentRequest !== requestId) return;
        const types = await activityTeamsSummaryService.loadEquipmentTypes(
          nextReport.equipmentPerformance.map((item) => item.code),
        );
        if (currentRequest !== requestId) return;
        const typeByCode = new Map(
          types.map((item) => [item.code, item.type?.trim() || "Sin tipo"]),
        );
        report.value = {
          ...nextReport,
          equipmentPerformance: nextReport.equipmentPerformance.map((item) => ({
            ...item,
            type: typeByCode.get(item.code) ?? "Sin tipo",
          })),
        };
        state.value = report.value.equipmentPerformance.length
          ? "ready"
          : "empty";
      } catch (caughtError) {
        if (currentRequest !== requestId) return;
        report.value = null;
        error.value =
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el resumen de actividad.";
        state.value = "error";
      }
    }

    async function setDateRange(
      startDate: string,
      endDate: string,
    ): Promise<void> {
      filters.value = { startDate, endDate };
      await load();
    }

    return {
      filters,
      report,
      state,
      error,
      typePerformance,
      load,
      setDateRange,
    };
  },
);
