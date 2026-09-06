<script setup lang="ts">
import { AlertCircle, Loader2, RotateCcw, UsersRound } from "lucide-vue-next";
import EquipmentOperatorsKpiGrid from "./EquipmentOperatorsKpiGrid.vue";
import EquipmentOperatorsUsageTable from "./EquipmentOperatorsUsageTable.vue";
import OperatorDetailAnalytics from "./OperatorDetailAnalytics.vue";
import OperatorDetailBottomRow from "./OperatorDetailBottomRow.vue";
import type {
  EquipmentOperators,
  OperatorDetail,
  ReportLoadState,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
defineProps<{
  operators: EquipmentOperators | null;
  selectedOperatorId: string | null;
  operatorDetail: OperatorDetail | null;
  operatorsState: ReportLoadState;
  operatorDetailState: ReportLoadState;
  operatorsError: string | null;
  operatorDetailError: string | null;
}>();
const emit = defineEmits<{
  selectOperator: [operatorId: string];
  retryOperators: [];
  retryOperatorDetail: [];
}>();
</script>
<template>
  <section
    id="equipment-operators-view"
    class="grid h-full min-h-0 gap-2 overflow-y-auto lg:grid-rows-[auto_minmax(160px,0.9fr)_minmax(150px,0.75fr)_minmax(170px,1fr)] lg:overflow-hidden"
  >
    <template v-if="operatorsState === 'ready' && operators"
      ><EquipmentOperatorsKpiGrid
        :metrics="operators.metrics"
        :equipment-code="operators.code"
      /><EquipmentOperatorsUsageTable
        :operators="operators.operators"
        :selected-operator-id="selectedOperatorId"
        @select-operator="emit('selectOperator', $event)"
      /><template v-if="operatorDetail"
        ><OperatorDetailAnalytics
          :detail="operatorDetail" /><OperatorDetailBottomRow
          :detail="operatorDetail"
      /></template>
      <div v-else-if="operatorDetailState === 'loading'" class="contents">
        <div class="grid gap-2 lg:grid-cols-3">
          <i
            v-for="index in 3"
            :key="index"
            class="min-h-28 animate-pulse rounded-[10px] border border-gray-200 bg-white"
          />
        </div>
        <i
          class="min-h-32 animate-pulse rounded-[10px] border border-gray-200 bg-white"
        />
      </div>
      <div
        v-else-if="operatorDetailState === 'error'"
        class="col-span-full grid place-items-center rounded-[10px] border border-danger/20 bg-white p-4 text-center text-xs text-gray-600"
      >
        <div>
          <AlertCircle class="mx-auto size-5 text-danger" />
          <p class="mt-2">
            {{
              operatorDetailError ??
              "No se pudo cargar el detalle del operador."
            }}
          </p>
          <button
            type="button"
            class="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-main px-2.5 py-1.5 text-xs font-semibold text-main hover:bg-main/5"
            @click="emit('retryOperatorDetail')"
          >
            <RotateCcw class="size-3.5" />Reintentar
          </button>
        </div>
      </div>
      <div
        v-else
        class="col-span-full grid min-h-28 place-items-center rounded-[10px] border border-dashed border-gray-200 bg-white p-4 text-center text-xs text-gray-500"
      >
        <span class="inline-flex items-center gap-2"
          ><UsersRound class="size-4 text-main" />Selecciona un operador para
          analizar su actividad.</span
        >
      </div></template
    >
    <div
      v-else-if="operatorsState === 'loading'"
      class="contents"
      aria-label="Cargando operadores"
    >
      <div class="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <i
          v-for="index in 4"
          :key="index"
          class="min-h-[68px] animate-pulse rounded-md border border-gray-200 bg-white"
        />
      </div>
      <i
        class="min-h-40 animate-pulse rounded-[10px] border border-gray-200 bg-white"
      />
      <div class="grid gap-2 lg:grid-cols-3">
        <i
          v-for="index in 3"
          :key="index"
          class="min-h-28 animate-pulse rounded-[10px] border border-gray-200 bg-white"
        />
      </div>
      <div
        class="grid place-items-center rounded-[10px] border border-gray-200 bg-white text-xs text-gray-500"
      >
        <span class="inline-flex items-center gap-2"
          ><Loader2 class="size-4 animate-spin text-main" />Cargando
          operadores…</span
        >
      </div>
    </div>
    <div
      v-else-if="operatorsState === 'error'"
      class="grid h-full place-items-center rounded-[10px] border border-danger/20 bg-white p-4 text-center"
    >
      <div>
        <AlertCircle class="mx-auto size-6 text-danger" />
        <p class="mt-2 text-xs text-gray-600">
          {{ operatorsError ?? "No se pudieron cargar los operadores." }}
        </p>
        <button
          type="button"
          class="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-main px-2.5 py-1.5 text-xs font-semibold text-main hover:bg-main/5"
          @click="emit('retryOperators')"
        >
          <RotateCcw class="size-3.5" />Reintentar
        </button>
      </div>
    </div>
    <div
      v-else
      class="grid h-full place-items-center rounded-[10px] border border-gray-200 bg-white p-4 text-center text-xs text-gray-500"
    >
      {{
        operatorsState === "empty"
          ? "No hay operadores para el rango seleccionado."
          : "Seleccione un equipo para analizar sus operadores."
      }}
    </div>
  </section>
</template>
