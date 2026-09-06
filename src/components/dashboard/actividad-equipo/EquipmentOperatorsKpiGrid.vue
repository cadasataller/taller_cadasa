<script setup lang="ts">
import type { OperatorMetrics } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{ metrics: OperatorMetrics; equipmentCode: string }>();
</script>

<template>
  <section
    id="equipment-operators-kpis"
    class="grid grid-cols-2 gap-2 lg:grid-cols-4"
  >
    <article
      id="operators-unique-count-card"
      class="flex min-h-[68px] min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm"
    >
      <span class="text-[10px] text-gray-500">Operadores únicos</span>
      <strong class="mt-0.5 text-sm tabular-nums text-main">{{
        metrics.uniqueOperators
      }}</strong>
      <small class="mt-0.5 truncate text-[10px] text-gray-500"
        >Equipo {{ equipmentCode }}</small
      >
    </article>
    <article
      id="operators-total-time-card"
      class="flex min-h-[68px] min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm"
    >
      <span class="text-[10px] text-gray-500">Tiempo registrado</span>
      <strong class="mt-0.5 text-sm tabular-nums text-main">{{
        metrics.totalTime
      }}</strong>
      <small class="mt-0.5 text-[10px] text-gray-500"
        >Participación acumulada</small
      >
    </article>
    <article
      id="operators-journeys-card"
      class="flex min-h-[68px] min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm"
    >
      <span class="text-[10px] text-gray-500">Jornadas del equipo</span>
      <strong class="mt-0.5 text-sm tabular-nums text-main">{{
        metrics.journeys
      }}</strong>
      <small class="mt-0.5 text-[10px] text-gray-500">Rango consultado</small>
    </article>
    <article
      id="operators-top-participation-card"
      class="flex min-h-[68px] min-w-0 flex-col justify-center rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm"
    >
      <span class="text-[10px] text-gray-500">Mayor participación</span>
      <strong class="mt-0.5 text-sm tabular-nums text-main">{{
        metrics.topParticipation
          ? `${metrics.topParticipation.percentage}%`
          : "—"
      }}</strong>
      <small class="mt-0.5 truncate text-[10px] text-gray-500">{{
        metrics.topParticipation?.operator ?? "—"
      }}</small>
    </article>
  </section>
</template>
