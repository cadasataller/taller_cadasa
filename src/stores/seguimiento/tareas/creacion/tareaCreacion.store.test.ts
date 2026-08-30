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

  it("mantiene los errores locales en Zod por bloque", () => {
    const store = useTareaCreacionStore();
    store.open("area-1");
    store.updateType("zona");
    store.updateDetails({
      instructions: "Inspeccionar zona",
      scheduledDate: "2026-02-31",
    });

    expect(store.validationErrors.map((error) => error.field)).toContain(
      "details",
    );
    expect(store.draft.validBlocks.details).toBe(false);
    expect(store.draft.validBlocks.geometry).toBe(false);
  });
});
