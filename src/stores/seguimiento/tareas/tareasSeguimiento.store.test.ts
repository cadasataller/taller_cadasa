import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const loadWorkspaceContext = vi.hoisted(() => vi.fn());
const loadTasks = vi.hoisted(() => vi.fn());
const loadPlannedRoutes = vi.hoisted(() => vi.fn());

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

import { useTareasSeguimientoStore } from "./tareasSeguimiento.store";

const context = {
  trackers: [],
  trackerLoadObservations: [],
  catalog: { areas: [] },
  geography: [],
  mapConfiguration: null,
};

describe("carga de rutas planificadas", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    loadWorkspaceContext.mockReset();
    loadTasks.mockReset();
    loadPlannedRoutes.mockReset();
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
});
