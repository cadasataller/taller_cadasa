import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoEdicionHeader from "./EquipoEdicionHeader.vue";
import EquipoDatosForm from "./datos/EquipoDatosForm.vue";
import type {
  AuxiliaresEdicionEquipo,
  EquipoEdicionDraft,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";

const draft: EquipoEdicionDraft = {
  equipo: {
    id: 123,
    codigo: "422017",
    tipoEquipoId: 5,
    tipoEquipo: "Combinadas",
    subtipo: "Cosechadora 9900",
    estado: "activo",
  },
  etapas: [{ id: 1, nombre: "Cultivo" }],
  filtros: [],
  aceites: [],
  imagen: {
    mainStoragePath: null,
    tieneImagenMain: false,
    imagenActualizadaEn: null,
  },
  tipoEquipoReferencia: {
    estado: "existente",
    id: 5,
    tempId: null,
    nombre: "Combinadas",
  },
  operaciones: {
    datos: "existente",
    etapas: "existente",
    filtros: "existente",
    aceites: "existente",
  },
};

const auxiliares: AuxiliaresEdicionEquipo = {
  tiposEquipo: [],
  etapas: draft.etapas,
  tiposFiltro: [],
  sistemasAceite: [],
  aceites: [],
};

describe("cabecera y datos del editor", () => {
  it("resume código, tipo, modelo y estado en la barra superior", () => {
    const wrapper = mount(EquipoEdicionHeader, { props: { draft } });

    expect(wrapper.text()).toContain("422017");
    expect(wrapper.text()).toContain("Combinadas");
    expect(wrapper.text()).toContain("Cosechadora 9900");
    expect(wrapper.text()).toContain("activo");
  });

  it("integra la imagen y mantiene editable el estado", async () => {
    const FieldStub = defineComponent({ template: "<div />" });
    const wrapper = mount(EquipoDatosForm, {
      props: {
        draft,
        auxiliares,
        isDuplicateTipoEquipo: () => false,
      },
      slots: { imagen: '<div data-test="imagen-integrada" />' },
      global: {
        stubs: {
          EquipoTipoField: FieldStub,
          EquipoEtapasField: FieldStub,
        },
      },
    });

    expect(wrapper.get("h2").text()).toBe("1. Datos del equipo");
    expect(wrapper.find('[data-test="imagen-integrada"]').exists()).toBe(true);
    await wrapper.get('button[aria-pressed="false"]').trigger("click");
    expect(wrapper.emitted("updateEstado")).toEqual([["descartado"]]);
  });
});
