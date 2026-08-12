import { computed, ref, shallowRef } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import { filtrarCatalogoSistemas, ordenarCatalogoSistemas, resumirCatalogoSistemas } from "./sistemasCatalogo.helpers";
import { normalizarCatalogoSistemasError } from "./sistemasCatalogo.errors";
import { sistemasCatalogoService } from "./sistemasCatalogo.service";
import type { CatalogoSistemasError } from "./sistemasCatalogo.errors";
import type { CatalogoSistemaEstado, CatalogoSistemaGuardarInput, CatalogoSistemaItem, CatalogoSistemasResumen, CatalogoSistemaSortKey, CatalogoSistemaUso, CatalogoSortDirection } from "./sistemasCatalogo.types";

export const useSistemasCatalogoStore = defineStore("dbequipos_engrase_catalogo_sistemas", () => {
  const items = ref<CatalogoSistemaItem[]>([]); const resumen = ref<CatalogoSistemasResumen>({ total: 0, activos: 0, desactivados: 0 });
  const cargado = shallowRef(false); const loadingInicial = shallowRef(false); const guardando = shallowRef(false);
  const errorInicial = shallowRef<CatalogoSistemasError | null>(null); const errorGuardado = shallowRef<CatalogoSistemasError | null>(null);
  const seleccionadoId = shallowRef<number | null>(null); const busqueda = shallowRef(""); const estado = shallowRef<CatalogoSistemaEstado>("activos"); const uso = shallowRef<CatalogoSistemaUso>("todos");
  const sortKey = shallowRef<CatalogoSistemaSortKey>("nombre"); const sortDirection = shallowRef<CatalogoSortDirection>("asc"); let pendingRequest: Promise<void> | null = null;
  const itemsVisibles = computed(() => ordenarCatalogoSistemas(filtrarCatalogoSistemas(items.value, { busqueda: busqueda.value, estado: estado.value, uso: uso.value }), sortKey.value, sortDirection.value));
  const itemSeleccionado = computed(() => items.value.find(({ id }) => id === seleccionadoId.value) ?? null);
  const cantidadVisible = computed(() => itemsVisibles.value.length);
  const hayFiltrosActivos = computed(() => Boolean(busqueda.value.trim()) || estado.value !== "activos" || uso.value !== "todos" || sortKey.value !== "nombre" || sortDirection.value !== "asc");
  const sinResultados = computed(() => cargado.value && items.value.length > 0 && itemsVisibles.value.length === 0);
  function cerrarSeleccionNoVisible(): void { if (seleccionadoId.value !== null && !itemsVisibles.value.some(({ id }) => id === seleccionadoId.value)) seleccionadoId.value = null; }
  async function inicializar(force = false): Promise<void> { if (pendingRequest) return pendingRequest; if (cargado.value && !force) return; pendingRequest = (async () => { loadingInicial.value = true; errorInicial.value = null; try { const response = await sistemasCatalogoService.listar(); items.value = response.items; resumen.value = response.resumen; cargado.value = true; cerrarSeleccionNoVisible(); } catch (error) { errorInicial.value = normalizarCatalogoSistemasError(error, "TRANSPORTE"); } finally { loadingInicial.value = false; pendingRequest = null; } })(); return pendingRequest; }
  const reintentar = (): Promise<void> => inicializar(true);
  function seleccionar(id: number | null): void { if (id === null || items.value.some((item) => item.id === id)) seleccionadoId.value = id; }
  function actualizarBusqueda(value: string): void { busqueda.value = value; cerrarSeleccionNoVisible(); }
  function actualizarEstado(value: CatalogoSistemaEstado): void { estado.value = value; cerrarSeleccionNoVisible(); }
  function actualizarUso(value: CatalogoSistemaUso): void { uso.value = value; cerrarSeleccionNoVisible(); }
  function actualizarOrden(key: CatalogoSistemaSortKey): void { if (sortKey.value === key) sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"; else { sortKey.value = key; sortDirection.value = "asc"; } }
  function limpiarFiltros(): void { busqueda.value = ""; estado.value = "activos"; uso.value = "todos"; sortKey.value = "nombre"; sortDirection.value = "asc"; cerrarSeleccionNoVisible(); }
  function limpiarErrorGuardado(): void { errorGuardado.value = null; }
  async function guardar(input: CatalogoSistemaGuardarInput): Promise<CatalogoSistemaItem> { if (guardando.value) throw new Error("Ya existe un guardado en curso."); guardando.value = true; errorGuardado.value = null; try { const response = await sistemasCatalogoService.guardar(input); const exists = items.value.some(({ id }) => id === response.item.id); items.value = exists ? items.value.map((item) => item.id === response.item.id ? response.item : item) : [...items.value, response.item]; resumen.value = resumirCatalogoSistemas(items.value); if (input.id !== null) seleccionadoId.value = response.item.id; cerrarSeleccionNoVisible(); return response.item; } catch (error) { errorGuardado.value = normalizarCatalogoSistemasError(error); throw errorGuardado.value; } finally { guardando.value = false; } }
  function reset(): void { items.value = []; resumen.value = { total: 0, activos: 0, desactivados: 0 }; cargado.value = false; loadingInicial.value = false; guardando.value = false; errorInicial.value = null; errorGuardado.value = null; seleccionadoId.value = null; limpiarFiltros(); pendingRequest = null; }
  return { items, resumen, cargado, loadingInicial, guardando, errorInicial, errorGuardado, seleccionadoId, busqueda, estado, uso, sortKey, sortDirection, itemsVisibles, itemSeleccionado, cantidadVisible, hayFiltrosActivos, sinResultados, inicializar, reintentar, seleccionar, actualizarBusqueda, actualizarEstado, actualizarUso, actualizarOrden, limpiarFiltros, limpiarErrorGuardado, guardar, reset };
});
if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useSistemasCatalogoStore, import.meta.hot));
