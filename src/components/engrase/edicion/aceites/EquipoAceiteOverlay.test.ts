import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import EquipoAceiteOverlay from "./EquipoAceiteOverlay.vue";

const FormStub = defineComponent({
  name: "EquipoAceiteForm",
  emits: ["changed", "confirm"],
  template: '<button type="button" data-test="change" @click="$emit(\'changed\')">Cambiar</button>',
});

let activeWrapper: VueWrapper | null = null;
const mountOverlay = () => {
  activeWrapper = mount(EquipoAceiteOverlay, {
  attachTo: document.body,
  props: {
    mode: { kind: "add" },
    sistemas: [],
    aceites: [],
    hasSystemConflict: () => false,
  },
  global: { stubs: { EquipoAceiteForm: FormStub } },
  });
  return activeWrapper;
};

describe("overlay de aceites", () => {
  afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
  });

  it("cierra directamente cuando el formulario no cambió", async () => {
    const wrapper = mountOverlay();
    expect(
      document.querySelector("[data-equipo-overlay-scroll]"),
    ).not.toBeNull();
    await document.querySelector<HTMLButtonElement>('[aria-label="Cerrar"]')?.click();
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("usa una confirmación propia al cerrar con cambios", async () => {
    const wrapper = mountOverlay();
    document.querySelector<HTMLButtonElement>('[data-test="change"]')?.click();
    await nextTick();
    document.querySelector<HTMLButtonElement>('[aria-label="Cerrar"]')?.click();
    await nextTick();
    const dialog = document.querySelector<HTMLElement>('[role="alertdialog"]');
    expect(dialog?.textContent).toContain("Descartar cambios del aceite");
    expect(wrapper.emitted("close")).toBeUndefined();
    const continueButton = dialog?.querySelector<HTMLButtonElement>("button");
    expect(document.activeElement).toBe(continueButton);
    continueButton?.click();
    await nextTick();
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("descarta desde el diálogo sin invocar una ventana nativa", async () => {
    const wrapper = mountOverlay();
    document.querySelector<HTMLButtonElement>('[data-test="change"]')?.click();
    await nextTick();
    document.querySelector<HTMLButtonElement>('[aria-label="Cerrar"]')?.click();
    await nextTick();
    const buttons = document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button');
    buttons[1]?.click();
    await nextTick();
    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
