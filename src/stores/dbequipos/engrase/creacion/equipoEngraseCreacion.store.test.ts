import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { EquipoEngraseListItem } from "../filtrosEngrase.types";
import type { AuxiliaresEquipoEngrase } from "./equipoEngraseCreacion.types";

const obtenerAuxiliaresMock = vi.hoisted(() => vi.fn());
const validarCodigoMock = vi.hoisted(() => vi.fn());
vi.mock("./equipoEngraseCreacion.service", () => ({
  equipoEngraseCreacionService: {
    obtenerAuxiliaresEquipo: obtenerAuxiliaresMock,
    validarCodigoEquipoParaCreacion: validarCodigoMock,
  },
}));

import { useEquipoEngraseCreacionStore } from "./equipoEngraseCreacion.store";

const auxiliares: AuxiliaresEquipoEngrase = {
  tiposEquipo: [{ id: 1, nombre: "Buses", subtiposSugeridos: ["Urbano"] }],
  etapas: [{ id: 1, nombre: "Cultivo" }],
  tiposFiltro: [],
  sistemasAceite: [],
  aceites: [],
};

const equipoCreado: EquipoEngraseListItem = {
  id: 7,
  codigo: "410003",
  tipo_equipo_id: 1,
  tipo_equipo: "Buses",
  subtipo: "Urbano",
  estado: "activo",
  main_storage_path: null,
  tiene_imagen_main: false,
  imagen_actualizada_en: null,
  etapas: [{ id: 1, nombre: "Cultivo" }],
};

describe("store de creación de equipos de engrase", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("inicia vacío, con Imagen bloqueada y contadores en cero", () => {
    const store = useEquipoEngraseCreacionStore();
    expect(store.pasoActual).toBe(1);
    expect(store.mayorPasoCompletado).toBe(0);
    expect(store.auxiliares).toBeNull();
    expect(store.hasDraftContent).toBe(false);
    expect(store.isCreated).toBe(false);
    expect(store.puedeAbrirPaso(5)).toBe(false);
    expect([store.stagesCount, store.filtersCount, store.oilsCount]).toEqual([0, 0, 0]);
  });

  it("carga auxiliares sólo una vez y permite reintento después de un error", async () => {
    const store = useEquipoEngraseCreacionStore();
    obtenerAuxiliaresMock.mockResolvedValue(auxiliares);
    await store.cargarInicial();
    await store.cargarInicial();
    expect(obtenerAuxiliaresMock).toHaveBeenCalledTimes(1);
    expect(store.isReady).toBe(true);
    expect(store.auxiliares).not.toBe(auxiliares);

    store.resetCompleto();
    obtenerAuxiliaresMock.mockRejectedValueOnce(new Error("sin conexión"));
    await store.cargarInicial();
    expect(store.errorInicial).toMatchObject({ codigo: "ERROR_CARGA_AUXILIARES" });
    obtenerAuxiliaresMock.mockResolvedValueOnce(auxiliares);
    await store.reintentarCargaInicial();
    expect(store.errorInicial).toBeNull();
    expect(store.isReady).toBe(true);
  });

  it("valida manualmente el código normalizado e invalida el resultado al cambiarlo", async () => {
    const store = useEquipoEngraseCreacionStore();
    obtenerAuxiliaresMock.mockResolvedValue(auxiliares);
    await store.cargarInicial();
    store.actualizarCodigo(" 410003 ");
    expect(store.canValidateCode).toBe(true);
    validarCodigoMock.mockResolvedValue({ puedeCrearse: true });
    await store.validarCodigoActual();
    expect(validarCodigoMock).toHaveBeenCalledWith("410003");
    expect(store.draft.validacionCodigo).toEqual({ estado: "valido", codigo: "410003" });
    store.actualizarCodigo("410003A");
    expect(store.draft.validacionCodigo).toEqual({ estado: "idle" });
    store.actualizarCodigo("1234");
    expect(store.canValidateCode).toBe(false);
  });

  it("ignora una respuesta de validación obsoleta", async () => {
    const store = useEquipoEngraseCreacionStore();
    obtenerAuxiliaresMock.mockResolvedValue(auxiliares);
    await store.cargarInicial();
    let resolver: ((valor: { puedeCrearse: true }) => void) | null = null;
    validarCodigoMock.mockImplementation(() => new Promise<{ puedeCrearse: true }>((resolve) => {
      resolver = resolve;
    }));
    store.actualizarCodigo("410003");
    const validacion = store.validarCodigoActual();
    store.actualizarCodigo("410003A");
    resolver?.({ puedeCrearse: true });
    await validacion;
    expect(store.draft.validacionCodigo).toEqual({ estado: "idle" });
  });

  it("avanza sólo por pasos válidos y permite volver a pasos alcanzados", async () => {
    const store = useEquipoEngraseCreacionStore();
    obtenerAuxiliaresMock.mockResolvedValue(auxiliares);
    await store.cargarInicial();
    expect(store.avanzar()).toBe(false);
    store.actualizarCodigo("410003");
    validarCodigoMock.mockResolvedValue({ puedeCrearse: true });
    await store.validarCodigoActual();
    store.seleccionarTipoEquipo({ estado: "existente", id: 1, tempId: null, nombre: "Buses", subtiposSugeridos: [] });
    store.actualizarSubtipo("Urbano");
    store.agregarEtapa(1);
    expect(store.avanzar()).toBe(true);
    expect(store.pasoActual).toBe(2);
    expect(store.mayorPasoCompletado).toBe(1);
    expect(store.puedeAbrirPaso(3)).toBe(false);
    expect(store.irAPaso(1)).toBe(true);
    expect(store.irAPaso(2)).toBe(true);
    expect(store.avanzar()).toBe(false);
  });

  it("protege el descarte sin perder auxiliares y bloquea el borrador tras crear", async () => {
    const store = useEquipoEngraseCreacionStore();
    obtenerAuxiliaresMock.mockResolvedValue(auxiliares);
    await store.cargarInicial();
    store.actualizarCodigo("410003");
    expect(store.solicitarSalida()).toBe(false);
    expect(store.activeOverlay).toEqual({ kind: "confirmar_salida" });
    store.confirmarDescarte();
    expect(store.hasDraftContent).toBe(false);
    expect(store.auxiliares).not.toBeNull();

    store.registrarEquipoCreado(equipoCreado);
    equipoCreado.etapas[0].nombre = "Mutado";
    expect(store.pasoActual).toBe(5);
    expect(store.mayorPasoCompletado).toBe(4);
    expect(store.draft.equipoCreado?.etapas[0].nombre).toBe("Cultivo");
    expect(store.puedeAbrirPaso(1)).toBe(false);
    expect(store.retroceder()).toBe(false);
    store.actualizarCodigo("CAMBIO");
    expect(store.draft.datos.codigo).toBe("");
    expect(store.solicitarSalida()).toBe(true);
  });
});
