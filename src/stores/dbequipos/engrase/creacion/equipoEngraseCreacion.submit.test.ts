import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ErrorCreacionEquipo } from "./equipoEngraseCreacion.remote-errors";
import type {
  AuxiliaresEquipoEngrase,
  CrearEquipoCompletoRespuesta,
} from "./equipoEngraseCreacion.types";

const obtenerAuxiliaresMock = vi.hoisted(() => vi.fn());
const crearEquipoCompletoMock = vi.hoisted(() => vi.fn());

vi.mock("./equipoEngraseCreacion.service", () => ({
  equipoEngraseCreacionService: {
    obtenerAuxiliaresEquipo: obtenerAuxiliaresMock,
    crearEquipoCompleto: crearEquipoCompletoMock,
  },
}));

import { useEquipoEngraseCreacionStore } from "./equipoEngraseCreacion.store";
import { useFiltrosEngraseStore } from "../filtrosEngrase.store";

const auxiliares: AuxiliaresEquipoEngrase = {
  tiposEquipo: [{ id: 1, nombre: "Buses", subtiposSugeridos: [] }],
  etapas: [{ id: 1, nombre: "Cultivo" }],
  tiposFiltro: [],
  sistemasAceite: [],
  aceites: [],
};

const respuesta: CrearEquipoCompletoRespuesta = {
  codigo: "EQUIPO_CREADO",
  mensaje: "Equipo creado.",
  equipoLista: {
    id: 10,
    codigo: "410003",
    tipo_equipo_id: 2,
    tipo_equipo: "Equipo nuevo",
    subtipo: "Urbano",
    estado: "activo",
    main_storage_path: null,
    tiene_imagen_main: false,
    imagen_actualizada_en: null,
    etapas: [{ id: 1, nombre: "Cultivo" }],
  },
  resumenOperaciones: { etapasAgregadas: 1, filtrosAgregados: 1, aceitesAgregados: 0 },
};

async function prepararBorradorValido() {
  const store = useEquipoEngraseCreacionStore();
  obtenerAuxiliaresMock.mockResolvedValue(auxiliares);
  await store.cargarInicial();
  store.actualizarCodigo("410003");
  store.draft.validacionCodigo = { estado: "valido", codigo: "410003" };
  store.seleccionarTipoEquipo({ estado: "existente", id: 1, tempId: null, nombre: "Buses", subtiposSugeridos: [] });
  store.actualizarSubtipo("Urbano");
  store.agregarEtapa(1);
  store.draft.filtros = [{
    draftId: "filtro-1",
    tipoFiltro: { estado: "existente", id: 1, tempId: null, nombre: "Aceite" },
    filtro: { estado: "existente", id: 1, tempId: null, codigo: "P550", estaEnListaCompras: false },
    cantidad: 1,
  }];
  store.avanzar();
  store.avanzar();
  store.avanzar();
  return store;
}

describe("submit transaccional de creación", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("bloquea sincrónicamente el segundo submit y las mutaciones", async () => {
    const store = await prepararBorradorValido();
    let resolver: (value: CrearEquipoCompletoRespuesta) => void = () => undefined;
    crearEquipoCompletoMock.mockImplementation(() => new Promise<CrearEquipoCompletoRespuesta>((resolve) => {
      resolver = resolve;
    }));

    const primero = store.crearEquipo();
    expect(store.submitState).toEqual({ kind: "creating" });
    expect(await store.crearEquipo()).toEqual({ kind: "busy" });
    store.actualizarSubtipo("No debe cambiar");
    expect(store.draft.datos.subtipo).toBe("Urbano");
    expect(store.retroceder()).toBe(false);

    resolver(respuesta);
    await expect(primero).resolves.toMatchObject({ kind: "success" });
  });

  it("inserta una copia local, reconcilia catálogos y bloquea el wizard tras éxito", async () => {
    const store = await prepararBorradorValido();
    crearEquipoCompletoMock.mockResolvedValue(respuesta);

    await expect(store.crearEquipo()).resolves.toMatchObject({ kind: "success" });
    const listado = useFiltrosEngraseStore();
    expect(listado.equipos).toHaveLength(1);
    expect(listado.tiposEquipo).toContainEqual({ id: 2, nombre: "Equipo nuevo" });
    expect(listado.aplicarEquipoCreado(respuesta.equipoLista)).toEqual({ kind: "applied" });
    expect(listado.equipos).toHaveLength(1);
    expect(store.pasoActual).toBe(5);
    expect(store.creationSummary).toEqual(respuesta.resumenOperaciones);
    respuesta.equipoLista.etapas[0].nombre = "Mutada";
    expect(listado.equipos[0].etapas[0].nombre).toBe("Cultivo");
    expect(store.draft.equipoCreado?.etapas[0].nombre).toBe("Cultivo");
    await expect(store.crearEquipo()).resolves.toEqual({ kind: "already_created" });
  });

  it("conserva la creación remota cuando la lista tiene un conflicto local de código", async () => {
    const store = await prepararBorradorValido();
    const listado = useFiltrosEngraseStore();
    listado.equipos = [{ ...respuesta.equipoLista, id: 99, etapas: [] }];
    crearEquipoCompletoMock.mockResolvedValue(respuesta);

    await expect(store.crearEquipo()).resolves.toMatchObject({ kind: "success" });
    expect(listado.equipos).toHaveLength(1);
    expect(store.draft.equipoCreado?.id).toBe(10);
    expect(store.submitState).toMatchObject({ kind: "success_with_local_warning" });
  });

  it("conserva el borrador y desbloquea el reintento ante un error RPC", async () => {
    const store = await prepararBorradorValido();
    crearEquipoCompletoMock.mockRejectedValue(new ErrorCreacionEquipo(
      "EQUIPO_YA_EXISTE_EN_ENGRASE",
      "Código ocupado",
    ));

    await expect(store.crearEquipo()).resolves.toMatchObject({ kind: "error" });
    expect(store.draft.equipoCreado).toBeNull();
    expect(store.draft.validacionCodigo.estado).toBe("invalido");
    expect(store.submitState).toMatchObject({ kind: "error", codigo: "EQUIPO_YA_EXISTE_EN_ENGRASE" });
    expect(store.isInteractionLocked).toBe(false);
    expect(store.validationErrors).toContainEqual(expect.objectContaining({ paso: 1 }));
  });
});
