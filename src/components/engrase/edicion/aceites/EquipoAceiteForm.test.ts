import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoAceiteForm from "./EquipoAceiteForm.vue";

const CatalogSelectStub = defineComponent({
  name: "EquipoCatalogSelect",
  emits: ["tag", "update:modelValue"],
  template: "<div />",
});

describe("formulario de aceites", () => {
  it("reutiliza un nombre temporal si el selector emite el mismo tag más de una vez", async () => {
    const wrapper = mount(EquipoAceiteForm, {
      props: {
        mode: { kind: "add" },
        sistemas: [],
        aceites: [],
        hasSystemConflict: () => false,
      },
      global: { stubs: { EquipoCatalogSelect: CatalogSelectStub } },
    });
    const selects = wrapper.findAllComponents(CatalogSelectStub);

    selects[0]!.vm.$emit("tag", "Sistema al azar");
    await nextTick();
    selects[0]!.vm.$emit("tag", "SISTEMA AL AZAR");
    selects[1]!.vm.$emit("tag", "Aceite al azar");
    await nextTick();
    selects[1]!.vm.$emit("tag", "ACEITE AL AZAR");
    await nextTick();

    expect(wrapper.text()).not.toContain("Ya existe un");
    expect(wrapper.text().match(/Pendiente de creación/g)).toHaveLength(2);
  });
});
