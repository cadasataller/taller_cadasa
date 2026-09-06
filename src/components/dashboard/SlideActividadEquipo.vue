<script setup lang="ts">
import { computed, shallowRef } from "vue";
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
  eventos: "ver_dashboard_actividad_equipo",
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
  retryOperators,
  retryOperatorDetail,
  stops,
  operators,
  operatorDetail,
  selectedOperatorId,
  selectOperator,
  selectEquipment,
  setDateRange,
  setTab: updateActiveTab,
} = useReporteEquiposView();

const equipmentSearchResetSignal = shallowRef(0);

function setTab(tab: ReportTab): void {
  if (availableTabs.value.includes(tab)) {
    updateActiveTab(tab);
  }
}

async function clearAllFilters(): Promise<void> {
  equipmentSearchResetSignal.value += 1;
  await clearFilters();
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
      @clear="clearAllFilters"
    />
    <main
      id="equipment-report-workspace"
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 pb-4 md:px-5 lg:overflow-hidden"
      :class="
        activeTab === 'eventos'
          ? 'lg:grid-cols-[250px_minmax(0,1fr)]'
          : 'lg:grid-cols-[250px_minmax(0,1fr)_250px]'
      "
    >
      <EquipmentReportSidebar
        :equipment="equipment"
        :selected-code="selectedEquipmentCode"
        :load-state="equipmentListState"
        :error="initialError"
        :reset-search-signal="equipmentSearchResetSignal"
        @select="selectEquipment"
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
        :operators="operators"
        :operator-detail="operatorDetail"
        :selected-operator-id="selectedOperatorId"
        :operators-state="loadStates.operators"
        :operator-detail-state="loadStates.operatorDetail"
        :operators-error="errors.operators"
        :operator-detail-error="errors.operatorDetail"
        :filters="filters"
        @retry-summary="retrySummary"
        @retry-stops="retryStops"
        @select-operator="selectOperator"
        @retry-operators="retryOperators"
        @retry-operator-detail="retryOperatorDetail"
      />
      <EquipmentReportDetailSidebar
        v-if="activeTab !== 'eventos'"
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
