<script setup lang="ts">
import type {
  EquipmentContext,
  StopMetrics,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{ metrics: StopMetrics; context: EquipmentContext | null }>();
</script>

<template>
  <section
    id="equipment-stops-kpis"
    class="grid grid-cols-2 gap-2 lg:grid-cols-4"
  >
    <article
      id="stops-total-time-card"
      class="flex min-h-[68px] min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm"
    >
      <span class="text-[10px] text-gray-500">Tiempo parado</span>
      <strong class="mt-0.5 text-sm tabular-nums text-main">{{
        metrics.stoppedTime
      }}</strong>
      <small class="mt-0.5 text-[10px] text-gray-500">Total acumulado</small>
    </article>
    <article
      id="stops-percentage-card"
      class="flex min-h-[68px] min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm"
    >
      <span class="text-[10px] text-gray-500">% parado</span>
      <strong class="mt-0.5 text-sm tabular-nums text-main"
        >{{ metrics.stoppedPercentage }}%</strong
      >
      <small class="mt-0.5 text-[10px] text-gray-500"
        >Sobre {{ context?.totalTime ?? "—" }} registrados</small
      >
    </article>
    <article
      id="stops-count-card"
      class="flex min-h-[68px] min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm"
    >
      <span class="text-[10px] text-gray-500">N.º de paradas</span>
      <strong class="mt-0.5 text-sm tabular-nums text-main">{{
        metrics.stopCount
      }}</strong>
      <small class="mt-0.5 text-[10px] text-gray-500"
        >Períodos con causa principal</small
      >
    </article>
    <article
      id="stops-average-duration-card"
      class="flex min-h-[68px] min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm"
    >
      <span class="text-[10px] text-gray-500">Duración promedio</span>
      <strong class="mt-0.5 text-sm tabular-nums text-main">{{
        metrics.averageDuration
      }}</strong>
      <small class="mt-0.5 text-[10px] text-gray-500"
        >Tiempo parado / paradas</small
      >
    </article>
  </section>
</template>
