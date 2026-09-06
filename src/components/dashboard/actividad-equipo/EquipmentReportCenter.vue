<script setup lang="ts">
import EquipmentOperatorsView from "./EquipmentOperatorsView.vue";
import EquipmentStopsView from "./EquipmentStopsView.vue";
import EquipmentReportSummaryView from "./EquipmentReportSummaryView.vue";
import EquipmentEventsView from "./EquipmentEventsView.vue";
import type {
  EquipmentContext,
  EquipmentListItem,
  EquipmentMasterDetail,
  EquipmentOperators,
  OperatorDetail,
  EquipmentSummary,
  EquipmentStops,
  ReportFilters,
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
  operators: EquipmentOperators | null;
  operatorDetail: OperatorDetail | null;
  selectedOperatorId: string | null;
  operatorsState: ReportLoadState;
  operatorDetailState: ReportLoadState;
  operatorsError: string | null;
  operatorDetailError: string | null;
  filters: ReportFilters;
}>();
const emit = defineEmits<{
  retrySummary: [];
  retryStops: [];
  selectOperator: [operatorId: string];
  retryOperators: [];
  retryOperatorDetail: [];
}>();
</script>

<template>
  <section id="equipment-report-center" class="h-full min-h-0 overflow-hidden">
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
    <EquipmentOperatorsView
      v-else-if="activeTab === 'operadores'"
      :operators="operators"
      :selected-operator-id="selectedOperatorId"
      :operator-detail="operatorDetail"
      :operators-state="operatorsState"
      :operator-detail-state="operatorDetailState"
      :operators-error="operatorsError"
      :operator-detail-error="operatorDetailError"
      @select-operator="emit('selectOperator', $event)"
      @retry-operators="emit('retryOperators')"
      @retry-operator-detail="emit('retryOperatorDetail')"
    />
    <EquipmentEventsView
      v-else
      :equipo="selectedEquipment?.code ?? null"
      :desde="filters.startDate"
      :hasta="filters.endDate"
    />
  </section>
</template>
