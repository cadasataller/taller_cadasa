<script setup lang="ts">
import { Eraser, Plus, Search, X } from "lucide-vue-next";
import type { CatalogoEstadoFiltro } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

defineProps<{
  busqueda: string;
  estado: CatalogoEstadoFiltro;
  canClear: boolean;
}>();

const emit = defineEmits<{
  updateBusqueda: [value: string];
  updateEstado: [value: CatalogoEstadoFiltro];
  clear: [];
  create: [];
}>();

function onSearchInput(event: Event): void {
  emit("updateBusqueda", (event.target as HTMLInputElement).value);
}

function onStateChange(event: Event): void {
  emit("updateEstado", (event.target as HTMLSelectElement).value as CatalogoEstadoFiltro);
}
</script>

<template>
  <div class="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_minmax(150px,190px)_auto] lg:grid-cols-[minmax(240px,420px)_minmax(150px,190px)_auto_auto]">
    <div class="relative min-w-0">
      <label for="tipos-filtro-search" class="sr-only">Buscar tipo de filtro</label>
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        id="tipos-filtro-search"
        :value="busqueda"
        type="search"
        autocomplete="off"
        placeholder="Buscar por nombre"
        class="min-h-11 w-full rounded-md border border-gray-300 bg-white pl-9 pr-10 text-base text-gray-700 outline-none transition-colors focus:border-main focus:ring-2 focus:ring-main/15 md:min-h-9 md:text-sm"
        @input="onSearchInput"
      />
      <button
        v-if="busqueda"
        type="button"
        class="absolute right-0 top-0 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-r-md text-gray-500 hover:bg-gray-100 hover:text-main focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-main md:min-h-9 md:min-w-9"
        aria-label="Limpiar búsqueda"
        @click="emit('updateBusqueda', '')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <div class="min-w-0 max-sm:col-span-1">
      <label for="tipos-filtro-state" class="sr-only">Estado</label>
      <select
        id="tipos-filtro-state"
        :value="estado"
        class="min-h-11 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 text-base font-medium text-gray-700 outline-none transition-colors focus:border-main focus:ring-2 focus:ring-main/15 md:min-h-9 md:text-sm"
        @change="onStateChange"
      >
        <option value="activos">Activos</option>
        <option value="desactivados">Desactivados</option>
        <option value="todos">Todos</option>
      </select>
    </div>

    <button
      type="button"
      class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-main px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-main-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main active:bg-main-dark sm:col-span-3 lg:col-span-1 md:min-h-9 md:text-xs"
      @click="emit('create')"
    >
      <Plus class="h-4 w-4" aria-hidden="true" />
      Nuevo tipo de filtro
    </button>

    <button
      type="button"
      class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main sm:col-start-3 sm:row-start-1 lg:col-start-auto lg:row-start-auto md:min-h-9 md:text-xs"
      :class="canClear ? 'cursor-pointer hover:border-main/40 hover:bg-main/5 hover:text-main' : 'cursor-not-allowed opacity-50'"
      :disabled="!canClear"
      aria-label="Limpiar filtros"
      @click="emit('clear')"
    >
      <Eraser class="h-4 w-4" aria-hidden="true" />
      <span class="hidden lg:inline">Limpiar filtros</span>
    </button>
  </div>
</template>
