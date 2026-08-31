import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useTareaCreacionStore } from "./tareaCreacion.store";

describe("useTareaCreacionStore", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("abre un borrador aislado y pide confirmación al cerrarlo con cambios", () => {
    const store = useTareaCreacionStore();
    store.open("area-1");
    store.updateType("finca");

    expect(store.isPanelOpen).toBe(true);
    expect(store.flowState).toBe("editing");
    expect(store.hasUnsavedChanges).toBe(true);
    expect(store.requestClose()).toBe(false);
    expect(store.isDiscardConfirmationOpen).toBe(true);

    store.discard();
    expect(store.isPanelOpen).toBe(false);
    expect(store.flowState).toBe("idle");
  });

  it("mantiene los errores locales de Zod asociados a cada control", () => {
    const store = useTareaCreacionStore();
    store.open("area-1");
    store.updateType("zona");
    store.updateDetails({
      instructions: "Inspeccionar zona",
      scheduledDate: "2026-02-31",
    });

    expect(store.validationErrors).toEqual([]);
    expect(store.draft.validBlocks.details).toBe(false);
    expect(store.draft.validBlocks.geometry).toBe(false);
    expect(store.canSubmit).toBe(false);
  });

  it("muestra solo el primer campo pendiente y avanza según el orden del panel", async () => {
    const store = useTareaCreacionStore();
    store.open("area-1");

    await store.submit();
    expect(store.validationErrors).toEqual([
      { field: "type", message: "Selecciona un tipo de tarea." },
    ]);

    store.updateType("zona");
    expect(store.validationErrors).toEqual([]);

    store.reportSkippedField("instructions");
    expect(store.validationErrors).toEqual([
      { field: "worker", message: "Selecciona un trabajador válido." },
    ]);
  });

  it("pausa el wizard después de la zona inicial y exige una acción para abrir detalles o agregar otra zona", () => {
    const store = useTareaCreacionStore();
    const routePoint = { latitude: 8.5, longitude: -80.5 };
    const controlLine = {
      type: "MultiLineString" as const,
      coordinates: [
        [
          [-80.5, 8.5],
          [-80.49, 8.51],
        ],
      ],
    };
    const zone = {
      type: "MultiPolygon" as const,
      coordinates: [
        [
          [
            [-80.5, 8.5],
            [-80.49, 8.5],
            [-80.49, 8.51],
            [-80.5, 8.5],
          ],
        ],
      ],
    };

    store.openSpatial("area-1", "2026-08-31");
    expect(store.wizardStep).toBe("selecting-control-point");

    store.captureSpatialRoute(routePoint, controlLine);
    expect(store.wizardStep).toBe("drawing-initial-zone");

    store.completeSpatialSelection(
      "finca",
      "farm-1",
      zone,
      routePoint,
      controlLine,
      true,
    );
    expect(store.wizardStep).toBe("details-pending");
    expect(store.isPanelOpen).toBe(false);

    store.openDetails();
    expect(store.wizardStep).toBe("editing-details");
    expect(store.isPanelOpen).toBe(true);

    expect(store.startAdditionalControlZone()).toBe(true);
    expect(store.wizardStep).toBe("drawing-extra-zone");
    expect(store.isPanelOpen).toBe(false);

    store.finishAdditionalControlZone();
    expect(store.wizardStep).toBe("details-pending");
  });
});
