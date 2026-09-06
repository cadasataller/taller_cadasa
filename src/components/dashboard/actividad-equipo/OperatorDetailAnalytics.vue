<script setup lang="ts">
import OperatorClassificationDistributionCard from "./OperatorClassificationDistributionCard.vue";
import OperatorMainStopsCard from "./OperatorMainStopsCard.vue";
import type { OperatorDetail } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
defineProps<{ detail: OperatorDetail }>();
</script>
<template>
  <section class="grid min-h-0 gap-2 lg:grid-cols-2">
    <OperatorClassificationDistributionCard
      :rows="detail.classificationDistribution"
    /><OperatorMainStopsCard :rows="detail.mainStops" />
  </section>
</template>
