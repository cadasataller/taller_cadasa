<script setup lang="ts">
import { computed, onMounted, shallowRef } from "vue";
import FiltrosEngraseToolbar from "@/components/engrase/filtros/FiltrosEngraseToolbar.vue";
import EquiposEngrasePanel from "@/components/engrase/filtros/EquiposEngrasePanel.vue";
import FiltrosEquipoPanel from "@/components/engrase/filtros/FiltrosEquipoPanel.vue";
import FiltroDetallePanel from "@/components/engrase/filtros/FiltroDetallePanel.vue";
import { useFiltrosEngrase } from "@/composables/engrase/useFiltrosEngrase";
const f = useFiltrosEngrase(),
  mobileStage = shallowRef<"equipos" | "filtros">("equipos");
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
</script>
<template>
  <main class="min-h-full bg-second p-3 text-gray-700 md:p-4">
    
    <div v-if="f.errorInicial.value" class="rounded-lg border border-danger/30 bg-danger-bg p-4 text-sm text-danger">
      <p>{{ f.errorInicial.value }}</p>
      <button @click="f.reintentar">Reintentar</button>
    </div>
    <template v-else>
      <FiltrosEngraseToolbar
        :filters="f.filtrosAplicados.value"
        :tipos-equipo="f.tiposEquipo.value"
        :tipos-filtro="f.tiposFiltro.value"
        :etapas="f.etapas.value"
        :sugerencias-codigo="f.sugerenciasCodigo.value"
        :loading="f.loadingInicial.value"
        :loading-sugerencias="f.loadingSugerencias.value"
        @update-filters="update"
        @search-code-suggestions="f.buscarCodigo"
        @select-code-suggestion="f.seleccionarCodigo"
        @clear-code="f.limpiarCodigo"
      />
      <div class="mt-3 grid min-h-[460px] gap-3 md:h-[calc(100vh-180px)] md:grid-cols-[minmax(220px,.85fr)_minmax(360px,1.8fr)_minmax(210px,.75fr)]">
        <div
          class="min-w-0"
          :class="{ 'max-md:hidden': mobileStage === 'filtros' }"
        >
          <EquiposEngrasePanel
            :equipos="f.equiposVisibles.value"
            :selected-equipo-id="f.equipoSeleccionadoId.value"
            :counts-by-tipo="f.conteoPorTipoEquipo.value"
            :loading="f.loadingEquipos.value"
            :error="f.errorEquipos.value"
            @select-equipo="selectEquipo"
            @retry="f.reintentar"
          />
        </div>
        <div
          class="min-w-0"
          :class="{ 'max-md:hidden': mobileStage === 'equipos' }"
        >
          <FiltrosEquipoPanel
            :equipo="f.equipoSeleccionado.value"
            :filtros="f.filtrosEquipo.value"
            :equivalencias="f.equivalenciasPorFiltroId.value"
            :selected-filtro-id="f.filtroSeleccionadoId.value"
            :loading="f.loadingDetalleEquipo.value"
            :error="f.errorDetalle.value"
            @select-filtro="f.seleccionarFiltro"
            @retry="retryDetalle"
            @back-to-equipos="mobileStage = 'equipos'"
          />
        </div>
        <FiltroDetallePanel
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
