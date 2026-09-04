<script setup lang="ts">
import { UsersRound } from "lucide-vue-next";
import EquipmentStopsView from "./EquipmentStopsView.vue";
import EquipmentReportSummaryView from "./EquipmentReportSummaryView.vue";
import type {
  EquipmentContext,
  EquipmentListItem,
  EquipmentMasterDetail,
  EquipmentSummary,
  EquipmentStops,
  ReportLoadState,
  ReportTab,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{
  activeTab: ReportTab;
  selectedEquipment: EquipmentListItem | null;
  summary: EquipmentSummary | null;
  masterDetail: EquipmentMasterDetail | null;
  context: EquipmentContext | null;
  summaryState: ReportLoadState;
  summaryError: string | null;
  stops: EquipmentStops | null;
  stopsState: ReportLoadState;
  stopsError: string | null;
}>();
const emit = defineEmits<{ retrySummary: []; retryStops: [] }>();

const tabCopy: Record<
  "operadores",
  { title: string; text: string; icon: typeof UsersRound }
> = {
  operadores: {
    title: "Uso por operadores",
    text: "La fase 4 incorporará participación, detalle de operador e historial.",
    icon: UsersRound,
  },
};
</script>

<template>
  <section id="equipment-report-center" class="min-h-0 overflow-hidden">
    <EquipmentReportSummaryView
      v-if="activeTab === 'resumen'"
      :summary="summary"
      :master-detail="masterDetail"
      :context="context"
      :load-state="summaryState"
      :error="summaryError"
      @retry="emit('retrySummary')"
    />
    <EquipmentStopsView
      v-else-if="activeTab === 'paradas'"
      :stops="stops"
      :context="context"
      :load-state="stopsState"
      :error="stopsError"
      @retry="emit('retryStops')"
    />
    <div
      v-else
      class="grid h-full place-items-center rounded-[10px] border border-gray-200 bg-white shadow-sm"
    >
      <div class="max-w-sm px-6 py-10 text-center">
        <component
          :is="tabCopy[activeTab].icon"
          class="mx-auto size-7 text-main"
          aria-hidden="true"
        />
        <p
          class="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-accent"
        >
          {{
            selectedEquipment
              ? selectedEquipment.code
              : "Sin equipo seleccionado"
          }}
        </p>
        <h2 class="mt-1 text-base font-bold text-gray-800">
          {{ tabCopy[activeTab].title }}
        </h2>
        <p class="mt-2 text-xs leading-5 text-gray-500">
          {{ tabCopy[activeTab].text }}
        </p>
      </div>
    </div>
  </section>
</template>
