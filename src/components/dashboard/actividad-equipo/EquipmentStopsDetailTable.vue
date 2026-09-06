<script setup lang="ts">
import type { StopDetailRow } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
import { formatCompactPanamaDateTime } from "@/utils/formatCompactPanamaDate";
import { formatOperationalNumber } from "@/utils/formatOperationalNumber";

const props = defineProps<{ details: StopDetailRow[] }>();

const originLabel: Record<StopDetailRow["origin"], string> = {
  equipo: "Equipo",
  implemento: "Implemento",
  otro: "Otro",
};
function implementLabel(row: StopDetailRow): string {
  return row.implement
    ? `${formatOperationalNumber(row.implement.number)} ${row.implement.name}`
    : "—";
}
function dateKey(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value;
}
function isStartOfNewDate(index: number): boolean {
  const currentRow = props.details[index];
  const previousRow = props.details[index - 1];
  if (!currentRow || !previousRow) return true;
  return dateKey(currentRow.startLocal) !== dateKey(previousRow.startLocal);
}
</script>

<template>
  <article
    id="stops-detail-card"
    class="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
  >
    <h3 class="mb-1.5 text-xs font-bold text-main">
      Detalle de paradas · 10 últimas
    </h3>
    <div
      id="stops-detail-scroll"
      class="min-h-0 flex-1 overflow-y-auto rounded-md border border-gray-100"
    >
      <div class="min-w-[760px]">
        <table class="w-full table-fixed border-collapse text-[10px]">
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
              <th
                class="w-16 border-b border-r border-gray-100 p-1.5 text-right font-bold"
              >
                Duración
              </th>
              <th class="border-b border-r border-gray-100 p-1.5 font-bold">
                Motivo
              </th>
              <th
                class="w-[70px] border-b border-r border-gray-100 p-1.5 font-bold"
              >
                Origen
              </th>
              <th
                class="w-[82px] border-b border-r border-gray-100 p-1.5 font-bold"
              >
                Clasificación
              </th>
              <th
                class="w-16 border-b border-r border-gray-100 p-1.5 font-bold"
              >
                Motor
              </th>
              <th class="w-[92px] border-b border-gray-100 p-1.5 font-bold">
                Implemento
              </th>
            </tr>
          </thead>
          <tbody v-if="details.length">
            <tr
              v-for="(row, index) in details"
              :key="`${row.startLocal}-${row.endLocal}-${row.reason}`"
              class="border-b border-gray-100 transition-colors last:border-0 hover:bg-main/5"
              :class="
                isStartOfNewDate(index)
                  ? 'bg-gray-50/90 shadow-[inset_3px_0_0_var(--color-main)]'
                  : ''
              "
            >
              <td
                class="border-r border-gray-100 p-1.5 align-top whitespace-nowrap"
              >
                {{ formatCompactPanamaDateTime(row.startAt) }}
              </td>
              <td
                class="border-r border-gray-100 p-1.5 align-top whitespace-nowrap"
              >
                {{ formatCompactPanamaDateTime(row.endAt) }}
              </td>
              <td
                class="border-r border-gray-100 p-1.5 text-right align-top tabular-nums whitespace-nowrap"
              >
                {{ row.duration }}
              </td>
              <td
                class="border-r border-gray-100 p-1.5 align-top leading-tight break-words"
              >
                {{ row.reason }}
              </td>
              <td class="border-r border-gray-100 p-1.5 align-top">
                {{ originLabel[row.origin] }}
              </td>
              <td class="border-r border-gray-100 p-1.5 align-top">
                {{ row.classification }}
              </td>
              <td class="border-r border-gray-100 p-1.5 align-top">
                {{ row.engine }}
              </td>
              <td class="p-1.5 align-top leading-tight break-words">
                {{ implementLabel(row) }}
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="8" class="p-3 text-center text-gray-500">
                Sin detalle de paradas.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </article>
</template>
