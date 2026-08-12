import { describe, expect, it } from "vitest";
import { obtenerIconoTipoFiltro } from "./filtrosEngraseIconos";

describe("obtenerIconoTipoFiltro", () => {
  it.each([
    ["Filtro de aire acondicionado", "aire"],
    ["Filtro de cabina", "aire"],
    ["Filtro hidráulico", "hidraulico"],
    ["Filtro de aceite", "motor"],
    ["Filtro diésel", "combustible"],
    ["Filtro de elemento", "combustible"],
    ["Filtro de transmisión", "transmision"],
    ["Filtro desconocido", "otros"],
  ] as const)("clasifica %s", (nombre, grupo) => {
    expect(obtenerIconoTipoFiltro(nombre).grupo).toBe(grupo);
  });
});
