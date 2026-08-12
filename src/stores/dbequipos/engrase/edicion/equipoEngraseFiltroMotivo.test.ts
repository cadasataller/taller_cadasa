import { describe, expect, it } from "vitest";
import { crearMotivoCambioFiltro } from "./equipoEngraseFiltroMotivo";
import type {
  EquipoEdicionFiltro,
  EquipoFiltroDraft,
} from "./equipoEngraseEdicion.types";

const original: EquipoEdicionFiltro = {
  id: 4,
  equipoId: 2,
  tipoFiltro: { id: 1, nombre: "Filtro de aceite" },
  filtro: { id: 8, codigo: "LFP3191", estaEnListaCompras: true },
  cantidad: 1,
  cantidadEquivalencias: 0,
};
const actual = (
  tipoId: number,
  nombre: string,
  cantidad: number,
): EquipoFiltroDraft => ({
  ...original,
  tipoFiltro: { id: tipoId, nombre },
  cantidad,
  draftId: "equipo_filtro_4",
  estadoOperacion: "existente",
  estadoAntesDeEliminar: null,
  filtroReferencia: {
    estado: "existente",
    id: original.filtro.id,
    tempId: null,
    codigo: original.filtro.codigo,
    estaEnListaCompras: original.filtro.estaEnListaCompras,
  },
  tipoFiltroReferencia: {
    estado: "existente",
    id: tipoId,
    tempId: null,
    nombre,
  },
});

describe("crearMotivoCambioFiltro", () => {
  it("mantiene el orden humano de tipo y cantidad", () => {
    expect(
      crearMotivoCambioFiltro(original, actual(2, "Filtro hidráulico", 2)),
    ).toBe(
      "Tipo de filtro: Filtro de aceite → Filtro hidráulico; Cantidad: 1 → 2",
    );
  });
  it("no genera motivo cuando se revierten todos los cambios", () => {
    expect(
      crearMotivoCambioFiltro(original, actual(1, "Filtro de aceite", 1)),
    ).toBeUndefined();
  });
});
