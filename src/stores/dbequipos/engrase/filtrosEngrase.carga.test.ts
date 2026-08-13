import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { EquipoEngraseListItem } from "./filtrosEngrase.types";

const obtenerEquipos = vi.hoisted(() => vi.fn());
vi.mock("./filtrosEngrase.service", () => ({
  filtrosEngraseService: { obtenerEquipos },
}));

import { useFiltrosEngraseStore } from "./filtrosEngrase.store";

const equipo: EquipoEngraseListItem = {
  id: 1,
  codigo: "EQ-1",
  tipo_equipo_id: 2,
  tipo_equipo: "Buses",
  subtipo: "BUS URBANO",
  estado: "activo",
  main_storage_path: null,
  tiene_imagen_main: false,
  imagen_actualizada_en: null,
  etapas: [],
};

describe("carga segura del listado de equipos", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    obtenerEquipos.mockResolvedValue([equipo]);
  });

  it("carga al entrar con el store vacío", async () => {
    const store = useFiltrosEngraseStore();

    await store.asegurarEquiposCargados();

    expect(obtenerEquipos).toHaveBeenCalledOnce();
    expect(store.equipos).toEqual([equipo]);
    expect(store.equipoSeleccionadoId).toBeNull();
  });

  it("no recarga si el store ya contiene equipos", async () => {
    const store = useFiltrosEngraseStore();
    store.equipos = [equipo];

    await store.asegurarEquiposCargados();

    expect(obtenerEquipos).not.toHaveBeenCalled();
  });

  it("reutiliza una carga que ya está en curso", async () => {
    const store = useFiltrosEngraseStore();

    await Promise.all([
      store.asegurarEquiposCargados(),
      store.asegurarEquiposCargados(),
    ]);

    expect(obtenerEquipos).toHaveBeenCalledOnce();
  });
});
