<script setup lang="ts">
import { computed } from "vue";
import { formatOperationalNumber } from "@/utils/formatOperationalNumber";
import type {
  EquipmentContext,
  EquipmentMasterDetail,
  EquipmentSummary,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

const props = defineProps<{
  detail: EquipmentMasterDetail | null;
  context: EquipmentContext | null;
  summary: EquipmentSummary;
}>();

const clampPercentage = (value: number): number =>
  Math.min(100, Math.max(0, value));

const effectivenessPercentage = computed(() =>
  clampPercentage(props.summary.effectiveness),
);
const stoppedPercentage = computed(() => {
  if (props.summary.totalSeconds > 0) {
    return clampPercentage(
      (props.summary.stoppedSeconds / props.summary.totalSeconds) * 100,
    );
  }

  return clampPercentage(100 - effectivenessPercentage.value);
});
const percentageFormatter = new Intl.NumberFormat("es", {
  maximumFractionDigits: 1,
});
const effectivenessLabel = computed(
  () => `${percentageFormatter.format(effectivenessPercentage.value)}%`,
);
const stoppedLabel = computed(
  () => `${percentageFormatter.format(stoppedPercentage.value)}%`,
);
</script>

<template>
  <article
    id="equipment-summary-main-card"
    class="border border-gray-200 bg-white shadow-sm"
  >
    <div
      class="grid items-stretch lg:grid-cols-[minmax(280px,1.55fr)_minmax(360px,2fr)_minmax(160px,.8fr)]"
    >
      <section
        id="equipment-summary-identity"
        class="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] items-center gap-3 px-1 py-3"
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
      <section
        id="summary-effectiveness-stops-card"
        class="grid min-w-0 border-y border-gray-200 sm:grid-rows-[minmax(0,1fr)_auto] lg:border-l lg:border-y-0"
        aria-label="Comparación entre efectividad y paradas"
      >
        <div class="grid grid-cols-2 divide-x divide-gray-200">
          <section
            id="summary-effectiveness-card"
            class="flex min-h-[88px] min-w-0 flex-col justify-center px-4 py-2"
          >
            <div class="flex items-baseline justify-between gap-2">
              <span
                class="text-[10px] font-bold uppercase tracking-wide text-main"
                >Efectividad</span
              >
              <strong
                class="text-right text-2xl font-extrabold tabular-nums text-main-dark sm:text-3xl"
                >{{ effectivenessLabel }}</strong
              >
            </div>
            <p class="mt-1 text-[11px] text-gray-600">
              <span class="font-bold tabular-nums text-gray-900">{{
                summary.workingTime
              }}</span>
              horas efectivas
            </p>
          </section>
          <section
            id="summary-stopped-card"
            class="flex min-h-[88px] min-w-0 flex-col justify-center px-4 py-2"
          >
            <div class="flex items-baseline justify-between gap-2">
              <span
                class="text-[10px] font-bold uppercase tracking-wide text-accent-dark"
                >Paradas</span
              >
              <strong
                class="text-right text-2xl font-extrabold tabular-nums text-accent-dark sm:text-3xl"
                >{{ stoppedLabel }}</strong
              >
            </div>
            <p class="mt-1 text-[11px] text-gray-600">
              <span class="font-bold tabular-nums text-gray-900">{{
                summary.stoppedTime
              }}</span>
              horas paradas
            </p>
          </section>
        </div>
        <div class="px-4 pb-4">
          <div
            class="flex h-3 overflow-hidden rounded-full bg-gray-100"
            aria-label="Proporción de efectividad y paradas"
          >
            <div
              class="bg-main transition-[width] duration-300"
              :style="{ width: `${effectivenessPercentage}%` }"
            ></div>
            <div
              class="bg-accent transition-[width] duration-300"
              :style="{ width: `${stoppedPercentage}%` }"
            ></div>
          </div>
        </div>
      </section>
      <section
        id="summary-total-time-card"
        class="flex min-h-[112px] min-w-0 flex-col items-center justify-center border-gray-200 bg-gray-50 px-4 py-3 text-center lg:border-l"
      >
        <span
          class="text-[10px] font-medium uppercase tracking-wide text-main-dark/70"
          >Horas registradas</span
        >
        <strong
          class="mt-1 text-3xl font-extrabold tabular-nums text-main-dark"
          >{{ summary.totalTime }}</strong
        >
        <small class="mt-1 text-[10px] text-main-dark/70"
          >Total acumulado</small
        >
      </section>
    </div>
  </article>
</template>
