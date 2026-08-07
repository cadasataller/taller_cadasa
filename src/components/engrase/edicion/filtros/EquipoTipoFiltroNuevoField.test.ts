import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoTipoFiltroNuevoField from "./EquipoTipoFiltroNuevoField.vue";

describe("EquipoTipoFiltroNuevoField", () => {
  it("filtra el catálogo y permite elegir la opción temporal escrita", async () => {
    const wrapper = mount(EquipoTipoFiltroNuevoField, {
      props: {
        tipos: [{ id: 2, nombre: "Aire", tiposEquipoQueLoUsan: [] }],
        selected: null,
        isDuplicate: () => false,
      },
    });

    const input = wrapper.get("input");
    await input.trigger("focus");
    await input.setValue("Combustible");

    expect(wrapper.text()).toContain("Crear “Combustible” como tipo nuevo");
    await wrapper.get(".multiselect__option").trigger("click");

    expect(wrapper.emitted("select")?.[0]?.[0]).toMatchObject({
      estado: "nuevo",
      id: null,
      nombre: "Combustible",
    });
  });

  it("muestra el badge compacto para un tipo sugerido", async () => {
    const wrapper = mount(EquipoTipoFiltroNuevoField, {
      props: {
        tipos: [{ id: 2, nombre: "Aire", tiposEquipoQueLoUsan: [] }],
        selected: null,
        suggestedTypeIds: [2],
        isDuplicate: () => false,
      },
    });

    await wrapper.get("input").trigger("focus");

    expect(wrapper.text()).toContain("Sugerido");
  });
});
