<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { ChevronDown } from "lucide-vue-next";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import EquipmentReportCenter from "@/components/dashboard/actividad-equipo/EquipmentReportCenter.vue";
import EquipmentReportDetailSidebar from "@/components/dashboard/actividad-equipo/EquipmentReportDetailSidebar.vue";
import EquipmentReportMobileDrawer from "@/components/dashboard/actividad-equipo/EquipmentReportMobileDrawer.vue";
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
  equipmentSortMode,
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
  setEquipmentSortMode,
  setDateRange,
  setTab: updateActiveTab,
} = useReporteEquiposView();

const equipmentSearchResetSignal = shallowRef(0);
const isEquipmentDrawerOpen = shallowRef(false);
const isProfileDrawerOpen = shallowRef(false);

function setTab(tab: ReportTab): void {
  if (availableTabs.value.includes(tab)) {
    updateActiveTab(tab);
  }
}

async function clearAllFilters(): Promise<void> {
  equipmentSearchResetSignal.value += 1;
  await clearFilters();
}

function selectMobileEquipment(code: string): void {
  isEquipmentDrawerOpen.value = false;
  void selectEquipment(code);
}
</script>

<template>
  <section
    id="equipment-report-view"
    class="flex min-h-full flex-col bg-second text-sm text-gray-900 lg:h-full lg:min-h-0 lg:flex-1"
  >
    <div class="flex shrink-0 gap-2 px-3 pt-3 lg:hidden">
      <button
        type="button"
        class="inline-flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-main shadow-sm"
        aria-haspopup="dialog"
        @click="isEquipmentDrawerOpen = true"
      >
        <span class="truncate">
          {{ selectedEquipmentCode ?? "Elegir equipo" }}
        </span>
        <ChevronDown class="size-4 shrink-0" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-main shadow-sm"
        aria-haspopup="dialog"
        @click="isProfileDrawerOpen = true"
      >
        Perfil Equipo
      </button>
    </div>
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
      class="grid flex-none grid-cols-1 gap-3 px-4 pb-4 md:px-5 lg:min-h-0 lg:flex-1 lg:overflow-hidden"
      :class="
        activeTab === 'eventos'
          ? 'lg:grid-cols-[250px_minmax(0,1fr)]'
          : 'lg:grid-cols-[250px_minmax(0,1fr)_250px]'
      "
    >
      <EquipmentReportSidebar
        class="hidden lg:flex"
        :equipment="equipment"
        :selected-code="selectedEquipmentCode"
        :load-state="equipmentListState"
        :error="initialError"
        :reset-search-signal="equipmentSearchResetSignal"
        :sort-mode="equipmentSortMode"
        @select="selectEquipment"
        @retry="retry"
        @update-sort-mode="setEquipmentSortMode"
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
        class="hidden lg:flex"
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
    <EquipmentReportMobileDrawer
      v-if="isEquipmentDrawerOpen"
      title="Equipos"
      @close="isEquipmentDrawerOpen = false"
    >
      <EquipmentReportSidebar
        class="h-full"
        :equipment="equipment"
        :selected-code="selectedEquipmentCode"
        :load-state="equipmentListState"
        :error="initialError"
        :reset-search-signal="equipmentSearchResetSignal"
        :sort-mode="equipmentSortMode"
        @select="selectMobileEquipment"
        @retry="retry"
        @update-sort-mode="setEquipmentSortMode"
      />
    </EquipmentReportMobileDrawer>
    <EquipmentReportMobileDrawer
      v-if="isProfileDrawerOpen"
      title="Perfil del equipo"
      @close="isProfileDrawerOpen = false"
    >
      <EquipmentReportDetailSidebar
        class="h-full"
        :detail="masterDetail"
        :context="context"
        :detail-state="loadStates.equipmentDetail"
        :context-state="loadStates.context"
        :summary="summary"
        :summary-state="loadStates.summary"
        :summary-error="errors.summary"
        :error="initialError"
      />
    </EquipmentReportMobileDrawer>
  </section>
</template>
