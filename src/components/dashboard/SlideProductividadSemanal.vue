<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { storeToRefs } from "pinia";
import { Copy, Download, Loader2, RefreshCw } from "lucide-vue-next";
import ProductividadSemanalAreaSlideLegacy from "@/components/dashboard/ProductividadSemanalAreaSlide.vue";
import ProductividadSemanalAreaSlideV2 from "@/components/dashboard/ProductividadSemanalAreaSlideV2.vue";
import { useProductividadSlidePngExport } from "@/composables/useProductividadSlidePngExport";
import { useHorasTrabajoStore } from "@/stores/horasTrabajoStore";
import { useMaintenanceStore } from "@/stores/maintenanceStore";
import { useHorasPerdidasAreaMotivoStore } from "@/stores/db_mantenimiento/horas_perdidas_area_motivo/horasPerdidasAreaMotivo.store";
import type { ProductividadSemanalArea } from "@/stores/horasTrabajo.types";
import { getWeekNumber } from "@/utils/dateUtils";

interface DeferredDashboardLoadProps {
  isActive: boolean;
  loadImmediately: boolean;
}

const props = withDefaults(defineProps<DeferredDashboardLoadProps>(), {
  isActive: false,
  loadImmediately: false,
});

const horasTrabajoStore = useHorasTrabajoStore();
const maintenanceStore = useMaintenanceStore();
const horasPerdidasAreaMotivoStore = useHorasPerdidasAreaMotivoStore();
const {
  productividadSemanal,
  productividadSemanalLoading,
  productividadSemanalError,
  productividadSemanalDashboardTablas,
  error: horasTrabajoError,
} = storeToRefs(horasTrabajoStore);
const { error: maintenanceError, hasLoaded: maintenanceHasLoaded } =
  storeToRefs(maintenanceStore);
const {
  error: horasPerdidasAreaMotivoError,
  isLoaded: horasPerdidasAreaMotivoLoaded,
} = storeToRefs(horasPerdidasAreaMotivoStore);

const currentWeek = String(getWeekNumber(new Date()));
const horasPerdidasFechaDesde = "2026-04-06";

const normalizeAreaKey = (areaName: string) =>
  String(areaName || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const currentSlideIndex = ref(0);
const slideCaptureRef = useTemplateRef<HTMLElement>("slideCaptureRef");
const dashboardTablesLoading = ref(false);
const dashboardTablesLoaded = ref(false);
const dashboardTablesError = ref<string | null>(null);
let dataLoadTimer: ReturnType<typeof setTimeout> | null = null;
let hasRequestedData = false;

const productivitySlides = computed(
  () => productividadSemanal.value?.areas ?? [],
);
const activeSlide = computed(
  () => productivitySlides.value[currentSlideIndex.value] ?? null,
);
const dashboardTables = computed(
  () => productividadSemanalDashboardTablas.value,
);
const availableAreas = computed(() => productivitySlides.value);
const activeSlideComponent = computed(() => {
  const areaName = normalizeAreaKey(activeSlide.value?.area || "");
  return areaName === "servicios generales"
    ? ProductividadSemanalAreaSlideLegacy
    : ProductividadSemanalAreaSlideV2;
});
const canGoPrevious = computed(() => currentSlideIndex.value > 0);
const canGoNext = computed(
  () => currentSlideIndex.value < productivitySlides.value.length - 1,
);
const weekLabel = computed(
  () => productividadSemanal.value?.semana || currentWeek,
);
const loadingError = computed(
  () => productividadSemanalError.value || dashboardTablesError.value,
);
const isSlideDataLoading = computed(
  () =>
    !loadingError.value &&
    (productividadSemanalLoading.value ||
      dashboardTablesLoading.value ||
      !productividadSemanal.value ||
      !dashboardTablesLoaded.value),
);

const {
  copyActiveSlideToClipboard,
  exportError,
  exportActiveSlideAsPng,
  isCopying,
  isExporting,
} = useProductividadSlidePngExport({
  currentSlideIndex,
  slideElement: slideCaptureRef,
  slides: productivitySlides,
  weekLabel,
});

const fetchProductividad = () => {
  return horasTrabajoStore.fetchProductividadSemanalPorEquipo(currentWeek, 3);
};

const loadProductividad = async () => {
  await fetchProductividad();
};

const loadDashboardTables = async () => {
  dashboardTablesLoading.value = true;
  dashboardTablesLoaded.value = false;
  dashboardTablesError.value = null;

  try {
    await Promise.all([
      maintenanceStore.fetchAllOrders(),
      horasTrabajoStore.fetchData(),
      horasPerdidasAreaMotivoStore.cargarResumen(horasPerdidasFechaDesde),
    ]);

    const silentError =
      maintenanceError.value ||
      horasTrabajoError.value ||
      horasPerdidasAreaMotivoError.value;

    if (silentError) {
      throw new Error(silentError);
    }

    if (!maintenanceHasLoaded.value || !horasPerdidasAreaMotivoLoaded.value) {
      throw new Error("No llegaron todos los datos de productividad semanal");
    }

    dashboardTablesLoaded.value = true;
  } catch (error) {
    dashboardTablesError.value =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar todos los datos de productividad semanal";
  } finally {
    dashboardTablesLoading.value = false;
  }
};

const loadAllProductivityData = () => {
  void Promise.allSettled([loadProductividad(), loadDashboardTables()]);
};

const clearDataLoadTimer = () => {
  if (!dataLoadTimer) return;
  clearTimeout(dataLoadTimer);
  dataLoadTimer = null;
};

const loadDataOnce = () => {
  if (hasRequestedData) return;

  hasRequestedData = true;
  loadAllProductivityData();
};

const goPrevious = () => {
  if (!canGoPrevious.value) return;
  currentSlideIndex.value -= 1;
};

const goNext = () => {
  if (productivitySlides.value.length === 0) return;

  if (!canGoNext.value) {
    currentSlideIndex.value = 0;
    return;
  }

  currentSlideIndex.value += 1;
};

const selectAreaSlide = (selectedArea: ProductividadSemanalArea) => {
  const targetIndex = productivitySlides.value.findIndex(
    (slide) =>
      normalizeAreaKey(slide.area) === normalizeAreaKey(selectedArea.area),
  );

  if (targetIndex < 0) return;
  currentSlideIndex.value = targetIndex;
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
};

const handleKeyNavigation = (event: KeyboardEvent) => {
  if (isEditableTarget(event.target)) return;
  if (productivitySlides.value.length <= 1) return;

  const pressedKey = event.key.toLowerCase();

  if (pressedKey === "s") {
    event.preventDefault();
    goNext();
    return;
  }

  if (pressedKey === "a") {
    event.preventDefault();

    if (!canGoPrevious.value) {
      currentSlideIndex.value = Math.max(
        productivitySlides.value.length - 1,
        0,
      );
      return;
    }

    goPrevious();
  }
};

watch(productivitySlides, (slides) => {
  if (currentSlideIndex.value > slides.length - 1) {
    currentSlideIndex.value = Math.max(slides.length - 1, 0);
  }
});

watch(
  [() => props.isActive, () => props.loadImmediately],
  ([isActive, loadImmediately]) => {
    clearDataLoadTimer();

    if (!isActive || hasRequestedData) return;

    if (loadImmediately) {
      loadDataOnce();
      return;
    }

    dataLoadTimer = setTimeout(() => {
      if (props.isActive) loadDataOnce();
    }, 2000);
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener("keydown", handleKeyNavigation);
});

onUnmounted(() => {
  clearDataLoadTimer();
  window.removeEventListener("keydown", handleKeyNavigation);
});
</script>

<template>
  <section
    class="weekly-productivity-section relative overflow-hidden bg-white"
  >
    <div
      v-if="isSlideDataLoading"
      class="flex h-full items-center justify-center"
    >
      <Loader2 class="h-8 w-8 animate-spin text-main" />
    </div>

    <div
      v-else-if="loadingError"
      class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <p class="max-w-md text-sm font-semibold text-gray-500">
        {{ loadingError }}
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-main px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-main-light"
        @click.stop="loadAllProductivityData"
      >
        <RefreshCw class="h-4 w-4" />
        Reintentar
      </button>
    </div>

    <div
      v-else-if="activeSlide"
      ref="slideCaptureRef"
      class="weekly-productivity-frame"
    >
      <ProductividadSemanalAreaSlideV2
        v-if="activeSlideComponent === ProductividadSemanalAreaSlideV2"
        :key="activeSlide.area"
        :area="activeSlide"
        :semana="productividadSemanal?.semana || currentWeek"
        :dashboard-tables="dashboardTables"
        :available-areas="availableAreas"
        aria-label="Productividad semanal"
        @select-area="selectAreaSlide"
      />

      <ProductividadSemanalAreaSlideLegacy
        v-else
        :key="activeSlide!.area"
        :area="activeSlide"
        :semana="productividadSemanal?.semana || currentWeek"
        :dashboard-tables="dashboardTables"
        :available-areas="availableAreas"
        aria-label="Productividad semanal"
        @select-area="selectAreaSlide"
      />
    </div>

    <div
      v-if="activeSlide && !isSlideDataLoading && !loadingError"
      class="absolute right-4 top-4 z-20 flex flex-col items-end gap-2"
    >
      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white/95 px-4 py-2 text-sm font-bold text-main shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isCopying || isExporting"
        @click.stop="copyActiveSlideToClipboard"
      >
        <Loader2 v-if="isCopying" class="h-4 w-4 animate-spin" />
        <Copy v-else class="h-4 w-4" />
        {{ isCopying ? "Copiando..." : "" }}
      </button>

      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white/95 px-4 py-2 text-sm font-bold text-main shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isExporting || isCopying"
        @click.stop="exportActiveSlideAsPng"
      >
        <Loader2 v-if="isExporting" class="h-4 w-4 animate-spin" />
        <Download v-else class="h-4 w-4" />
        {{ isExporting ? "Generando PNG..." : "" }}
      </button>

      <p
        v-if="exportError"
        class="max-w-xs rounded-lg bg-white/95 px-3 py-2 text-right text-xs font-semibold text-danger shadow-sm"
      >
        {{ exportError }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.weekly-productivity-section {
  height: 100%;
}

.weekly-productivity-frame {
  height: 100%;
  margin: 0 auto;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0.35rem 0;
  width: 100%;
}
</style>
