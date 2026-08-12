import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import FiltroChangeSummary from "./FiltroChangeSummary.vue";
import FiltroForm from "./FiltroForm.vue";
import FiltroMobileCard from "./FiltroMobileCard.vue";
import FiltroRelatedTypes from "./FiltroRelatedTypes.vue";
import FiltroUpdateConfirmDialog from "./FiltroUpdateConfirmDialog.vue";
import FiltrosTable from "./FiltrosTable.vue";
import FiltrosToolbar from "./FiltrosToolbar.vue";
import type { CatalogoFiltroItem } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";
const item: CatalogoFiltroItem = {
  id: 7,
  codigo: "B7030",
  estaEnListaCompras: true,
  activo: true,
  creadoEn: null,
  actualizadoEn: null,
  tiposFiltro: [{ id: 2, nombre: "Aire", cantidadEquipos: 18 }],
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
describe("componentes del catálogo de filtros", () => {
  it("toolbar emite los cuatro filtros, limpiar y crear", async () => {
    const w = mount(FiltrosToolbar, {
      props: {
        busqueda: "",
        tipoFiltroId: null,
        compras: "todos",
        estado: "activos",
        tiposFiltro: item.tiposFiltro,
        canClear: true,
      },
    });
    await w.get("input").setValue("B7");
    const selects = w.findAll("select");
    await selects[0]!.setValue("2");
    await selects[1]!.setValue("en-compras");
    await selects[2]!.setValue("todos");
    await w.get('[aria-label="Limpiar filtros"]').trigger("click");
    expect(w.emitted("updateBusqueda")?.[0]).toEqual(["B7"]);
    expect(w.emitted("updateTipoFiltro")?.[0]).toEqual([2]);
    expect(w.emitted("updateCompras")?.[0]).toEqual(["en-compras"]);
    expect(w.emitted("updateEstado")?.[0]).toEqual(["todos"]);
    expect(w.emitted("clear")).toHaveLength(1);
  });
  it("tabla usa el icono genérico, anuncia orden y abre con teclado", async () => {
    const w = mount(FiltrosTable, {
      props: {
        items: [item],
        selectedId: null,
        sortKey: "codigo",
        sortDirection: "asc",
      },
    });
    expect(w.find("svg.lucide-funnel").exists()).toBe(true);
    expect(w.find("svg.lucide-droplet").exists()).toBe(false);
    expect(w.get("th[aria-sort='ascending']").text()).toContain("Código");
    await w.get("tbody tr").trigger("keydown", { key: "Enter" });
    expect(w.emitted("select")?.[0]?.[0]).toEqual(item);
  });
  it("card usa el icono genérico y no expone tipos relacionados", () => {
    const w = mount(FiltroMobileCard, { props: { item, selected: false } });
    expect(w.find("svg.lucide-funnel").exists()).toBe(true);
    expect(w.find("svg.lucide-droplet").exists()).toBe(false);
    expect(w.text()).toContain("B7030");
    expect(w.text()).not.toContain("Aire");
  });
  it("detalle clasifica el icono de cada tipo relacionado", () => {
    const w = mount(FiltroRelatedTypes, { props: { items: item.tiposFiltro } });
    expect(w.find("svg.lucide-wind").exists()).toBe(true);
    expect(w.text()).toContain("Aire");
  });
  it("form asocia error y solo edita campos maestros", async () => {
    const w = mount(FiltroForm, {
      props: {
        draft: { id: 7, codigo: "", esta_en_lista_compras: true, activo: true },
        errors: { codigo: "Ingresa el código del filtro." },
      },
    });
    expect(w.get("input").attributes("aria-describedby")).toContain(
      "filtro-code-error",
    );
    expect(w.text()).not.toContain("Tipos de filtro donde");
    await w.get("input").setValue("AF-1");
    expect(w.emitted("updateDraft")?.[0]).toEqual([
      { id: 7, codigo: "AF-1", esta_en_lista_compras: true, activo: true },
    ]);
  });
  it("resumen muestra únicamente cambios reales", () => {
    const w = mount(FiltroChangeSummary, {
      props: {
        original: item,
        draft: {
          id: 7,
          codigo: "B7030-A",
          esta_en_lista_compras: true,
          activo: true,
        },
      },
    });
    expect(w.text()).toContain("Código");
    expect(w.text()).not.toContain("En compras");
    expect(w.text()).not.toContain("Estado");
  });
  it("confirmación explica impacto y bloquea doble acción", () => {
    const w = mount(FiltroUpdateConfirmDialog, {
      props: {
        original: item,
        draft: {
          id: 7,
          codigo: "B7030",
          esta_en_lista_compras: true,
          activo: false,
        },
        saving: true,
      },
      global: { stubs: { Teleport: true } },
    });
    expect(w.text()).toContain("18 equipos");
    expect(w.text()).toContain(
      "Las asociaciones con equipos no se modificarán",
    );
    expect(
      w
        .findAll("button")
        .every((button) => button.attributes("disabled") !== undefined),
    ).toBe(true);
    w.unmount();
  });
});
