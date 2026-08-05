<script setup lang="ts">
import { computed, onMounted, shallowRef } from "vue";
import FiltrosEngraseToolbar from "@/components/engrase/filtros/FiltrosEngraseToolbar.vue";
import EquiposEngrasePanel from "@/components/engrase/filtros/EquiposEngrasePanel.vue";
import FiltrosEquipoPanel from "@/components/engrase/filtros/FiltrosEquipoPanel.vue";
import FiltroDetallePanel from "@/components/engrase/filtros/FiltroDetallePanel.vue";
import { useFiltrosEngrase } from "@/composables/engrase/useFiltrosEngrase";
const f = useFiltrosEngrase(),
  mobileStage = shallowRef<"equipos" | "filtros">("equipos"),
  resetSignal = shallowRef(0);
const equivalenciasSeleccionadas = computed(() =>
  f.filtroSeleccionado.value
    ? (f.equivalenciasPorFiltroId.value[f.filtroSeleccionado.value.filtro_id] ??
      [])
    : [],
);
onMounted(() => f.inicializar());
async function selectEquipo(id: number) {
  await f.seleccionarEquipo(id);
  mobileStage.value = "filtros";
}
async function update(filters: any) {
  await f.actualizarFiltros(filters);
}
async function retryDetalle() {
  if (f.equipoSeleccionadoId.value) await f.reintentar();
}
async function clearAllFilters() {
  await f.limpiarFiltros();
  resetSignal.value += 1;
}
</script>
<template>
  <main class="flex h-full min-h-0 flex-col overflow-hidden bg-second p-3 text-gray-700 md:p-4">
    
    <div v-if="f.errorInicial.value" class="rounded-lg border border-danger/30 bg-danger-bg p-4 text-sm text-danger">
      <p>{{ f.errorInicial.value }}</p>
      <button @click="f.reintentar">Reintentar</button>
    </div>
    <template v-else>
      <FiltrosEngraseToolbar
        class="shrink-0"
        :filters="f.filtrosAplicados.value"
        :tipos-equipo="f.tiposEquipo.value"
        :tipos-filtro="f.tiposFiltro.value"
        :etapas="f.etapas.value"
        :sugerencias-codigo="f.sugerenciasCodigo.value"
        :loading="f.loadingInicial.value"
        :loading-sugerencias="f.loadingSugerencias.value"
        :reset-signal="resetSignal"
        @update-filters="update"
        @search-code-suggestions="f.buscarCodigo"
        @select-code-suggestion="f.seleccionarCodigo"
        @clear-code="f.limpiarCodigo"
        @clear-all="clearAllFilters"
      />
      <div class="mt-3 grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(220px,.85fr)_minmax(360px,1.8fr)_minmax(210px,.75fr)]">
        <div
          class="min-h-0 min-w-0"
          :class="{ 'max-md:hidden': mobileStage === 'filtros' }"
        >
          <EquiposEngrasePanel
            class="h-full"
            :equipos="f.equiposVisibles.value"
            :selected-equipo-id="f.equipoSeleccionadoId.value"
            :counts-by-tipo="f.conteoPorTipoEquipo.value"
            :loading="f.loadingEquipos.value"
            :error="f.errorEquipos.value"
            :reset-signal="resetSignal"
            @select-equipo="selectEquipo"
            @retry="f.reintentar"
            @filter-tipo="update({ tipoEquipoId: $event, modelo: '' })"
            @filter-modelo="update({ modelo: $event })"
          />
        </div>
        <div
          class="min-h-0 min-w-0"
          :class="{ 'max-md:hidden': mobileStage === 'equipos' }"
        >
          <FiltrosEquipoPanel
            class="h-full"
            :equipo="f.equipoSeleccionado.value"
            :filtros="f.filtrosEquipo.value"
            :equivalencias="f.equivalenciasPorFiltroId.value"
            :codigo-buscado="f.filtrosAplicados.value.codigoExactoSeleccionado"
            :selected-filtro-id="f.filtroSeleccionadoId.value"
            :loading="f.loadingDetalleEquipo.value"
            :error="f.errorDetalle.value"
            @select-filtro="f.seleccionarFiltro"
            @retry="retryDetalle"
            @back-to-equipos="mobileStage = 'equipos'"
          />
        </div>
        <FiltroDetallePanel
          class="h-full"
          :open="Boolean(f.filtroSeleccionadoId.value)"
          :equipo="f.equipoSeleccionado.value"
          :filtro="f.filtroSeleccionado.value"
          :equivalencias="equivalenciasSeleccionadas"
          :loading-equivalencias="false"
          :error-equivalencias="null"
          @close="f.seleccionarFiltro(null)"
          @retry-equivalencias="retryDetalle"
        />
      </div>
    </template>
  </main>
</template>
