<script setup lang="ts">
import { computed } from "vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import EquipmentReportCenter from "@/components/dashboard/actividad-equipo/EquipmentReportCenter.vue";
import EquipmentReportDetailSidebar from "@/components/dashboard/actividad-equipo/EquipmentReportDetailSidebar.vue";
import EquipmentReportSidebar from "@/components/dashboard/actividad-equipo/EquipmentReportSidebar.vue";
import EquipmentReportToolbar from "@/components/dashboard/actividad-equipo/EquipmentReportToolbar.vue";
import { useReporteEquiposView } from "@/composables/dashboard/useReporteEquiposView";
import type { ReportTab } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

const REPORT_SECTION_FEATURES: Record<ReportTab, string> = {
  resumen: "ver_dashboard_actividad_equipo_resumen",
  paradas: "ver_dashboard_actividad_equipo_paradas",
  operadores: "ver_dashboard_actividad_equipo_operadores",
};

const featureAccessStore = useFeatureAccessStore();
const availableTabs = computed<ReportTab[]>(() =>
  (Object.keys(REPORT_SECTION_FEATURES) as ReportTab[]).filter((tab) =>
    featureAccessStore.tieneFuncionalidad(REPORT_SECTION_FEATURES[tab]),
  ),
);

const {
  activeTab,
  context,
  equipment,
  equipmentListState,
  errors,
  filters,
  initialError,
  loadStates,
  masterDetail,
  selectedEquipment,
  selectedEquipmentCode,
  summary,
  clearFilters,
  retry,
  retrySummary,
  retryStops,
  stops,
  selectEquipment,
  setDateRange,
  setSearch,
  setTab: updateActiveTab,
} = useReporteEquiposView();

function setTab(tab: ReportTab): void {
  if (availableTabs.value.includes(tab)) {
    updateActiveTab(tab);
  }
}
</script>

<template>
  <section
    id="equipment-report-view"
    class="flex h-full min-h-90 flex-1 flex-col bg-second text-sm text-gray-900 lg:min-h-0"
  >
    <EquipmentReportToolbar
      :filters="filters"
      :active-tab="activeTab"
      :available-tabs="availableTabs"
      @update-date-range="setDateRange"
      @set-tab="setTab"
      @clear="clearFilters"
    />
    <main
      id="equipment-report-workspace"
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 pb-4 md:px-5 lg:grid-cols-[250px_minmax(0,1fr)_250px] lg:overflow-hidden"
    >
      <EquipmentReportSidebar
        :equipment="equipment"
        :selected-code="selectedEquipmentCode"
        :load-state="equipmentListState"
        :error="initialError"
        @select="selectEquipment"
        @search="setSearch"
        @retry="retry"
      />
      <EquipmentReportCenter
        :active-tab="activeTab"
        :selected-equipment="selectedEquipment"
        :summary="summary"
        :master-detail="masterDetail"
        :context="context"
        :summary-state="loadStates.summary"
        :summary-error="errors.summary"
        :stops="stops"
        :stops-state="loadStates.stops"
        :stops-error="errors.stops"
        @retry-summary="retrySummary"
        @retry-stops="retryStops"
      />
      <EquipmentReportDetailSidebar
        :detail="masterDetail"
        :context="context"
        :detail-state="loadStates.equipmentDetail"
        :context-state="loadStates.context"
        :summary="summary"
        :summary-state="loadStates.summary"
        :summary-error="errors.summary"
        :error="initialError"
      />
    </main>
  </section>
</template>
