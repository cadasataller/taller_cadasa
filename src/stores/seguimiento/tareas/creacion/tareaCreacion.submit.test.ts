import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const create = vi.hoisted(() => vi.fn());
const processPendingRoute = vi.hoisted(() => vi.fn());
vi.mock("./tareaCreacion.service", () => ({
  tareaCreacionService: { create, processPendingRoute },
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
    processPendingRoute.mockReset();
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
    create.mockResolvedValue({
      id: "task-1",
      requiere_procesar_ruta: false,
      solicitud_recalculo_ruta_id: null,
    });

    expect(store.canSubmit).toBe(true);

    await expect(store.submit()).resolves.toMatchObject({ id: "task-1" });
    expect(store.isPanelOpen).toBe(false);
    expect(store.flowState).toBe("success");
  });

  it("conserva el éxito de creación cuando falla el procesamiento de ruta", async () => {
    const store = completeFarmDraft();
    create.mockResolvedValue({
      id: "task-1",
      requiere_procesar_ruta: true,
      solicitud_recalculo_ruta_id: "request-1",
    });
    processPendingRoute.mockRejectedValue(
      new Error("OpenRouteService no disponible"),
    );

    await expect(store.submit()).resolves.toMatchObject({ id: "task-1" });

    expect(processPendingRoute).toHaveBeenCalledWith({
      solicitud_id: "request-1",
    });
    expect(store.flowState).toBe("success");
    expect(store.routeProcessingWarning).toBe(
      "La tarea fue creada correctamente, pero no se pudo actualizar la ruta.",
    );
  });
});
