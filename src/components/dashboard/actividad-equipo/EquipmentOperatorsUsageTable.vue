<script setup lang="ts">
import EquipmentSummaryPercentBar from "./EquipmentSummaryPercentBar.vue";
import type { OperatorUsageRow } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{
  operators: OperatorUsageRow[];
  selectedOperatorId: string | null;
}>();
const emit = defineEmits<{ selectOperator: [operatorId: string] }>();
function select(operatorId: string): void {
  emit("selectOperator", operatorId);
}
</script>

<template>
  <article
    id="operators-usage-table-card"
    class="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
  >
    <div class="mb-1.5 flex items-baseline justify-between gap-2">
      <h3 class="text-xs font-bold text-main">Uso del equipo por operador</h3>
      <small class="text-right text-[10px] text-gray-500"
        >Selecciona un operador para analizar su actividad</small
      >
    </div>
    <div class="min-h-0 flex-1 overflow-auto rounded-md border border-gray-100">
      <div class="min-w-[680px]">
        <table class="w-full table-fixed border-collapse text-[10px]">
          <thead class="sticky top-0 z-10 bg-gray-50 text-left text-gray-600">
            <tr>
              <th class="w-[26%] border-b border-gray-100 p-1.5 font-bold">
                Operador
              </th>
              <th
                class="w-16 border-b border-gray-100 p-1.5 text-right font-bold"
              >
                Jornadas
              </th>
              <th
                class="w-[74px] border-b border-gray-100 p-1.5 text-right font-bold"
              >
                Total
              </th>
              <th
                class="w-[78px] border-b border-gray-100 p-1.5 text-right font-bold"
              >
                Trabajando
              </th>
              <th
                class="w-[68px] border-b border-gray-100 p-1.5 text-right font-bold"
              >
                Parado
              </th>
              <th class="w-[145px] border-b border-gray-100 p-1.5 font-bold">
                % uso
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in operators"
              :id="`operator-row-${row.operatorId}`"
              :key="row.operatorId"
              tabindex="0"
              role="button"
              :aria-pressed="selectedOperatorId === row.operatorId"
              class="cursor-pointer border-b border-gray-100 outline-none transition-colors last:border-0 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-main/50"
              :class="
                selectedOperatorId === row.operatorId
                  ? 'bg-success-bg shadow-[inset_3px_0_0_var(--color-main)]'
                  : ''
              "
              @click="select(row.operatorId)"
              @keydown.enter.prevent="select(row.operatorId)"
              @keydown.space.prevent="select(row.operatorId)"
            >
              <td class="p-1.5 font-semibold break-words text-gray-800">
                {{ row.operator }}
              </td>
              <td class="p-1.5 text-right tabular-nums">
                {{ row.journeys ?? "—" }}
              </td>
              <td class="p-1.5 text-right tabular-nums">{{ row.totalTime }}</td>
              <td class="p-1.5 text-right tabular-nums">
                {{ row.workingTime ?? "—" }}
              </td>
              <td class="p-1.5 text-right tabular-nums">
                {{ row.stoppedTime ?? "—" }}
              </td>
              <td class="p-1.5">
                <EquipmentSummaryPercentBar
                  :percentage="row.percentage"
                  :tone="
                    selectedOperatorId === row.operatorId ? 'main' : 'success'
                  "
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </article>
</template>
