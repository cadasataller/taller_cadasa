<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import MapToolsOverlay from "@/components/seguimiento/tareas/MapToolsOverlay.vue";
import TaskDetailPanel from "@/components/seguimiento/tareas/TaskDetailPanel.vue";
import TaskListPanel from "@/components/seguimiento/tareas/TaskListPanel.vue";
import TrackingFiltersBar from "@/components/seguimiento/tareas/TrackingFiltersBar.vue";
import TrackingMapWorkspace from "@/components/seguimiento/tareas/TrackingMapWorkspace.vue";
import { useSeguimientoTareasView } from "@/composables/seguimiento/useSeguimientoTareasView";
import { SEGUIMIENTO_FEATURES } from "@/seguimiento/shared/seguimiento.permissions";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type {
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
  mapStatus,
  mapTools,
  panelMode,
  selectedTask,
  selectedTaskId,
  tasks,
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
function applyFilters(next: Partial<TareasSeguimientoFilters>): void {
  updateFilters(next);
  void retry();
}
function focusMap(coordinates: SeguimientoCoordinates | null): void {
  if (coordinates) {
    mapFocus.value = coordinates;
  }
}
function resetMap(): void {
  mapFocus.value = null;
}
</script>

<template>
  <section
    class="relative isolate min-h-[calc(100dvh-5rem)] overflow-hidden bg-[#8fa281] pb-4 md:pb-0"
    aria-label="Workspace de seguimiento de tareas"
  >
    <TrackingMapWorkspace
      v-if="canViewMap"
      :tasks="tasks"
      :trackers="trackers"
      :selected-task-id="selectedTaskId"
      :map-tools="mapTools"
      :status="mapStatus"
      :error="mapError"
      :focus="mapFocus"
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
      class="absolute left-3 right-3 top-3 z-30 md:left-[22rem] md:right-20"
      :filters="filters"
      :trackers="trackers"
      :loading="loadingInitial"
      :disabled="!canViewMap"
      :show-trackers="canViewTrackers"
      @apply="applyFilters"
      @focus="focusMap"
    />
    <MapToolsOverlay
      v-if="canViewMap"
      class="absolute right-4 top-56 z-30 md:top-[5.5rem]"
      :tools="mapTools"
      :disabled="mapStatus === 'error'"
      @reset="resetMap"
      @toggle="toggleMapTool"
      @focus-selected="focusMap(selectedTask?.routePoint ?? null)"
    />
    <TaskListPanel
      class="relative z-40 mt-48 w-full md:absolute md:inset-y-0 md:left-0 md:mt-0 md:w-[20.5rem]"
      :tasks="visibleTasks"
      :selected-task-id="selectedTaskId"
      :loading="loadingInitial"
      :error="initialError"
      :search="filters.search"
      @select="selectTask"
      @retry="retry"
      @update-search="updateFilters({ search: $event })"
    />
    <TaskDetailPanel
      v-if="panelMode === 'view'"
      class="absolute inset-x-3 bottom-3 z-40 max-h-[70dvh] md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[23rem]"
      :task="detail ?? selectedTask"
      :loading="loadingDetail"
      :error="detailError"
      @close="closeDetail"
      @focus="focusMap"
    />
  </section>
</template>
