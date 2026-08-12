import { computed, ref, shallowRef } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import {
  filtrarCatalogoFiltros, obtenerOpcionesTiposFiltro, ordenarCatalogoFiltros, resumirCatalogoFiltros,
} from "./filtrosCatalogo.helpers";
import { normalizarCatalogoFiltrosError } from "./filtrosCatalogo.errors";
import { filtrosCatalogoService } from "./filtrosCatalogo.service";
import type { CatalogoFiltrosError } from "./filtrosCatalogo.errors";
import type {
  CatalogoFiltroCompras, CatalogoFiltroEstado, CatalogoFiltroGuardarInput, CatalogoFiltroItem,
  CatalogoFiltrosResumen, CatalogoFiltroSortKey, CatalogoSortDirection,
} from "./filtrosCatalogo.types";

export const useFiltrosCatalogoStore = defineStore("dbequipos_engrase_catalogo_filtros", () => {
  const items = ref<CatalogoFiltroItem[]>([]);
  const resumen = ref<CatalogoFiltrosResumen>({ total: 0, activos: 0, desactivados: 0, enCompras: 0, fueraCompras: 0 });
  const cargado = shallowRef(false);
  const loadingInicial = shallowRef(false);
  const guardando = shallowRef(false);
  const errorInicial = shallowRef<CatalogoFiltrosError | null>(null);
  const errorGuardado = shallowRef<CatalogoFiltrosError | null>(null);
  const seleccionadoId = shallowRef<number | null>(null);
  const busqueda = shallowRef("");
  const tipoFiltroId = shallowRef<number | null>(null);
  const compras = shallowRef<CatalogoFiltroCompras>("todos");
  const estado = shallowRef<CatalogoFiltroEstado>("activos");
  const sortKey = shallowRef<CatalogoFiltroSortKey>("codigo");
  const sortDirection = shallowRef<CatalogoSortDirection>("asc");
  let pendingRequest: Promise<void> | null = null;

  const filteredItems = computed(() => filtrarCatalogoFiltros(items.value, {
    busqueda: busqueda.value, tipoFiltroId: tipoFiltroId.value, compras: compras.value, estado: estado.value,
  }));
  const itemsVisibles = computed(() => ordenarCatalogoFiltros(filteredItems.value, sortKey.value, sortDirection.value));
  const itemSeleccionado = computed(() => items.value.find(({ id }) => id === seleccionadoId.value) ?? null);
  const cantidadVisible = computed(() => itemsVisibles.value.length);
  const opcionesTiposFiltro = computed(() => obtenerOpcionesTiposFiltro(items.value));
  const hayFiltrosActivos = computed(() => Boolean(busqueda.value.trim())
    || tipoFiltroId.value !== null || compras.value !== "todos" || estado.value !== "activos"
    || sortKey.value !== "codigo" || sortDirection.value !== "asc");
  const sinResultados = computed(() => cargado.value && items.value.length > 0 && itemsVisibles.value.length === 0);

  function cerrarSeleccionNoVisible(): void {
    if (seleccionadoId.value !== null && !itemsVisibles.value.some(({ id }) => id === seleccionadoId.value)) {
      seleccionadoId.value = null;
    }
  }

  async function inicializar(force = false): Promise<void> {
    if (pendingRequest) return pendingRequest;
    if (cargado.value && !force) return;
    pendingRequest = (async () => {
      loadingInicial.value = true;
      errorInicial.value = null;
      try {
        const response = await filtrosCatalogoService.listar();
        items.value = response.items;
        resumen.value = response.resumen;
        cargado.value = true;
        cerrarSeleccionNoVisible();
      } catch (error) {
        errorInicial.value = normalizarCatalogoFiltrosError(error, "TRANSPORTE");
      } finally {
        loadingInicial.value = false;
        pendingRequest = null;
      }
    })();
    return pendingRequest;
  }

  const reintentar = (): Promise<void> => inicializar(true);
  function seleccionar(id: number | null): void {
    if (id === null || items.value.some((item) => item.id === id)) seleccionadoId.value = id;
  }
  function actualizarBusqueda(value: string): void { busqueda.value = value; cerrarSeleccionNoVisible(); }
  function actualizarTipoFiltro(value: number | null): void { tipoFiltroId.value = value; cerrarSeleccionNoVisible(); }
  function actualizarCompras(value: CatalogoFiltroCompras): void { compras.value = value; cerrarSeleccionNoVisible(); }
  function actualizarEstado(value: CatalogoFiltroEstado): void { estado.value = value; cerrarSeleccionNoVisible(); }
  function actualizarOrden(key: CatalogoFiltroSortKey): void {
    if (sortKey.value === key) sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    else { sortKey.value = key; sortDirection.value = "asc"; }
  }
  function limpiarFiltros(): void {
    busqueda.value = ""; tipoFiltroId.value = null; compras.value = "todos"; estado.value = "activos";
    sortKey.value = "codigo"; sortDirection.value = "asc"; cerrarSeleccionNoVisible();
  }
  function limpiarErrorGuardado(): void { errorGuardado.value = null; }

  async function guardar(input: CatalogoFiltroGuardarInput): Promise<CatalogoFiltroItem> {
    if (guardando.value) throw new Error("Ya existe un guardado en curso.");
    guardando.value = true;
    errorGuardado.value = null;
    try {
      const response = await filtrosCatalogoService.guardar(input);
      const exists = items.value.some(({ id }) => id === response.item.id);
      items.value = exists
        ? items.value.map((item) => item.id === response.item.id ? response.item : item)
        : [...items.value, response.item];
      resumen.value = resumirCatalogoFiltros(items.value);
      if (input.id !== null) seleccionadoId.value = response.item.id;
      cerrarSeleccionNoVisible();
      return response.item;
    } catch (error) {
      errorGuardado.value = normalizarCatalogoFiltrosError(error);
      throw errorGuardado.value;
    } finally { guardando.value = false; }
  }

  function reset(): void {
    items.value = [];
    resumen.value = { total: 0, activos: 0, desactivados: 0, enCompras: 0, fueraCompras: 0 };
    cargado.value = false; loadingInicial.value = false; guardando.value = false;
    errorInicial.value = null; errorGuardado.value = null; seleccionadoId.value = null;
    limpiarFiltros(); pendingRequest = null;
  }

  return {
    items, resumen, cargado, loadingInicial, guardando, errorInicial, errorGuardado, seleccionadoId,
    busqueda, tipoFiltroId, compras, estado, sortKey, sortDirection, itemsVisibles, itemSeleccionado,
    cantidadVisible, opcionesTiposFiltro, hayFiltrosActivos, sinResultados, inicializar, reintentar,
    seleccionar, actualizarBusqueda, actualizarTipoFiltro, actualizarCompras, actualizarEstado,
    actualizarOrden, limpiarFiltros, limpiarErrorGuardado, guardar, reset,
  };
});

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useFiltrosCatalogoStore, import.meta.hot));
