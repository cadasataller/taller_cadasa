<script setup lang="ts">
import { computed } from "vue";
import EquipmentSummaryPercentBar from "./EquipmentSummaryPercentBar.vue";
import type {
  EquipmentSummary,
  SummaryHistoryRow,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

interface HistoryDateGroup {
  date: string;
  rows: SummaryHistoryRow[];
}

const props = defineProps<{ summary: EquipmentSummary }>();

function splitLocalDateTime(value: string): { date: string; time: string } {
  const [date = "—", ...timeParts] = value.trim().split(/\s+/);
  return { date: date || "—", time: timeParts.join(" ") || "—" };
}

function formatTwoWords(value: string): string {
  const [firstWord, secondWord] = value.trim().split(/\s+/);
  if (!firstWord) return "—";
  if (!secondWord) return firstWord;
  const visibleSecondWord =
    secondWord.length > 6 ? `${secondWord.slice(0, 5)}.....` : secondWord;
  return `${firstWord} ${visibleSecondWord}`;
}

const historyByDate = computed<HistoryDateGroup[]>(() =>
  props.summary.history.reduce<HistoryDateGroup[]>((groups, row) => {
    const date = splitLocalDateTime(row.startLocal).date;
    const latestGroup = groups[groups.length - 1];
    if (latestGroup?.date === date) latestGroup.rows.push(row);
    else groups.push({ date, rows: [row] });
    return groups;
  }, []),
);
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
        <table class="w-full table-auto border-collapse text-[10px]">
          <thead>
            <tr class="border-b border-gray-100 text-left text-gray-500">
              <th class="pb-1 font-semibold">Implemento</th>
              <th class="w-[64px] pb-1 text-right font-semibold">Jornadas</th>
              <th class="w-[64px] pb-1 text-right font-semibold">Tiempo</th>
              <th class="w-[112px] pb-1 font-semibold">% uso</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in summary.implements"
              :key="row.implementId"
              class="border-b border-gray-100 last:border-0"
            >
              <td
                class="py-1.5 leading-tight whitespace-nowrap"
                :title="`${row.number} ${row.description}`"
              >
                <span class="font-semibold">{{ row.number }}</span>
                {{ formatTwoWords(row.description) }}
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
        Historial reciente · 10 últimos
      </h3>
      <div
        id="summary-history-scroll"
        class="min-h-0 flex-1 overflow-y-auto rounded-md border border-gray-100"
      >
        <table class="w-full table-fixed border-collapse text-[10px]">
          <thead class="sticky top-0 z-10 bg-gray-50 text-left text-gray-600">
            <tr>
              <th
                class="w-[72px] border-b border-r border-gray-100 p-1.5 font-bold"
              >
                Inicio
              </th>
              <th
                class="w-[72px] border-b border-r border-gray-100 p-1.5 font-bold"
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
          <tbody v-for="group in historyByDate" :key="group.date">
            <tr class="border-b border-gray-100 bg-gray-50/70">
              <th
                colspan="4"
                class="p-1.5 text-left text-[10px] font-bold text-main"
              >
                {{ group.date }}
              </th>
            </tr>
            <tr
              v-for="row in group.rows"
              :key="`${row.startAt}-${row.kind}-${row.detail}`"
              class="border-b border-gray-100 last:border-0"
            >
              <td
                class="border-r border-gray-100 p-1.5 align-top tabular-nums whitespace-nowrap"
              >
                {{ splitLocalDateTime(row.startLocal).time }}
              </td>
              <td
                class="border-r border-gray-100 p-1.5 align-top tabular-nums whitespace-nowrap"
              >
                {{ splitLocalDateTime(row.endLocal).time }}
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
