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

type DeferredDashboardSlideId = "mantenimiento" | "productividad_semanal";

type DeferredSlideLoadProps = {
  isActive: boolean;
  loadImmediately: boolean;
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

const containerRef = ref<HTMLElement | null>(null);
const currentSlideIndex = ref(0);
const immediateLoadSlideId = ref<DeferredDashboardSlideId | null>(null);

const isBackable = computed(() => !!route.query.back);
const backPath = computed(() => (route.query.back as string) || "/");

const isDeferredDashboardSlide = (
  slideId: string,
): slideId is DeferredDashboardSlideId =>
  slideId === "mantenimiento" || slideId === "productividad_semanal";

const getDeferredSlideLoadProps = (
  slideId: string,
): DeferredSlideLoadProps | Record<never, never> => {
  if (!isDeferredDashboardSlide(slideId)) return {};

  return {
    isActive: slides.value[currentSlideIndex.value]?.id === slideId,
    loadImmediately: immediateLoadSlideId.value === slideId,
  };
};

const scrollToSlideIndex = (index: number, loadImmediately = false) => {
  const targetSlideId = slides.value[index]?.id;
  immediateLoadSlideId.value =
    loadImmediately && targetSlideId && isDeferredDashboardSlide(targetSlideId)
      ? targetSlideId
      : null;

  if (containerRef.value) {
    const slideEl = containerRef.value.children[index] as HTMLElement;
    if (slideEl) {
      containerRef.value.scrollTo({
        left: slideEl.offsetLeft,
        behavior: "smooth",
      });
    }
  }
  currentSlideIndex.value = index;
};

const handleScroll = () => {
  if (!containerRef.value) return;
  const scrollLeft = containerRef.value.scrollLeft;
  const slideWidth = containerRef.value.clientWidth;
  const index = Math.round(scrollLeft / slideWidth);
  if (currentSlideIndex.value !== index) {
    currentSlideIndex.value = index;
  }
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
          nextTick(() => {
            scrollToSlideIndex(idx);
          });
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
        scrollToSlideIndex(idx);
      }
    }
  },
);

watch(
  [slides, currentSlideIndex],
  ([currentSlides, activeIndex]) => {
    syncDashboardHeaderNav({
      currentSlideIndex: activeIndex,
      onSelectSlide: (index) => scrollToSlideIndex(index, true),
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
      v-if="!isLoading"
      id="dashboard-slider-container"
      ref="containerRef"
      @scroll.passive="handleScroll"
      class="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-gray-50/50"
      style="scroll-behavior: smooth"
    >
      <div
        v-for="slide in slides"
        :key="slide.id"
        :id="'dashboard-slide-' + slide.id"
        class="min-w-full w-full flex-shrink-0 snap-center"
        :class="
          slide.id === 'actividad_equipo'
            ? 'min-h-0 overflow-y-auto px-4 pb-[120px] md:px-6 md:pb-8 md:pt-0 lg:px-10 lg:pb-10 lg:pt-0 lg:overflow-hidden'
            : 'px-4 pb-[120px] md:px-6 md:pb-8 md:pt-0 lg:px-10 lg:pb-10 lg:pt-0 overflow-y-auto'
        "
      >
        <div
          class="flex flex-col gap-0"
          :class="slide.id === 'actividad_equipo' ? 'min-h-0 lg:h-full' : ''"
        >
          <component
            :is="slide.component"
            v-bind="getDeferredSlideLoadProps(slide.id)"
          />
          <!-- End of scroll spacer to separate from bottom nav -->
          <div
            v-if="slide.id !== 'productividad_semanal'"
            class="h-10 w-full flex-shrink-0 lg:hidden"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
