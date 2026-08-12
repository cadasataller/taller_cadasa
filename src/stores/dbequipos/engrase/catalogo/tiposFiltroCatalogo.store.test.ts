import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { CatalogoTipoFiltroItem } from "./tiposFiltroCatalogo.types";

const listar = vi.hoisted(() => vi.fn());
const guardar = vi.hoisted(() => vi.fn());
vi.mock("./tiposFiltroCatalogo.service", () => ({
  tiposFiltroCatalogoService: { listar, guardar },
}));

import { useTiposFiltroCatalogoStore } from "./tiposFiltroCatalogo.store";

const item = (id: number, nombre: string, activo = true): CatalogoTipoFiltroItem => ({
  id, nombre, activo, creadoEn: null, actualizadoEn: null,
  impacto: { totalEquipos: id, totalAsignaciones: id, tiposEquipo: [] },
});

describe("store del catálogo de tipos de filtro", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    listar.mockResolvedValue({
      items: [item(1, "Aire"), item(2, "Combustible", false)],
      resumen: { total: 2, activos: 1, desactivados: 1 },
    });
  });

  it("deduplica la carga y filtra sin solicitar nuevamente", async () => {
    const store = useTiposFiltroCatalogoStore();
    await Promise.all([store.inicializar(), store.inicializar()]);
    expect(listar).toHaveBeenCalledOnce();
    store.actualizarBusqueda("aire");
    store.actualizarEstado("todos");
    expect(store.itemsVisibles.map(({ id }) => id)).toEqual([1]);
    expect(listar).toHaveBeenCalledOnce();
  });

  it("restaura los filtros y cierra una selección que deja de ser visible", async () => {
    const store = useTiposFiltroCatalogoStore();
    await store.inicializar();
    store.actualizarEstado("todos");
    store.seleccionar(2);
    store.actualizarEstado("activos");
    expect(store.seleccionadoId).toBeNull();
    store.actualizarOrden("uso");
    store.limpiarFiltros();
    expect(store.$state).toMatchObject({ busqueda: "", estado: "activos", sortKey: "nombre", sortDirection: "asc" });
  });

  it("agrega creación y reemplaza actualización sin recargar", async () => {
    const store = useTiposFiltroCatalogoStore();
    await store.inicializar();
    guardar.mockResolvedValueOnce({ item: item(3, "Aceite"), operacion: "creado" });
    await store.guardar({ id: null, nombre: "Aceite", activo: true });
    expect(store.items).toHaveLength(3);
    expect(store.resumen).toEqual({ total: 3, activos: 2, desactivados: 1 });
    guardar.mockResolvedValueOnce({ item: item(1, "Aire primario", false), operacion: "actualizado" });
    store.seleccionar(1);
    await store.guardar({ id: 1, nombre: "Aire primario", activo: false });
    expect(store.items.find(({ id }) => id === 1)?.nombre).toBe("Aire primario");
    expect(store.items.filter(({ id }) => id === 1)).toHaveLength(1);
    expect(listar).toHaveBeenCalledOnce();
  });

  it("conserva los datos ante error y reset limpia el estado de sesión", async () => {
    const store = useTiposFiltroCatalogoStore();
    await store.inicializar();
    guardar.mockRejectedValueOnce(new Error("fallo de red"));

    await expect(store.guardar({ id: 1, nombre: "Aire nuevo", activo: true })).rejects.toBeTruthy();
    expect(store.items.map(({ id }) => id)).toEqual([1, 2]);
    expect(store.errorGuardado).not.toBeNull();

    store.reset();
    expect(store.items).toEqual([]);
    expect(store.$state).toMatchObject({
      cargado: false,
      busqueda: "",
      estado: "activos",
      seleccionadoId: null,
      errorGuardado: null,
    });
  });

  it("bloquea un segundo guardado concurrente", async () => {
    const store = useTiposFiltroCatalogoStore();
    let resolveSave = (_value: unknown): void => {};
    guardar.mockImplementation(() => new Promise((resolve) => { resolveSave = resolve; }));
    const first = store.guardar({ id: null, nombre: "Aire", activo: true });
    await expect(store.guardar({ id: null, nombre: "Aceite", activo: true })).rejects.toThrow(/curso/);
    resolveSave({ item: item(3, "Aire"), operacion: "creado" });
    await first;
    expect(guardar).toHaveBeenCalledOnce();
  });
});
