<script setup lang="ts">
import EquipmentSummaryPercentBar from "./EquipmentSummaryPercentBar.vue";
import type { OperatorStopReasonRow } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
defineProps<{ rows: OperatorStopReasonRow[]; operatorLabel: string }>();
</script>
<template>
  <article
    id="operator-main-stops-card"
    class="flex min-h-28 flex-col rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
  >
    <h3 class="text-xs font-bold text-main">Principales paradas</h3>
    <p class="mt-0.5 text-[10px] text-gray-500">
      {{ operatorLabel }} · últimos 10 registros
    </p>
    <table class="mt-2 w-full table-fixed text-[10px]">
      <thead class="text-left text-gray-500">
        <tr>
          <th class="pb-1 font-semibold">Motivo</th>
          <th class="w-16 pb-1 text-right font-semibold">Tiempo</th>
          <th class="w-[130px] pb-1 font-semibold">% detenido</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.reason"
          class="border-t border-gray-100"
        >
          <td class="py-1.5 leading-tight break-words">{{ row.reason }}</td>
          <td class="py-1.5 text-right tabular-nums">{{ row.time }}</td>
          <td class="py-1.5">
            <EquipmentSummaryPercentBar
              :percentage="row.percentage"
              tone="accent"
            />
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="3" class="py-3 text-center text-gray-500">
            Sin paradas registradas.
          </td>
        </tr>
      </tbody>
    </table>
  </article>
</template>
