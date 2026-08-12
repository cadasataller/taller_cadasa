<script setup lang="ts">
import { computed, onMounted } from "vue";
import FiltrosToolbar from "@/components/engrase/catalogo/filtros/FiltrosToolbar.vue";
import FiltrosTable from "@/components/engrase/catalogo/filtros/FiltrosTable.vue";
import FiltrosMobileList from "@/components/engrase/catalogo/filtros/FiltrosMobileList.vue";
import FiltrosMobileFilterSheet from "@/components/engrase/catalogo/filtros/FiltrosMobileFilterSheet.vue";
import FiltrosListState from "@/components/engrase/catalogo/filtros/FiltrosListState.vue";
import FiltroDetailDrawer from "@/components/engrase/catalogo/filtros/FiltroDetailDrawer.vue";
import FiltroUpdateConfirmDialog from "@/components/engrase/catalogo/filtros/FiltroUpdateConfirmDialog.vue";
import FiltroUnsavedDialog from "@/components/engrase/catalogo/filtros/FiltroUnsavedDialog.vue";
import { useCatalogoFiltros } from "@/composables/engrase/catalogo/useCatalogoFiltros";
import { mensajeCatalogoFiltrosError } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.errors";
import type { CatalogoFiltroItem } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";

const catalogo = useCatalogoFiltros();
const listState = computed<"loading" | "error" | "empty" | "no-results" | null>(() => {
  if (catalogo.loadingInicial.value) return "loading";
  if (catalogo.errorInicial.value) return "error";
  if (catalogo.cargado.value && !catalogo.items.value.length) return "empty";
  if (catalogo.sinResultados.value) return "no-results";
  return null;
});
const totalLabel = computed(() => new Intl.NumberFormat("es").format(catalogo.items.value.length));
const visibleLabel = computed(() => new Intl.NumberFormat("es").format(catalogo.cantidadVisible.value));
const saveError = computed(() => mensajeCatalogoFiltrosError(catalogo.errorGuardado.value));
onMounted(() => void catalogo.inicializar());
function openItem(item: CatalogoFiltroItem, trigger: HTMLElement): void { catalogo.abrirEditar(item, trigger); }
</script>

<template>
  <section class="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-gray-200 bg-[#FAF9F5] shadow-sm">
    <div
      class="min-w-0 flex-1 p-3 sm:p-4 lg:flex lg:min-h-0 lg:flex-col"
      :class="catalogo.drawerOpen.value ? 'lg:pr-[calc(clamp(340px,30vw,420px)+1rem)]' : ''"
    >
      <FiltrosToolbar :busqueda="catalogo.busqueda.value" :tipo-filtro-id="catalogo.tipoFiltroId.value" :compras="catalogo.compras.value" :estado="catalogo.estado.value" :tipos-filtro="catalogo.opcionesTiposFiltro.value" :can-clear="catalogo.hayFiltrosActivos.value" @update-busqueda="catalogo.actualizarBusqueda" @update-tipo-filtro="catalogo.actualizarTipoFiltro" @update-compras="catalogo.actualizarCompras" @update-estado="catalogo.actualizarEstado" @open-filters="catalogo.filtrosMobileAbiertos.value = true" @clear="catalogo.limpiarFiltros" @create="catalogo.abrirCrear" />
      <header class="mt-4 border-t border-gray-200 pt-3"><h2 data-catalogo-filtros-heading tabindex="-1" class="text-sm font-bold text-main">Filtros</h2><p class="text-xs text-gray-500" aria-live="polite">{{ visibleLabel }} resultados</p></header>
      <div class="mt-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1"><FiltrosListState v-if="listState" :kind="listState" :message="mensajeCatalogoFiltrosError(catalogo.errorInicial.value)" @retry="catalogo.reintentar" @clear="catalogo.limpiarFiltros" @create="catalogo.abrirCrear" /><template v-else><FiltrosTable :items="catalogo.itemsVisibles.value" :selected-id="catalogo.seleccionadoId.value" :sort-key="catalogo.sortKey.value" :sort-direction="catalogo.sortDirection.value" @select="openItem" @sort="catalogo.actualizarOrden" /><FiltrosMobileList :items="catalogo.itemsVisibles.value" :selected-id="catalogo.seleccionadoId.value" @select="openItem" /><p class="mt-3 text-xs tabular-nums text-gray-500">Mostrando {{ visibleLabel }} de {{ totalLabel }} filtros</p></template></div>
    </div>
    <FiltrosMobileFilterSheet v-if="catalogo.filtrosMobileAbiertos.value" :open="catalogo.filtrosMobileAbiertos.value" :tipo-filtro-id="catalogo.tipoFiltroId.value" :compras="catalogo.compras.value" :estado="catalogo.estado.value" :tipos-filtro="catalogo.opcionesTiposFiltro.value" :result-count="catalogo.cantidadVisible.value" @close="catalogo.filtrosMobileAbiertos.value = false" @reset="catalogo.limpiarFiltros" @update-tipo-filtro="catalogo.actualizarTipoFiltro" @update-compras="catalogo.actualizarCompras" @update-estado="catalogo.actualizarEstado" />
    <FiltroDetailDrawer :open="catalogo.drawerOpen.value" :mode="catalogo.modo.value" :item="catalogo.original.value" :draft="catalogo.draft.value" :has-changes="catalogo.hasChanges.value" :can-submit="catalogo.canSubmit.value" :saving="catalogo.guardando.value" :field-errors="catalogo.fieldErrors.value" :save-error="saveError" @update-draft="catalogo.updateDraft" @blur-code="catalogo.validateCode" @request-close="catalogo.solicitarCierre" @cancel="catalogo.solicitarCierre" @submit="catalogo.submit" />
    <FiltroUpdateConfirmDialog v-if="catalogo.confirmacionAbierta.value && catalogo.original.value && catalogo.draft.value" :original="catalogo.original.value" :draft="catalogo.draft.value" :saving="catalogo.guardando.value" @cancel="catalogo.cancelarConfirmacion" @confirm="catalogo.confirmarActualizacion" />
    <FiltroUnsavedDialog v-if="catalogo.confirmarDescarteAbierto.value" @cancel="catalogo.cancelarDescarte" @discard="catalogo.cerrarAhora" />
    <div class="pointer-events-none fixed right-4 top-4 z-[90]" aria-live="polite" aria-atomic="true"><p v-if="catalogo.successMessage.value" class="rounded-md border border-success/25 bg-white px-4 py-3 text-sm font-semibold text-success shadow-lg">{{ catalogo.successMessage.value }}</p></div>
  </section>
</template>
