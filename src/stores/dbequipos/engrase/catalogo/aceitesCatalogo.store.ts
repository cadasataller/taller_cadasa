import { computed, ref, shallowRef } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { filtrarCatalogoAceites, obtenerOpcionesSistemas, ordenarCatalogoAceites, resumirCatalogoAceites } from "./aceitesCatalogo.helpers";
import { normalizarCatalogoAceitesError } from "./aceitesCatalogo.errors";
import { aceitesCatalogoService } from "./aceitesCatalogo.service";
import type { CatalogoAceitesError } from "./aceitesCatalogo.errors";
import type { CatalogoAceiteEstado, CatalogoAceiteGuardarInput, CatalogoAceiteItem, CatalogoAceitesResumen, CatalogoAceiteSortKey, CatalogoAceiteUso, CatalogoSortDirection } from "./aceitesCatalogo.types";

export const useAceitesCatalogoStore = defineStore("dbequipos_engrase_catalogo_aceites", () => {
  const items = ref<CatalogoAceiteItem[]>([]);
  const resumen = ref<CatalogoAceitesResumen>({ total: 0, activos: 0, desactivados: 0 });
  const cargado = shallowRef(false); const loadingInicial = shallowRef(false); const guardando = shallowRef(false);
  const errorInicial = shallowRef<CatalogoAceitesError | null>(null); const errorGuardado = shallowRef<CatalogoAceitesError | null>(null);
  const seleccionadoId = shallowRef<number | null>(null); const busqueda = shallowRef(""); const sistemaId = shallowRef<number | null>(null);
  const estado = shallowRef<CatalogoAceiteEstado>("activos"); const uso = shallowRef<CatalogoAceiteUso>("todos");
  const sortKey = shallowRef<CatalogoAceiteSortKey>("nombre"); const sortDirection = shallowRef<CatalogoSortDirection>("asc");
  let pendingRequest: Promise<void> | null = null;
  const itemsVisibles = computed(() => ordenarCatalogoAceites(filtrarCatalogoAceites(items.value, { busqueda: busqueda.value, sistemaId: sistemaId.value, estado: estado.value, uso: uso.value }), sortKey.value, sortDirection.value));
  const itemSeleccionado = computed(() => items.value.find(({ id }) => id === seleccionadoId.value) ?? null);
  const cantidadVisible = computed(() => itemsVisibles.value.length);
  const opcionesSistema = computed(() => obtenerOpcionesSistemas(items.value));
  const hayFiltrosActivos = computed(() => Boolean(busqueda.value.trim()) || sistemaId.value !== null || estado.value !== "activos" || uso.value !== "todos" || sortKey.value !== "nombre" || sortDirection.value !== "asc");
  const sinResultados = computed(() => cargado.value && items.value.length > 0 && itemsVisibles.value.length === 0);
  function cerrarSeleccionNoVisible(): void { if (seleccionadoId.value !== null && !itemsVisibles.value.some(({ id }) => id === seleccionadoId.value)) seleccionadoId.value = null; }
  async function inicializar(force = false): Promise<void> { if (pendingRequest) return pendingRequest; if (cargado.value && !force) return; pendingRequest = (async () => { loadingInicial.value = true; errorInicial.value = null; try { const response = await aceitesCatalogoService.listar(); items.value = response.items; resumen.value = response.resumen; cargado.value = true; cerrarSeleccionNoVisible(); } catch (error) { errorInicial.value = normalizarCatalogoAceitesError(error, "TRANSPORTE"); } finally { loadingInicial.value = false; pendingRequest = null; } })(); return pendingRequest; }
  const reintentar = (): Promise<void> => inicializar(true);
  function seleccionar(id: number | null): void { if (id === null || items.value.some((item) => item.id === id)) seleccionadoId.value = id; }
  function actualizarBusqueda(value: string): void { busqueda.value = value; cerrarSeleccionNoVisible(); }
  function actualizarSistema(value: number | null): void { sistemaId.value = value; cerrarSeleccionNoVisible(); }
  function actualizarEstado(value: CatalogoAceiteEstado): void { estado.value = value; cerrarSeleccionNoVisible(); }
  function actualizarUso(value: CatalogoAceiteUso): void { uso.value = value; cerrarSeleccionNoVisible(); }
  function actualizarOrden(key: CatalogoAceiteSortKey): void { if (sortKey.value === key) sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"; else { sortKey.value = key; sortDirection.value = "asc"; } }
  function limpiarFiltros(): void { busqueda.value = ""; sistemaId.value = null; estado.value = "activos"; uso.value = "todos"; sortKey.value = "nombre"; sortDirection.value = "asc"; cerrarSeleccionNoVisible(); }
  function limpiarErrorGuardado(): void { errorGuardado.value = null; }
  async function guardar(input: CatalogoAceiteGuardarInput): Promise<CatalogoAceiteItem> { if (guardando.value) throw new Error("Ya existe un guardado en curso."); guardando.value = true; errorGuardado.value = null; try { const response = await aceitesCatalogoService.guardar(input); const exists = items.value.some(({ id }) => id === response.item.id); items.value = exists ? items.value.map((item) => item.id === response.item.id ? response.item : item) : [...items.value, response.item]; resumen.value = resumirCatalogoAceites(items.value); if (input.id !== null) seleccionadoId.value = response.item.id; cerrarSeleccionNoVisible(); return response.item; } catch (error) { errorGuardado.value = normalizarCatalogoAceitesError(error); throw errorGuardado.value; } finally { guardando.value = false; } }
  function reset(): void { items.value = []; resumen.value = { total: 0, activos: 0, desactivados: 0 }; cargado.value = false; loadingInicial.value = false; guardando.value = false; errorInicial.value = null; errorGuardado.value = null; seleccionadoId.value = null; limpiarFiltros(); pendingRequest = null; }
  return { items, resumen, cargado, loadingInicial, guardando, errorInicial, errorGuardado, seleccionadoId, busqueda, sistemaId, estado, uso, sortKey, sortDirection, itemsVisibles, itemSeleccionado, cantidadVisible, opcionesSistema, hayFiltrosActivos, sinResultados, inicializar, reintentar, seleccionar, actualizarBusqueda, actualizarSistema, actualizarEstado, actualizarUso, actualizarOrden, limpiarFiltros, limpiarErrorGuardado, guardar, reset };
});
if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useAceitesCatalogoStore, import.meta.hot));
