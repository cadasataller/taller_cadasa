<script setup lang="ts">
import EquipmentSummaryPercentBar from "./EquipmentSummaryPercentBar.vue";
import type { EquipmentSummary } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{ summary: EquipmentSummary }>();
</script>

<template>
  <section
    id="equipment-summary-bottom-row"
    class="grid min-h-0 gap-2 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)] lg:overflow-hidden"
  >
    <article
      id="summary-equipment-implements-card"
      class="min-h-0 overflow-hidden rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">
        Implementos usados por equipo
      </h3>
      <div class="overflow-x-auto">
        <table
          class="min-w-[420px] w-full table-fixed border-collapse text-[10px]"
        >
          <thead>
            <tr class="border-b border-gray-100 text-left text-gray-500">
              <th class="w-16 pb-1 font-semibold">Implemento</th>
              <th class="pb-1 font-semibold">Descripción</th>
              <th class="w-12 pb-1 text-right font-semibold">Jornadas</th>
              <th class="w-14 pb-1 text-right font-semibold">Tiempo</th>
              <th class="w-24 pb-1 font-semibold">% uso</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in summary.implements"
              :key="row.implementId"
              class="border-b border-gray-100 last:border-0"
            >
              <td class="py-1.5 font-semibold">{{ row.number }}</td>
              <td class="py-1.5 leading-tight break-words">
                {{ row.description }}
              </td>
              <td class="py-1.5 text-right tabular-nums">{{ row.journeys }}</td>
              <td class="py-1.5 text-right tabular-nums">{{ row.time }}</td>
              <td class="py-1.5">
                <EquipmentSummaryPercentBar
                  :percentage="row.percentage"
                  tone="main"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
    <article
      id="summary-history-card"
      class="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">
        Historial reciente · 10 últimos · hora de Panamá
      </h3>
      <div
        id="summary-history-scroll"
        class="min-h-0 flex-1 overflow-y-auto rounded-md border border-gray-100"
      >
        <table
          class="min-w-[520px] w-full table-fixed border-collapse text-[10px]"
        >
          <thead class="sticky top-0 z-10 bg-gray-50 text-left text-gray-600">
            <tr>
              <th
                class="w-28 border-b border-r border-gray-100 p-1.5 font-bold"
              >
                Inicio
              </th>
              <th
                class="w-28 border-b border-r border-gray-100 p-1.5 font-bold"
              >
                Fin
              </th>
              <th class="border-b border-r border-gray-100 p-1.5 font-bold">
                Labor / Motivo
              </th>
              <th
                class="w-14 border-b border-gray-100 p-1.5 text-right font-bold"
              >
                Tiempo
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in summary.history"
              :key="`${row.startAt}-${row.kind}-${row.detail}`"
              class="border-b border-gray-100"
            >
              <td
                class="border-r border-gray-100 p-1.5 align-top whitespace-nowrap"
              >
                {{ row.startLocal }}
              </td>
              <td
                class="border-r border-gray-100 p-1.5 align-top whitespace-nowrap"
              >
                {{ row.endLocal }}
              </td>
              <td
                class="border-r border-gray-100 p-1.5 align-top leading-tight break-words"
              >
                {{ row.detail }}
              </td>
              <td class="p-1.5 text-right align-top tabular-nums">
                {{ row.time }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
