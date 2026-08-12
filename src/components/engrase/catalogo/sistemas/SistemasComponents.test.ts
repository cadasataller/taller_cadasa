import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import SistemaUpdateConfirmDialog from "./SistemaUpdateConfirmDialog.vue";
import type { CatalogoSistemaItem } from "@/stores/dbequipos/engrase/catalogo/sistemasCatalogo.types";

const item: CatalogoSistemaItem = {
  id: 7,
  nombre: "Motor",
  activo: true,
  creadoEn: null,
  actualizadoEn: null,
  aceites: [],
  impacto: {
    totalEquipos: 18,
    totalAsignaciones: 23,
    tiposEquipo: [{ id: 1, nombre: "TRACTORES", cantidadEquipos: 7 }],
  },
};

afterEach(() => {
  document.body.innerHTML = "";
  document.body.style.overflow = "";
});

describe("componentes del catálogo de sistemas", () => {
  it("mantiene el resumen de equipos cerrado inicialmente", () => {
    const wrapper = mount(SistemaUpdateConfirmDialog, {
      props: {
        original: item,
        draft: { id: 7, nombre: "Motor principal", activo: true },
        saving: false,
      },
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.get("details").attributes("open")).toBeUndefined();
    expect(wrapper.get("summary").text()).toContain("Resumen de equipos");
    expect(wrapper.get("summary").text()).toContain("18");
    wrapper.unmount();
  });
});
