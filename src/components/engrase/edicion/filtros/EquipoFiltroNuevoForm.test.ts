import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EquipoFiltroNuevoForm from "./EquipoFiltroNuevoForm.vue";

describe("EquipoFiltroNuevoForm", () => {
  it("emite un filtro temporal al confirmar una combinación válida", async () => {
    const wrapper = mount(EquipoFiltroNuevoForm, {
      props: {
        mode: "nuevo",
        codigoInicial: "LFP3191",
        tipos: [{ id: 2, nombre: "Aire", tiposEquipoQueLoUsan: ["Tractor"] }],
        activeTypeNames: [],
        isDuplicateCode: () => false,
        search: async () => ({
          encontrado: false,
          coincidenciaExacta: false,
          codigo: "FILTRO_NO_ENCONTRADO",
          codigoBuscado: "LFP3191",
          puedeCrearse: true,
          sugerencias: [],
        }),
      },
      global: {
        stubs: {
          EquipoTipoFiltroNuevoField: {
            template:
              "<button data-test='select-type' type='button' @click='$emit(\"select\", { estado: \"existente\", id: 2, tempId: null, nombre: \"Aire\" })'>Seleccionar tipo</button>",
          },
        },
      },
    });

    await wrapper.get("[data-test='select-type']").trigger("click");
    await wrapper.get("form").trigger("submit");

    const confirmaciones = wrapper.emitted("confirm");
    expect(confirmaciones).toHaveLength(1);
    expect(confirmaciones?.[0]).toMatchObject([
      {
        estado: "nuevo",
        id: null,
        codigo: "LFP3191",
        estaEnListaCompras: true,
      },
      { estado: "existente", id: 2, nombre: "Aire" },
      1,
    ]);
  });
});
