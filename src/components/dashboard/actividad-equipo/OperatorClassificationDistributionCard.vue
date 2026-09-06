<script setup lang="ts">
import EquipmentSummaryPercentBar from "./EquipmentSummaryPercentBar.vue";
import type { OperatorClassificationDistributionRow } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{ rows: OperatorClassificationDistributionRow[] }>();

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
  <article
    id="operator-classification-distribution-card"
    class="flex flex-col rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
  >
    <h3 class="text-xs font-bold text-main">Distribución por clasificación</h3>
    <table class="mt-2 w-full table-fixed text-[10px]">
      <thead class="text-left text-gray-500">
        <tr>
          <th class="pb-1 font-semibold">Clasificación</th>
          <th class="w-16 pb-1 text-left font-semibold">Tiempo</th>
          <th class="w-[130px] pb-1 font-semibold text-center">% muestra</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.classification"
          class="border-t border-gray-100"
        >
          <td class="py-1.5">
            <span class="flex min-w-0 items-start gap-1.5">
              <i
                class="mt-0.5 size-1.5 shrink-0 rounded-full"
                :class="
                  classificationTone(row.classification) === 'main'
                    ? 'bg-main'
                    : classificationTone(row.classification) === 'success'
                      ? 'bg-success'
                      : 'bg-warning'
                "
              />
              <span
                class="leading-tight break-words"
                :title="row.classification"
              >
                {{ row.classification }}
              </span>
            </span>
          </td>
          <td class="py-1.5 text-left tabular-nums">{{ row.time }}</td>
          <td class="py-1.5 text-center">
            <EquipmentSummaryPercentBar
              :percentage="row.percentage"
              :tone="classificationTone(row.classification)"
            />
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="3" class="py-3 text-center text-gray-500">
            Sin clasificación registrada.
          </td>
        </tr>
      </tbody>
    </table>
  </article>
</template>
