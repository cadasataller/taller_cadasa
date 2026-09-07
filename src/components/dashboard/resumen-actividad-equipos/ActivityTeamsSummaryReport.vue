<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { ChartNoAxesCombined, RefreshCw } from "lucide-vue-next";
import ActivityTeamsBreakdownView from "./ActivityTeamsBreakdownView.vue";
import ActivityTeamsGeneralView from "./ActivityTeamsGeneralView.vue";
import ActivityTeamsSummaryToolbar from "./ActivityTeamsSummaryToolbar.vue";
import { useActivityTeamsSummary } from "@/composables/dashboard/useActivityTeamsSummary";
import type { ActivityTeamsSummaryTab } from "@/stores/dashboard/resumen-actividad-equipos/resumenActividadEquipos.types";

const activeTab = shallowRef<ActivityTeamsSummaryTab>("general");
const { filters, report, state, error, typePerformance, retry, setDateRange } =
  useActivityTeamsSummary();
const isReady = computed(
  () => state.value === "ready" && report.value !== null,
);
</script>

<template>
  <section
    class="min-h-full bg-second text-gray-900"
    aria-label="Resumen de actividad de equipos"
  >
    <ActivityTeamsSummaryToolbar
      :filters="filters"
      :active-tab="activeTab"
      @update-date-range="setDateRange"
      @set-tab="activeTab = $event"
    />
    <div
      v-if="state === 'loading'"
      class="flex min-h-64 items-center justify-center p-6 text-sm text-main"
    >
      <ChartNoAxesCombined
        class="mr-2 size-5 animate-pulse"
        aria-hidden="true"
      />
      Cargando resumen de actividad…
    </div>
    <div
      v-else-if="state === 'error'"
      class="mx-3 my-4 rounded-lg border border-danger/25 bg-danger/5 p-4 text-sm text-danger sm:mx-4"
    >
      <p>{{ error }}</p>
      <button
        type="button"
        class="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-danger px-3 py-2 text-xs font-bold text-white"
        @click="retry"
      >
        <RefreshCw class="size-3.5" aria-hidden="true" /> Reintentar
      </button>
    </div>
    <div
      v-else-if="state === 'empty'"
      class="p-8 text-center text-sm text-gray-500"
    >
      No hay actividad de equipos en el rango seleccionado.
    </div>
    <template v-else-if="isReady && report">
      <ActivityTeamsGeneralView
        v-if="activeTab === 'general'"
        :totals="report.totals"
        :best-day="report.bestDay"
        :worst-day="report.worstDay"
        :top-jobs="report.topJobs"
        :top-stop-reasons="report.topStopReasons"
        :type-performance="typePerformance"
      />
      <ActivityTeamsBreakdownView
        v-else
        :daily-activity="report.dailyActivity"
        :best-equipment="report.bestEquipment"
        :worst-equipment="report.worstEquipment"
        :top-operators="report.topOperators"
      />
    </template>
  </section>
</template>
