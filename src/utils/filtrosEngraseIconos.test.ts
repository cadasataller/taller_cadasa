import { describe, expect, it } from "vitest";
import { obtenerIconoTipoFiltro } from "./filtrosEngraseIconos";

describe("obtenerIconoTipoFiltro", () => {
  it("prioriza aire acondicionado sobre el grupo genérico de aire", () => {
    expect(obtenerIconoTipoFiltro("Filtro de aire acondicionado").grupo).toBe(
      "climatizacion",
    );
  });

  it.each([
    ["Filtro hidráulico", "hidraulico"],
    ["Filtro de aceite", "lubricacion"],
    ["Filtro diésel", "combustible"],
    ["Filtro desconocido", "elemento"],
  ] as const)("clasifica %s", (nombre, grupo) => {
    expect(obtenerIconoTipoFiltro(nombre).grupo).toBe(grupo);
  });
});
