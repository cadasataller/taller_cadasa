<script setup lang="ts">
import { computed, onMounted } from "vue";
import TiposFiltroToolbar from "@/components/engrase/catalogo/tipos-filtro/TiposFiltroToolbar.vue";
import TiposFiltroTable from "@/components/engrase/catalogo/tipos-filtro/TiposFiltroTable.vue";
import TiposFiltroMobileList from "@/components/engrase/catalogo/tipos-filtro/TiposFiltroMobileList.vue";
import TiposFiltroListState from "@/components/engrase/catalogo/tipos-filtro/TiposFiltroListState.vue";
import TipoFiltroDetailDrawer from "@/components/engrase/catalogo/tipos-filtro/TipoFiltroDetailDrawer.vue";
import TipoFiltroUpdateConfirmDialog from "@/components/engrase/catalogo/tipos-filtro/TipoFiltroUpdateConfirmDialog.vue";
import TipoFiltroUnsavedDialog from "@/components/engrase/catalogo/tipos-filtro/TipoFiltroUnsavedDialog.vue";
import { useCatalogoTiposFiltro } from "@/composables/engrase/catalogo/useCatalogoTiposFiltro";
import { mensajeCatalogoTiposFiltroError } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.errors";
import type { CatalogoTipoFiltroItem } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

const catalogo = useCatalogoTiposFiltro();
const listState = computed<"loading" | "error" | "empty" | "no-results" | null>(() => {
  if (catalogo.loadingInicial.value) return "loading";
  if (catalogo.errorInicial.value) return "error";
  if (catalogo.cargado.value && !catalogo.items.value.length) return "empty";
  if (catalogo.sinResultados.value) return "no-results";
  return null;
});
const totalLabel = computed(() => new Intl.NumberFormat("es").format(catalogo.items.value.length));
const visibleLabel = computed(() => new Intl.NumberFormat("es").format(catalogo.cantidadVisible.value));
const saveErrorMessage = computed(() => mensajeCatalogoTiposFiltroError(catalogo.errorGuardado.value));

onMounted(() => void catalogo.inicializar());
function openItem(item: CatalogoTipoFiltroItem): void { catalogo.abrirEditar(item); }
</script>

<template>
  <section class="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-gray-200 bg-[#FAF9F5] shadow-sm">
    <div class="flex min-h-0 min-w-0 flex-1 gap-3">
      <div class="min-w-0 flex-1 p-3 sm:p-4" :class="catalogo.drawerOpen.value ? 'lg:pr-[calc(clamp(320px,28vw,400px)+1rem)]' : ''">
        <TiposFiltroToolbar
          :busqueda="catalogo.busqueda.value"
          :estado="catalogo.estado.value"
          :can-clear="catalogo.hayFiltrosActivos.value"
          @update-busqueda="catalogo.actualizarBusqueda"
          @update-estado="catalogo.actualizarEstado"
          @clear="catalogo.limpiarFiltros"
          @create="catalogo.abrirCrear"
        />

        <header class="mt-4 flex items-end justify-between gap-3 border-t border-gray-200 pt-3">
          <div><h2 class="text-sm font-bold text-main">Tipos de filtro</h2><p class="text-xs text-gray-500" aria-live="polite">{{ visibleLabel }} resultados</p></div>
        </header>

        <div class="mt-3">
          <TiposFiltroListState v-if="listState" :kind="listState" :message="mensajeCatalogoTiposFiltroError(catalogo.errorInicial.value)" @retry="catalogo.reintentar" @clear="catalogo.limpiarFiltros" @create="catalogo.abrirCrear" />
          <template v-else>
            <TiposFiltroTable :items="catalogo.itemsVisibles.value" :selected-id="catalogo.seleccionadoId.value" :sort-key="catalogo.sortKey.value" :sort-direction="catalogo.sortDirection.value" @select="openItem" @sort="catalogo.actualizarOrden" />
            <TiposFiltroMobileList :items="catalogo.itemsVisibles.value" :selected-id="catalogo.seleccionadoId.value" @select="openItem" />
            <p class="mt-3 text-xs tabular-nums text-gray-500">Mostrando {{ visibleLabel }} de {{ totalLabel }} tipos de filtro</p>
          </template>
        </div>
      </div>
    </div>

    <TipoFiltroDetailDrawer
      :open="catalogo.drawerOpen.value"
      :mode="catalogo.modo.value"
      :item="catalogo.original.value"
      :draft="catalogo.draft.value"
      :has-changes="catalogo.hasChanges.value"
      :can-submit="catalogo.canSubmit.value"
      :saving="catalogo.guardando.value"
      :field-errors="catalogo.fieldErrors.value"
      :save-error="saveErrorMessage"
      @update-draft="catalogo.updateDraft"
      @blur-name="catalogo.validateName"
      @request-close="catalogo.solicitarCierre"
      @cancel="catalogo.solicitarCierre"
      @submit="catalogo.submit"
    />

    <TipoFiltroUpdateConfirmDialog v-if="catalogo.confirmacionAbierta.value && catalogo.original.value && catalogo.draft.value" :original="catalogo.original.value" :draft="catalogo.draft.value" :saving="catalogo.guardando.value" @cancel="catalogo.cancelarConfirmacion" @confirm="catalogo.confirmarActualizacion" />
    <TipoFiltroUnsavedDialog v-if="catalogo.confirmarDescarteAbierto.value" @cancel="catalogo.cancelarDescarte" @discard="catalogo.cerrarAhora" />

    <div class="pointer-events-none fixed right-4 top-4 z-[90]" aria-live="polite" aria-atomic="true">
      <p v-if="catalogo.successMessage.value" class="rounded-md border border-success/25 bg-white px-4 py-3 text-sm font-semibold text-success shadow-lg">{{ catalogo.successMessage.value }}</p>
    </div>
  </section>
</template>
