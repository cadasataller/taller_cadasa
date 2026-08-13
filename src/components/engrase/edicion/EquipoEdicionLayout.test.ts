import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoEdicionHeader from "./EquipoEdicionHeader.vue";
import EquipoEdicionShell from "./EquipoEdicionShell.vue";
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
        modelOptions: [],
        isDuplicateTipoEquipo: () => false,
      },
      slots: { imagen: '<div data-test="imagen-integrada" />' },
      global: {
        stubs: {
          EquipoTipoField: FieldStub,
          EquipoModeloField: FieldStub,
          EquipoEtapasField: FieldStub,
        },
      },
    });

    expect(wrapper.get("h2").text()).toBe("Datos del equipo");
    expect(wrapper.find('[data-test="imagen-integrada"]').exists()).toBe(true);
    await wrapper.get('button[aria-pressed="false"]').trigger("click");
    expect(wrapper.emitted("updateEstado")).toEqual([["descartado"]]);
  });

  it("muestra una sección por pestaña e indica los cambios pendientes", async () => {
    const wrapper = mount(EquipoEdicionShell, {
      props: {
        draft,
        activeTab: "datos",
        filtersCount: 2,
        oilsCount: 1,
        hasDataChanges: false,
        hasFilterChanges: true,
        hasOilChanges: false,
        hasDataErrors: false,
        hasFilterErrors: true,
        hasOilErrors: false,
        canSave: true,
        saving: false,
        message: null,
        messageKind: null,
        validationCount: 0,
        movePending: false,
      },
      slots: {
        datos: '<div data-test="datos">Datos</div>',
        filtros: '<div data-test="filtros">Filtros</div>',
        aceites: '<div data-test="aceites">Aceites</div>',
      },
      global: { stubs: { EquipoEdicionHeader: true, EquipoEdicionFooter: true } },
    });

    expect(wrapper.get("[role=tab][aria-selected=true]").text()).toContain("Datos del equipo");
    expect(wrapper.get("#panel-datos").isVisible()).toBe(true);
    expect(wrapper.get("#panel-filtros").isVisible()).toBe(false);
    expect(wrapper.get("#tab-filtros").text()).toContain("Errores por corregir");

    await wrapper.get("#tab-filtros").trigger("click");
    expect(wrapper.emitted("updateActiveTab")).toEqual([["filtros"]]);
  });
});
