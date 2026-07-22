<script setup lang="ts">
import { LoaderCircle, Search, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue';

import CrearSolicitudEquipoChip from './CrearSolicitudEquipoChip.vue';
import type { EquipoOption } from '@/stores/dbequipos/equipos/equipos.types';
import type { DestinoSeleccionado } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

defineProps<{
  selectedItems: DestinoSeleccionado[];
  searchResults: EquipoOption[];
  isSearching: boolean;
  searchError: string | null;
  fieldError?: string;
}>();

const emit = defineEmits<{
  (e: 'search', value: string): void;
  (e: 'add', item: EquipoOption): void;
  (e: 'remove', payload: { codigo: string; tipoOrigen?: string }): void;
}>();

const query = shallowRef('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(query, (value) => {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  const normalizedValue = value.trim();

  debounceTimer = setTimeout(() => {
    emit('search', normalizedValue.length >= 3 ? normalizedValue : '');
  }, 300);
});

onBeforeUnmount(() => {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
});

const clearQuery = (): void => {
  query.value = '';
};

const searchStateMessage = computed(() => {
  const normalizedQuery = query.value.trim();

  if (normalizedQuery.length >= 3) {
    return 'No hay resultados para la búsqueda actual.';
  }

  return 'No hay búsqueda disponible.';
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-3 overflow-y-auto lg:overflow-hidden">
    <label class="block text-xs font-semibold text-stone-800">
      Destino <span class="text-danger">*</span>
    </label>

    <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-2 lg:overflow-hidden">
      <div class="flex min-h-0 flex-col gap-3">
        <div
          class="rounded-lg border bg-white px-3 py-2"
          :class="fieldError ? 'border-danger bg-danger-bg/30' : 'border-stone-300'"
        >
          <div class="flex items-center gap-3">
            <Search class="h-5 w-5 text-stone-400" />
            <input
              v-model="query"
              type="text"
              placeholder="Buscar por número de equipo"
              class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
            >
            <button
              v-if="query.trim().length > 0"
              type="button"
              class="rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              @click="clearQuery"
            >
              <X class="h-4 w-4" />
            </button>
            <LoaderCircle
              v-if="isSearching"
              class="h-4 w-4 animate-spin text-main"
            />
          </div>
          <p
            v-if="query.trim().length > 0 && query.trim().length < 3"
            class="mt-2 text-xs text-stone-500"
          >
            Ingresa al menos 3 caracteres para buscar equipos.
          </p>
        </div>

        <div
          v-if="selectedItems.length > 0"
          class="sticky top-0 z-40 -mt-1 rounded-lg border border-stone-200 bg-stone-50/95 px-3 py-2 shadow-sm backdrop-blur lg:hidden"
        >
          <div class="flex flex-wrap items-start gap-2">
            <CrearSolicitudEquipoChip
              v-for="item in selectedItems"
              :key="`${item.tipoOrigen}-${item.codigo}`"
              :label="item.label"
              full-width-mobile
              @remove="emit('remove', { codigo: item.codigo, tipoOrigen: item.tipoOrigen })"
            />
          </div>
        </div>

        <div
          v-else
          class="sticky top-0 z-40 -mt-1 rounded-lg border border-dashed border-stone-300 bg-white/95 px-3 py-2 text-xs text-stone-500 shadow-sm backdrop-blur md:text-sm lg:hidden"
        >
          Aún no has seleccionado destinos.
        </div>

        <div
          id="result_serach_equipo"
          class="flex-1 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50"
          :class="searchResults.length > 0 ? 'min-h-[12rem] lg:min-h-0' : 'hidden lg:block lg:min-h-0'"
        >
          <template v-if="searchResults.length > 0">
            <button
              v-for="item in searchResults"
              :key="item.codEquipo"
              type="button"
              class="flex w-full items-center justify-between border-b border-stone-200 px-3 py-2 text-left text-xs transition last:border-b-0 hover:bg-white "
              @click="emit('add', item)"
            >
              <span class="text-stone-800">{{ item.label }}</span>
              <span class="font-semibold text-main">Agregar</span>
            </button>
          </template>

          <div
            v-else
            class="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-stone-500"
          >
            {{ searchStateMessage }}
          </div>
        </div>
      </div>

      <div class="hidden min-h-[12rem] overflow-hidden rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 lg:block lg:min-h-0">
        <div
          v-if="selectedItems.length > 0"
          class="grid max-h-full grid-cols-2 items-start content-start gap-3 overflow-y-auto lg:grid-cols-3"
        >
          <CrearSolicitudEquipoChip
            v-for="item in selectedItems"
            :key="`${item.tipoOrigen}-${item.codigo}`"
            :label="item.label"
            @remove="emit('remove', { codigo: item.codigo, tipoOrigen: item.tipoOrigen })"
          />
        </div>

        <div
          v-else
          class="rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2 text-xs text-stone-500 md:text-sm"
        >
          Aún no has seleccionado destinos.
        </div>
      </div>
    </div>

    <p
      v-if="searchError"
      class="text-sm font-medium text-danger"
    >
      {{ searchError }}
    </p>

    <p
      v-if="fieldError"
      class="text-sm font-medium text-danger"
    >
      {{ fieldError }}
    </p>
  </div>
</template>
