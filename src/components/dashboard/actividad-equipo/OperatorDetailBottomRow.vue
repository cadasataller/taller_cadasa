<script setup lang="ts">
import type { OperatorDetail } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
import { formatCompactPanamaDateTime } from "@/utils/formatCompactPanamaDate";

const props = defineProps<{ detail: OperatorDetail }>();

function dateKey(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value;
}
function isStartOfNewDate(index: number): boolean {
  const currentRow = props.detail.history[index];
  const previousRow = props.detail.history[index - 1];
  if (!currentRow || !previousRow) return true;
  return dateKey(currentRow.startLocal) !== dateKey(previousRow.startLocal);
}
</script>

<template>
  <article
    id="operator-history-card"
    class="flex h-full min-h-40 flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
  >
    <h3 class="mb-1.5 text-xs font-bold text-main">
      Historial reciente · 10 últimos
    </h3>
    <div
      id="operator-history-scroll"
      class="min-h-0 flex-1 overflow-y-auto rounded-md border border-gray-100"
    >
      <div class="min-w-[550px]">
        <table class="w-full table-fixed text-[10px]">
          <thead class="sticky top-0 z-10 bg-gray-50 text-left text-gray-600">
            <tr>
              <th class="w-28 border-b border-gray-100 p-1.5 font-bold">
                Inicio
              </th>
              <th class="w-28 border-b border-gray-100 p-1.5 font-bold">Fin</th>
              <th class="border-b border-gray-100 p-1.5 font-bold text-center">
                Labor / Motivo
              </th>
              <th
                class="w-16 border-b border-gray-100 p-1.5 text-right font-bold"
              >
                Tiempo
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in detail.history"
              :key="`${row.startAt}-${row.endAt}-${row.detail}`"
              class="border-b border-gray-100 transition-colors last:border-0 hover:bg-main/5"
              :class="
                isStartOfNewDate(index)
                  ? 'bg-gray-50/90 shadow-[inset_3px_0_0_var(--color-main)]'
                  : ''
              "
            >
              <td class="p-1.5 align-top whitespace-nowrap">
                {{ formatCompactPanamaDateTime(row.startAt) }}
              </td>
              <td class="p-1.5 align-top whitespace-nowrap">
                {{ formatCompactPanamaDateTime(row.endAt) }}
              </td>
              <td class="p-1.5 align-top leading-tight break-words text-center">
                {{ row.detail }}
              </td>
              <td class="p-1.5 text-right align-top tabular-nums">
                {{ row.time }}
              </td>
            </tr>
            <tr v-if="!detail.history.length">
              <td colspan="4" class="p-3 text-center text-gray-500">
                Sin historial reciente.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </article>
</template>
