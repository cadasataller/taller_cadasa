import { computed, ref, shallowRef } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import {
  filtrarTiposFiltro,
  ordenarTiposFiltro,
  resumirTiposFiltro,
} from "./tiposFiltroCatalogo.helpers";
import { normalizarCatalogoTiposFiltroError } from "./tiposFiltroCatalogo.errors";
import { tiposFiltroCatalogoService } from "./tiposFiltroCatalogo.service";
import type {
  CatalogoEstadoFiltro,
  CatalogoSortDirection,
  CatalogoTipoFiltroGuardarInput,
  CatalogoTipoFiltroItem,
  CatalogoTipoFiltroSortKey,
  CatalogoTiposFiltroResumen,
} from "./tiposFiltroCatalogo.types";
import type { CatalogoTiposFiltroError } from "./tiposFiltroCatalogo.errors";

export const useTiposFiltroCatalogoStore = defineStore(
  "dbequipos_engrase_catalogo_tipos_filtro",
  () => {
    const items = ref<CatalogoTipoFiltroItem[]>([]);
    const resumen = ref<CatalogoTiposFiltroResumen>({
      total: 0,
      activos: 0,
      desactivados: 0,
    });
    const cargado = shallowRef(false);
    const loadingInicial = shallowRef(false);
    const guardando = shallowRef(false);
    const errorInicial = shallowRef<CatalogoTiposFiltroError | null>(null);
    const errorGuardado = shallowRef<CatalogoTiposFiltroError | null>(null);
    const seleccionadoId = shallowRef<number | null>(null);
    const busqueda = shallowRef("");
    const estado = shallowRef<CatalogoEstadoFiltro>("activos");
    const sortKey = shallowRef<CatalogoTipoFiltroSortKey>("nombre");
    const sortDirection = shallowRef<CatalogoSortDirection>("asc");
    let pendingRequest: Promise<void> | null = null;

    const itemsVisibles = computed(() =>
      ordenarTiposFiltro(
        filtrarTiposFiltro(items.value, busqueda.value, estado.value),
        sortKey.value,
        sortDirection.value,
      ),
    );
    const itemSeleccionado = computed(() =>
      items.value.find((item) => item.id === seleccionadoId.value) ?? null,
    );
    const cantidadVisible = computed(() => itemsVisibles.value.length);
    const hayFiltrosActivos = computed(() =>
      Boolean(busqueda.value.trim())
      || estado.value !== "activos"
      || sortKey.value !== "nombre"
      || sortDirection.value !== "asc",
    );
    const sinResultados = computed(() =>
      cargado.value && items.value.length > 0 && itemsVisibles.value.length === 0,
    );

    function cerrarSeleccionNoVisible(): void {
      if (
        seleccionadoId.value !== null
        && !itemsVisibles.value.some((item) => item.id === seleccionadoId.value)
      ) {
        seleccionadoId.value = null;
      }
    }

    async function inicializar(force = false): Promise<void> {
      if (cargado.value && !force) return;
      if (pendingRequest && !force) return pendingRequest;
      pendingRequest = (async () => {
        loadingInicial.value = true;
        errorInicial.value = null;
        try {
          const response = await tiposFiltroCatalogoService.listar();
          items.value = response.items;
          resumen.value = response.resumen;
          cargado.value = true;
          cerrarSeleccionNoVisible();
        } catch (error) {
          errorInicial.value = normalizarCatalogoTiposFiltroError(error, "TRANSPORTE");
        } finally {
          loadingInicial.value = false;
          pendingRequest = null;
        }
      })();
      return pendingRequest;
    }

    function reintentar(): Promise<void> {
      return inicializar(true);
    }

    function seleccionar(id: number | null): void {
      if (id === null || items.value.some((item) => item.id === id)) {
        seleccionadoId.value = id;
      }
    }

    function actualizarBusqueda(value: string): void {
      busqueda.value = value;
      cerrarSeleccionNoVisible();
    }

    function actualizarEstado(value: CatalogoEstadoFiltro): void {
      estado.value = value;
      cerrarSeleccionNoVisible();
    }

    function actualizarOrden(key: CatalogoTipoFiltroSortKey): void {
      if (sortKey.value === key) {
        sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
      } else {
        sortKey.value = key;
        sortDirection.value = "asc";
      }
    }

    function limpiarFiltros(): void {
      busqueda.value = "";
      estado.value = "activos";
      sortKey.value = "nombre";
      sortDirection.value = "asc";
      cerrarSeleccionNoVisible();
    }

    function limpiarErrorGuardado(): void {
      errorGuardado.value = null;
    }

    async function guardar(
      input: CatalogoTipoFiltroGuardarInput,
    ): Promise<CatalogoTipoFiltroItem> {
      if (guardando.value) {
        throw new Error("Ya existe un guardado en curso.");
      }
      guardando.value = true;
      errorGuardado.value = null;
      try {
        const response = await tiposFiltroCatalogoService.guardar(input);
        const index = items.value.findIndex((item) => item.id === response.item.id);
        items.value = index < 0
          ? [...items.value, response.item]
          : items.value.map((item) => item.id === response.item.id ? response.item : item);
        resumen.value = resumirTiposFiltro(items.value);
        if (input.id !== null) seleccionadoId.value = response.item.id;
        cerrarSeleccionNoVisible();
        return response.item;
      } catch (error) {
        errorGuardado.value = normalizarCatalogoTiposFiltroError(error);
        throw errorGuardado.value;
      } finally {
        guardando.value = false;
      }
    }

    function reset(): void {
      items.value = [];
      resumen.value = { total: 0, activos: 0, desactivados: 0 };
      cargado.value = false;
      loadingInicial.value = false;
      guardando.value = false;
      errorInicial.value = null;
      errorGuardado.value = null;
      seleccionadoId.value = null;
      busqueda.value = "";
      estado.value = "activos";
      sortKey.value = "nombre";
      sortDirection.value = "asc";
      pendingRequest = null;
    }

    return {
      items,
      resumen,
      cargado,
      loadingInicial,
      guardando,
      errorInicial,
      errorGuardado,
      seleccionadoId,
      busqueda,
      estado,
      sortKey,
      sortDirection,
      itemsVisibles,
      itemSeleccionado,
      cantidadVisible,
      hayFiltrosActivos,
      sinResultados,
      inicializar,
      reintentar,
      seleccionar,
      actualizarBusqueda,
      actualizarEstado,
      actualizarOrden,
      limpiarFiltros,
      limpiarErrorGuardado,
      guardar,
      reset,
    };
  },
);

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTiposFiltroCatalogoStore, import.meta.hot));
}
