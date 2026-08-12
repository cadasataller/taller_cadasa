import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { describe, expect, it } from "vitest";
import CatalogoEngraseHeader from "./CatalogoEngraseHeader.vue";
import CatalogoEngraseNavigation from "./CatalogoEngraseNavigation.vue";
import CatalogoEngraseSectionShell from "./CatalogoEngraseSectionShell.vue";
import CatalogoEngraseView from "@/views/engrase/catalogo/CatalogoEngraseView.vue";
import type { CatalogoEngraseNavigationItem } from "@/stores/dbequipos/engrase/catalogo/catalogoEngrase.types";

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
  it("expone una acción de retorno accesible", async () => {
    const wrapper = mount(CatalogoEngraseHeader);

    await wrapper.get('button[aria-label="Volver a filtros de engrase"]').trigger("click");

    expect(wrapper.emitted("back")).toHaveLength(1);
    expect(wrapper.text()).toContain("Catálogo de filtros y engrase");
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

  it("conserva montados la vista y el shell al cambiar la ruta hija", async () => {
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
      global: { plugins: [router] },
    });
    const initialViewElement = wrapper.findComponent(CatalogoEngraseView).element;
    const initialShellElement = wrapper.findComponent(CatalogoEngraseSectionShell).element;

    await router.push({ name: "CatalogoEngraseFiltros" });

    expect(wrapper.findComponent(CatalogoEngraseView).element).toBe(initialViewElement);
    expect(wrapper.findComponent(CatalogoEngraseSectionShell).element).toBe(initialShellElement);
    expect(wrapper.findComponent(CatalogoEngraseSectionShell).text()).toContain("Filtros");
  });
});
