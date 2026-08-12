import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquiposEngrasePanel from "./EquiposEngrasePanel.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";

describe("entrada al catálogo desde Equipos", () => {
  it("solo la muestra con edición, cierra el menú y emite la intención", async () => {
    const pinia = createPinia();
    const featureAccess = useFeatureAccessStore(pinia);
    featureAccess.isLoaded = true;
    featureAccess.funcionalidadesPermitidas = ["editar_filtros_engrase"];

    const wrapper = mount(EquiposEngrasePanel, {
      props: {
        equipos: [],
        selectedEquipoId: null,
        filters: {
          estadoEquipo: "activo",
          tipoEquipoId: null,
          tipoFiltroId: null,
          modelo: "",
          etapaIds: [],
          codigoExactoSeleccionado: null,
        },
        countsByTipo: [],
        loading: false,
        error: null,
        resetSignal: 0,
      },
      global: { plugins: [pinia] },
    });

    await wrapper.get('button[aria-label="Abrir acciones de equipos"]').trigger("click");
    const catalogButton = wrapper.findAll('[role="menuitem"]')
      .find((button) => button.text() === "Ver catálogo");

    expect(catalogButton).toBeDefined();
    await catalogButton!.trigger("click");

    expect(wrapper.emitted("openCatalogo")).toHaveLength(1);
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });
});
