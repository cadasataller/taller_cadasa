import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import EquipoCreacionAceiteForm from "./EquipoCreacionAceiteForm.vue";

const CatalogSelectStub = defineComponent({
  name: "EquipoCatalogSelect",
  emits: ["tag", "update:modelValue"],
  template: "<div />",
});

const sistema = { estado: "existente" as const, id: 1, tempId: null, nombre: "Motor" };
const aceite = { estado: "existente" as const, id: 2, tempId: null, nombre: "15W-40" };

describe("formulario de aceites de creación", () => {
  it("confirma referencias existentes y delega la creación temporal al store", async () => {
    const crearSistema = vi.fn(() => sistema);
    const wrapper = mount(EquipoCreacionAceiteForm, {
      props: {
        mode: { kind: "add", dirty: false, error: null },
        sistemas: [sistema],
        aceites: [aceite],
        crearSistema,
        crearAceite: vi.fn(() => aceite),
        hasSystemConflict: () => false,
        error: null,
      },
      global: { stubs: { EquipoCatalogSelect: CatalogSelectStub } },
    });
    const selects = wrapper.findAllComponents(CatalogSelectStub);
    selects[0]!.vm.$emit("tag", " Motor ");
    selects[1]!.vm.$emit("update:modelValue", "existente-2");
    await nextTick();

    await wrapper.get("form").trigger("submit");

    expect(crearSistema).toHaveBeenCalledWith(" Motor ");
    expect(wrapper.emitted("confirm")?.[0]).toEqual([sistema, aceite]);
  });
});
