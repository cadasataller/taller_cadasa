import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const obtenerFiltrosDeEquipo = vi.hoisted(() => vi.fn());
const obtenerAceitesDeEquipo = vi.hoisted(() => vi.fn());
const obtenerEquivalenciasActivas = vi.hoisted(() => vi.fn());
const crearUrlFirmadaImagen = vi.hoisted(() => vi.fn());
const cambiarEstadoEquipo = vi.hoisted(() => vi.fn());

vi.mock("./filtrosEngrase.service", () => ({
  filtrosEngraseService: {
    obtenerFiltrosDeEquipo,
    obtenerAceitesDeEquipo,
    obtenerEquivalenciasActivas,
    crearUrlFirmadaImagen,
    cambiarEstadoEquipo,
  },
}));

import { useFiltrosEngraseStore } from "./filtrosEngrase.store";
import type { EquipoEngraseListItem } from "./filtrosEngrase.types";

const equipo = (id: number, codigo: string): EquipoEngraseListItem => ({
  id,
  codigo,
  tipo_equipo_id: 5,
  tipo_equipo: "Combinadas",
  subtipo: "Cosechadora",
  estado: "activo",
  main_storage_path: null,
  tiene_imagen_main: false,
  imagen_actualizada_en: null,
  etapas: [],
});

describe("detalle de filtros y aceites del equipo", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    obtenerFiltrosDeEquipo.mockResolvedValue([]);
    obtenerAceitesDeEquipo.mockResolvedValue([
      { sistema: "Motor", aceite: "15W-40" },
    ]);
    obtenerEquivalenciasActivas.mockResolvedValue([]);
  });

  it("carga filtros y aceites en paralelo y conserva ambos en cache", async () => {
    let resolverFiltros!: (value: []) => void;
    let resolverAceites!: (value: { sistema: string; aceite: string }[]) => void;
    obtenerFiltrosDeEquipo.mockReturnValue(
      new Promise<[]>((resolve) => { resolverFiltros = resolve; }),
    );
    obtenerAceitesDeEquipo.mockReturnValue(
      new Promise<{ sistema: string; aceite: string }[]>((resolve) => {
        resolverAceites = resolve;
      }),
    );
    const store = useFiltrosEngraseStore();
    store.equipos = [equipo(123, "422017")];

    const carga = store.seleccionarEquipo(123);

    expect(obtenerFiltrosDeEquipo).toHaveBeenCalledWith(123);
    expect(obtenerAceitesDeEquipo).toHaveBeenCalledWith(123);
    resolverFiltros([]);
    resolverAceites([{ sistema: "Motor", aceite: "15W-40" }]);
    await carga;

    expect(store.aceitesEquipo).toEqual([{ sistema: "Motor", aceite: "15W-40" }]);
    await store.cargarFiltrosEquipo(123);
    expect(obtenerFiltrosDeEquipo).toHaveBeenCalledOnce();
    expect(obtenerAceitesDeEquipo).toHaveBeenCalledOnce();
  });

  it("confirma el estado por RPC y actualiza el store sin recargar equipos", async () => {
    cambiarEstadoEquipo.mockResolvedValue("descartado");
    const store = useFiltrosEngraseStore();
    store.equipos = [equipo(123, "422017"), equipo(124, "422018")];
    store.equipoSeleccionadoId = 123;

    await store.cambiarEstadoEquipo("422017", "descartado");

    expect(cambiarEstadoEquipo).toHaveBeenCalledWith("422017", "descartado");
    expect(store.equipos[0]?.estado).toBe("descartado");
    expect(store.equipoSeleccionadoId).toBe(123);
    expect(store.equiposVisibles.map((item) => item.id)).toEqual([124]);
  });
});
