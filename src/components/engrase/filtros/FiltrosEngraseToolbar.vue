<script setup lang="ts">
import { Eraser, Sprout, Wheat } from 'lucide-vue-next';
import FiltroCodigoAutocomplete from "./FiltroCodigoAutocomplete.vue";
import type {
  EtapaEngrase,
  FiltroCodigoSugerencia,
  FiltrosEngraseQuery,
  TipoEquipoEngrase,
  TipoFiltroEngrase,
} from "@/stores/dbequipos/engrase/filtrosEngrase.types";
const props = defineProps<{
  filters: FiltrosEngraseQuery;
  tiposEquipo: TipoEquipoEngrase[];
  tiposFiltro: TipoFiltroEngrase[];
  etapas: EtapaEngrase[];
  sugerenciasCodigo: FiltroCodigoSugerencia[];
  loading: boolean;
  loadingSugerencias: boolean;
  resetSignal: number;
}>();
const emit = defineEmits<{
  updateFilters: [Partial<FiltrosEngraseQuery>];
  searchCodeSuggestions: [string];
  selectCodeSuggestion: [FiltroCodigoSugerencia];
  clearCode: [];
  clearAll: [];
  closeDetail: [];
}>();
function clearAllFilters() {
  emit('clearAll');
  emit('closeDetail');
}
function toggleEtapa(etapaId: number) {
  const etapaIds = new Set(props.filters.etapaIds);
  etapaIds.has(etapaId) ? etapaIds.delete(etapaId) : etapaIds.add(etapaId);
  emit('updateFilters', { etapaIds: [...etapaIds] });
}
function esCultivo(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === 'cultivo';
}
function esZafra(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === 'zafra';
}
</script>
<template>
  <section
    class="grid gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm lg:grid-cols-4"
    aria-label="Filtros de equipos"
  >
    <FiltroCodigoAutocomplete
      class="lg:col-span-2"
      :model-value="filters.codigoExactoSeleccionado ?? ''"
      :sugerencias="sugerenciasCodigo"
      :loading="loadingSugerencias"
      :reset-signal="resetSignal"
      @update:model-value="
        emit('updateFilters', { codigoExactoSeleccionado: null })
      "
      @search="emit('searchCodeSuggestions', $event)"
      @select="emit('selectCodeSuggestion', $event)"
      @clear="emit('clearCode')"
    />
    <fieldset class="flex min-w-0 gap-1" aria-label="Etapas">
      <legend class="sr-only">Etapas</legend>
      <button
        v-for="item in etapas"
        :key="item.id"
        type="button"
        class="flex h-9 min-w-0 flex-1 items-center justify-center gap-1 truncate rounded-md border px-2 text-xs"
        :class="
          filters.etapaIds.includes(item.id)
            ? 'border-main bg-main/10 text-main'
            : 'border-gray-200 text-gray-500'
        "
        :aria-pressed="filters.etapaIds.includes(item.id)"
        @click="toggleEtapa(item.id)"
      >
        <Sprout v-if="esCultivo(item.nombre)" class="h-3.5 w-3.5 shrink-0 text-main" />
        <Wheat v-else-if="esZafra(item.nombre)" class="h-3.5 w-3.5 shrink-0 text-accent" />
        {{ item.nombre }}
      </button>
    </fieldset>
    <div class="flex gap-1 border-l border-gray-200 pl-2">
      <button
        class="h-9 flex-1 rounded-md border text-xs"
        :class="
          filters.estadoEquipo === 'activo'
            ? 'border-success bg-success-bg text-success'
            : 'border-gray-200 text-gray-500'
        "
        @click="emit('updateFilters', { estadoEquipo: 'activo' })"
      >
        Activos</button
      ><button
        class="h-9 flex-1 rounded-md border text-xs"
        :class="
          filters.estadoEquipo === 'descartado'
            ? 'border-danger bg-danger-bg text-danger'
            : 'border-gray-200 text-gray-500'
        "
        @click="emit('updateFilters', { estadoEquipo: 'descartado' })"
      >
        Descartados
      </button>
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-main/5 hover:text-main"
        aria-label="Limpiar todos los filtros"
        title="Limpiar todos los filtros"
        @click="clearAllFilters"
      >
        <Eraser class="h-4 w-4" />
      </button>
    </div>
  </section>
</template>
