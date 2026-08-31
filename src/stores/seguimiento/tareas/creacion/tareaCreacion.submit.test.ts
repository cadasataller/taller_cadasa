import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const create = vi.hoisted(() => vi.fn());
vi.mock("./tareaCreacion.service", () => ({
  tareaCreacionService: { create },
}));

import { useTareaCreacionStore } from "./tareaCreacion.store";

const completeFarmDraft = () => {
  const store = useTareaCreacionStore();
  store.open("area-1");
  store.updateType("finca");
  store.updateWorker({ id: "worker-1", label: "Trabajador" });
  store.updateTracker({ id: 1, sourceId: 2, label: "Tracker" });
  store.updateDetails({
    instructions: "Inspeccionar cultivo",
    scheduledDate: "2026-08-26",
    priorityId: 1,
    estimatedMinutes: 60,
  });
  store.updateGeometry({
    locationId: "farm-1",
    routePoint: { latitude: 8.43, longitude: -82.5 },
    controlLine: {
      type: "MultiLineString",
      coordinates: [
        [
          [-82.5, 8.43],
          [-82.51, 8.44],
        ],
      ],
    },
    controlZones: [
      {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-82.5, 8.43],
              [-82.51, 8.44],
              [-82.52, 8.43],
              [-82.5, 8.43],
            ],
          ],
        ],
      },
    ],
  });
  return store;
};

describe("submit de creación", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    create.mockReset();
  });

  it("conserva el borrador y expone el error remoto para corregirlo", async () => {
    const store = completeFarmDraft();
    create.mockRejectedValue({
      message: "La línea de control no es válida.",
      code: "P0001",
    });

    await expect(store.submit()).resolves.toBeNull();
    expect(store.isPanelOpen).toBe(true);
    expect(store.draft.details.instructions).toBe("Inspeccionar cultivo");
    expect(store.remoteError?.message).toContain("línea de control");
    expect(store.flowState).toBe("error");
  });

  it("cierra únicamente después de recibir éxito del RPC", async () => {
    const store = completeFarmDraft();
    create.mockResolvedValue({ tarea_id: "task-1" });

    expect(store.canSubmit).toBe(true);

    await expect(store.submit()).resolves.toEqual({ tarea_id: "task-1" });
    expect(store.isPanelOpen).toBe(false);
    expect(store.flowState).toBe("success");
  });
});
