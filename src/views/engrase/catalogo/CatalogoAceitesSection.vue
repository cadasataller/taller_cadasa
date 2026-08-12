<script setup lang="ts">
import { computed, onMounted } from "vue";
import AceitesToolbar from "@/components/engrase/catalogo/aceites/AceitesToolbar.vue";
import AceitesTable from "@/components/engrase/catalogo/aceites/AceitesTable.vue";
import AceitesMobileList from "@/components/engrase/catalogo/aceites/AceitesMobileList.vue";
import AceitesMobileFilterSheet from "@/components/engrase/catalogo/aceites/AceitesMobileFilterSheet.vue";
import AceitesListState from "@/components/engrase/catalogo/aceites/AceitesListState.vue";
import AceiteDetailDrawer from "@/components/engrase/catalogo/aceites/AceiteDetailDrawer.vue";
import AceiteUpdateConfirmDialog from "@/components/engrase/catalogo/aceites/AceiteUpdateConfirmDialog.vue";
import AceiteUnsavedDialog from "@/components/engrase/catalogo/aceites/AceiteUnsavedDialog.vue";
import { useCatalogoAceites } from "@/composables/engrase/catalogo/useCatalogoAceites";
import { mensajeCatalogoAceitesError } from "@/stores/dbequipos/engrase/catalogo/aceitesCatalogo.errors";
import type { CatalogoAceiteItem } from "@/stores/dbequipos/engrase/catalogo/aceitesCatalogo.types";

const catalogo = useCatalogoAceites();
const listState = computed<"loading" | "error" | "empty" | "no-results" | null>(() => {
  if (catalogo.loadingInicial.value) return "loading";
  if (catalogo.errorInicial.value) return "error";
  if (catalogo.cargado.value && !catalogo.items.value.length) return "empty";
  return catalogo.sinResultados.value ? "no-results" : null;
});
const totalLabel = computed(() => new Intl.NumberFormat("es").format(catalogo.items.value.length));
const visibleLabel = computed(() => new Intl.NumberFormat("es").format(catalogo.cantidadVisible.value));
const saveError = computed(() => mensajeCatalogoAceitesError(catalogo.errorGuardado.value));
onMounted(() => void catalogo.inicializar());
function openItem(item: CatalogoAceiteItem, trigger: HTMLElement): void { catalogo.abrirEditar(item, trigger); }
</script>

<template>
  <section class="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-gray-200 bg-[#FAF9F5] shadow-sm">
    <div class="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4" :class="catalogo.drawerOpen.value ? 'lg:pr-[calc(clamp(340px,30vw,420px)+1rem)]' : ''">
      <AceitesToolbar :busqueda="catalogo.busqueda.value" :sistema-id="catalogo.sistemaId.value" :estado="catalogo.estado.value" :uso="catalogo.uso.value" :sistemas="catalogo.opcionesSistema.value" :can-clear="catalogo.hayFiltrosActivos.value" @update-busqueda="catalogo.actualizarBusqueda" @update-sistema="catalogo.actualizarSistema" @update-estado="catalogo.actualizarEstado" @update-uso="catalogo.actualizarUso" @open-filters="catalogo.filtrosMobileAbiertos.value = true" @clear="catalogo.limpiarFiltros" @create="catalogo.abrirCrear" />
      <header class="mt-4 border-t border-gray-200 pt-3"><h2 data-catalogo-aceites-heading tabindex="-1" class="text-sm font-bold text-main">Aceites</h2><p class="text-xs text-gray-500" aria-live="polite">{{ visibleLabel }} resultados</p></header>
      <div class="mt-3"><AceitesListState v-if="listState" :kind="listState" :message="mensajeCatalogoAceitesError(catalogo.errorInicial.value)" @retry="catalogo.reintentar" @clear="catalogo.limpiarFiltros" @create="catalogo.abrirCrear" /><template v-else><AceitesTable :items="catalogo.itemsVisibles.value" :selected-id="catalogo.seleccionadoId.value" :sort-key="catalogo.sortKey.value" :sort-direction="catalogo.sortDirection.value" @select="openItem" @sort="catalogo.actualizarOrden" /><AceitesMobileList :items="catalogo.itemsVisibles.value" :selected-id="catalogo.seleccionadoId.value" @select="openItem" /><p class="mt-3 text-xs tabular-nums text-gray-500">Mostrando {{ visibleLabel }} de {{ totalLabel }} aceites</p></template></div>
    </div>
    <AceitesMobileFilterSheet v-if="catalogo.filtrosMobileAbiertos.value" :open="catalogo.filtrosMobileAbiertos.value" :sistema-id="catalogo.sistemaId.value" :estado="catalogo.estado.value" :uso="catalogo.uso.value" :sistemas="catalogo.opcionesSistema.value" :result-count="catalogo.cantidadVisible.value" @close="catalogo.filtrosMobileAbiertos.value = false" @reset="catalogo.limpiarFiltros" @update-sistema="catalogo.actualizarSistema" @update-estado="catalogo.actualizarEstado" @update-uso="catalogo.actualizarUso" />
    <AceiteDetailDrawer :open="catalogo.drawerOpen.value" :mode="catalogo.modo.value" :item="catalogo.original.value" :draft="catalogo.draft.value" :has-changes="catalogo.hasChanges.value" :can-submit="catalogo.canSubmit.value" :saving="catalogo.guardando.value" :field-errors="catalogo.fieldErrors.value" :save-error="saveError" @update-draft="catalogo.updateDraft" @blur-name="catalogo.validateName" @request-close="catalogo.solicitarCierre" @cancel="catalogo.solicitarCierre" @submit="catalogo.submit" />
    <AceiteUpdateConfirmDialog v-if="catalogo.confirmacionAbierta.value && catalogo.original.value && catalogo.draft.value" :original="catalogo.original.value" :draft="catalogo.draft.value" :saving="catalogo.guardando.value" @cancel="catalogo.cancelarConfirmacion" @confirm="catalogo.confirmarActualizacion" />
    <AceiteUnsavedDialog v-if="catalogo.confirmarDescarteAbierto.value" @cancel="catalogo.cancelarDescarte" @discard="catalogo.cerrarAhora" />
    <div class="pointer-events-none fixed right-4 top-4 z-[90]" aria-live="polite"><p v-if="catalogo.successMessage.value" class="rounded-md border border-success/25 bg-white px-4 py-3 text-sm font-semibold text-success shadow-lg">{{ catalogo.successMessage.value }}</p></div>
  </section>
</template>
