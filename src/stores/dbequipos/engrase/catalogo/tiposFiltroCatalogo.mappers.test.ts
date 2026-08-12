import { describe, expect, it } from "vitest";
import {
  mapCatalogoTipoFiltroGuardarResponse,
  mapCatalogoTiposFiltroListarResponse,
} from "./tiposFiltroCatalogo.mappers";

const rpcItem = {
  id: 7,
  nombre: "  Filtro de aire  ",
  activo: true,
  creado_en: "2026-08-01T14:00:00Z",
  actualizado_en: "fecha inválida",
  impacto: {
    total_equipos: 0,
    total_asignaciones: 0,
    tipos_equipo: [{ id: 1, nombre: " COMBINADAS ", cantidad_equipos: 0 }],
  },
};

describe("mapper del catálogo de tipos de filtro", () => {
  it("mapea listado, recorta textos y conserva conteos cero", () => {
    const result = mapCatalogoTiposFiltroListarResponse({
      ok: true,
      items: [rpcItem],
      resumen: { total: 1, activos: 1, desactivados: 0 },
    });

    expect(result.items[0]).toMatchObject({
      id: 7,
      nombre: "Filtro de aire",
      actualizadoEn: null,
      impacto: { totalEquipos: 0, totalAsignaciones: 0 },
    });
    expect(result.items[0]?.impacto.tiposEquipo[0]?.nombre).toBe("COMBINADAS");
  });

  it("tolera tipos de equipo ausentes, pero rechaza estructura esencial inválida", () => {
    expect(mapCatalogoTiposFiltroListarResponse({
      ok: true,
      items: [{ ...rpcItem, impacto: { ...rpcItem.impacto, tipos_equipo: undefined } }],
      resumen: { total: 1, activos: 1, desactivados: 0 },
    }).items[0]?.impacto.tiposEquipo).toEqual([]);

    expect(() => mapCatalogoTiposFiltroListarResponse({
      ok: true,
      items: [{ ...rpcItem, activo: "true" }],
      resumen: { total: 1, activos: 1, desactivados: 0 },
    })).toThrow(/activo/i);
  });

  it("mapea guardado usando el mismo item", () => {
    expect(mapCatalogoTipoFiltroGuardarResponse({
      ok: true,
      operacion: "actualizado",
      codigo: "TIPO_FILTRO_ACTUALIZADO",
      mensaje: " Actualizado ",
      afecta_equipos: 0,
      item: rpcItem,
    })).toMatchObject({
      operacion: "actualizado",
      codigo: "TIPO_FILTRO_ACTUALIZADO",
      mensaje: "Actualizado",
      item: { nombre: "Filtro de aire" },
    });
  });
});
