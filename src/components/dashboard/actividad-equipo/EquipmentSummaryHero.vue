<script setup lang="ts">
import EquipmentSummaryMetric from "./EquipmentSummaryMetric.vue";
import EquipmentSummaryEffectivenessChart from "./EquipmentSummaryEffectivenessChart.vue";
import { formatOperationalNumber } from "@/utils/formatOperationalNumber";
import type {
  EquipmentContext,
  EquipmentMasterDetail,
  EquipmentSummary,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{
  detail: EquipmentMasterDetail | null;
  context: EquipmentContext | null;
  summary: EquipmentSummary;
}>();
</script>

<template>
  <article
    id="equipment-summary-main-card"
    class="rounded-[10px] border border-gray-200 bg-white p-2 shadow-sm"
  >
    <div
      class="grid gap-2 lg:grid-cols-[minmax(280px,1.55fr)_repeat(3,minmax(120px,.75fr))]"
    >
      <section
        id="equipment-summary-identity"
        class="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] items-center gap-3 p-1"
      >
        <div
          id="equipment-summary-image"
          class="grid h-[58px] w-[76px] place-items-center overflow-hidden rounded-md border border-gray-200 bg-gray-50"
        >
          <img
            v-if="detail?.imageUrl"
            :src="detail.imageUrl"
            :alt="`Equipo ${formatOperationalNumber(detail.code)}`"
            class="h-full w-full object-contain"
          />
          <span v-else class="text-[10px] text-gray-500">IMAGEN</span>
        </div>
        <div class="min-w-0">
          <p class="text-base font-extrabold text-main">
            {{ formatOperationalNumber(detail?.code ?? summary.code) }}
          </p>
          <p class="mt-0.5 truncate text-xs text-gray-600">
            {{ detail?.type ?? "—" }}
          </p>
          <div class="mt-1.5 flex flex-wrap gap-1">
            <span
              class="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] text-success"
              >{{ context?.journeys ?? "—" }} jornadas</span
            >
            <span
              class="rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600"
              >{{
                detail ? (detail.active ? "Activo" : "Inactivo") : "—"
              }}</span
            >
          </div>
        </div>
      </section>
      <EquipmentSummaryMetric
        id="summary-total-time-card"
        label="Horas registradas"
        :value="summary.totalTime"
        detail="Total acumulado"
      />
      <EquipmentSummaryMetric
        id="summary-effective-time-card"
        label="Horas efectivas"
        :value="summary.workingTime"
        detail="Tiempo trabajando"
      />
      <EquipmentSummaryEffectivenessChart
        id="summary-effectiveness-card"
        :effectiveness="summary.effectiveness"
        :stopped-seconds="summary.stoppedSeconds"
        :total-seconds="summary.totalSeconds"
        :stopped-time="summary.stoppedTime"
      />
    </div>
  </article>
</template>
