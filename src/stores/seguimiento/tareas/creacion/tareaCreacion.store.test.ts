import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSeguimientoTareaCreacion } from "@/composables/seguimiento/useSeguimientoTareaCreacion";
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

  it("rechaza con Zod un orden superior a la siguiente posición disponible", () => {
    const store = useTareaCreacionStore();
    store.open("area-1");
    store.setMaximumRouteOrder(3);
    store.updateRoute(4);

    expect(store.submitBlockReasons).toContain(
      "El orden de ruta no puede ser mayor que 3.",
    );
    expect(store.draft.validBlocks.route).toBe(false);
    expect(store.validationErrors).toEqual([
      {
        field: "route",
        message: "El orden de ruta no puede ser mayor que 3.",
      },
    ]);
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

  it.each([
    {
      type: "zona" as const,
      locationId: null,
      controlLine: null,
    },
    {
      type: "finca" as const,
      locationId: "farm-1",
      controlLine: {
        type: "MultiLineString" as const,
        coordinates: [
          [
            [-80.5, 8.5],
            [-80.49, 8.51],
          ],
        ],
      },
    },
  ])(
    "habilita Guardar para una tarea $type completa",
    ({ type, locationId, controlLine }) => {
      const store = useTareaCreacionStore();
      const { canSubmitCreate } = useSeguimientoTareaCreacion();
      store.open("area-1", "2026-08-31");
      store.updateType(type);
      store.updateWorker({ id: "worker-1", label: "Trabajador" });
      store.updateTracker({ id: 1, sourceId: 2, label: "Equipo" });
      store.updateDetails({ instructions: "Inspeccionar el área" });
      store.updateGeometry({
        locationId,
        routePoint: { latitude: 8.5, longitude: -80.5 },
        controlLine,
        controlZones: [
          {
            type: "MultiPolygon",
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
          },
        ],
      });
      store.updateRoute(1);

      expect(store.canSubmit).toBe(true);
      expect(canSubmitCreate.value).toBe(true);
    },
  );

  it("expone todos los motivos que bloquean Guardar", () => {
    const store = useTareaCreacionStore();
    store.open("area-1", "2026-08-31");

    expect(store.submitBlockReasons).toEqual([
      "Selecciona un tipo de tarea.",
      "Selecciona un trabajador válido.",
      "Selecciona un equipo válido.",
      "Escribe las indicaciones de la tarea.",
      "Selecciona un punto de enrutado.",
    ]);
  });

  it("detalla los campos pendientes de una tarea zona", () => {
    const store = useTareaCreacionStore();
    store.open("area-1", "2026-08-31");
    store.updateType("zona");

    expect(store.revealSubmitRequirements()).toEqual([
      { field: "worker", message: "Selecciona un trabajador válido." },
      { field: "tracker", message: "Selecciona un equipo válido." },
      {
        field: "instructions",
        message: "Escribe las indicaciones de la tarea.",
      },
      {
        field: "routePoint",
        message: "Selecciona un punto de enrutado.",
      },
      {
        field: "controlZone",
        message: "Dibuja el polígono de control de la zona.",
      },
    ]);
  });
});
