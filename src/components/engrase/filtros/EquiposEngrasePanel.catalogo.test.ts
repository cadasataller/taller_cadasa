import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquiposEngrasePanel from "./EquiposEngrasePanel.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";

describe("acciones del panel Equipos", () => {
  it("no mezcla la navegación al catálogo con las acciones del equipo", async () => {
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
    expect(wrapper.find('[role="menu"]').text()).toContain("Agregar Equipo");
    expect(wrapper.find('[role="menu"]').text()).not.toContain("Ver catálogo");
    expect(wrapper.emitted("openCatalogo")).toBeUndefined();
  });
});
