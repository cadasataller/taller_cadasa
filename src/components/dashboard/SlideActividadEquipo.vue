<script setup lang="ts">
import EquipmentReportCenter from "@/components/dashboard/actividad-equipo/EquipmentReportCenter.vue";
import EquipmentReportDetailSidebar from "@/components/dashboard/actividad-equipo/EquipmentReportDetailSidebar.vue";
import EquipmentReportSidebar from "@/components/dashboard/actividad-equipo/EquipmentReportSidebar.vue";
import EquipmentReportToolbar from "@/components/dashboard/actividad-equipo/EquipmentReportToolbar.vue";
import { useReporteEquiposView } from "@/composables/dashboard/useReporteEquiposView";

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
  setTab,
} = useReporteEquiposView();
</script>

<template>
  <section
    id="equipment-report-view"
    class="flex h-full min-h-90 flex-1 flex-col bg-second text-sm text-gray-900 lg:min-h-0"
  >
    <EquipmentReportToolbar
      :filters="filters"
      :active-tab="activeTab"
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
        :error="initialError"
      />
    </main>
  </section>
</template>
