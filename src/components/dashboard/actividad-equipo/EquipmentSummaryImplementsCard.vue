<script setup lang="ts">
import { LoaderCircle, TriangleAlert } from "lucide-vue-next";
import type {
  EquipmentSummary,
  ReportLoadState,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
import { formatOperationalNumber } from "@/utils/formatOperationalNumber";

interface Props {
  summary: EquipmentSummary | null;
  loadState: ReportLoadState;
  error: string | null;
}

defineProps<Props>();

function formatTwoWords(value: string): string {
  const [firstWord, secondWord] = value.trim().split(/\s+/);
  if (!firstWord) return "—";
  if (!secondWord) return firstWord;
  const visibleSecondWord =
    secondWord.length > 6 ? `${secondWord.slice(0, 5)}.....` : secondWord;
  return `${firstWord} ${visibleSecondWord}`;
}
</script>

<template>
  <article
    id="summary-equipment-implements-card"
    class="flex min-h-[168px] flex-1 flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm"
  >
    <header class="px-3 pb-2 pt-3">
      <h2 class="text-xs font-bold text-main">Implementos usados por equipo</h2>
    </header>
    <div
      v-if="loadState === 'loading'"
      class="grid min-h-0 flex-1 place-items-center gap-2 px-3 pb-5 pt-2 text-xs text-gray-500"
    >
      <LoaderCircle class="size-4 animate-spin text-main" />
      Cargando implementos…
    </div>
    <div
      v-else-if="loadState === 'error'"
      class="flex min-h-0 flex-1 gap-2 px-3 pb-4 text-xs text-danger"
    >
      <TriangleAlert class="size-4 shrink-0" />{{ error }}
    </div>
    <div v-else-if="summary" class="min-h-0 flex-1 overflow-auto px-3 pb-3">
      <table class="w-full table-fixed border-collapse text-[10px]">
        <thead class="sticky top-0 bg-white text-left text-gray-500">
          <tr class="border-b border-gray-100">
            <th class="py-1.5 font-semibold">Implemento</th>
            <th class="w-[58px] py-1.5 text-right font-semibold">Jornadas</th>
            <th class="w-[54px] py-1.5 text-right font-semibold">Tiempo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="summary.implements.length === 0" class="h-[54px]">
            <td colspan="3" class="text-center text-[10px] text-gray-400">
              Sin datos para el período
            </td>
          </tr>
          <tr
            v-for="row in summary.implements"
            :key="row.implementId"
            class="border-b border-gray-100 last:border-0"
          >
            <td
              class="truncate py-1.5 leading-tight"
              :title="`${formatOperationalNumber(row.number)} ${row.description}`"
            >
              <span class="font-semibold">{{
                formatOperationalNumber(row.number)
              }}</span>
              {{ formatTwoWords(row.description) }}
            </td>
            <td class="py-1.5 text-right tabular-nums">{{ row.journeys }}</td>
            <td class="py-1.5 text-right tabular-nums">{{ row.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="px-3 pb-5 text-xs text-gray-500">
      Seleccione un equipo para ver sus implementos.
    </p>
  </article>
</template>
