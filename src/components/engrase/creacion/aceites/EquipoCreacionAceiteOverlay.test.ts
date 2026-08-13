import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoCreacionAceiteOverlay from "./EquipoCreacionAceiteOverlay.vue";

const FormStub = defineComponent({
  name: "EquipoCreacionAceiteForm",
  emits: ["changed", "confirm"],
  template: "<button type='button' data-test='confirm' @click=\"$emit('confirm', { estado: 'existente', id: 1, tempId: null, nombre: 'Motor' }, { estado: 'existente', id: 2, tempId: null, nombre: '15W-40' })\">Confirmar</button>",
});

describe("overlay de aceites de creación", () => {
  it("reenvía ambas referencias confirmadas por el formulario", async () => {
    const wrapper = mount(EquipoCreacionAceiteOverlay, {
      props: {
        mode: { kind: "add", dirty: false, error: null },
        sistemas: [],
        aceites: [],
        crearSistema: () => null,
        crearAceite: () => null,
        hasSystemConflict: () => false,
        error: null,
      },
      global: { stubs: { EquipoCreacionAceiteForm: FormStub, Teleport: true } },
    });
    await wrapper.get("[data-test='confirm']").trigger("click");
    await nextTick();
    expect(wrapper.emitted("confirm")?.[0]).toEqual([
      { estado: "existente", id: 1, tempId: null, nombre: "Motor" },
      { estado: "existente", id: 2, tempId: null, nombre: "15W-40" },
    ]);
  });
});
