import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoCreacionFooter from "./EquipoCreacionFooter.vue";

const props = {
  step: 3,
  nextDisabled: false,
  creating: false,
  imageSaving: false,
  canSaveImage: false,
  canFinish: false,
};

describe("EquipoCreacionFooter", () => {
  it("mantiene Cancelar creación a la izquierda durante el borrador", async () => {
    const wrapper = mount(EquipoCreacionFooter, { props });
    const cancel = wrapper.get("button:first-child");

    expect(cancel.text()).toContain("Cancelar creación");
    await cancel.trigger("click");
    expect(wrapper.emitted("cancel")).toHaveLength(1);
  });

  it("no muestra Cancelar creación después de crear el equipo", () => {
    const wrapper = mount(EquipoCreacionFooter, { props: { ...props, step: 5 } });

    expect(wrapper.text()).not.toContain("Cancelar creación");
  });
});
