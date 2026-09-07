<script setup lang="ts">
import EquipmentSummaryPercentBar from "./EquipmentSummaryPercentBar.vue";
import type { EquipmentSummary } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{ summary: EquipmentSummary }>();

function classificationTone(
  classification: string,
): "main" | "success" | "warning" {
  if (classification === "OPERATIVO") return "success";
  if (classification === "TALLER" || classification === "IMPONDERABLE")
    return "warning";
  return "main";
}
</script>

<template>
  <section
    id="equipment-summary-analytics"
    class="grid min-h-0 items-stretch gap-2 lg:grid-cols-3"
  >
    <article
      id="summary-classification-card"
      class="group flex min-h-0 min-w-0 flex-col rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">
        Distribución por clasificación
      </h3>

      <div
        class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto lg:overflow-y-hidden lg:group-hover:overflow-y-auto"
      >
        <table class="w-full table-fixed border-collapse text-[10px]">
          <tbody>
            <tr v-if="summary.classifications.length === 0" class="h-[100px]">
              <td class="text-center text-[10px] text-gray-400">
                Sin datos para el período
              </td>
            </tr>
            <tr
              v-for="row in summary.classifications"
              :key="row.classification"
              class="border-b border-gray-100 last:border-0"
            >
              <td class="py-1.5">
                <div class="flex min-w-0 items-start justify-between gap-2">
                  <span class="flex min-w-0 gap-1.5">
                    <span
                      class="line-clamp-2 leading-tight"
                      :title="row.classification"
                      >{{ row.classification }}</span
                    >
                  </span>
                  <span class="w-11 shrink-0 tabular-nums text-gray-600">{{
                    row.time
                  }}</span>
                </div>
                <EquipmentSummaryPercentBar
                  class="mt-1"
                  :percentage="row.percentage"
                  percentage-position="end"
                  value-width="aligned"
                  :tone="classificationTone(row.classification)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
    <article
      id="summary-main-stops-card"
      class="group flex min-h-0 min-w-0 flex-col rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">Principales paradas</h3>
      <div
        class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto lg:overflow-y-hidden lg:group-hover:overflow-y-auto"
      >
        <table class="w-full table-fixed border-collapse text-[10px]">
          <tbody>
            <tr v-if="summary.mainStops.length === 0" class="h-[100px]">
              <td class="text-center text-[10px] text-gray-400">
                Sin datos para el período
              </td>
            </tr>
            <tr
              v-for="row in summary.mainStops"
              :key="row.reason"
              class="border-b border-gray-100 last:border-0"
            >
              <td class="py-1.5">
                <div class="flex min-w-0 items-start justify-between gap-2">
                  <span
                    class="line-clamp-2 min-w-0 break-words leading-tight"
                    :title="row.reason"
                    >{{ row.reason }}</span
                  >
                  <span class="w-11 shrink-0 tabular-nums text-gray-600">{{
                    row.time
                  }}</span>
                </div>
                <EquipmentSummaryPercentBar
                  class="mt-1"
                  :percentage="row.percentage"
                  percentage-position="end"
                  value-width="aligned"
                  tone="accent"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
    <article
      id="summary-operator-usage-card"
      class="group flex min-h-0 min-w-0 flex-col rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">Uso por operador</h3>
      <div
        class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto lg:overflow-y-hidden lg:group-hover:overflow-y-auto"
      >
        <table class="w-full table-fixed border-collapse text-[10px]">
          <tbody>
            <tr v-if="summary.operators.length === 0" class="h-[100px]">
              <td class="text-center text-[10px] text-gray-400">
                Sin datos para el período
              </td>
            </tr>
            <tr
              v-for="row in summary.operators"
              :key="row.operatorId"
              class="border-b border-gray-100 last:border-0"
            >
              <td class="py-1.5">
                <div class="flex min-w-0 items-start justify-between gap-2">
                  <span
                    class="line-clamp-2 min-w-0 break-words leading-tight"
                    :title="row.operator"
                    >{{ row.operator }}</span
                  >
                  <span class="w-11 shrink-0 tabular-nums text-gray-600">{{
                    row.time
                  }}</span>
                </div>
                <EquipmentSummaryPercentBar
                  class="mt-1"
                  :percentage="row.percentage"
                  percentage-position="end"
                  value-width="aligned"
                  tone="main"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
