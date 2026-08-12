import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoTipoField from "./EquipoTipoField.vue";

describe("EquipoTipoField", () => {
  const props = {
    tipos: [{ id: 2, nombre: "Tractor", subtiposSugeridos: [] }],
    selected: {
      estado: "existente" as const,
      id: 2,
      nombre: "Tractor",
      tempId: null,
    },
    isDuplicate: () => false,
  };

  it("permite crear y seleccionar el tipo temporal escrito", async () => {
    const wrapper = mount(EquipoTipoField, { props });

    const input = wrapper.get("input");
    await input.trigger("focus");
    await input.setValue("Cosechadora");

    expect(wrapper.text()).toContain("Crear “Cosechadora” como tipo nuevo");
    await wrapper.get(".multiselect__option").trigger("click");

    expect(wrapper.emitted("create")?.[0]).toEqual(["Cosechadora"]);
  });

  it("no crea un tipo duplicado", async () => {
    const wrapper = mount(EquipoTipoField, {
      props: { ...props, isDuplicate: () => true },
    });

    const input = wrapper.get("input");
    await input.trigger("focus");
    await input.setValue("Excavadora");
    await wrapper.get(".multiselect__option").trigger("click");

    expect(wrapper.emitted("create")).toBeUndefined();
    expect(wrapper.text()).toContain("Ya existe un tipo de equipo");
  });
});
