<script setup lang="ts">
import type { EquipmentSummary } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

const props = defineProps<{ summary: EquipmentSummary }>();

const abbreviatedMonths = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "agos",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

function dateKey(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value;
}

function formatHistoryDate(value: string): string {
  const [rawDate, rawTime] = value.trim().split(/\s+/);
  const [rawDay, rawMonth, rawYear] = (rawDate ?? "").split("/");
  const day = Number(rawDay);
  const month = Number(rawMonth);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !rawYear
  )
    return value;

  const date = `${String(day).padStart(2, "0")} ${
    abbreviatedMonths[month - 1]
  } ${rawYear.slice(-2)}`;

  return rawTime ? `${date} - ${rawTime}` : date;
}

function isStartOfNewDate(index: number): boolean {
  const currentRow = props.summary.history[index];
  const previousRow = props.summary.history[index - 1];
  if (!currentRow || !previousRow) return true;

  return dateKey(currentRow.startLocal) !== dateKey(previousRow.startLocal);
}
</script>

<template>
  <section id="equipment-summary-bottom-row" class="min-w-0 lg:self-start">
    <article
      id="summary-history-card"
      class="flex min-w-0 flex-col overflow-visible rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm lg:max-h-[26rem] lg:overflow-hidden"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">
        Historial reciente · 10 últimos
      </h3>
      <div
        id="summary-history-scroll"
        class="min-h-0 flex-1 overflow-x-auto overflow-y-visible rounded-md border border-gray-100 lg:overflow-auto"
      >
        <table
          class="min-w-[500px] w-full table-fixed border-collapse text-[10px]"
        >
          <thead class="sticky top-0 z-10 bg-gray-50 text-left text-gray-600">
            <tr>
              <th
                class="w-[128px] border-b border-r border-gray-100 p-1.5 font-bold"
              >
                Inicio
              </th>
              <th
                class="w-[128px] border-b border-r border-gray-100 p-1.5 font-bold"
              >
                Fin
              </th>
              <th class="border-b border-r border-gray-100 p-1.5 font-bold">
                Labor / Motivo
              </th>
              <th
                class="w-16 border-b border-gray-100 p-1.5 text-right font-bold"
              >
                Tiempo
              </th>
            </tr>
          </thead>
          <tbody v-if="summary.history.length === 0">
            <tr class="h-[54px]">
              <td colspan="4" class="text-center text-[10px] text-gray-400">
                Sin datos para el período
              </td>
            </tr>
          </tbody>
          <tbody>
            <tr
              v-for="(row, index) in summary.history"
              :key="`${row.startAt}-${row.kind}-${row.detail}`"
              class="border-b border-gray-100 transition-colors last:border-0 hover:bg-main/5"
              :class="
                isStartOfNewDate(index)
                  ? 'bg-gray-50/90 shadow-[inset_3px_0_0_var(--color-main)]'
                  : ''
              "
            >
              <td
                class="border-r border-gray-100 p-1.5 align-top tabular-nums whitespace-nowrap"
              >
                {{ formatHistoryDate(row.startLocal) }}
              </td>
              <td
                class="border-r border-gray-100 p-1.5 align-top tabular-nums whitespace-nowrap"
              >
                {{ formatHistoryDate(row.endLocal) }}
              </td>
              <td
                class="min-w-0 border-r border-gray-100 p-1.5 align-top"
                :title="row.detail"
              >
                <span class="block truncate leading-tight">{{
                  row.detail
                }}</span>
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
