import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import EquipoFiltroBuscarForm from "./EquipoFiltroBuscarForm.vue";

const resultadoNoEncontrado = {
  encontrado: false as const,
  coincidenciaExacta: false as const,
  codigo: "FILTRO_NO_ENCONTRADO",
  codigoBuscado: "B7",
  puedeCrearse: true,
  sugerencias: [
    { id: 35, codigo: "B7577", estaEnListaCompras: true },
  ],
};

describe("EquipoFiltroBuscarForm", () => {
  it("mantiene seleccionable una sugerencia cuyo código ya está en uso", async () => {
    const search = vi
      .fn()
      .mockResolvedValueOnce(resultadoNoEncontrado)
      .mockResolvedValueOnce({
        encontrado: true,
        coincidenciaExacta: true,
        codigo: "FILTRO_ENCONTRADO",
        filtro: { id: 35, codigo: "B7577", estaEnListaCompras: true },
        requiereSeleccionarTipo: true,
        sinTiposRegistrados: false,
        tiposPosibles: [],
      });
    const wrapper = mount(EquipoFiltroBuscarForm, {
      props: {
        tipos: [],
        activeTypeNames: [],
        occupiedTypeIds: [],
        occupiedFilterIds: [35],
        occupiedFilterCodes: ["B7577"],
        assignedTypeCodes: {},
        draftSuggestions: [],
        pendingFilterTypeKeys: [],
        search,
      },
      global: {
        stubs: { EquipoTipoFiltroNuevoField: true },
      },
    });

    await wrapper.get("input").setValue("B7");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    const suggestion = wrapper.findAll("button").find((button) =>
      button.text().includes("B7577"),
    );
    expect(suggestion?.attributes("disabled")).toBeUndefined();
    expect(suggestion?.text()).toContain("En uso");

    await suggestion?.trigger("click");
    expect(search).toHaveBeenLastCalledWith("B7577");
    expect(wrapper.text()).toContain("EN USO");
  });
});
