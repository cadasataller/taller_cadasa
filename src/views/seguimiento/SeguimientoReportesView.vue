<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { BarChart3, ChartNoAxesCombined } from "lucide-vue-next";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { SEGUIMIENTO_FEATURES } from "@/seguimiento/shared/seguimiento.permissions";

const ACTIVITY_EQUIPMENT_FEATURE = "ver_dashboard_actividad_equipo";
const route = useRoute();
const router = useRouter();
const featureAccessStore = useFeatureAccessStore();

const firstAvailableReportRoute = computed(() => {
  if (
    featureAccessStore.tieneFuncionalidad(
      SEGUIMIENTO_FEATURES.viewActivityTeamsSummary,
    )
  ) {
    return { name: "SeguimientoReportesResumenActividadEquipos" };
  }

  if (featureAccessStore.tieneFuncionalidad(ACTIVITY_EQUIPMENT_FEATURE)) {
    return { name: "SeguimientoReportesActividadEquipo" };
  }

  return null;
});

watch(
  [() => route.name, firstAvailableReportRoute],
  ([routeName, destination]) => {
    if (routeName === "SeguimientoReportes" && destination) {
      void router.replace(destination);
    }
  },
  { immediate: true },
);
</script>

<template>
  <RouterView v-if="firstAvailableReportRoute" />
  <section
    v-else
    class="grid min-h-full place-items-center bg-second p-4 text-center"
    aria-label="Reportes de seguimiento"
  >
    <div
      class="max-w-sm rounded-lg border border-main/15 bg-white p-5 shadow-sm"
    >
      <ChartNoAxesCombined
        class="mx-auto size-7 text-main"
        aria-hidden="true"
      />
      <h1 class="mt-3 text-sm font-bold text-main">Reportes</h1>
      <p class="mt-1 text-xs text-gray-500">
        No tienes permisos para visualizar los reportes disponibles.
      </p>
      <BarChart3 class="mx-auto mt-4 size-4 text-main/40" aria-hidden="true" />
    </div>
  </section>
</template>
