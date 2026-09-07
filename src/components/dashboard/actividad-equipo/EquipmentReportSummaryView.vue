<script setup lang="ts">
import { AlertCircle, Loader2, RotateCcw } from "lucide-vue-next";
import EquipmentSummaryAnalytics from "./EquipmentSummaryAnalytics.vue";
import EquipmentSummaryBottomRow from "./EquipmentSummaryBottomRow.vue";
import EquipmentSummaryHero from "./EquipmentSummaryHero.vue";
import type {
  EquipmentContext,
  EquipmentMasterDetail,
  EquipmentSummary,
  ReportLoadState,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{
  summary: EquipmentSummary | null;
  masterDetail: EquipmentMasterDetail | null;
  context: EquipmentContext | null;
  loadState: ReportLoadState;
  error: string | null;
}>();
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <section
    id="equipment-summary-view"
    class="report-tab-scroll h-auto min-h-0 min-w-0 overflow-visible lg:h-full lg:overflow-x-hidden lg:overflow-y-auto"
  >
    <Transition name="summary-content" mode="out-in">
      <div
        v-if="loadState === 'ready' && summary"
        :key="`summary-${summary.code}`"
        class="grid min-w-0 gap-2 lg:h-full lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)]"
      >
        <EquipmentSummaryHero
          :detail="masterDetail"
          :context="context"
          :summary="summary"
        />
        <div class="grid h-auto gap-2 lg:grid-rows-[auto_auto]">
          <EquipmentSummaryAnalytics :summary="summary" />
          <EquipmentSummaryBottomRow :summary="summary" />
        </div>
      </div>
      <div
        v-else-if="loadState === 'loading'"
        key="summary-loading"
        class="grid min-h-[360px] place-items-center rounded-[10px] border border-gray-200 bg-white text-xs text-gray-500 shadow-sm lg:h-full lg:min-h-0"
      >
        <span class="inline-flex items-center gap-2"
          ><Loader2 class="size-4 animate-spin text-main" />Cargando
          resumen…</span
        >
      </div>
      <div
        v-else-if="loadState === 'error'"
        key="summary-error"
        class="grid min-h-[360px] place-items-center rounded-[10px] border border-danger/20 bg-white p-4 text-center shadow-sm lg:h-full lg:min-h-0"
      >
        <div>
          <AlertCircle class="mx-auto size-6 text-danger" />
          <p class="mt-2 text-xs text-gray-600">
            {{ error ?? "No se pudo cargar el resumen." }}
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
        key="summary-empty"
        class="grid min-h-[360px] place-items-center rounded-[10px] border border-gray-200 bg-white p-4 text-center text-xs text-gray-500 shadow-sm lg:h-full lg:min-h-0"
      >
        Seleccione un equipo para ver su resumen.
      </div>
    </Transition>
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

<style scoped>
.summary-content-enter-active,
.summary-content-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.summary-content-enter-from,
.summary-content-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (prefers-reduced-motion: reduce) {
  .summary-content-enter-active,
  .summary-content-leave-active {
    transition: none;
  }
}
</style>
