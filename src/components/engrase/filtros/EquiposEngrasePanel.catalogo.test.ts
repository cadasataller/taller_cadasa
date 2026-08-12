import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquiposEngrasePanel from "./EquiposEngrasePanel.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";

describe("acciones del panel Equipos", () => {
  it("muestra únicamente el botón Plus para agregar equipo", async () => {
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

    const addButton = wrapper.get('button[aria-label="Agregar equipo"]');

    expect(addButton.find("svg.lucide-plus").exists()).toBe(true);
    expect(addButton.attributes("aria-haspopup")).toBeUndefined();
    await addButton.trigger("click");
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });
});
