<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import MapToolsOverlay from "@/components/seguimiento/tareas/MapToolsOverlay.vue";
import MobileMapActions from "@/components/seguimiento/tareas/MobileMapActions.vue";
import TaskDetailPanel from "@/components/seguimiento/tareas/TaskDetailPanel.vue";
import TaskListPanel from "@/components/seguimiento/tareas/TaskListPanel.vue";
import TrackingFiltersBar from "@/components/seguimiento/tareas/TrackingFiltersBar.vue";
import TrackingMapWorkspace from "@/components/seguimiento/tareas/TrackingMapWorkspace.vue";
import { useSeguimientoTareasView } from "@/composables/seguimiento/useSeguimientoTareasView";
import { SEGUIMIENTO_FEATURES } from "@/seguimiento/shared/seguimiento.permissions";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type {
  SeguimientoCrossFilter,
  SeguimientoMapTool,
  TareasSeguimientoFilters,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const featureAccess = useFeatureAccessStore();
const {
  detail,
  detailError,
  filters,
  initialError,
  loadingDetail,
  loadingInitial,
  mapError,
  mapConfiguration,
  geography,
  mapStatus,
  mapTools,
  panelMode,
  selectedTask,
  selectedTaskId,
  tasks,
  catalog,
  trackers,
  visibleTasks,
  closeDetail,
  retry,
  selectTask,
  setMapError,
  setMapReady,
  toggleMapTool,
  updateFilters,
} = useSeguimientoTareasView();
const mapFocus = shallowRef<SeguimientoCoordinates | null>(null);
const crossFilter = shallowRef<SeguimientoCrossFilter>({
  workerId: null,
  sourceId: null,
});
const mobileView = shallowRef<
  "map" | "filters" | "list" | "view" | "map-focus"
>("map");
const canViewMap = computed(
  () =>
    !featureAccess.isLoaded ||
    featureAccess.tieneFuncionalidad(SEGUIMIENTO_FEATURES.viewMap),
);
const canViewTrackers = computed(
  () =>
    !featureAccess.isLoaded ||
    featureAccess.tieneFuncionalidad(SEGUIMIENTO_FEATURES.viewTaskTracker),
);
const isImplicitAreaSelection = computed(() => {
  const [onlyArea] = catalog.value.areas;

  return (
    catalog.value.areas.length === 1 && filters.value.areaId === onlyArea?.id
  );
});
const hasActiveFilters = computed(() =>
  Boolean(
    filters.value.search ||
    filters.value.scheduledDate ||
    (filters.value.areaId && !isImplicitAreaSelection.value) ||
    filters.value.assignedUserId ||
    filters.value.sourceId ||
    crossFilter.value.workerId ||
    crossFilter.value.sourceId !== null ||
    filters.value.types.length ||
    filters.value.statuses.length,
  ),
);
const desktopFiltersPosition = computed(() =>
  panelMode.value === "view" ? "md:right-[23rem]" : "md:right-0",
);
const locallyFilteredTasks = computed(() =>
  visibleTasks.value.filter(
    (task) =>
      (!crossFilter.value.workerId ||
        task.assignedUserId === crossFilter.value.workerId) &&
      (crossFilter.value.sourceId === null ||
        task.sourceId === crossFilter.value.sourceId),
  ),
);
function applyFilters(next: Partial<TareasSeguimientoFilters>): void {
  updateFilters(next);
  void retry();
  mobileView.value = "map";
}
function focusMap(coordinates: SeguimientoCoordinates | null): void {
  if (coordinates) {
    mapFocus.value = coordinates;
  }
}
function focusTaskOnMap(coordinates: SeguimientoCoordinates | null): void {
  focusMap(coordinates);
  mobileView.value = "map-focus";
}
function openTask(taskId: string): void {
  mobileView.value = "view";
  void selectTask(taskId);
}
function closeTaskDetail(): void {
  closeDetail();
  mobileView.value = "list";
}
function resetMap(): void {
  mapFocus.value = null;
}
function reloadMapData(): void {
  void retry();
}
function clearFilters(): void {
  crossFilter.value = { workerId: null, sourceId: null };
  applyFilters({
    scheduledDate: null,
    areaId: null,
    assignedUserId: null,
    sourceId: null,
    types: [],
    statuses: [],
    search: "",
  });
}
</script>

<template>
  <section
    class="relative isolate min-h-[calc(100dvh-5rem)] overflow-hidden bg-[#8fa281] pb-4 md:pb-0"
    aria-label="Workspace de seguimiento de tareas"
  >
    <TrackingMapWorkspace
      v-if="canViewMap"
      :tasks="locallyFilteredTasks"
      :trackers="trackers"
      :selected-task-id="selectedTaskId"
      :map-tools="mapTools"
      :status="mapStatus"
      :error="mapError"
      :focus="mapFocus"
      :map-configuration="mapConfiguration"
      :geography="geography"
      @ready="setMapReady"
      @error="setMapError"
    />
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center bg-[#e8ece9] text-[#31544d]"
      role="status"
    >
      No tienes acceso al mapa de seguimiento.
    </div>
    <TrackingFiltersBar
      class="absolute left-0 right-0 top-0 z-30 hidden min-w-0 transition-[right] duration-200 md:grid md:left-[20.5rem]"
      :class="desktopFiltersPosition"
      mode="toolbar"
      :filters="filters"
      :cross-filter="crossFilter"
      :trackers="trackers"
      :catalog="catalog"
      :loading="loadingInitial"
      :disabled="!canViewMap"
      :show-trackers="canViewTrackers"
      @apply="applyFilters"
      @focus="focusMap"
      @update:cross-filter="crossFilter = $event"
    />
    <section
      v-if="mobileView === 'filters'"
      class="fixed inset-0 z-50 flex flex-col bg-[#f8f7f4] md:hidden"
      aria-label="Filtros de seguimiento"
    >
      <header
        class="flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white px-4"
      >
        <button
          class="grid size-11 place-items-center rounded-lg border border-slate-200 text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
          type="button"
          aria-label="Volver al mapa"
          @click="mobileView = 'map'"
        >
          ←
        </button>
        <div>
          <h1 class="text-sm font-bold text-slate-800">Filtros del mapa</h1>
          <p class="text-[11px] text-slate-500">
            Contexto operativo y búsqueda por coordenadas.
          </p>
        </div>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <TrackingFiltersBar
          mode="panel"
          form-id="tracking-mobile-filters"
          :filters="filters"
          :cross-filter="crossFilter"
          :trackers="trackers"
          :catalog="catalog"
          :loading="loadingInitial"
          :disabled="!canViewMap"
          :show-trackers="canViewTrackers"
          @apply="applyFilters"
          @focus="focusMap"
          @update:cross-filter="crossFilter = $event"
        />
      </div>
      <footer
        class="grid grid-cols-[1fr_1.25fr] gap-2 border-t border-slate-200 bg-white p-3"
      >
        <button
          class="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
          type="button"
          @click="mobileView = 'map'"
        >
          Cancelar
        </button>
        <button
          class="h-11 rounded-lg bg-main px-3 text-sm font-extrabold text-white transition hover:bg-main-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-55"
          :disabled="!canViewMap || loadingInitial"
          type="submit"
          form="tracking-mobile-filters"
        >
          {{ loadingInitial ? "Aplicando…" : "Aplicar filtros" }}
        </button>
      </footer>
    </section>
    <MapToolsOverlay
      v-if="canViewMap"
      class="absolute right-4 top-56 z-30 hidden md:grid md:top-[5.5rem]"
      :tools="mapTools"
      :disabled="mapStatus === 'error'"
      @reload="reloadMapData"
      @reset="resetMap"
      @toggle="toggleMapTool"
      @focus-selected="focusMap(selectedTask?.routePoint ?? null)"
    />
    <div
      v-if="mobileView === 'map-focus'"
      class="absolute inset-x-3 top-3 z-30 flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-3 shadow-md backdrop-blur md:hidden"
    >
      <button
        class="grid size-11 place-items-center rounded-lg text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
        type="button"
        aria-label="Volver al detalle"
        @click="mobileView = 'view'"
      >
        ←
      </button>
      <div class="min-w-0">
        <p class="truncate text-xs font-bold text-slate-800">
          {{ selectedTask?.instructions || "Tarea seleccionada" }}
        </p>
        <p class="text-[10px] text-slate-500">
          Ubicación de la tarea seleccionada
        </p>
      </div>
    </div>
    <MobileMapActions
      v-if="mobileView === 'map' || mobileView === 'map-focus'"
      :task-count="locallyFilteredTasks.length"
      @open-filters="mobileView = 'filters'"
      @open-tasks="mobileView = 'list'"
    />
    <TaskListPanel
      class="fixed inset-0 z-50 w-full bg-[#f8f7f4] transition md:absolute md:inset-y-0 md:left-0 md:z-40 md:w-[20.5rem]"
      :class="mobileView === 'list' ? '' : 'max-md:hidden'"
      :tasks="locallyFilteredTasks"
      :selected-task-id="selectedTaskId"
      :loading="loadingInitial"
      :error="initialError"
      :search="filters.search"
      :has-active-filters="hasActiveFilters"
      :show-back="true"
      @select="openTask"
      @retry="retry"
      @update-search="updateFilters({ search: $event })"
      @clear-filters="clearFilters"
      @back="mobileView = 'map'"
    />
    <TaskDetailPanel
      v-if="panelMode === 'view'"
      class="fixed inset-0 z-50 max-h-none md:absolute md:inset-y-0 md:left-auto md:right-0 md:z-40 md:w-[23rem]"
      :class="mobileView === 'view' ? '' : 'max-md:hidden'"
      :task="detail ?? selectedTask"
      :loading="loadingDetail"
      :error="detailError"
      @close="closeTaskDetail"
      @focus="focusTaskOnMap"
      @retry="selectedTaskId && selectTask(selectedTaskId)"
    />
  </section>
</template>
