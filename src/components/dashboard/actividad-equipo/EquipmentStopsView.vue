<script setup lang="ts">
import { AlertCircle, Loader2, RotateCcw } from "lucide-vue-next";
import EquipmentStopsBreakdown from "./EquipmentStopsBreakdown.vue";
import EquipmentStopsDetailTable from "./EquipmentStopsDetailTable.vue";
import EquipmentStopsKpiGrid from "./EquipmentStopsKpiGrid.vue";
import EquipmentStopsReasonsCard from "./EquipmentStopsReasonsCard.vue";
import type {
  EquipmentContext,
  EquipmentStops,
  ReportLoadState,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{
  stops: EquipmentStops | null;
  context: EquipmentContext | null;
  loadState: ReportLoadState;
  error: string | null;
}>();
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <section
    id="equipment-stops-view"
    class="report-tab-scroll grid h-auto gap-2 overflow-visible lg:h-full lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:grid-rows-[auto_auto_auto_auto]"
  >
    <template v-if="loadState === 'ready' && stops">
      <EquipmentStopsKpiGrid :metrics="stops.metrics" :context="context" />
      <EquipmentStopsBreakdown
        :classifications="stops.classifications"
        :origins="stops.origins"
      />
      <EquipmentStopsReasonsCard :reasons="stops.mainReasons" />
      <EquipmentStopsDetailTable :details="stops.details" />
    </template>
    <div
      v-else-if="loadState === 'loading'"
      class="contents"
      aria-label="Cargando paradas"
    >
      <div class="grid min-h-[68px] grid-cols-2 gap-2 lg:grid-cols-4">
        <i
          v-for="index in 4"
          :key="index"
          class="animate-pulse rounded-md border border-gray-200 bg-white"
        />
      </div>
      <div class="grid gap-2 lg:grid-cols-2">
        <i
          v-for="index in 2"
          :key="index"
          class="min-h-28 animate-pulse rounded-[10px] border border-gray-200 bg-white"
        />
      </div>
      <i
        class="min-h-24 animate-pulse rounded-[10px] border border-gray-200 bg-white"
      />
      <div
        class="grid place-items-center rounded-[10px] border border-gray-200 bg-white text-xs text-gray-500"
      >
        <span class="inline-flex items-center gap-2"
          ><Loader2 class="size-4 animate-spin text-main" />Cargando
          paradas…</span
        >
      </div>
    </div>
    <div
      v-else-if="loadState === 'error'"
      class="col-span-full grid min-h-[360px] place-items-center rounded-[10px] border border-danger/20 bg-white p-4 text-center shadow-sm lg:h-full lg:min-h-0"
    >
      <div>
        <AlertCircle class="mx-auto size-6 text-danger" />
        <p class="mt-2 text-xs text-gray-600">
          {{ error ?? "No se pudieron cargar las paradas." }}
        </p>
        <button
          type="button"
          class="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-main px-2.5 py-1.5 text-xs font-semibold text-main hover:bg-main/5"
          @click="emit('retry')"
        >
          <RotateCcw class="size-3.5" />Reintentar
        </button>
      </div>
    </div>
    <div
      v-else
      class="col-span-full grid min-h-[360px] place-items-center rounded-[10px] border border-gray-200 bg-white p-4 text-center text-xs text-gray-500 shadow-sm lg:h-full lg:min-h-0"
    >
      {{
        loadState === "empty"
          ? "No hay paradas para el rango seleccionado."
          : "Seleccione un equipo para analizar sus paradas."
      }}
    </div>
  </section>
</template>

<style scoped>
.report-tab-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.report-tab-scroll::-webkit-scrollbar {
  display: none;
}
</style>
