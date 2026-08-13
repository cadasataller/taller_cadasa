import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoModeloField from "./EquipoModeloField.vue";

const options = [
  {
    key: "bus urbano",
    value: "BUS URBANO",
    tiposEquipo: ["Buses"],
    esActual: true,
    correspondeAlTipoActual: true,
  },
  {
    key: "fh",
    value: "FH",
    tiposEquipo: ["Camiones"],
    esActual: false,
    correspondeAlTipoActual: false,
  },
];

describe("EquipoModeloField", () => {
  it("distingue el modelo actual y muestra tipos sin cantidades", async () => {
    const wrapper = mount(EquipoModeloField, {
      props: { modelValue: "Bus urbano", options },
    });

    await wrapper.get("input").trigger("focus");

    expect(wrapper.text()).toContain("Modelo actual");
    expect(wrapper.text()).toContain("Buses");
    expect(wrapper.text()).toContain("Camiones");
    expect(wrapper.text()).not.toContain("equipos");
  });

  it("crea el modelo escrito en mayúsculas", async () => {
    const wrapper = mount(EquipoModeloField, {
      props: { modelValue: "BUS URBANO", options },
    });
    const input = wrapper.get("input");
    await input.trigger("focus");
    await input.setValue("  modelo   especial ");

    expect(wrapper.text()).toContain("Crear “MODELO ESPECIAL”");
    await wrapper.get(".multiselect__option").trigger("click");

    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      "MODELO ESPECIAL",
    ]);
  });
});
