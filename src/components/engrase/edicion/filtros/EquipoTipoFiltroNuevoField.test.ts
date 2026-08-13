import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
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

  it("distingue el tipo asignado al código buscado de otro tipo ocupado", async () => {
    const wrapper = mount(EquipoTipoFiltroNuevoField, {
      props: {
        tipos: [
          { id: 1, nombre: "Aceite", tiposEquipoQueLoUsan: [] },
          { id: 2, nombre: "Aire", tiposEquipoQueLoUsan: [] },
          { id: 3, nombre: "Hidráulico", tiposEquipoQueLoUsan: [] },
        ],
        selected: null,
        disabledTypeIds: [1, 2],
        assignedTypeCodes: { 1: "B7577", 2: "AF-100" },
        searchedCode: "b7577",
        suggestedTypeIds: [1, 2, 3],
        isDuplicate: () => false,
      },
    });

    await wrapper.get("input").trigger("focus");

    const options = wrapper.findAll(".multiselect__option");
    expect(options[0]?.text()).toContain("Asignado a este código");
    expect(options[0]?.text()).not.toContain("Sugerido");
    expect(options[0]?.classes()).toContain("multiselect__option--disabled");
    expect(options[1]?.text()).not.toContain("Asignado a este código");
    expect(options[1]?.text()).toContain("Sugerido");
    expect(options[1]?.classes()).toContain("multiselect__option--disabled");
    expect(options[2]?.classes()).not.toContain("multiselect__option--disabled");
  });

  it("lleva el selector al área visible del bottom sheet antes de mostrar opciones", async () => {
    const matchMediaOriginal = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    const scrollContainer = document.createElement("div");
    scrollContainer.dataset.equipoOverlayScroll = "";
    scrollContainer.scrollTop = 20;
    scrollContainer.getBoundingClientRect = () =>
      ({ top: 100 } as DOMRect);
    document.body.appendChild(scrollContainer);
    const wrapper = mount(EquipoTipoFiltroNuevoField, {
      attachTo: scrollContainer,
      props: {
        tipos: [{ id: 2, nombre: "Aire", tiposEquipoQueLoUsan: [] }],
        selected: null,
        isDuplicate: () => false,
      },
    });
    wrapper.get(".multiselect").element.getBoundingClientRect = () =>
      ({ top: 260 } as DOMRect);

    await wrapper.get("input").trigger("focus");
    await flushPromises();

    expect(
      wrapper.findComponent({ name: "vue-multiselect" }).props("openDirection"),
    ).toBe("below");
    expect(scrollContainer.scrollTop).toBe(172);
    wrapper.unmount();
    scrollContainer.remove();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMediaOriginal,
    });
  });
});
