import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CatalogoEngraseHeader from "./CatalogoEngraseHeader.vue";
import CatalogoEngraseNavigation from "./CatalogoEngraseNavigation.vue";
import CatalogoEngraseSectionShell from "./CatalogoEngraseSectionShell.vue";
import CatalogoEngraseView from "@/views/engrase/catalogo/CatalogoEngraseView.vue";
import CatalogoTiposFiltroSection from "@/views/engrase/catalogo/CatalogoTiposFiltroSection.vue";
import CatalogoFiltrosSection from "@/views/engrase/catalogo/CatalogoFiltrosSection.vue";
import CatalogoAceitesSection from "@/views/engrase/catalogo/CatalogoAceitesSection.vue";
import type { CatalogoEngraseNavigationItem } from "@/stores/dbequipos/engrase/catalogo/catalogoEngrase.types";

const listarTiposFiltro = vi.hoisted(() => vi.fn());
const listarFiltros = vi.hoisted(() => vi.fn());
const listarAceites = vi.hoisted(() => vi.fn());
vi.mock("@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.service", () => ({
  tiposFiltroCatalogoService: {
    listar: listarTiposFiltro,
    guardar: vi.fn(),
  },
}));
vi.mock("@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.service", () => ({
  filtrosCatalogoService: {
    listar: listarFiltros,
    guardar: vi.fn(),
  },
}));
vi.mock("@/stores/dbequipos/engrase/catalogo/aceitesCatalogo.service", () => ({
  aceitesCatalogoService: { listar: listarAceites, guardar: vi.fn() },
}));

const items = [
  { id: "tipos-filtro", label: "Tipos de filtro", routeName: "CatalogoEngraseTiposFiltro" },
  { id: "filtros", label: "Filtros", routeName: "CatalogoEngraseFiltros" },
  { id: "aceites", label: "Aceites", routeName: "CatalogoEngraseAceites" },
  { id: "sistemas", label: "Sistemas", routeName: "CatalogoEngraseSistemas" },
] as const satisfies readonly CatalogoEngraseNavigationItem[];

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: items.map((item) => ({
      path: `/${item.id}`,
      name: item.routeName,
      component: { template: "<div />" },
    })),
  });
}

describe("shell del catálogo de engrase", () => {
  beforeEach(() => {
    listarTiposFiltro.mockReset();
    listarTiposFiltro.mockResolvedValue({
      items: [],
      resumen: { total: 0, activos: 0, desactivados: 0 },
    });
    listarFiltros.mockReset();
    listarFiltros.mockResolvedValue({
      items: [],
      resumen: { total: 0, activos: 0, desactivados: 0, enCompras: 0, fueraCompras: 0 },
    });
    listarAceites.mockReset();
    listarAceites.mockResolvedValue({
      items: [],
      resumen: { total: 0, activos: 0, desactivados: 0 },
    });
  });
  it("presenta el Catálogo como sección propia de Engrase", () => {
    const wrapper = mount(CatalogoEngraseHeader);

    expect(wrapper.text()).toContain("Catálogo de filtros y engrase");
    expect(wrapper.text()).toContain("Engrase / Catálogo");
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("ofrece los cuatro enlaces y un selector mobile", async () => {
    const router = createTestRouter();
    await router.push({ name: "CatalogoEngraseFiltros" });
    await router.isReady();

    const wrapper = mount(CatalogoEngraseNavigation, {
      props: { items, activeSection: "filtros" },
      global: { plugins: [router] },
    });

    expect(wrapper.findAll("a")).toHaveLength(4);
    expect(wrapper.get('a[aria-current="page"]').text()).toBe("Filtros");
    expect(wrapper.get("label").text()).toBe("Sección del catálogo");

    await wrapper.get("select").setValue("aceites");
    expect(wrapper.emitted("selectSection")).toEqual([["aceites"]]);
  });

  it("muestra un pendiente honesto y admite estados futuros", async () => {
    const pending = mount(CatalogoEngraseSectionShell, {
      props: { title: "Sistemas" },
    });
    expect(pending.text()).toContain("Sistemas");
    expect(pending.text()).toContain("entrega posterior");
    expect(pending.find("button").exists()).toBe(false);

    const loading = mount(CatalogoEngraseSectionShell, {
      props: { title: "Sistemas", state: "loading" },
    });
    expect(loading.get("section").attributes("aria-busy")).toBe("true");

    const error = mount(CatalogoEngraseSectionShell, {
      props: { title: "Sistemas", state: "error" },
    });
    await error.get("button").trigger("click");
    expect(error.emitted("retry")).toHaveLength(1);
  });

  it("conserva montada la vista y no recarga tipos de filtro al volver", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/catalogo",
          component: CatalogoEngraseView,
          children: items.map((item) => ({
            path: item.id,
            name: item.routeName,
            component: { template: "<div />" },
          })),
        },
      ],
    });
    await router.push({ name: "CatalogoEngraseTiposFiltro" });
    await router.isReady();

    const wrapper = mount(defineComponent({ template: "<RouterView />" }), {
      global: { plugins: [router, createPinia()] },
    });
    const initialViewElement = wrapper.findComponent(CatalogoEngraseView).element;
    expect(wrapper.findComponent(CatalogoTiposFiltroSection).exists()).toBe(true);
    expect(wrapper.findComponent(CatalogoEngraseView).get("main").classes()).toContain("lg:overflow-hidden");
    await vi.waitFor(() => expect(listarTiposFiltro).toHaveBeenCalledOnce());

    await router.push({ name: "CatalogoEngraseFiltros" });

    expect(wrapper.findComponent(CatalogoEngraseView).element).toBe(initialViewElement);
    expect(wrapper.findComponent(CatalogoEngraseView).get("main").classes()).toContain("lg:overflow-hidden");
    expect(wrapper.findComponent(CatalogoFiltrosSection).exists()).toBe(true);
    await vi.waitFor(() => expect(listarFiltros).toHaveBeenCalledOnce());

    await router.push({ name: "CatalogoEngraseAceites" });
    expect(wrapper.findComponent(CatalogoAceitesSection).exists()).toBe(true);
    expect(wrapper.findComponent(CatalogoEngraseView).get("main").classes()).toContain("lg:overflow-hidden");
    await vi.waitFor(() => expect(listarAceites).toHaveBeenCalledOnce());

    await router.push({ name: "CatalogoEngraseTiposFiltro" });
    expect(wrapper.findComponent(CatalogoTiposFiltroSection).exists()).toBe(true);
    expect(listarTiposFiltro).toHaveBeenCalledOnce();
  });
});
