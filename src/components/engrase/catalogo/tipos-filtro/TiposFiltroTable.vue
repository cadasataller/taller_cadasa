<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Filter } from "lucide-vue-next";
import TipoFiltroEstadoBadge from "./TipoFiltroEstadoBadge.vue";
import { formatoEquipos } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.helpers";
import type {
  CatalogoSortDirection,
  CatalogoTipoFiltroItem,
  CatalogoTipoFiltroSortKey,
} from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

const props = defineProps<{
  items: readonly CatalogoTipoFiltroItem[];
  selectedId: number | null;
  sortKey: CatalogoTipoFiltroSortKey;
  sortDirection: CatalogoSortDirection;
}>();

const emit = defineEmits<{
  select: [item: CatalogoTipoFiltroItem];
  sort: [key: CatalogoTipoFiltroSortKey];
}>();

function ariaSort(key: CatalogoTipoFiltroSortKey): "ascending" | "descending" | "none" {
  if (props.sortKey !== key) return "none";
  return props.sortDirection === "asc" ? "ascending" : "descending";
}
</script>

<template>
  <div class="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
    <table class="w-full table-fixed text-left text-xs" role="grid" aria-label="Tipos de filtro">
      <colgroup>
        <col class="w-12" />
        <col />
        <col class="w-40" />
        <col class="w-48" />
        <col class="w-10" />
      </colgroup>
      <thead class="bg-gray-50 text-gray-600">
        <tr class="h-9 border-b border-gray-200">
          <th class="px-3"><span class="sr-only">Indicador</span></th>
          <th :aria-sort="ariaSort('nombre')">
            <button type="button" class="inline-flex h-9 cursor-pointer items-center gap-1.5 px-3 font-semibold hover:text-main focus-visible:outline-2 focus-visible:outline-main" @click="emit('sort', 'nombre')">
              Nombre
              <component :is="sortKey === 'nombre' ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </th>
          <th :aria-sort="ariaSort('estado')">
            <button type="button" class="inline-flex h-9 cursor-pointer items-center gap-1.5 px-3 font-semibold hover:text-main focus-visible:outline-2 focus-visible:outline-main" @click="emit('sort', 'estado')">
              Estado
              <component :is="sortKey === 'estado' ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </th>
          <th :aria-sort="ariaSort('uso')">
            <button type="button" class="inline-flex h-9 cursor-pointer items-center gap-1.5 px-3 font-semibold hover:text-main focus-visible:outline-2 focus-visible:outline-main" @click="emit('sort', 'uso')">
              Resumen de uso
              <component :is="sortKey === 'uso' ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </th>
          <th><span class="sr-only">Abrir detalles</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
          class="h-12 cursor-pointer border-b border-gray-100 transition-colors last:border-b-0 hover:bg-main/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-main"
          :class="selectedId === item.id ? 'bg-main/7 shadow-[inset_3px_0_0_var(--color-main)]' : 'bg-white'"
          tabindex="0"
          :aria-selected="selectedId === item.id"
          @click="emit('select', item)"
          @keydown.enter="emit('select', item)"
          @keydown.space.prevent="emit('select', item)"
        >
          <td class="px-3">
            <span class="grid h-7 w-7 place-items-center rounded-md bg-main/7 text-main">
              <Filter class="h-4 w-4" aria-hidden="true" />
            </span>
          </td>
          <td class="truncate px-3 text-sm font-semibold text-main">{{ item.nombre }}</td>
          <td class="px-3"><TipoFiltroEstadoBadge :activo="item.activo" /></td>
          <td class="px-3 font-medium tabular-nums text-gray-600">{{ formatoEquipos(item.impacto.totalEquipos) }}</td>
          <td class="px-2 text-main"><ChevronRight class="h-4 w-4" aria-hidden="true" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
