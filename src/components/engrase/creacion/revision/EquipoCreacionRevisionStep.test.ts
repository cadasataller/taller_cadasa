import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoCreacionRevisionStep from "./EquipoCreacionRevisionStep.vue";
import type { CrearEquipoDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";

const draft: CrearEquipoDraft = {
  datos: {
    codigo: "23434",
    tipoEquipo: {
      estado: "existente",
      id: 7,
      tempId: null,
      nombre: "Camecos",
      subtiposSugeridos: [],
    },
    subtipo: "BUS",
    etapas: [{ id: 3, nombre: "ZAFRA" }],
    estado: "activo",
  },
  filtros: [{
    draftId: "filter-1",
    tipoFiltro: { estado: "existente", id: 5, tempId: null, nombre: "Filtro de aceite 1" },
    filtro: { estado: "existente", id: 10, tempId: null, codigo: "LFP805", estaEnListaCompras: true },
    cantidad: 1,
  }],
  aceites: [{
    draftId: "oil-1",
    sistema: { estado: "existente", id: 4, tempId: null, nombre: "Motor" },
    aceite: { estado: "existente", id: 6, tempId: null, nombre: "15W40" },
  }],
  validacionCodigo: { estado: "valido", codigo: "23434" },
  equipoCreado: null,
};

describe("EquipoCreacionRevisionStep", () => {
  it("muestra toda la configuración del borrador antes de crear", () => {
    const wrapper = mount(EquipoCreacionRevisionStep, {
      props: { draft, errors: [], creating: false },
    });

    expect(wrapper.text()).toContain("1 etapa · 1 filtro · 1 aceite");
    expect(wrapper.text()).toContain("Filtro de aceite 1");
    expect(wrapper.text()).toContain("LFP805");
    expect(wrapper.text()).toContain("En lista de compras");
    expect(wrapper.text()).toContain("Motor");
    expect(wrapper.text()).toContain("15W40");
  });

  it("presenta aceites vacíos como opcionales y permite volver a cada sección", async () => {
    const wrapper = mount(EquipoCreacionRevisionStep, {
      props: { draft: { ...draft, aceites: [] }, errors: [], creating: false },
    });

    expect(wrapper.text()).toContain("Sin aceites asociados — esta sección es opcional.");
    const buttons = wrapper.findAll("button");
    await buttons[0].trigger("click");
    await buttons[1].trigger("click");
    await buttons[2].trigger("click");

    expect(wrapper.emitted("edit")?.map(([step]) => step)).toEqual([1, 2, 3]);
  });
});
