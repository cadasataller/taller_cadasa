import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { reactive } from "vue";
import type {
  AuxiliaresEdicionEquipo,
  EquipoParaEdicion,
  ActualizarEquipoCompletoRespuesta,
} from "./equipoEngraseEdicion.types";

const obtenerEquipo = vi.hoisted(() => vi.fn());
const obtenerAuxiliares = vi.hoisted(() => vi.fn());
const actualizarEquipoCompleto = vi.hoisted(() => vi.fn());
vi.mock("./equipoEngraseEdicion.service", () => ({
  equipoEngraseEdicionService: {
    obtenerEquipoParaEdicion: obtenerEquipo,
    obtenerAuxiliaresEdicionEquipo: obtenerAuxiliares,
    actualizarEquipoCompleto,
  },
}));

import { useEquipoEngraseEdicionStore } from "./equipoEngraseEdicion.store";
import { useFiltrosEngraseStore } from "../filtrosEngrase.store";

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
  imagen: {
    mainStoragePath: "equipos/410002/main_thumb/imagen.webp",
    tieneImagenMain: true,
    imagenActualizadaEn: "2026-08-10T15:33:50.316Z",
  },
};
const auxiliares: AuxiliaresEdicionEquipo = {
  tiposEquipo: [],
  etapas: [],
  tiposFiltro: [],
  sistemasAceite: [],
  aceites: [],
};
const respuestaActualizacion = (codigo = "410002"): ActualizarEquipoCompletoRespuesta => ({
  codigo: "EQUIPO_ACTUALIZADO",
  mensaje: "Equipo actualizado.",
  equipoLista: { id: 6, codigo, tipo_equipo_id: 1, tipo_equipo: "Buses", subtipo: "Bus urbano", estado: "activo", main_storage_path: null, tiene_imagen_main: false, imagen_actualizada_en: null, etapas: [{ id: 1, nombre: "Cultivo" }] },
  cambiosDetalle: { datosEquipoCambiaron: true, etapasCambiaron: false, filtrosCambiaron: false, aceitesCambiaron: false },
  resumenOperaciones: { etapasAgregadas: 0, etapasEliminadas: 0, filtrosAgregados: 0, filtrosActualizados: 0, filtrosEliminados: 0, historialesFiltroCreados: 0, aceitesAgregados: 0, aceitesActualizados: 0, aceitesEliminados: 0 },
});

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
    expect(store.imagenPersistidaActual).toEqual(equipo.imagen);
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
  it("administra aceites locales, valida sistema único y conserva el cambio al deshacer", async () => {
    obtenerEquipo.mockResolvedValue({ ...equipo, aceites: [{ equipoAceiteId: 11, sistema: { id: 1, nombre: "Motor" }, aceite: { id: 1, nombre: "15W-40" } }] });
    obtenerAuxiliares.mockResolvedValue({ ...auxiliares, sistemasAceite: [{ id: 1, nombre: "Motor" }, { id: 2, nombre: "Transmisión" }], aceites: [{ id: 1, nombre: "15W-40" }, { id: 2, nombre: "Hy-Tran" }] });
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");
    expect(store.isDirty).toBe(false);
    expect(store.agregarAceite({ sistema: { estado: "existente", id: 1, tempId: null, nombre: "Motor" }, aceite: { estado: "existente", id: 2, tempId: null, nombre: "Hy-Tran" } })).toBe(false);
    expect(store.agregarAceite({ sistema: { estado: "nuevo", id: null, tempId: "sistema_1", nombre: "Hidráulico" }, aceite: { estado: "nuevo", id: null, tempId: "aceite_1", nombre: "ISO 46" } })).toBe(true);
    const nuevo = store.draft?.aceites.find((aceite) => aceite.estadoOperacion === "nuevo");
    if (!nuevo) throw new Error("No se agregó el aceite.");
    store.marcarAceiteParaEliminar(nuevo.draftId);
    expect(store.deshacerEliminacionAceite(nuevo.draftId)).toBe(true);
    expect(nuevo.estadoOperacion).toBe("nuevo");
  });
  it("guarda una vez, reemplaza el listado e invalida el detalle sin recarga global", async () => {
    const equipoConFiltro: EquipoParaEdicion = { ...equipo, filtros: [{ id: 9, equipoId: 6, tipoFiltro: { id: 2, nombre: "Aire" }, filtro: { id: 4, codigo: "AF-1", estaEnListaCompras: true }, cantidad: 1, cantidadEquivalencias: 0 }] };
    obtenerEquipo.mockResolvedValue(equipoConFiltro);
    obtenerAuxiliares.mockResolvedValue(auxiliares);
    actualizarEquipoCompleto.mockResolvedValue(respuestaActualizacion());
    const store = useEquipoEngraseEdicionStore();
    const listado = useFiltrosEngraseStore();
    listado.equipos = [{ ...respuestaActualizacion().equipoLista, subtipo: "Bus" }];
    listado.equipoSeleccionadoId = 6;
    listado.filtrosAplicados = { ...listado.filtrosAplicados, modelo: "urbano" };
    await store.cargar("410002");
    store.actualizarSubtipo("Bus urbano");
    const mover = vi.fn(async (): Promise<void> => {});
    const [primero, segundo] = await Promise.all([store.guardar(mover), store.guardar(mover)]);
    expect([primero.kind, segundo.kind]).toContain("success");
    expect([primero.kind, segundo.kind]).toContain("busy");
    expect(actualizarEquipoCompleto).toHaveBeenCalledOnce();
    expect(actualizarEquipoCompleto).toHaveBeenCalledWith({ codigoOriginal: "410002", cambios: { datos_equipo: { estado_operacion: "actualizado", subtipo: "Bus urbano" } } });
    expect(store.isDirty).toBe(false);
    expect(store.successMessage).toBe("Equipo actualizado.");
    expect(listado.equipos[0]?.subtipo).toBe("Bus urbano");
    expect(listado.filtrosAplicados.modelo).toBe("urbano");
    expect(listado.equipoSeleccionadoId).toBe(6);
  });

  it("guarda referencias provenientes de proxies reactivos de Vue", async () => {
    obtenerEquipo.mockResolvedValue({
      ...equipo,
      filtros: [{ id: 9, equipoId: 6, tipoFiltro: { id: 2, nombre: "Aire" }, filtro: { id: 4, codigo: "AF-1", estaEnListaCompras: true }, cantidad: 1, cantidadEquivalencias: 0 }],
    });
    obtenerAuxiliares.mockResolvedValue(auxiliares);
    actualizarEquipoCompleto.mockResolvedValue(respuestaActualizacion());
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");

    const subtiposSugeridos = reactive(["Bus urbano"]);
    const tipoEquipo = reactive({
      estado: "nuevo" as const,
      id: null,
      tempId: "tipo_equipo_1",
      nombre: "Buses urbanos",
      subtiposSugeridos,
    });
    store.seleccionarTipoEquipo(tipoEquipo);

    const resultado = await store.guardar(async () => {});

    expect(resultado.kind).toBe("success");
    expect(actualizarEquipoCompleto).toHaveBeenCalledOnce();
  });

  it("conserva el borrador y habilita reintento cuando falla la RPC", async () => {
    obtenerEquipo.mockResolvedValue({ ...equipo, filtros: [{ id: 9, equipoId: 6, tipoFiltro: { id: 2, nombre: "Aire" }, filtro: { id: 4, codigo: "AF-1", estaEnListaCompras: true }, cantidad: 1, cantidadEquivalencias: 0 }] });
    obtenerAuxiliares.mockResolvedValue(auxiliares);
    actualizarEquipoCompleto.mockRejectedValue(new Error("CODIGO_EQUIPO_YA_EXISTE: duplicado"));
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");
    store.actualizarCodigo("410003");
    expect((await store.guardar(async () => {})).kind).toBe("error");
    expect(store.draft?.equipo.codigo).toBe("410003");
    expect(store.saveError).toMatchObject({ codigo: "CODIGO_EQUIPO_YA_EXISTE", mensaje: "El código ingresado ya pertenece a otro equipo." });
    expect(store.canSave).toBe(true);
  });
  it("deja una sincronización recuperable si el código cambia y Storage falla", async () => {
    obtenerEquipo.mockResolvedValue({ ...equipo, filtros: [{ id: 9, equipoId: 6, tipoFiltro: { id: 2, nombre: "Aire" }, filtro: { id: 4, codigo: "AF-1", estaEnListaCompras: true }, cantidad: 1, cantidadEquivalencias: 0 }] });
    obtenerAuxiliares.mockResolvedValue(auxiliares);
    const respuesta = respuestaActualizacion("410003");
    respuesta.equipoLista.main_storage_path = "equipos/410003/main_thumb/a.webp";
    respuesta.equipoLista.tiene_imagen_main = true;
    actualizarEquipoCompleto.mockResolvedValue(respuesta);
    const store = useEquipoEngraseEdicionStore();
    await store.cargar("410002");
    store.actualizarImagenPersistida({ mainStoragePath: "equipos/410002/main_thumb/a.webp", tieneImagenMain: true, imagenActualizadaEn: "2026-08-10" });
    store.actualizarCodigo("410003");
    const resultado = await store.guardar(async () => { throw new Error("Storage no disponible"); });
    expect(resultado.kind).toBe("partial");
    expect(store.imagenSyncState).toEqual({ kind: "move_pending", sourcePath: "equipos/410002/main_thumb/a.webp", destinationPath: "equipos/410003/main_thumb/a.webp" });
    expect(store.isDirty).toBe(false);
    expect(actualizarEquipoCompleto).toHaveBeenCalledOnce();
  });
});
