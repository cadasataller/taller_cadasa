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
  <main class="page">
    
    <div v-if="f.errorInicial.value" class="initial-error">
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
      <div class="workspace">
        <div
          class="equipos-stage"
          :class="{ mobileHidden: mobileStage === 'filtros' }"
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
          class="filters-stage"
          :class="{ mobileHidden: mobileStage === 'equipos' }"
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
<style scoped>
.page {
  padding: 1.5rem;
  min-height: 100%;
  background: #f6f8fc;
  color: #172554;
}

.title {
  margin-bottom: 1.1rem;
}

.title p {
  margin: 0;
  color: #0759e8;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.title h1 {
  margin: 0.2rem 0;
  font-size: 1.8rem;
  letter-spacing: -0.05em;
}

.title span {
  color: #64748b;
  font-size: 0.85rem;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(230px, 0.85fr) minmax(390px, 1.8fr) minmax(
      220px,
      0.75fr
    );
  gap: 1rem;
  margin-top: 1rem;
  height: calc(100vh - 255px);
  min-height: 460px;
}

.workspace > * {
  min-width: 0;
}

.initial-error {
  padding: 2rem;
  border: 1px solid #fecaca;
  background: #fff;
  color: #991b1b;
  border-radius: 1rem;
}

.initial-error button {
  padding: 0.5rem 0.8rem;
  background: #991b1b;
  color: white;
  border-radius: 0.5rem;
}

@media (max-width: 900px) {
  .workspace {
    grid-template-columns: minmax(210px, 0.8fr) 1.4fr;
    height: auto;
  }

  .workspace > .detail {
    display: block;
  }
}

@media (max-width: 650px) {
  .page {
    padding: 1rem;
    padding-bottom: 5rem;
  }

  .workspace {
    display: block;
    min-height: auto;
  }

  .mobileHidden {
    display: none;
  }
}
</style>
