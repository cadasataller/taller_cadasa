import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import TipoFiltroChangeSummary from "./TipoFiltroChangeSummary.vue";
import TipoFiltroDetailDrawer from "./TipoFiltroDetailDrawer.vue";
import TipoFiltroForm from "./TipoFiltroForm.vue";
import TipoFiltroMobileCard from "./TipoFiltroMobileCard.vue";
import TipoFiltroUpdateConfirmDialog from "./TipoFiltroUpdateConfirmDialog.vue";
import TiposFiltroTable from "./TiposFiltroTable.vue";
import TiposFiltroToolbar from "./TiposFiltroToolbar.vue";
import type { CatalogoTipoFiltroItem } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

const item: CatalogoTipoFiltroItem = {
  id: 7,
  nombre: "Aire",
  activo: true,
  creadoEn: null,
  actualizadoEn: null,
  impacto: {
    totalEquipos: 18,
    totalAsignaciones: 20,
    tiposEquipo: [{ id: 1, nombre: "TRACTORES", cantidadEquipos: 7 }],
  },
};

afterEach(() => {
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  });

describe("componentes del catálogo de tipos de filtro", () => {
  it("la toolbar emite búsqueda, estado, limpieza y creación", async () => {
    const wrapper = mount(TiposFiltroToolbar, {
      props: { busqueda: "", estado: "activos", canClear: true },
    });

    await wrapper.get("input").setValue("aire");
    await wrapper.get("select").setValue("desactivados");
    await wrapper.get('[aria-label="Limpiar filtros"]').trigger("click");
    await wrapper.get("button.bg-main").trigger("click");

    expect(wrapper.emitted("updateBusqueda")?.[0]).toEqual(["aire"]);
    expect(wrapper.emitted("updateEstado")?.[0]).toEqual(["desactivados"]);
    expect(wrapper.emitted("clear")).toHaveLength(1);
    expect(wrapper.emitted("create")).toHaveLength(1);
  });

  it("la tabla anuncia orden y permite seleccionar con teclado", async () => {
    const wrapper = mount(TiposFiltroTable, {
      props: {
        items: [item],
        selectedId: null,
        sortKey: "nombre",
        sortDirection: "asc",
      },
    });

    expect(wrapper.get("th[aria-sort='ascending']").text()).toContain("Nombre");
    expect(wrapper.find("svg.lucide-wind").exists()).toBe(true);
    await wrapper.get("tbody tr").trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("select")?.[0]).toEqual([item]);
    await wrapper.get("thead button").trigger("click");
    expect(wrapper.emitted("sort")?.[0]).toEqual(["nombre"]);
  });

  it("la card mobile usa el icono derivado del nombre", () => {
    const wrapper = mount(TipoFiltroMobileCard, {
      props: { item, selected: false },
    });

    expect(wrapper.find("svg.lucide-wind").exists()).toBe(true);
    expect(wrapper.find("svg.lucide-funnel").exists()).toBe(false);
  });

  it("el formulario vincula el error al nombre y no expone campos de impacto", async () => {
    const wrapper = mount(TipoFiltroForm, {
      props: {
        draft: { id: 7, nombre: "", activo: true },
        errors: { nombre: "Ingresa un nombre para mostrar." },
      },
    });

    const input = wrapper.get("input");
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(input.attributes("aria-describedby")).toContain(
      "tipo-filtro-name-error",
    );
    expect(wrapper.text()).not.toContain("Equipos asociados");
    await input.setValue("Aceite");
    expect(wrapper.emitted("updateDraft")?.[0]).toEqual([
      { id: 7, nombre: "Aceite", activo: true },
    ]);
  });

  it("el resumen muestra únicamente campos modificados", () => {
    const wrapper = mount(TipoFiltroChangeSummary, {
      props: {
        original: item,
        draft: { id: 7, nombre: "Aire premium", activo: true },
      },
    });

    expect(wrapper.text()).toContain("Nombre");
    expect(wrapper.text()).toContain("Aire premium");
    expect(wrapper.text()).not.toContain("Estado");
  });

  it("la confirmación informa impacto y bloquea acciones mientras guarda", () => {
    const wrapper = mount(TipoFiltroUpdateConfirmDialog, {
      props: {
        original: item,
        draft: { id: 7, nombre: "Aire", activo: false },
        saving: true,
      },
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.text()).toContain("18 equipos");
    expect(wrapper.text()).toContain(
      "Las asociaciones con equipos no se modificarán",
    );
    expect(wrapper.text()).toContain("TRACTORES");
    expect(wrapper.get("details").attributes("open")).toBeUndefined();
    expect(wrapper.get("summary").text()).toContain("Resumen de equipos");
    expect(
      wrapper
        .findAll("button")
        .every((button) => button.attributes("disabled") !== undefined),
    ).toBe(true);
    wrapper.unmount();
  });

  it("creación y edición comparten el panel acoplado al borde inferior", async () => {
    const wrapper = mount(TipoFiltroDetailDrawer, {
      props: {
        open: true,
        mode: "crear",
        item: null,
        draft: { id: null, nombre: "", activo: true },
        hasChanges: false,
        canSubmit: false,
        saving: false,
        fieldErrors: {},
      },
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.get("aside").classes()).toEqual(
      expect.arrayContaining(["lg:right-0", "lg:bottom-0"]),
    );
    expect(wrapper.text()).toContain("Nuevo tipo de filtro");

    await wrapper.setProps({
      mode: "editar",
      item,
      draft: { id: 7, nombre: "Aire", activo: true },
    });
    expect(wrapper.text()).toContain("Detalles");
    expect(wrapper.get("aside").classes()).toEqual(
      expect.arrayContaining(["lg:right-0", "lg:bottom-0"]),
    );
    wrapper.unmount();
  });
});
