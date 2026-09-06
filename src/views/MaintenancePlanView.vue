<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
import type { Component } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2, ChevronDown, Check } from "lucide-vue-next";
import { supabase } from "@/lib/supabase";

// Maintenance Slides
import MaintSlideOrders from "@/components/maintenance/MaintSlideOrders.vue";
import MaintSlideSG from "@/components/maintenance/MaintSlideSG.vue";
import MaintSlideHours from "@/components/maintenance/MaintSlideHours.vue";
import MaintSlideStages from "@/components/maintenance/MaintSlideStages.vue";
import MaintSlideMetrics from "@/components/maintenance/MaintSlideMetrics.vue";
import MaintSlideUpdates from "@/components/maintenance/MaintSlideUpdates.vue";
import SlideHorasTrabajo from "@/components/dashboard/SlideHorasTrabajo.vue";
import SlideMantenimiento from "@/components/dashboard/SlideMantenimiento.vue";
import SlideProductividadSemanal from "@/components/dashboard/SlideProductividadSemanal.vue";
import SlideServiciosGenerales from "@/components/dashboard/SlideServiciosGenerales.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { storeToRefs } from "pinia";

type MaintenanceSlide = {
  id: string;
  label: string;
  mobileLabel?: string;
  component: Component;
  adminOnly?: boolean;
  requiredFeature?: string;
};

const route = useRoute();
const router = useRouter();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const CACHE_LIMIT = 3;

const allSlides: MaintenanceSlide[] = [
  {
    id: "ordenes",
    label: "Ordenes De Mantenimiento",
    mobileLabel: "Orden",
    component: MaintSlideOrders,
  },
  {
    id: "servicios_generales",
    label: "Servicios Generales",
    mobileLabel: "Servicios",
    component: MaintSlideSG,
  },
  {
    id: "horas_asignadas",
    label: "Horas Asignadas",
    mobileLabel: "Horas",
    component: MaintSlideHours,
  },
  {
    id: "definiciones_etapas",
    label: "Definiciones de Etapas",
    component: MaintSlideStages,
  },
  {
    id: "metricas",
    label: "Métricas",
    component: MaintSlideMetrics,
    adminOnly: true,
  },
  {
    id: "actualizaciones",
    label: "Actualizaciones",
    component: MaintSlideUpdates,
    adminOnly: true,
  },
  {
    id: "indicadores",
    label: "Indicadores",
    component: SlideMantenimiento,
    requiredFeature: "ver_dashboard_mantenimiento",
  },
  {
    id: "productividad",
    label: "Productividad",
    component: SlideProductividadSemanal,
    requiredFeature: "ver_dashboard_productividad",
  },
  {
    id: "horas_trabajo",
    label: "Horas Trabajo",
    component: SlideHorasTrabajo,
    requiredFeature: "ver_dashboard_horas_trabajo",
  },
  {
    id: "servicios_generales_analitica",
    label: "Analítica SG",
    mobileLabel: "Analítica SG",
    component: SlideServiciosGenerales,
    requiredFeature: "ver_dashboard_servicios_generales",
  },
];

const isLoading = ref(true);
const userArea = ref("");
const showDropdown = ref(false);
const activeSlideId = ref("");

const filteredSlides = computed(() => {
  const area = userArea.value;
  let list = [...allSlides];

  // Restricción: Ordenes no disponible para Servicios Generales
  if (area === "SERVICIOS GENERALES") {
    list = list.filter((s) => s.id !== "ordenes");
  }

  // Restricción: Métricas y Actualizaciones solo para ALL
  if (area !== "ALL") {
    list = list.filter((s) => !s.adminOnly);
  }

  return list.filter(
    (slide) =>
      !slide.requiredFeature ||
      (isFeatureAccessLoaded.value &&
        featureAccessStore.tieneFuncionalidad(slide.requiredFeature)),
  );
});

const primarySlides = computed(() => filteredSlides.value.slice(0, 3));
const overflowSlides = computed(() => filteredSlides.value.slice(3));
const activeSlide = computed(
  () =>
    filteredSlides.value.find((slide) => slide.id === activeSlideId.value) ??
    filteredSlides.value[0] ??
    null,
);
const currentSlideIndex = computed(() =>
  activeSlide.value
    ? filteredSlides.value.findIndex(
        (slide) => slide.id === activeSlide.value?.id,
      )
    : -1,
);

const getSlideLoadProps = (slideId: string) => {
  if (slideId !== "indicadores" && slideId !== "productividad") {
    return {};
  }

  return {
    isActive: true,
    loadImmediately: true,
  };
};

const syncRouteWithSlide = async (slideId: string) => {
  if (route.query.maint_slide === slideId) {
    return;
  }

  await router.replace({
    query: {
      ...route.query,
      maint_slide: slideId,
    },
  });
};

const selectSlide = async (slideId: string) => {
  const slideExists = filteredSlides.value.some(
    (slide) => slide.id === slideId,
  );

  if (!slideExists || activeSlideId.value === slideId) {
    showDropdown.value = false;
    return;
  }

  activeSlideId.value = slideId;
  showDropdown.value = false;

  await syncRouteWithSlide(slideId);
};

const setInitialSlide = () => {
  const requestedSlide =
    typeof route.query.maint_slide === "string" ? route.query.maint_slide : "";
  const firstAvailableSlide = filteredSlides.value[0]?.id ?? "";

  if (
    requestedSlide &&
    filteredSlides.value.some((slide) => slide.id === requestedSlide)
  ) {
    activeSlideId.value = requestedSlide;
    return;
  }

  activeSlideId.value = firstAvailableSlide;
};

const handleWindowClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;

  if (!target?.closest("#maint-dropdown-container")) {
    showDropdown.value = false;
  }
};

onMounted(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && user.email) {
    const { data } = await supabase
      .from("PROFILE")
      .select("area")
      .eq("email", user.email)
      .maybeSingle();
    userArea.value = data?.area?.toUpperCase() || "";
  }

  isLoading.value = false;
  setInitialSlide();
  if (activeSlideId.value) {
    syncRouteWithSlide(activeSlideId.value).catch((error) => {
      console.error("Error sincronizando tab de mantenimiento:", error);
    });
  }

  // Close dropdown on click outside
  window.addEventListener("click", handleWindowClick);
});

onUnmounted(() => {
  window.removeEventListener("click", handleWindowClick);
});

watch(
  filteredSlides,
  (slides) => {
    if (slides.length === 0) {
      activeSlideId.value = "";
      return;
    }

    if (!slides.some((slide) => slide.id === activeSlideId.value)) {
      setInitialSlide();
    }
  },
  { immediate: true },
);

watch(
  () => route.query.maint_slide,
  (newSlide) => {
    if (typeof newSlide !== "string" || !newSlide) {
      return;
    }

    if (filteredSlides.value.some((slide) => slide.id === newSlide)) {
      activeSlideId.value = newSlide;
    }
  },
);
</script>

<template>
  <div class="h-full flex flex-col relative bg-white">
    <div
      v-if="isLoading"
      id="maint-loading-spinner"
      class="flex items-center justify-center h-full"
    >
      <Loader2 class="w-8 h-8 text-main animate-spin" />
    </div>

    <!-- Header / Pill Navigation -->
    <div
      v-if="!isLoading"
      id="maint-header-container"
      class="sticky top-0 bg-white/90 backdrop-blur-sm z-30 border-b border-gray-100"
    >
      <div
        class="px-2 py-2 md:px-4 md:py-3 flex items-center justify-center relative"
      >
        <!-- Main Navigation Pills -->
        <div
          class="flex items-center gap-1 bg-gray-100 p-0.5 md:p-1 rounded-xl shadow-inner border border-gray-200/20"
        >
          <!-- Dynamic Slides -->
          <button
            v-for="(slide, index) in primarySlides"
            :key="slide.id"
            @click="selectSlide(slide.id)"
            class="px-2.5 py-1.5 md:px-4 md:py-2 text-[10px] md:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none"
            :class="
              index === currentSlideIndex
                ? 'bg-white text-main shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            "
          >
            <span class="sm:hidden">{{
              slide.mobileLabel || slide.label
            }}</span>
            <span class="hidden sm:inline">{{ slide.label }}</span>
          </button>

          <!-- Dropdown for overflow slides -->
          <div
            v-if="overflowSlides.length > 0"
            id="maint-dropdown-container"
            class="relative"
          >
            <button
              @click.stop="showDropdown = !showDropdown"
              class="px-2.5 py-1.5 md:px-3 md:py-2 text-[10px] md:text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 outline-none"
              :class="
                currentSlideIndex >= 3
                  ? 'bg-white text-main shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              "
            >
              Más
              <ChevronDown
                class="w-3 h-3 transition-transform"
                :class="showDropdown ? 'rotate-180' : ''"
              />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="showDropdown"
              class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                v-for="(slide, index) in overflowSlides"
                :key="slide.id"
                @click="selectSlide(slide.id)"
                class="w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between"
                :class="
                  index + 3 === currentSlideIndex
                    ? 'bg-main/5 text-main'
                    : 'text-gray-500 hover:bg-gray-50'
                "
              >
                {{ slide.label }}
                <Check
                  v-if="index + 3 === currentSlideIndex"
                  class="w-3.5 h-3.5"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!isLoading && activeSlide"
      id="maint-tab-panel"
      class="flex-1 overflow-y-auto bg-gray-50/50"
    >
      <div
        class="px-4 py-4 pb-[120px] md:px-8 md:py-8 md:pb-8 lg:px-10 lg:py-10 lg:pb-10"
      >
        <KeepAlive :max="CACHE_LIMIT">
          <component
            :is="activeSlide.component"
            :key="activeSlide.id"
            v-bind="getSlideLoadProps(activeSlide.id)"
          />
        </KeepAlive>
      </div>
    </div>
  </div>
</template>
