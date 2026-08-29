import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import {
  createInitialTareasSeguimientoFilters,
  toErrorMessage,
} from "./tareasSeguimiento.helpers";
import { tareasSeguimientoService } from "./tareasSeguimiento.service";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import type {
  SeguimientoMapStatus,
  SeguimientoMapToolState,
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
    const selectedTaskId = shallowRef<string | null>(null);
    const detail = ref<TareaSeguimientoDetail | null>(null);
    const panelMode = shallowRef<"closed" | "view">("closed");
    const mapStatus = shallowRef<SeguimientoMapStatus>("idle");
    const mapError = shallowRef<string | null>(null);
    const mapTools = ref<SeguimientoMapToolState[]>(initialMapTools());
    const loadingInitial = shallowRef(false);
    const loadingDetail = shallowRef(false);
    const initialError = shallowRef<string | null>(null);
    const detailError = shallowRef<string | null>(null);
    let initialRequest: Promise<void> | null = null;
    let detailRequestId = 0;

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

    async function loadWorkspace(force = false): Promise<void> {
      if (initialRequest && !force) return initialRequest;
      initialRequest = (async () => {
        loadingInitial.value = true;
        initialError.value = null;
        try {
          const workspace = await tareasSeguimientoService.loadWorkspace(
            filters.value,
          );
          tasks.value = workspace.tasks;
          trackers.value = workspace.trackers;
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

    async function selectTask(taskId: string): Promise<void> {
      selectedTaskId.value = taskId;
      panelMode.value = "view";
      detailError.value = null;
      detail.value = null;
      const requestId = ++detailRequestId;
      loadingDetail.value = true;
      try {
        detail.value = await tareasSeguimientoService.loadDetail(taskId);
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
      filters.value = { ...filters.value, ...next };
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
    }

    return {
      filters,
      tasks,
      trackers,
      selectedTaskId,
      selectedTask,
      visibleTasks,
      detail,
      panelMode,
      mapStatus,
      mapError,
      mapTools,
      loadingInitial,
      loadingDetail,
      initialError,
      detailError,
      loadWorkspace,
      selectTask,
      closeDetail,
      setFilters,
      setMapReady,
      setMapError,
      toggleMapTool,
    };
  },
);
