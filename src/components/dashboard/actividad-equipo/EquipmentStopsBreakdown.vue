<script setup lang="ts">
import EquipmentSummaryPercentBar from "./EquipmentSummaryPercentBar.vue";
import type {
  StopClassificationRow,
  StopOriginRow,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{
  classifications: StopClassificationRow[];
  origins: StopOriginRow[];
}>();

function classificationTone(value: string): "main" | "success" | "warning" {
  if (value === "OPERATIVO") return "success";
  if (value === "TALLER" || value === "IMPONDERABLE") return "warning";
  return "main";
}
function originTone(
  value: StopOriginRow["origin"],
): "main" | "success" | "warning" {
  if (value === "implemento") return "success";
  if (value === "equipo") return "warning";
  return "main";
}
const originLabel: Record<StopOriginRow["origin"], string> = {
  equipo: "Equipo",
  implemento: "Implemento",
  otro: "Otro",
};
</script>

<template>
  <section class="grid items-stretch gap-2 lg:grid-cols-2">
    <article
      id="stops-classification-card"
      class="rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">
        Paradas por clasificación
      </h3>
      <div v-if="classifications.length" class="overflow-x-auto">
        <table class="w-full table-fixed border-collapse text-[10px]">
          <thead>
            <tr class="border-b border-gray-100 text-left text-gray-500">
              <th class="pb-1 font-semibold">Clasificación</th>
              <th class="w-[68px] pb-1 text-right font-semibold">Tiempo</th>
              <th class="w-14 pb-1 text-right font-semibold">N.º</th>
              <th class="w-[118px] pb-1 font-semibold">% parada</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in classifications"
              :key="row.classification"
              class="border-b border-gray-100 last:border-0"
            >
              <td class="py-1.5">
                <span class="inline-flex items-center gap-1.5"
                  ><i
                    class="size-1.5 rounded-full"
                    :class="
                      classificationTone(row.classification) === 'success'
                        ? 'bg-success'
                        : classificationTone(row.classification) === 'warning'
                          ? 'bg-warning'
                          : 'bg-main'
                    "
                  />{{ row.classification }}</span
                >
              </td>
              <td class="py-1.5 text-right tabular-nums">{{ row.time }}</td>
              <td class="py-1.5 text-right tabular-nums">{{ row.count }}</td>
              <td class="py-1.5">
                <EquipmentSummaryPercentBar
                  :percentage="row.percentage"
                  :tone="classificationTone(row.classification)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="py-2 text-[10px] text-gray-500">
        Sin datos de clasificación.
      </p>
    </article>
    <article
      id="stops-origin-card"
      class="rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">Paradas por origen</h3>
      <div v-if="origins.length" class="overflow-x-auto">
        <table class="w-full table-fixed border-collapse text-[10px]">
          <thead>
            <tr class="border-b border-gray-100 text-left text-gray-500">
              <th class="pb-1 font-semibold">Origen</th>
              <th class="w-[68px] pb-1 text-right font-semibold">Tiempo</th>
              <th class="w-14 pb-1 text-right font-semibold">N.º</th>
              <th class="w-[118px] pb-1 font-semibold">% parada</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in origins"
              :key="row.origin"
              class="border-b border-gray-100 last:border-0"
            >
              <td class="py-1.5">
                <span class="inline-flex items-center gap-1.5"
                  ><i
                    class="size-1.5 rounded-full"
                    :class="
                      originTone(row.origin) === 'success'
                        ? 'bg-success'
                        : originTone(row.origin) === 'warning'
                          ? 'bg-warning'
                          : 'bg-main'
                    "
                  />{{ originLabel[row.origin] }}</span
                >
              </td>
              <td class="py-1.5 text-right tabular-nums">{{ row.time }}</td>
              <td class="py-1.5 text-right tabular-nums">{{ row.count }}</td>
              <td class="py-1.5">
                <EquipmentSummaryPercentBar
                  :percentage="row.percentage"
                  :tone="originTone(row.origin)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="py-2 text-[10px] text-gray-500">Sin datos de origen.</p>
    </article>
  </section>
</template>
