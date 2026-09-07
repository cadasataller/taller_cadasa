<script setup lang="ts">
import EquipmentSummaryPercentBar from "./EquipmentSummaryPercentBar.vue";
import type { StopReasonRow } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{ reasons: StopReasonRow[] }>();
</script>

<template>
  <article
    id="stops-main-reasons-card"
    class="flex h-auto self-start flex-col rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
  >
    <h3 class="mb-1.5 text-xs font-bold text-main">
      Principales motivos de parada
    </h3>
    <div v-if="reasons.length" class="flex-none overflow-visible">
      <table class="w-full table-fixed border-collapse text-[10px]">
        <thead>
          <tr class="border-b border-gray-100 text-left text-gray-500">
            <th class="pb-1 font-semibold">Motivo</th>
            <th class="w-[74px] pb-1 text-center font-semibold">Ocurrencias</th>
            <th class="w-[76px] pb-1 text-center font-semibold">Tiempo</th>
            <th class="w-[150px] pb-1 text-center font-semibold">% parada</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in reasons"
            :key="row.reason"
            class="border-b border-gray-100 last:border-0"
          >
            <td class="py-1.5 leading-tight break-words">{{ row.reason }}</td>
            <td class="py-1.5 text-center tabular-nums">
              {{ row.occurrences }}
            </td>
            <td class="py-1.5 text-center tabular-nums">{{ row.time }}</td>
            <td class="py-1.5">
              <EquipmentSummaryPercentBar
                :percentage="row.percentage"
                tone="accent"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="py-2 text-[10px] text-gray-500">
      Sin motivos registrados.
    </p>
  </article>
</template>
