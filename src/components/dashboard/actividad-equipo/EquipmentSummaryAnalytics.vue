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
  <section id="equipment-summary-analytics" class="grid gap-2 lg:grid-cols-3">
    <article
      id="summary-classification-card"
      class="rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">
        Distribución por clasificación
      </h3>
      <table class="w-full table-fixed border-collapse text-[10px]">
        <thead>
          <tr class="border-b border-gray-100 text-left text-gray-500">
            <th class="pb-1 font-semibold">Clasificación</th>
            <th class="w-14 pb-1 text-right font-semibold">Tiempo</th>
            <th class="w-24 pb-1 font-semibold">%</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in summary.classifications"
            :key="row.classification"
            class="border-b border-gray-100 last:border-0"
          >
            <td class="py-1.5">
              <span class="inline-flex items-center gap-1.5"
                ><i
                  class="size-1.5 rounded-full"
                  :class="
                    classificationTone(row.classification) === 'main'
                      ? 'bg-main'
                      : classificationTone(row.classification) === 'success'
                        ? 'bg-success'
                        : 'bg-warning'
                  "
                />{{ row.classification }}</span
              >
            </td>
            <td class="py-1.5 text-right tabular-nums">{{ row.time }}</td>
            <td class="py-1.5">
              <EquipmentSummaryPercentBar
                :percentage="row.percentage"
                :tone="classificationTone(row.classification)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </article>
    <article
      id="summary-main-stops-card"
      class="rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">Principales paradas</h3>
      <table class="w-full table-fixed border-collapse text-[10px]">
        <thead>
          <tr class="border-b border-gray-100 text-left text-gray-500">
            <th class="pb-1 font-semibold">Motivo</th>
            <th class="w-14 pb-1 text-right font-semibold">Tiempo</th>
            <th class="w-24 pb-1 font-semibold">%</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in summary.mainStops"
            :key="row.reason"
            class="border-b border-gray-100 last:border-0"
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
        </tbody>
      </table>
    </article>
    <article
      id="summary-operator-usage-card"
      class="rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">Uso por operador</h3>
      <table class="w-full table-fixed border-collapse text-[10px]">
        <thead>
          <tr class="border-b border-gray-100 text-left text-gray-500">
            <th class="pb-1 font-semibold">Operador</th>
            <th class="w-14 pb-1 text-right font-semibold">Tiempo</th>
            <th class="w-24 pb-1 font-semibold">%</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in summary.operators"
            :key="row.operatorId"
            class="border-b border-gray-100 last:border-0"
          >
            <td class="truncate py-1.5">{{ row.operator }}</td>
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
    </article>
  </section>
</template>
