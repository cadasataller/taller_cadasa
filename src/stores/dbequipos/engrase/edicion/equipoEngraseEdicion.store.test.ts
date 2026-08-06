import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type {
  AuxiliaresEdicionEquipo,
  EquipoParaEdicion,
} from "./equipoEngraseEdicion.types";

const obtenerEquipo = vi.hoisted(() => vi.fn());
const obtenerAuxiliares = vi.hoisted(() => vi.fn());
vi.mock("./equipoEngraseEdicion.service", () => ({
  equipoEngraseEdicionService: {
    obtenerEquipoParaEdicion: obtenerEquipo,
    obtenerAuxiliaresEdicionEquipo: obtenerAuxiliares,
  },
}));

import { useEquipoEngraseEdicionStore } from "./equipoEngraseEdicion.store";

const equipo: EquipoParaEdicion = {
  equipo: {
    id: 6,
    codigo: "410002",
    tipoEquipoId: 1,
    tipoEquipo: "Buses",
    subtipo: "Bus",
    estado: "activo",
  },
  etapas: [{ id: 1, nombre: "Cultivo" }],
  filtros: [],
  aceites: [],
};
const auxiliares: AuxiliaresEdicionEquipo = {
  tiposEquipo: [],
  etapas: [],
  tiposFiltro: [],
  sistemasAceite: [],
  aceites: [],
};

describe("store de edición de equipo", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });
  it("carga equipo y auxiliares en paralelo con snapshot independiente", async () => {
    obtenerEquipo.mockResolvedValue(equipo);
    obtenerAuxiliares.mockResolvedValue(auxiliares);
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");
    expect(obtenerEquipo).toHaveBeenCalledWith("410002");
    expect(obtenerAuxiliares).toHaveBeenCalledOnce();
    expect(store.isDirty).toBe(false);
    if (!store.draft || !store.original)
      throw new Error("El borrador no se creó.");
    store.draft.equipo.subtipo = "Bus urbano";
    expect(store.original.equipo.subtipo).toBe("Bus");
    expect(store.isDirty).toBe(true);
  });
  it("convierte un error parcial en error de carga completo", async () => {
    obtenerEquipo.mockRejectedValue(new Error("EQUIPO_NO_ENCONTRADO: 410002"));
    obtenerAuxiliares.mockResolvedValue(auxiliares);
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");
    expect(store.loadError).toMatchObject({ codigo: "EQUIPO_NO_ENCONTRADO" });
    expect(store.isReady).toBe(false);
  });
  it("ignora una respuesta obsoleta", async () => {
    let resolverPrimero = (_valor: EquipoParaEdicion): void => {};
    obtenerEquipo
      .mockImplementationOnce(
        () =>
          new Promise<EquipoParaEdicion>((resolver) => {
            resolverPrimero = resolver;
          }),
      )
      .mockResolvedValueOnce({
        ...equipo,
        equipo: { ...equipo.equipo, codigo: "410003" },
      });
    obtenerAuxiliares.mockResolvedValue(auxiliares);
    const store = useEquipoEngraseEdicionStore();
    const primera = store.cargar("410002");
    await store.cargar("410003");
    resolverPrimero(equipo);
    await primera;
    expect(store.codigoOriginal).toBe("410003");
  });
  it("solicita confirmación al salir con cambios y sale directamente sin ellos", async () => {
    obtenerEquipo.mockResolvedValue(equipo);
    obtenerAuxiliares.mockResolvedValue(auxiliares);
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");
    expect(store.solicitarSalida()).toBe(true);
    if (!store.draft) throw new Error("El borrador no se creó.");
    store.draft.equipo.subtipo = "Bus urbano";
    expect(store.solicitarSalida()).toBe(false);
    expect(store.activeOverlay).toBe("confirmar_salida");
    store.descartarCambios();
    expect(store.isDirty).toBe(false);
  });
});
