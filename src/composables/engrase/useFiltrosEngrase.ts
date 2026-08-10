import { onBeforeUnmount, watch } from "vue";
import { storeToRefs } from "pinia";
import { useFiltrosEngraseStore } from "@/stores/dbequipos/engrase/filtrosEngrase.store";
import type {
  FiltroCodigoSugerencia,
  FiltrosEngraseQuery,
} from "@/stores/dbequipos/engrase/filtrosEngrase.types";

export function useFiltrosEngrase() {
  const store = useFiltrosEngraseStore();
  const state = storeToRefs(store);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function buscarCodigo(texto: string): void {
    if (timer) clearTimeout(timer);
    if (texto.trim().length < 2) {
      store.limpiarSugerencias();
      return;
    }
    timer = setTimeout(() => {
      store.buscarSugerencias(texto).catch(() => {});
    }, 300);
  }

  function actualizarFiltros(filters: Partial<FiltrosEngraseQuery>) {
    return store.actualizarFiltros(filters);
  }

  function seleccionarCodigo(sugerencia: FiltroCodigoSugerencia) {
    return store.seleccionarCodigoExacto(sugerencia);
  }

  watch(
    () => state.filtrosAplicados.value.codigoExactoSeleccionado,
    () => {
      if (timer) clearTimeout(timer);
      store.limpiarSugerencias();
    },
  );

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
  });

  return {
    ...state,
    inicializar: store.inicializar,
    actualizarFiltros,
    buscarCodigo,
    seleccionarCodigo,
    limpiarCodigo: store.limpiarCodigoSeleccionado,
    limpiarFiltros: store.limpiarFiltros,
    seleccionarEquipo: store.seleccionarEquipo,
    seleccionarFiltro: store.seleccionarFiltro,
    cargarImagenEquipo: store.cargarImagenEquipo,
    reintentar: store.reintentarCarga,
  };
}
