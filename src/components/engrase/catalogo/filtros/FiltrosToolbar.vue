<script setup lang="ts">
import { Eraser, Plus, Search, SlidersHorizontal, X } from "lucide-vue-next";
import { contarCriteriosFiltros } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.helpers";
import type {
  CatalogoFiltroCompras, CatalogoFiltroEstado, CatalogoTipoFiltroRelacionado,
} from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";

const props = defineProps<{
  busqueda: string; tipoFiltroId: number | null; compras: CatalogoFiltroCompras;
  estado: CatalogoFiltroEstado; tiposFiltro: readonly CatalogoTipoFiltroRelacionado[]; canClear: boolean;
  canCreate: boolean;
}>();
const emit = defineEmits<{
  updateBusqueda: [value: string]; updateTipoFiltro: [value: number | null];
  updateCompras: [value: CatalogoFiltroCompras]; updateEstado: [value: CatalogoFiltroEstado];
  openFilters: []; clear: []; create: [];
}>();
const filterCount = () => contarCriteriosFiltros(props.tipoFiltroId, props.compras, props.estado);
function input(event: Event): void { emit("updateBusqueda", (event.target as HTMLInputElement).value); }
function type(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  emit("updateTipoFiltro", value ? Number(value) : null);
}
</script>

<template>
  <div class="grid min-w-0 grid-cols-[1fr_44px] gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto] lg:flex lg:flex-wrap">
    <div class="relative min-w-0 lg:min-w-[220px] lg:max-w-[360px] lg:flex-1">
      <label for="filtros-search" class="sr-only">Buscar filtro por código</label>
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
      <input id="filtros-search" :value="busqueda" type="search" autocomplete="off" placeholder="Buscar por código" class="min-h-11 w-full rounded-md border border-gray-300 bg-white pl-9 pr-11 text-base outline-none focus:border-main focus:ring-2 focus:ring-main/15 md:min-h-9 md:text-sm" @input="input" />
      <button v-if="busqueda" type="button" class="absolute right-0 top-0 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-r-md text-gray-500 hover:bg-gray-100 md:min-h-9 md:min-w-9" aria-label="Limpiar búsqueda" @click="emit('updateBusqueda', '')"><X class="h-4 w-4" aria-hidden="true" /></button>
    </div>

    <button type="button" class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 lg:hidden" :aria-label="`Abrir filtros, ${filterCount()} activos`" @click="emit('openFilters')">
      <SlidersHorizontal class="h-4 w-4" aria-hidden="true" /><span class="hidden sm:inline">Filtros</span><span v-if="filterCount()" class="rounded-full bg-main px-1.5 text-xs text-white">{{ filterCount() }}</span>
    </button>

    <div class="hidden lg:block lg:w-[170px]">
      <label for="filtros-related-type" class="sr-only">Tipo de filtro relacionado</label>
      <select id="filtros-related-type" :value="tipoFiltroId ?? ''" class="h-9 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 text-sm" @change="type">
        <option value="">Todos los tipos</option><option v-for="item in tiposFiltro" :key="item.id" :value="item.id">{{ item.nombre }}</option>
      </select>
    </div>
    <div class="hidden lg:block lg:w-[160px]">
      <label for="filtros-purchases" class="sr-only">Estado en lista de compras</label>
      <select id="filtros-purchases" :value="compras" class="h-9 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 text-sm" @change="emit('updateCompras', ($event.target as HTMLSelectElement).value as CatalogoFiltroCompras)">
        <option value="todos">Todos</option><option value="en-compras">En compras</option><option value="fuera-compras">Fuera de compras</option>
      </select>
    </div>
    <div class="hidden lg:block lg:w-[145px]">
      <label for="filtros-state" class="sr-only">Estado</label>
      <select id="filtros-state" :value="estado" class="h-9 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 text-sm" @change="emit('updateEstado', ($event.target as HTMLSelectElement).value as CatalogoFiltroEstado)">
        <option value="activos">Activos</option><option value="desactivados">Desactivados</option><option value="todos">Todos</option>
      </select>
    </div>

    <button v-if="canCreate" type="button" class="col-span-2 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-main px-3 text-sm font-semibold text-white hover:bg-main-light sm:col-span-1 lg:h-9 lg:min-h-0 lg:text-xs" @click="emit('create')"><Plus class="h-4 w-4" aria-hidden="true" />Nuevo filtro</button>
    <button type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-600 sm:row-start-1 sm:col-start-3 lg:h-9 lg:min-h-0 lg:text-xs" :class="canClear ? 'cursor-pointer hover:bg-main/5 hover:text-main' : 'cursor-not-allowed opacity-50'" :disabled="!canClear" aria-label="Limpiar filtros" @click="emit('clear')"><Eraser class="h-4 w-4" aria-hidden="true" /><span class="hidden lg:inline">Limpiar filtros</span></button>
  </div>
</template>
