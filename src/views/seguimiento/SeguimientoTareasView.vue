<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from "vue";
import { CheckCircle2 } from "lucide-vue-next";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import MapToolsOverlay from "@/components/seguimiento/tareas/MapToolsOverlay.vue";
import MobileMapActions from "@/components/seguimiento/tareas/MobileMapActions.vue";
import TaskDetailPanel from "@/components/seguimiento/tareas/TaskDetailPanel.vue";
import TaskCreatePanel from "@/components/seguimiento/tareas/create/TaskCreatePanel.vue";
import TaskListPanel from "@/components/seguimiento/tareas/TaskListPanel.vue";
import TrackingFiltersBar from "@/components/seguimiento/tareas/TrackingFiltersBar.vue";
import TrackingMapWorkspace from "@/components/seguimiento/tareas/TrackingMapWorkspace.vue";
import { useSeguimientoTareasView } from "@/composables/seguimiento/useSeguimientoTareasView";
import { useSeguimientoTareaCreacion } from "@/composables/seguimiento/useSeguimientoTareaCreacion";
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
const {
  draft: createDraft,
  isPanelOpen: isCreatePanelOpen,
  isDiscardConfirmationOpen,
  validationErrors: createValidationErrors,
  openCreate,
  requestCloseCreate,
  continueCreateEditing,
  discardCreate,
  updateType,
  updateWorker,
  updateTracker,
  updateCompanion,
  updateDetails,
  updateGeometry,
  updateRoute,
  geometryMode,
  beginGeometryEdit,
  finishGeometryEdit,
  remoteError: createRemoteError,
  isSubmitLocked: isCreateSubmitting,
  submitCreate,
} = useSeguimientoTareaCreacion();
const mapFocus = shallowRef<SeguimientoCoordinates | null>(null);
const createSuccessMessage = shallowRef<string | null>(null);
let createSuccessTimer: ReturnType<typeof setTimeout> | null = null;
onBeforeUnmount(() => {
  if (createSuccessTimer) clearTimeout(createSuccessTimer);
});
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
const canCreateTasks = computed(
  () =>
    featureAccess.isLoaded &&
    featureAccess.tieneFuncionalidad(SEGUIMIENTO_FEATURES.createTasks),
);
const createWorkers = computed(
  () =>
    catalog.value.areas.find((area) => area.id === createDraft.value.areaId)
      ?.workers ?? [],
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
  panelMode.value === "view" || isCreatePanelOpen.value
    ? "md:right-[23rem]"
    : "md:right-0",
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
function startCreate(): void {
  if (!canCreateTasks.value) return;
  closeDetail();
  mobileView.value = "view";
  openCreate(filters.value.areaId ?? catalog.value.areas[0]?.id ?? null);
}
function selectCreateWorker(workerId: string): void {
  updateWorker(
    createWorkers.value.find((worker) => worker.id === workerId) ?? null,
  );
}
function selectCreateTracker(sourceId: number): void {
  const tracker = trackers.value.find((item) => item.sourceId === sourceId);
  updateTracker(
    tracker
      ? { id: tracker.id, sourceId: tracker.sourceId, label: tracker.label }
      : null,
  );
}
async function submitTaskCreate(): Promise<void> {
  const result = await submitCreate();
  if (!result) return;
  finishGeometryEdit();
  createSuccessMessage.value = "La tarea se creó correctamente.";
  if (createSuccessTimer) clearTimeout(createSuccessTimer);
  createSuccessTimer = setTimeout(() => {
    createSuccessMessage.value = null;
  }, 4000);
  await retry();
  const taskId = typeof result.tarea_id === "string" ? result.tarea_id : null;
  if (taskId) await selectTask(taskId);
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
      :creation-geometry-mode="geometryMode"
      @ready="setMapReady"
      @error="setMapError"
      @capture:route-point="updateGeometry({ routePoint: $event })"
      @capture:control-line="
        updateGeometry({
          controlLine: { type: 'MultiLineString', coordinates: $event },
        })
      "
      @capture:control-zone="
        updateGeometry({
          controlZone: { type: 'MultiPolygon', coordinates: $event },
        })
      "
    />
    <div
      v-if="createSuccessMessage"
      class="absolute right-4 top-4 z-[60] flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-xl border border-main/20 bg-white px-3 py-2.5 text-xs font-bold text-main shadow-lg md:right-[24rem]"
      role="status"
    >
      <CheckCircle2 class="size-4 shrink-0" aria-hidden="true" />
      {{ createSuccessMessage }}
    </div>
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
      :can-create="canCreateTasks"
      @select="openTask"
      @retry="retry"
      @update-search="updateFilters({ search: $event })"
      @clear-filters="clearFilters"
      @back="mobileView = 'map'"
      @create="startCreate"
    />
    <TaskDetailPanel
      v-if="panelMode === 'view' && !isCreatePanelOpen"
      class="fixed inset-0 z-50 max-h-none md:absolute md:inset-y-0 md:left-auto md:right-0 md:z-40 md:w-[23rem]"
      :class="mobileView === 'view' ? '' : 'max-md:hidden'"
      :task="detail ?? selectedTask"
      :loading="loadingDetail"
      :error="detailError"
      @close="closeTaskDetail"
      @focus="focusTaskOnMap"
      @retry="selectedTaskId && selectTask(selectedTaskId)"
    />
    <TaskCreatePanel
      v-if="isCreatePanelOpen"
      class="fixed inset-0 z-50 max-h-none md:absolute md:inset-y-0 md:left-auto md:right-0 md:z-40 md:w-[23rem]"
      :class="mobileView === 'view' ? '' : 'max-md:hidden'"
      :draft="createDraft"
      :workers="createWorkers"
      :trackers="trackers"
      :errors="createValidationErrors"
      :show-discard-confirmation="isDiscardConfirmationOpen"
      :geography="geography"
      :geometry-mode="geometryMode"
      :remote-error="createRemoteError?.message ?? null"
      :submitting="isCreateSubmitting"
      @close="requestCloseCreate"
      @continue-editing="continueCreateEditing"
      @discard="discardCreate"
      @update:type="updateType"
      @update:worker="selectCreateWorker"
      @update:tracker="selectCreateTracker"
      @update:companion="updateCompanion"
      @update:details="updateDetails"
      @update:geometry="updateGeometry"
      @update:route="updateRoute"
      @edit:geometry="beginGeometryEdit"
      @finish:geometry="finishGeometryEdit"
      @submit="submitTaskCreate"
    />
  </section>
</template>
