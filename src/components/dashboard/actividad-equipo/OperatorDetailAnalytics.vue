<script setup lang="ts">
import OperatorEngineUsageCard from "./OperatorEngineUsageCard.vue";
import OperatorMainStopsCard from "./OperatorMainStopsCard.vue";
import OperatorTimeDistributionCard from "./OperatorTimeDistributionCard.vue";
import type { OperatorDetail } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
defineProps<{ detail: OperatorDetail }>();
</script>
<template>
  <section class="grid gap-2 lg:grid-cols-3">
    <OperatorTimeDistributionCard
      :rows="detail.stateDistribution"
      :operator-label="detail.operatorLabel"
    /><OperatorMainStopsCard
      :rows="detail.mainStops"
      :operator-label="detail.operatorLabel"
    /><OperatorEngineUsageCard
      :rows="detail.engine"
      :operator-label="detail.operatorLabel"
    />
  </section>
</template>
