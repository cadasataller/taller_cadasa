<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Droplet } from "lucide-vue-next";
import FiltroComprasBadge from "./FiltroComprasBadge.vue";
import FiltroEstadoBadge from "./FiltroEstadoBadge.vue";
import { formatNumber } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.helpers";
import type { CatalogoFiltroItem, CatalogoFiltroSortKey, CatalogoSortDirection } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";

const props = defineProps<{ items: readonly CatalogoFiltroItem[]; selectedId: number | null; sortKey: CatalogoFiltroSortKey; sortDirection: CatalogoSortDirection }>();
const emit = defineEmits<{ select: [item: CatalogoFiltroItem, trigger: HTMLElement]; sort: [key: CatalogoFiltroSortKey] }>();
function sortIcon(key: CatalogoFiltroSortKey) { return props.sortKey !== key ? ArrowUpDown : props.sortDirection === "asc" ? ArrowUp : ArrowDown; }
function ariaSort(key: CatalogoFiltroSortKey): "ascending" | "descending" | "none" { return props.sortKey !== key ? "none" : props.sortDirection === "asc" ? "ascending" : "descending"; }
function select(item: CatalogoFiltroItem, event: Event): void { emit("select", item, event.currentTarget as HTMLElement); }
</script>

<template>
  <div class="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:block">
    <table class="w-full table-fixed border-collapse text-left text-xs">
      <thead class="h-9 bg-gray-50 text-gray-600">
        <tr><th class="w-12 px-3"><span class="sr-only">Filtro</span></th>
          <th class="w-[24%] px-3" :aria-sort="ariaSort('codigo')"><button type="button" class="inline-flex cursor-pointer items-center gap-1 font-semibold" @click="emit('sort','codigo')">Código<component :is="sortIcon('codigo')" class="h-3.5 w-3.5" /></button></th>
          <th class="w-[17%] px-3" :aria-sort="ariaSort('compras')"><button type="button" class="inline-flex cursor-pointer items-center gap-1 font-semibold" @click="emit('sort','compras')">En compras<component :is="sortIcon('compras')" class="h-3.5 w-3.5" /></button></th>
          <th class="w-[18%] px-3" :aria-sort="ariaSort('estado')"><button type="button" class="inline-flex cursor-pointer items-center gap-1 font-semibold" @click="emit('sort','estado')">Estado<component :is="sortIcon('estado')" class="h-3.5 w-3.5" /></button></th>
          <th class="px-3" :aria-sort="sortKey === 'equipos' || sortKey === 'asignaciones' ? ariaSort(sortKey) : 'none'"><div class="flex flex-wrap items-center gap-2"><span class="font-semibold">Resumen de uso</span><div class="inline-flex rounded border border-gray-200 bg-white p-0.5" aria-label="Ordenar resumen de uso"><button type="button" class="cursor-pointer rounded px-1.5 py-0.5" :class="sortKey === 'equipos' ? 'bg-main/10 font-semibold text-main' : ''" @click="emit('sort','equipos')">Equipos</button><button type="button" class="cursor-pointer rounded px-1.5 py-0.5" :class="sortKey === 'asignaciones' ? 'bg-main/10 font-semibold text-main' : ''" @click="emit('sort','asignaciones')">Asignaciones</button></div></div></th>
          <th class="w-10"><span class="sr-only">Abrir</span></th></tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id" tabindex="0" class="h-16 cursor-pointer border-t border-gray-100 text-gray-700 outline-none transition hover:bg-main/5 focus-visible:bg-main/7 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-main" :class="selectedId === item.id ? 'bg-main/5 shadow-[inset_3px_0_0_var(--color-main)]' : ''" :aria-selected="selectedId === item.id" @click="select(item,$event)" @keydown.enter.prevent="select(item,$event)" @keydown.space.prevent="select(item,$event)">
          <td class="px-3"><span class="grid h-8 w-8 place-items-center rounded-md bg-main/7 text-main"><Droplet class="h-4 w-4" aria-hidden="true" /></span></td>
          <td class="break-words px-3 font-semibold text-main">{{ item.codigo }}</td>
          <td class="px-3"><FiltroComprasBadge :en-compras="item.estaEnListaCompras" /></td>
          <td class="px-3"><FiltroEstadoBadge :activo="item.activo" /></td>
          <td class="px-3"><dl class="max-w-[220px] space-y-1 tabular-nums"><div class="flex justify-between gap-4"><dt>Equipos</dt><dd>{{ formatNumber(item.impacto.totalEquipos) }}</dd></div><div class="flex justify-between gap-4"><dt>Total asignaciones</dt><dd>{{ formatNumber(item.impacto.totalAsignaciones) }}</dd></div></dl></td>
          <td><ChevronRight class="h-4 w-4 text-main" aria-hidden="true" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
