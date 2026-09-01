import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import {
  createInitialTareasSeguimientoFilters,
  getSeguimientoToday,
  toErrorMessage,
} from "./tareasSeguimiento.helpers";
import { tareasSeguimientoService } from "./tareasSeguimiento.service";
import type {
  SeguimientoTracker,
  TrackerCurrentLocation,
  TrackerLocationBroadcast,
} from "@/seguimiento/shared/trackers/tracker.types";
import { trackerCurrentLocationService } from "@/seguimiento/shared/trackers/trackerCurrentLocation.service";
import { trackerLocationService } from "@/seguimiento/shared/trackers/trackerLocation.service";
import type {
  SeguimientoMapStatus,
  SeguimientoMapConfiguration,
  SeguimientoOperationalGeography,
  SeguimientoTaskCatalog,
  SeguimientoMapToolState,
  SeguimientoRutaPlanificada,
  TareaSeguimientoDetail,
  TareaSeguimientoListItem,
  TareasSeguimientoFilters,
} from "./tareasSeguimiento.types";

const initialMapTools = (): SeguimientoMapToolState[] => [
  { tool: "tasks", enabled: true },
  { tool: "trackers", enabled: true },
  { tool: "zones", enabled: true },
  { tool: "route", enabled: true },
];

export const useTareasSeguimientoStore = defineStore(
  "seguimiento_tareas",
  () => {
    const filters = ref<TareasSeguimientoFilters>(
      createInitialTareasSeguimientoFilters(),
    );
    const tasks = ref<TareaSeguimientoListItem[]>([]);
    const trackers = ref<SeguimientoTracker[]>([]);
    const trackerLoadObservations = ref<string[]>([]);
    const trackerLocationError = shallowRef<string | null>(null);
    const catalog = ref<SeguimientoTaskCatalog>({ areas: [] });
    const geography = ref<SeguimientoOperationalGeography[]>([]);
    const mapConfiguration = shallowRef<SeguimientoMapConfiguration | null>(
      null,
    );
    const selectedTaskId = shallowRef<string | null>(null);
    const detail = ref<TareaSeguimientoDetail | null>(null);
    const panelMode = shallowRef<"closed" | "view">("closed");
    const mapStatus = shallowRef<SeguimientoMapStatus>("idle");
    const mapError = shallowRef<string | null>(null);
    const mapTools = ref<SeguimientoMapToolState[]>(initialMapTools());
    const plannedRoutes = ref<SeguimientoRutaPlanificada[]>([]);
    const loadingInitial = shallowRef(false);
    const loadingDetail = shallowRef(false);
    const initialError = shallowRef<string | null>(null);
    const detailError = shallowRef<string | null>(null);
    let initialRequest: Promise<void> | null = null;
    let detailRequestId = 0;
    let plannedRoutesRequestId = 0;
    let trackerLocationSyncRequest: Promise<void> = Promise.resolve();

    const visibleTasks = computed(() => {
      const search = filters.value.search.trim().toLocaleLowerCase();
      return tasks.value.filter(
        (task) =>
          (!filters.value.types.length ||
            filters.value.types.includes(task.type)) &&
          (!filters.value.statuses.length ||
            filters.value.statuses.includes(task.status)) &&
          (!search ||
            [task.instructions, task.trackerLabel, task.type, task.status]
              .filter((value): value is string => Boolean(value))
              .some((value) => value.toLocaleLowerCase().includes(search))),
      );
    });
    const selectedTask = computed(
      () =>
        tasks.value.find((task) => task.id === selectedTaskId.value) ?? null,
    );
    const trackerLocationSourceIds = computed(() => {
      if (
        !mapTools.value.some((tool) => tool.tool === "trackers" && tool.enabled)
      )
        return [];
      if (filters.value.sourceId) return [filters.value.sourceId];
      return trackers.value.map((tracker) => tracker.sourceId);
    });
    const canLoadPlannedRoutes = computed(
      () =>
        Boolean(filters.value.areaId) &&
        Boolean(filters.value.scheduledDate) &&
        Boolean(
          filters.value.assignedUserId || filters.value.sourceId !== null,
        ),
    );

    function applyTrackerLocation(location: TrackerCurrentLocation): void {
      trackers.value = trackers.value.map((tracker) =>
        tracker.sourceId === location.sourceId
          ? {
              ...tracker,
              id: location.trackerId ?? tracker.id,
              label: location.trackerLabel ?? tracker.label,
              position: {
                latitude: location.latitude,
                longitude: location.longitude,
              },
              capturedAt: location.capturedAt,
              status: location.currentTaskId ? "at_task" : "available",
              currentTaskId: location.currentTaskId,
              movementStatus: location.movementStatus ?? tracker.movementStatus,
              movementStatusUpdatedAt:
                location.movementStatusUpdatedAt ??
                tracker.movementStatusUpdatedAt,
              connectionStatus:
                location.connectionStatus ?? tracker.connectionStatus,
              ignition: location.ignition ?? tracker.ignition,
              ignitionUpdatedAt:
                location.ignitionUpdatedAt ?? tracker.ignitionUpdatedAt,
              speed: location.speed ?? tracker.speed,
            }
          : tracker,
      );
    }

    function applyTrackerLocationBroadcast(
      location: TrackerLocationBroadcast,
    ): void {
      applyTrackerLocation({
        sourceId: location.source_id,
        trackerId: location.tracker_id ?? null,
        trackerLabel: location.tracker_label ?? null,
        latitude: location.latitud,
        longitude: location.longitud,
        capturedAt: location.capturada_en,
        currentTaskId: location.tarea_actual_id ?? null,
        movementStatus: location.movement_status,
        movementStatusUpdatedAt: location.movement_status_update,
        connectionStatus: location.connection_status,
        ignition: location.ignition,
        ignitionUpdatedAt: location.ignition_update,
        speed: location.velocidad,
      });
    }

    function syncTrackerLocations(): Promise<void> {
      trackerLocationSyncRequest = trackerLocationSyncRequest
        .catch(() => undefined)
        .then(async () => {
          try {
            const sourceIds = trackerLocationSourceIds.value;
            const locations =
              await trackerCurrentLocationService.load(sourceIds);
            locations.forEach(applyTrackerLocation);
            await trackerLocationService.sync(
              sourceIds,
              applyTrackerLocationBroadcast,
            );
            trackerLocationError.value = null;
          } catch (error) {
            trackerLocationError.value = toErrorMessage(
              error,
              "No se pudieron actualizar las ubicaciones de trackers.",
            );
          }
        });
      return trackerLocationSyncRequest;
    }

    async function loadWorkspace(force = false): Promise<void> {
      if (initialRequest && !force) return initialRequest;
      initialRequest = (async () => {
        loadingInitial.value = true;
        initialError.value = null;
        try {
          const context = await tareasSeguimientoService.loadWorkspaceContext(
            filters.value.areaId,
          );
          trackers.value = context.trackers;
          trackerLoadObservations.value = context.trackerLoadObservations;
          catalog.value = context.catalog;
          geography.value = context.geography;
          mapConfiguration.value = context.mapConfiguration;
          const taskDataRequest = tareasSeguimientoService.loadTasks(
            filters.value,
            context.trackers,
          );
          if (canLoadPlannedRoutes.value) void refreshPlannedRoutes();
          const taskData = await taskDataRequest;
          tasks.value = taskData.tasks;
          trackers.value = taskData.trackers;
          void syncTrackerLocations();
          if (
            selectedTaskId.value &&
            !tasks.value.some((task) => task.id === selectedTaskId.value)
          )
            closeDetail();
        } catch (error) {
          initialError.value = toErrorMessage(
            error,
            "No se pudieron cargar las tareas.",
          );
        } finally {
          loadingInitial.value = false;
          initialRequest = null;
        }
      })();
      return initialRequest;
    }

    async function refreshPlannedRoutes(options?: {
      sourceId?: number | null;
      userId?: string | null;
    }): Promise<void> {
      const sourceId = options?.sourceId ?? filters.value.sourceId;
      const userId = options?.userId ?? filters.value.assignedUserId;
      if (
        !filters.value.areaId ||
        !filters.value.scheduledDate ||
        (!userId && sourceId === null)
      ) {
        plannedRoutesRequestId++;
        plannedRoutes.value = [];
        return;
      }
      const requestId = ++plannedRoutesRequestId;
      try {
        const routes = await tareasSeguimientoService.loadPlannedRoutes({
          p_area_id: filters.value.areaId,
          p_fecha: filters.value.scheduledDate,
          p_usuario_id: userId,
          p_source_id: sourceId,
        });
        if (requestId !== plannedRoutesRequestId) return;
        if (options?.sourceId !== undefined && sourceId !== null) {
          plannedRoutes.value = [
            ...plannedRoutes.value.filter(
              (route) => route.sourceId !== sourceId,
            ),
            ...routes,
          ];
          return;
        }
        plannedRoutes.value = routes;
      } catch {
        // La ruta visible anterior se conserva si esta carga auxiliar falla.
      }
    }

    async function selectTask(taskId: string): Promise<void> {
      selectedTaskId.value = taskId;
      panelMode.value = "view";
      detailError.value = null;
      detail.value = null;
      const requestId = ++detailRequestId;
      loadingDetail.value = true;
      try {
        const loadedDetail = await tareasSeguimientoService.loadDetail(taskId);
        if (requestId !== detailRequestId) return;
        if (loadedDetail.id !== selectedTaskId.value) {
          detailError.value =
            "El detalle recibido no corresponde a la tarea seleccionada.";
          return;
        }
        detail.value = loadedDetail;
      } catch (error) {
        if (requestId === detailRequestId)
          detailError.value = toErrorMessage(
            error,
            "No se pudo cargar el detalle de la tarea.",
          );
      } finally {
        if (requestId === detailRequestId) loadingDetail.value = false;
      }
    }

    function closeDetail(): void {
      detailRequestId++;
      selectedTaskId.value = null;
      detail.value = null;
      detailError.value = null;
      panelMode.value = "closed";
    }

    function setFilters(next: Partial<TareasSeguimientoFilters>): void {
      filters.value = {
        ...filters.value,
        ...next,
        scheduledDate:
          next.scheduledDate ||
          filters.value.scheduledDate ||
          getSeguimientoToday(),
      };
      void syncTrackerLocations();
    }
    function setMapReady(): void {
      mapStatus.value = "ready";
      mapError.value = null;
    }
    function setMapError(error: unknown): void {
      mapStatus.value = "error";
      mapError.value = toErrorMessage(error, "No se pudo cargar el mapa.");
    }
    function toggleMapTool(tool: SeguimientoMapToolState["tool"]): void {
      mapTools.value = mapTools.value.map((item) =>
        item.tool === tool ? { ...item, enabled: !item.enabled } : item,
      );
      void syncTrackerLocations();
    }
    async function clearTrackerLocationSubscriptions(): Promise<void> {
      await trackerLocationService.clear();
    }

    return {
      filters,
      tasks,
      trackers,
      trackerLoadObservations,
      trackerLocationError,
      catalog,
      geography,
      mapConfiguration,
      selectedTaskId,
      selectedTask,
      visibleTasks,
      detail,
      panelMode,
      mapStatus,
      mapError,
      mapTools,
      plannedRoutes,
      loadingInitial,
      loadingDetail,
      initialError,
      detailError,
      loadWorkspace,
      refreshPlannedRoutes,
      selectTask,
      closeDetail,
      setFilters,
      setMapReady,
      setMapError,
      toggleMapTool,
      clearTrackerLocationSubscriptions,
    };
  },
);
