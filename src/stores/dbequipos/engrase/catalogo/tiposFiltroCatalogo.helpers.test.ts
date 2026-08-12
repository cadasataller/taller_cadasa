import { describe, expect, it } from "vitest";
import {
  filtrarTiposFiltro,
  formatoEquipos,
  normalizarBusquedaTipoFiltro,
  ordenarTiposFiltro,
} from "./tiposFiltroCatalogo.helpers";
import type { CatalogoTipoFiltroItem } from "./tiposFiltroCatalogo.types";

const item = (id: number, nombre: string, activo: boolean, totalEquipos: number): CatalogoTipoFiltroItem => ({
  id, nombre, activo, creadoEn: null, actualizadoEn: null,
  impacto: { totalEquipos, totalAsignaciones: totalEquipos, tiposEquipo: [] },
});
const items = [item(1, "Óleo", true, 2), item(2, "Aire", false, 10), item(3, "Aceite", true, 0)];

describe("helpers del catálogo de tipos de filtro", () => {
  it("normaliza espacios, mayúsculas y diacríticos", () => {
    expect(normalizarBusquedaTipoFiltro("  ÓLEO ")).toBe("oleo");
  });
  it("filtra localmente por búsqueda y estado", () => {
    expect(filtrarTiposFiltro(items, "oleo", "activos").map(({ id }) => id)).toEqual([1]);
    expect(filtrarTiposFiltro(items, "", "desactivados").map(({ id }) => id)).toEqual([2]);
    expect(filtrarTiposFiltro(items, "", "todos")).toHaveLength(3);
  });
  it("ordena nombre, estado y uso en ambos sentidos", () => {
    expect(ordenarTiposFiltro(items, "nombre", "asc").map(({ id }) => id)).toEqual([3, 2, 1]);
    expect(ordenarTiposFiltro(items, "uso", "desc").map(({ id }) => id)).toEqual([2, 1, 3]);
    expect(ordenarTiposFiltro(items, "estado", "asc")[0]?.activo).toBe(true);
    expect(ordenarTiposFiltro(items, "estado", "desc")[0]?.activo).toBe(false);
  });
  it("forma singular y plural", () => {
    expect(formatoEquipos(1)).toBe("1 equipo");
    expect(formatoEquipos(2)).toBe("2 equipos");
  });
});
