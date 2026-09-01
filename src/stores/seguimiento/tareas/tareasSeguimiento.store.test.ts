import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const loadWorkspaceContext = vi.hoisted(() => vi.fn());
const loadTasks = vi.hoisted(() => vi.fn());
const loadPlannedRoutes = vi.hoisted(() => vi.fn());
const realtimeSync = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const realtimeClear = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("./tareasSeguimiento.service", () => ({
  tareasSeguimientoService: {
    loadWorkspaceContext,
    loadTasks,
    loadPlannedRoutes,
  },
}));
vi.mock("@/seguimiento/shared/trackers/trackerCurrentLocation.service", () => ({
  trackerCurrentLocationService: { load: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/seguimiento/shared/trackers/trackerLocation.service", () => ({
  trackerLocationService: { sync: vi.fn(), clear: vi.fn() },
}));
vi.mock("@/seguimiento/shared/tareas/tareaRealtime.service", () => ({
  tareaRealtimeService: { sync: realtimeSync, clear: realtimeClear },
}));

import { useTareasSeguimientoStore } from "./tareasSeguimiento.store";

const context = {
  trackers: [],
  trackerLoadObservations: [],
  catalog: { areas: [] },
  geography: [],
  mapConfiguration: null,
};
const listedTask = {
  id: "task-1",
  type: "finca" as const,
  status: "pendiente" as const,
  areaId: "area-1",
  assignedUserId: null,
  locationId: null,
  scheduledDate: "2026-09-01",
  instructions: "Revisar lote",
  priorityId: null,
  estimatedMinutes: null,
  trackerId: null,
  sourceId: null,
  trackerLabel: null,
  elapsedSeconds: 0,
  currentVisitSeconds: 0,
  hasOpenVisit: false,
  routePoint: null,
  routeOrder: null,
};

describe("carga de rutas planificadas", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    loadWorkspaceContext.mockReset();
    loadTasks.mockReset();
    loadPlannedRoutes.mockReset();
    realtimeSync.mockClear();
    realtimeClear.mockClear();
    loadWorkspaceContext.mockResolvedValue(context);
    loadTasks.mockResolvedValue({ tasks: [], trackers: [] });
    loadPlannedRoutes.mockResolvedValue([]);
  });

  it("carga tareas, pero no rutas, sin filtros suficientes para las rutas", async () => {
    const store = useTareasSeguimientoStore();

    await store.loadWorkspace();

    expect(loadTasks).toHaveBeenCalledTimes(1);
    expect(loadPlannedRoutes).not.toHaveBeenCalled();
  });

  it("carga las rutas como información no bloqueante al completar filtros", async () => {
    const store = useTareasSeguimientoStore();
    store.setFilters({
      areaId: "area-1",
      scheduledDate: "2026-09-01",
      sourceId: 10319800,
    });

    await store.loadWorkspace();
    await Promise.resolve();

    expect(loadTasks).toHaveBeenCalledTimes(1);
    expect(loadPlannedRoutes).toHaveBeenCalledWith({
      p_area_id: "area-1",
      p_fecha: "2026-09-01",
      p_usuario_id: null,
      p_source_id: 10319800,
    });
    expect(store.loadingInitial).toBe(false);
  });

  it("sincroniza Broadcast por las áreas visibles tras cargar el workspace", async () => {
    loadWorkspaceContext.mockResolvedValue({
      ...context,
      catalog: {
        areas: [{ id: "area-1", label: "Área 1", workers: [], companions: [] }],
      },
    });
    const store = useTareasSeguimientoStore();

    await store.loadWorkspace();
    await Promise.resolve();

    expect(realtimeSync).toHaveBeenCalledWith(
      ["area-1"],
      expect.objectContaining({
        onPermanencia: expect.any(Function),
        onObservacion: expect.any(Function),
      }),
    );
  });

  it("parchea la card sin recargar el listado cuando inicia una permanencia", async () => {
    loadWorkspaceContext.mockResolvedValue({
      ...context,
      catalog: {
        areas: [{ id: "area-1", label: "Área 1", workers: [], companions: [] }],
      },
    });
    loadTasks.mockResolvedValue({ tasks: [listedTask], trackers: [] });
    const store = useTareasSeguimientoStore();

    await store.loadWorkspace();
    const handlers = realtimeSync.mock.calls[0]?.[1];
    handlers.onPermanencia({
      tipo: "permanencia_iniciada",
      alcance: "tarea",
      tarea_id: "task-1",
      area_id: "area-1",
      tipo_tarea: "finca",
      segundos_totales: 120,
      segundos_permanencia_actual: 120,
      visita_abierta: true,
      estado_operativo_codigo: "en_ubicacion",
    });

    expect(store.tasks[0]).toMatchObject({
      elapsedSeconds: 120,
      currentVisitSeconds: 120,
      hasOpenVisit: true,
      status: "activa",
    });
  });

  it("inicia el badge vivo para una visita abierta recibida desde el listado", async () => {
    loadTasks.mockResolvedValue({
      tasks: [
        {
          ...listedTask,
          id: "active-task",
          currentVisitSeconds: 3_307,
          elapsedSeconds: 3_307,
          hasOpenVisit: true,
        },
      ],
      trackers: [],
    });
    const store = useTareasSeguimientoStore();

    await store.loadWorkspace();

    expect(store.liveTaskPermanences).toMatchObject({
      "active-task": { seconds: 3_307 },
    });
    expect(store.liveBadgeNow).toEqual(expect.any(Number));
    await store.clearTrackerLocationSubscriptions();
  });

  it("prioriza las tareas visitadas por su visita más reciente y conserva el orden de las no visitadas", () => {
    const store = useTareasSeguimientoStore();
    store.tasks = [
      { ...listedTask, id: "not-visited-first" },
      {
        ...listedTask,
        id: "older-visit",
        lastVisitedAt: "2026-09-01T10:00:00Z",
      },
      {
        ...listedTask,
        id: "latest-visit",
        lastVisitedAt: "2026-09-01T11:00:00Z",
      },
      { ...listedTask, id: "not-visited-second" },
    ];

    expect(store.visibleTasks.map((task) => task.id)).toEqual([
      "latest-visit",
      "older-visit",
      "not-visited-first",
      "not-visited-second",
    ]);
  });
});
