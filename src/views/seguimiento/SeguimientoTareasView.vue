<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from "vue";
import { CheckCircle2 } from "lucide-vue-next";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import MapToolsOverlay from "@/components/seguimiento/tareas/MapToolsOverlay.vue";
import MobileMapActions from "@/components/seguimiento/tareas/MobileMapActions.vue";
import TaskDetailPanel from "@/components/seguimiento/tareas/TaskDetailPanel.vue";
import TaskCreatePanel from "@/components/seguimiento/tareas/create/TaskCreatePanel.vue";
import TaskCreationWizardCard from "@/components/seguimiento/tareas/create/TaskCreationWizardCard.vue";
import TaskListPanel from "@/components/seguimiento/tareas/TaskListPanel.vue";
import TrackingFiltersBar from "@/components/seguimiento/tareas/TrackingFiltersBar.vue";
import TrackingMapWorkspace from "@/components/seguimiento/tareas/TrackingMapWorkspace.vue";
import { useSeguimientoTareasView } from "@/composables/seguimiento/useSeguimientoTareasView";
import { useSeguimientoTareaCreacion } from "@/composables/seguimiento/useSeguimientoTareaCreacion";
import { SEGUIMIENTO_FEATURES } from "@/seguimiento/shared/seguimiento.permissions";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import { isValidControlZone } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.geometry";
import {
  resolveDominantFarm,
  snapToAreaRoads,
  snapToFarmRoads,
} from "@/stores/seguimiento/tareas/creacion/tareaCreacion.spatial";
import type { TareaCreacionBorrador } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.types";
import { getSeguimientoToday } from "@/stores/seguimiento/tareas/tareasSeguimiento.helpers";
import type {
  SeguimientoCrossFilter,
  SeguimientoMapTool,
  TareasSeguimientoFilters,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const featureAccess = useFeatureAccessStore();
const toast = useToast();
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
  openSpatialCreate,
  openCreateDetails,
  startAdditionalControlZone,
  finishAdditionalControlZone,
  cancelAdditionalControlZone,
  requestCloseCreate,
  continueCreateEditing,
  discardCreate,
  updateWorker,
  updateTracker,
  updateCompanions,
  updateDetails,
  updateGeometry,
  updateControlZone,
  captureSpatialRoute,
  completeSpatialSelection,
  updateRoute,
  geometryMode,
  editingControlZoneIndex,
  persistDraftOnNavigation,
  spatialState,
  wizardStep,
  lockedFarmId,
  beginGeometryEdit,
  beginControlZoneEdit,
  removeControlZone,
  finishGeometryEdit,
  remoteError: createRemoteError,
  isSubmitLocked: isCreateSubmitting,
  canSubmitCreate,
  submitBlockReasons,
  reportSkippedCreateField,
  revealCreateSubmitRequirements,
  submitCreate,
} = useSeguimientoTareaCreacion();
const mapFocus = shallowRef<SeguimientoCoordinates | null>(null);
const createSuccessMessage = shallowRef<string | null>(null);
const pendingControlZone = shallowRef<
  TareaCreacionBorrador["geometry"]["controlZones"][number] | null
>(null);
const creationSketchResetKey = shallowRef(0);
const creationGeometryPreview = computed(() => ({
  ...createDraft.value.geometry,
  controlZones: createDraft.value.geometry.controlZones,
}));
let createSuccessTimer: ReturnType<typeof setTimeout> | null = null;
onMounted(() => {
  if (
    featureAccess.isLoaded &&
    !featureAccess.tieneFuncionalidad(SEGUIMIENTO_FEATURES.viewMap)
  ) {
    void featureAccess.cargarFuncionalidadesPermitidas(true);
  }
});
onBeforeUnmount(() => {
  if (createSuccessTimer) clearTimeout(createSuccessTimer);
  if (!persistDraftOnNavigation.value) discardCreate();
});
const crossFilter = shallowRef<SeguimientoCrossFilter>({
  workerId: null,
  sourceId: null,
});
const creationLockedFilter = shallowRef<SeguimientoCrossFilter>({
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
const canStartCreate = computed(
  () =>
    canCreateTasks.value &&
    Boolean(filters.value.scheduledDate) &&
    Boolean(crossFilter.value.workerId || crossFilter.value.sourceId !== null),
);
const crossFilterLockMessage = computed(() =>
  isCreatePanelOpen.value || spatialState.value !== "idle"
    ? "Cierra el panel de creación para cambiar filtros."
    : "Cierra el panel de edición para cambiar filtros.",
);
const createWorkers = computed(
  () =>
    catalog.value.areas.find((area) => area.id === createDraft.value.areaId)
      ?.workers ?? [],
);
const createCompanions = computed(
  () =>
    catalog.value.areas.find((area) => area.id === createDraft.value.areaId)
      ?.companions ?? [],
);
const lockedFarmBoundary = computed(() => {
  if (!lockedFarmId.value || !createDraft.value.areaId) return null;
  return (
    geography.value
      .find((item) => item.areaId === createDraft.value.areaId)
      ?.farms.find((farm) => farm.id === lockedFarmId.value)?.boundary ?? null
  );
});
const hasAreaFilter = computed(
  () => catalog.value.areas.length > 1 && filters.value.areaId !== null,
);
const hasActiveFilters = computed(() =>
  Boolean(
    filters.value.search ||
    filters.value.scheduledDate !== getSeguimientoToday() ||
    hasAreaFilter.value ||
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
function prepareCreationDraft(): void {
  if (!canStartCreate.value) return;
  closeDetail();
  mobileView.value = "view";
  const selectedWorkerAreaId = crossFilter.value.workerId
    ? (catalog.value.areas.find((area) =>
        area.workers.some((worker) => worker.id === crossFilter.value.workerId),
      )?.id ?? null)
    : null;
  creationLockedFilter.value = { ...crossFilter.value };
  openSpatialCreate(
    filters.value.areaId ??
      selectedWorkerAreaId ??
      catalog.value.areas[0]?.id ??
      null,
    filters.value.scheduledDate,
  );
  updateRoute(tasks.value.length + 1);
  if (crossFilter.value.workerId)
    selectCreateWorker(crossFilter.value.workerId);
  if (crossFilter.value.sourceId !== null)
    selectCreateTracker(crossFilter.value.sourceId);
}
function startSpatialCreate(): void {
  prepareCreationDraft();
  mobileView.value = "map";
  toast.add({
    severity: "info",
    summary: "Selecciona el acceso",
    detail:
      "Haz clic cerca de una vía para generar el punto y la línea de control.",
    life: 4500,
  });
}
function openCreationDetails(): void {
  openCreateDetails();
  mobileView.value = "view";
}
function addControlZone(): void {
  if (!startAdditionalControlZone()) return;
  mobileView.value = "map";
  toast.add({
    severity: "info",
    summary: "Agregar zona de control",
    detail: "Dibuja la zona y ciérrala tocando el primer punto verde.",
    life: 3600,
  });
}
function selectCreateWorker(workerId: string): void {
  updateWorker(
    createWorkers.value.find((worker) => worker.id === workerId) ?? null,
  );
  crossFilter.value = { ...crossFilter.value, workerId };
}
function selectCreateTracker(sourceId: number): void {
  const tracker = trackers.value.find((item) => item.sourceId === sourceId);
  updateTracker(
    tracker
      ? { id: tracker.id, sourceId: tracker.sourceId, label: tracker.label }
      : null,
  );
  crossFilter.value = { ...crossFilter.value, sourceId };
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
function captureRoutePoint(clicked: SeguimientoCoordinates): void {
  if (spatialState.value !== "selecting-route-point") {
    updateGeometry({ routePoint: clicked });
    return;
  }
  const snap = snapToAreaRoads(clicked, geography.value);
  if (!snap) {
    toast.add({
      severity: "info",
      summary: "Punto para tarea zona",
      detail:
        "No hay vía enrutable a menos de 5 m. Dibuja una zona fuera de las fincas para crear una tarea zona.",
      life: 4200,
    });
    captureSpatialRoute(clicked, null);
    return;
  }
  captureSpatialRoute(snap.routePoint, snap.controlLine);
  toast.add({
    severity: "success",
    summary: "Acceso ajustado",
    detail: "Ahora dibuja la primera zona de trabajo.",
    life: 3200,
  });
}
function captureControlZone(
  zone: TareaCreacionBorrador["geometry"]["controlZones"][number],
): void {
  if (!isValidControlZone(zone)) return;
  pendingControlZone.value = zone;
  finishCreateGeometry();
}
function handleControlZoneUpdate(
  index: number,
  coordinates: number[][][][],
): void {
  updateControlZone(index, { type: "MultiPolygon", coordinates });
}
function notifyBlockedZoneCapture(): void {
  toast.add({
    severity: "warn",
    summary: "Área bloqueada",
    detail:
      "La zona está fuera de la finca. Corrige primero el punto de control y vuelve a dibujar la zona.",
    life: 3200,
  });
}
function clearSpatialZoneVertices(): void {
  pendingControlZone.value = null;
  creationSketchResetKey.value += 1;
  toast.add({
    severity: "info",
    summary: "Vértices eliminados",
    detail: "El punto enrutado se conserva. Puedes dibujar la zona nuevamente.",
    life: 2800,
  });
}
function finishCreateGeometry(): void {
  const isDrawingExtraZone = spatialState.value === "drawing-extra-zone";
  const zone = pendingControlZone.value;
  if (!zone) {
    finishGeometryEdit();
    return;
  }
  const farms =
    geography.value.find((item) => item.areaId === createDraft.value.areaId)
      ?.farms ?? [];
  if (spatialState.value === "drawing-first-zone") {
    const dominant = resolveDominantFarm([zone], farms);
    const originalRoutePoint = createDraft.value.geometry.routePoint;
    if (!createDraft.value.geometry.controlLine && dominant?.isFullyContained) {
      toast.add({
        severity: "warn",
        summary: "Zona dentro de una finca",
        detail:
          "Para crear una tarea finca, mueve el punto de control a una vía enrutable y vuelve a dibujar la zona.",
        life: 4800,
      });
      pendingControlZone.value = null;
      return;
    }
    const farmSnap =
      dominant && originalRoutePoint
        ? snapToFarmRoads(originalRoutePoint, dominant.farm)
        : null;
    completeSpatialSelection(
      dominant && farmSnap ? "finca" : "zona",
      dominant && farmSnap ? dominant.farm.id : null,
      zone,
      farmSnap?.routePoint ?? originalRoutePoint,
      farmSnap?.controlLine ?? null,
      Boolean(dominant?.isFullyContained && farmSnap),
    );
    pendingControlZone.value = null;
    return;
  }
  if (createDraft.value.type === "finca") {
    const selectedFarm = farms.find(
      (farm) => farm.id === createDraft.value.geometry.locationId,
    );
    const zoneInLockedFarm = selectedFarm
      ? resolveDominantFarm([zone], [selectedFarm])?.isFullyContained
      : false;
    if (lockedFarmId.value && !zoneInLockedFarm) {
      toast.add({
        severity: "warn",
        summary: "Zona fuera de la finca",
        detail: "La primera zona fijó esta tarea dentro de una sola finca.",
        life: 4200,
      });
      pendingControlZone.value = null;
      finishGeometryEdit();
      return;
    }
    const zones = [...createDraft.value.geometry.controlZones, zone];
    const dominant = resolveDominantFarm(zones, farms);
    const currentRoutePoint = createDraft.value.geometry.routePoint;
    const farmSnap =
      dominant && currentRoutePoint
        ? snapToFarmRoads(currentRoutePoint, dominant.farm)
        : null;
    if (!dominant || !farmSnap) {
      toast.add({
        severity: "warn",
        summary: "Zona sin acceso compatible",
        detail: "La zona no puede agregarse a esta tarea finca.",
        life: 4200,
      });
    } else {
      updateGeometry({
        locationId: dominant.farm.id,
        routePoint: farmSnap.routePoint,
        controlLine: farmSnap.controlLine,
        controlZones: zones,
      });
    }
  } else {
    updateGeometry({ controlZones: [zone] });
  }
  pendingControlZone.value = null;
  if (isDrawingExtraZone) {
    finishAdditionalControlZone();
    return;
  }
  finishGeometryEdit();
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
    scheduledDate: getSeguimientoToday(),
    areaId: null,
    assignedUserId: null,
    sourceId: null,
    types: [],
    statuses: [],
    search: "",
  });
}
function notifyCrossFilterLocked(): void {
  toast.add({
    severity: "warn",
    summary: "Filtros bloqueados",
    detail: crossFilterLockMessage.value,
    life: 3200,
  });
}
function notifyCreateSubmitBlocked(reasons: string[]): void {
  const currentReasons = revealCreateSubmitRequirements().map(
    (error) => error.message,
  );
  toast.add({
    severity: "warn",
    summary: "Faltan datos obligatorios",
    detail: (currentReasons.length ? currentReasons : reasons).join(" · "),
    life: 5000,
  });
}
</script>

<template>
  <section
    class="relative isolate min-h-[calc(100dvh-3rem)] overflow-hidden bg-[#8fa281] pb-4 md:pb-0"
    aria-label="Workspace de seguimiento de tareas"
  >
    <Toast position="top-right" />
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
      :creation-geometry="creationGeometryPreview"
      :creation-editing-zone-index="editingControlZoneIndex"
      :creation-locked-boundary="lockedFarmBoundary"
      :creation-sketch-reset-key="creationSketchResetKey"
      @ready="setMapReady"
      @error="setMapError"
      @capture:route-point="captureRoutePoint"
      @capture:control-line="
        updateGeometry({
          controlLine: { type: 'MultiLineString', coordinates: $event },
        })
      "
      @capture:control-zone="
        captureControlZone({ type: 'MultiPolygon', coordinates: $event })
      "
      @update:control-zone="handleControlZoneUpdate"
      @select:control-zone="beginControlZoneEdit"
      @capture:blocked="notifyBlockedZoneCapture"
    />
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center bg-[#e8ece9] text-[#31544d]"
      role="status"
    >
      No tienes acceso al mapa de seguimiento.
    </div>
    <TaskCreationWizardCard
      v-if="canStartCreate && wizardStep === 'ready'"
      class="absolute bottom-5 left-1/2 z-30 -translate-x-1/2"
      :step="wizardStep"
      @action="startSpatialCreate"
      @cancel="discardCreate"
    />
    <TaskCreationWizardCard
      v-else-if="wizardStep === 'selecting-control-point'"
      class="absolute bottom-5 left-1/2 z-30 -translate-x-1/2"
      :step="wizardStep"
      @cancel="discardCreate"
    />
    <TaskCreationWizardCard
      v-else-if="wizardStep === 'drawing-initial-zone'"
      class="absolute bottom-5 left-1/2 z-30 -translate-x-1/2"
      :step="wizardStep"
      @cancel="clearSpatialZoneVertices"
    />
    <TaskCreationWizardCard
      v-else-if="
        wizardStep === 'details-pending' && geometryMode !== 'zone-edit'
      "
      class="absolute bottom-5 left-1/2 z-30 -translate-x-1/2"
      :step="wizardStep"
      :show-add-zone="createDraft.type === 'finca'"
      @action="openCreationDetails"
      @add-zone="addControlZone"
      @cancel="discardCreate"
    />
    <TaskCreationWizardCard
      v-else-if="wizardStep === 'drawing-extra-zone'"
      class="absolute bottom-5 left-1/2 z-30 -translate-x-1/2"
      :step="wizardStep"
      @cancel="cancelAdditionalControlZone"
    />
    <div
      v-else-if="
        geometryMode === 'zone-edit' && editingControlZoneIndex !== null
      "
      class="absolute bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1 rounded-lg border border-white/75 bg-white/95 px-2 py-1.5 text-[11px] font-extrabold text-slate-800 shadow-md backdrop-blur"
    >
      Editar zona
      <button
        class="h-7 rounded-md border border-slate-200 px-2 text-slate-600"
        type="button"
        @click="finishGeometryEdit"
      >
        Cancelar
      </button>
      <button
        class="h-7 rounded-md bg-danger px-2 text-white"
        type="button"
        @click="
          removeControlZone(editingControlZoneIndex);
          finishGeometryEdit();
        "
      >
        Eliminar
      </button>
    </div>
    <TaskCreationWizardCard
      v-else-if="
        wizardStep === 'editing-details' &&
        createDraft.type === 'finca' &&
        geometryMode === null
      "
      class="absolute bottom-5 left-1/2 z-30 -translate-x-1/2"
      :step="wizardStep"
      @action="addControlZone"
    />
    <div
      v-if="createSuccessMessage"
      class="absolute right-4 top-4 z-[60] flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-xl border border-main/20 bg-white px-3 py-2.5 text-xs font-bold text-main shadow-lg md:right-[24rem]"
      role="status"
    >
      <CheckCircle2 class="size-4 shrink-0" aria-hidden="true" />
      {{ createSuccessMessage }}
    </div>
    <TrackingFiltersBar
      class="absolute left-0 right-0 top-0 z-[45] hidden min-w-0 transition-[right] duration-200 md:grid md:left-[20.5rem]"
      :class="desktopFiltersPosition"
      mode="toolbar"
      :filters="filters"
      :cross-filter="crossFilter"
      :trackers="trackers"
      :catalog="catalog"
      :loading="loadingInitial"
      :disabled="!canViewMap"
      :show-trackers="canViewTrackers"
      :lock-cross-filters="isCreatePanelOpen || spatialState !== 'idle'"
      @apply="applyFilters"
      @focus="focusMap"
      @update:cross-filter="crossFilter = $event"
      @attempt:cross-filter-change="notifyCrossFilterLocked"
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
          :lock-cross-filters="isCreatePanelOpen || spatialState !== 'idle'"
          @apply="applyFilters"
          @focus="focusMap"
          @update:cross-filter="crossFilter = $event"
          @attempt:cross-filter-change="notifyCrossFilterLocked"
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
      v-if="panelMode === 'view' && !isCreatePanelOpen"
      class="fixed inset-0 z-50 max-h-none md:absolute md:inset-y-0 md:left-auto md:right-0 md:z-40 md:w-[23rem]"
      :class="mobileView === 'view' ? '' : 'max-md:hidden'"
      :task="detail"
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
      :companions="createCompanions"
      :total-tasks="tasks.length"
      :errors="createValidationErrors"
      :show-discard-confirmation="isDiscardConfirmationOpen"
      :geography="geography"
      :geometry-mode="geometryMode"
      :remote-error="createRemoteError?.message ?? null"
      :submitting="isCreateSubmitting"
      :can-submit="canSubmitCreate"
      :submit-block-reasons="submitBlockReasons"
      :lock-worker="creationLockedFilter.workerId !== null"
      :lock-tracker="creationLockedFilter.sourceId !== null"
      @close="requestCloseCreate"
      @continue-editing="continueCreateEditing"
      @discard="discardCreate"
      @update:worker="selectCreateWorker"
      @update:tracker="selectCreateTracker"
      @update:companions="updateCompanions"
      @update:details="updateDetails"
      @update:geometry="updateGeometry"
      @edit:zone="beginControlZoneEdit"
      @remove:zone="removeControlZone"
      @update:route="updateRoute"
      @edit:geometry="beginGeometryEdit"
      @finish:geometry="finishCreateGeometry"
      @skip:field="reportSkippedCreateField"
      @submit:blocked="notifyCreateSubmitBlocked"
      @submit="submitTaskCreate"
    />
  </section>
</template>
