<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import type { Component } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Loader2 } from "lucide-vue-next";
import SlideGeneral from "@/components/dashboard/SlideGeneral.vue";
import SlideReparaciones from "@/components/dashboard/SlideReparaciones.vue";
import SlideMantenimiento from "@/components/dashboard/SlideMantenimiento.vue";
import SlideHorasTrabajo from "@/components/dashboard/SlideHorasTrabajo.vue";
import SlideServiciosGenerales from "@/components/dashboard/SlideServiciosGenerales.vue";
import SlideResumenActividadEquipos from "@/components/dashboard/SlideResumenActividadEquipos.vue";
import SlideCalificaciones from "@/components/dashboard/SlideCalificaciones.vue";
import SlideProductividadSemanal from "@/components/dashboard/SlideProductividadSemanal.vue";
import SlideActividadEquipo from "@/components/dashboard/SlideActividadEquipo.vue";
import { useDashboardHeaderNav } from "@/composables/useDashboardHeaderNav";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";

type DashboardSlide = {
  id: string;
  label: string;
  component: Component;
  requiredFeature: string;
};

const route = useRoute();
const router = useRouter();
const { syncDashboardHeaderNav, clearDashboardHeaderNav } =
  useDashboardHeaderNav();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);

const allSlides: DashboardSlide[] = [
  {
    id: "general",
    label: "General",
    component: SlideGeneral,
    requiredFeature: "ver_dashboard_general",
  },
  {
    id: "calificaciones",
    label: "Calificaciones",
    component: SlideCalificaciones,
    requiredFeature: "ver_dashboard_calificaciones",
  },
  {
    id: "mantenimiento",
    label: "Mantenimiento",
    component: SlideMantenimiento,
    requiredFeature: "ver_dashboard_mantenimiento",
  },
  {
    id: "productividad_semanal",
    label: "Productividad",
    component: SlideProductividadSemanal,
    requiredFeature: "ver_dashboard_productividad",
  },
  {
    id: "servicios_generales",
    label: "Servicios G.",
    component: SlideServiciosGenerales,
    requiredFeature: "ver_dashboard_servicios_generales",
  },
  {
    id: "resumen_actividad_equipos",
    label: "Resumen equipos",
    component: SlideResumenActividadEquipos,
    requiredFeature: "ver_resumen_actividad_equipos",
  },
  {
    id: "actividad_equipo",
    label: "Actividad equipo",
    component: SlideActividadEquipo,
    requiredFeature: "ver_dashboard_actividad_equipo",
  },
  {
    id: "horas_trabajo",
    label: "Horas Trabajo",
    component: SlideHorasTrabajo,
    requiredFeature: "ver_dashboard_horas_trabajo",
  },
  {
    id: "reparaciones",
    label: "Reparaciones",
    component: SlideReparaciones,
    requiredFeature: "ver_dashboard_reparaciones",
  },
];

const isLoading = computed(() => !isFeatureAccessLoaded.value);

const slides = computed(() => {
  if (!isFeatureAccessLoaded.value) return [];

  return allSlides.filter((slide) =>
    featureAccessStore.tieneFuncionalidad(slide.requiredFeature),
  );
});

const currentSlideIndex = ref(0);

const isBackable = computed(() => !!route.query.back);
const backPath = computed(() => (route.query.back as string) || "/");

const activeSlide = computed(
  () => slides.value[currentSlideIndex.value] ?? null,
);

const getSlideLoadProps = (slideId: string) => {
  if (slideId !== "mantenimiento" && slideId !== "productividad_semanal") {
    return {};
  }

  return {
    isActive: true,
    loadImmediately: true,
  };
};

const selectSlideIndex = (index: number) => {
  if (!slides.value[index]) return;
  currentSlideIndex.value = index;
};

const goBack = () => {
  if (isBackable.value) {
    router.push(backPath.value);
  } else {
    // Mobile strict fallback where 'back' wasn't passed via query string
    router.go(-1);
  }
};

watch(
  isLoading,
  (loading) => {
    if (loading) return;

    nextTick(() => {
      const initialSlide = route.query.slide as string;
      if (initialSlide) {
        const idx = slides.value.findIndex((s) => s.id === initialSlide);
        if (idx !== -1) {
          currentSlideIndex.value = idx;
          nextTick(() => selectSlideIndex(idx));
        }
      }
    });
  },
  { immediate: true },
);

watch(
  () => route.query.slide,
  (newSlide) => {
    if (newSlide) {
      const idx = slides.value.findIndex((s) => s.id === newSlide);
      if (idx !== -1 && idx !== currentSlideIndex.value) {
        selectSlideIndex(idx);
      }
    }
  },
);

watch(
  [slides, currentSlideIndex],
  ([currentSlides, activeIndex]) => {
    syncDashboardHeaderNav({
      currentSlideIndex: activeIndex,
      onSelectSlide: selectSlideIndex,
      slides: currentSlides.map(({ id, label }) => ({ id, label })),
    });
  },
  { immediate: true },
);

onUnmounted(() => {
  clearDashboardHeaderNav();
});
</script>

<template>
  <div class="h-full flex flex-col relative bg-white">
    <div
      v-if="isLoading"
      id="dashboard-loading-spinner"
      class="flex items-center justify-center h-full"
    >
      <Loader2 class="w-8 h-8 text-main animate-spin" />
    </div>

    <!-- Header with conditional back button -->
    <div
      v-if="!isLoading && (isBackable || slides.length <= 1)"
      id="dashboard-header-container"
      class="sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-gray-100"
    >
      <div
        class="px-4 py-3 md:px-6 md:py-4 flex items-center justify-center relative"
      >
        <!-- Back button & Title (Conditional) - Positioned absolute to not break centering -->
        <div
          v-if="isBackable"
          id="dashboard-back-header"
          class="flex items-center gap-2 md:gap-4 absolute left-4 md:left-6"
        >
          <button
            @click="goBack"
            class="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors block"
          >
            <ArrowLeft class="w-5 h-5 md:w-5 md:h-5" />
          </button>
          <h2
            class="text-xs md:text-sm font-bold text-gray-800 hidden sm:block"
          >
            Métricas
          </h2>
        </div>

        <!-- Mobile Title if no nav -->
        <div
          v-if="slides.length <= 1"
          class="md:hidden font-bold text-sm text-gray-800"
        >
          Métricas de Calificaciones
        </div>
      </div>
    </div>
    <div
      v-if="!isLoading && activeSlide"
      id="dashboard-tab-panel"
      class="flex-1 bg-gray-50/50"
      :class="
        activeSlide.id === 'actividad_equipo'
          ? 'min-h-full overflow-y-auto pb-2 lg:h-full lg:min-h-0 lg:overflow-hidden lg:pb-0'
          : 'overflow-y-auto px-4 pb-[76px] md:px-6 md:pb-8 md:pt-0 lg:px-10 lg:pb-10 lg:pt-0'
      "
    >
      <component
        :is="activeSlide.component"
        v-bind="getSlideLoadProps(activeSlide.id)"
      />
      <div
        v-if="activeSlide.id !== 'productividad_semanal'"
        class="h-10 w-full flex-shrink-0 lg:hidden"
      ></div>
    </div>
  </div>
</template>
