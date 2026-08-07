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
  it("conserva el estado previo al quitar y deshacer un filtro", async () => {
    obtenerEquipo.mockResolvedValue({ ...equipo, filtros: [{ id: 9, equipoId: 6, tipoFiltro: { id: 2, nombre: "Aire" }, filtro: { id: 4, codigo: "AF-1", estaEnListaCompras: true }, cantidad: 1, cantidadEquivalencias: 0 }, { id: 10, equipoId: 6, tipoFiltro: { id: 3, nombre: "Aceite" }, filtro: { id: 5, codigo: "OF-1", estaEnListaCompras: false }, cantidad: 1, cantidadEquivalencias: 0 }] });
    obtenerAuxiliares.mockResolvedValue({ ...auxiliares, tiposFiltro: [{ id: 2, nombre: "Aire", tiposEquipoQueLoUsan: [] }, { id: 3, nombre: "Aceite", tiposEquipoQueLoUsan: [] }] });
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");
    if (!store.draft) throw new Error("El borrador no se creó.");
    store.actualizarAsignacionFiltro({ draftId: "equipo_filtro_9", tipoFiltroId: 2, cantidad: 2 });
    store.marcarFiltroParaEliminar("equipo_filtro_9");
    expect(store.activeFiltersCount).toBe(1);
    store.deshacerEliminacionFiltro("equipo_filtro_9");
    expect(store.draft.filtros[0]).toMatchObject({ estadoOperacion: "actualizado", cantidad: 2 });
  });
  it("bloquea duplicados activos y restaura el pendiente en lugar de duplicarlo", async () => {
    obtenerEquipo.mockResolvedValue({ ...equipo, filtros: [{ id: 9, equipoId: 6, tipoFiltro: { id: 1, nombre: "Aceite" }, filtro: { id: 8, codigo: "OF-1", estaEnListaCompras: true }, cantidad: 1, cantidadEquivalencias: 0 }] });
    obtenerAuxiliares.mockResolvedValue({ ...auxiliares, tiposFiltro: [{ id: 2, nombre: "Aire", tiposEquipoQueLoUsan: [] }] });
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");
    const entrada = { filtro: { id: 4, codigo: "AF-1", estaEnListaCompras: true }, tipoFiltro: { id: 2, nombre: "Aire" }, cantidad: 1 };
    expect(store.agregarFiltroExistente(entrada)).toBe(true);
    expect(store.agregarFiltroExistente(entrada)).toBe(false);
    if (!store.draft) throw new Error("El borrador no se creó.");
    expect(store.draft.filtros).toHaveLength(2);
    const filtroNuevo = store.draft.filtros.find((filtro) => filtro.filtro.id === entrada.filtro.id);
    if (!filtroNuevo) throw new Error("No se agregó el filtro nuevo.");
    store.marcarFiltroParaEliminar(filtroNuevo.draftId);
    expect(store.agregarFiltroExistente(entrada)).toBe(true);
    expect(store.draft.filtros).toHaveLength(2);
    expect(filtroNuevo.estadoOperacion).toBe("nuevo");
  });
  it("incorpora referencias nuevas al borrador sin escribir en el catálogo", async () => {
    obtenerEquipo.mockResolvedValue(equipo);
    obtenerAuxiliares.mockResolvedValue({ ...auxiliares, tiposFiltro: [{ id: 2, nombre: "Aire", tiposEquipoQueLoUsan: [] }] });
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");

    expect(store.agregarFiltroTemporal({
      filtro: { estado: "nuevo", id: null, tempId: "filtro_1", codigo: "LFP3191", estaEnListaCompras: true },
      tipoFiltro: { estado: "nuevo", id: null, tempId: "tipo_filtro_1", nombre: "Combustible" },
      cantidad: 2,
    })).toBe(true);

    expect(store.draft?.filtros[0]).toMatchObject({
      estadoOperacion: "nuevo",
      cantidad: 2,
      filtroReferencia: { estado: "nuevo", tempId: "filtro_1", codigo: "LFP3191" },
      tipoFiltroReferencia: { estado: "nuevo", tempId: "tipo_filtro_1", nombre: "Combustible" },
    });
  });
});
