<script setup lang="ts">
import { ChevronRight, Filter } from "lucide-vue-next";
import FiltroComprasBadge from "./FiltroComprasBadge.vue";
import FiltroEstadoBadge from "./FiltroEstadoBadge.vue";
import { formatNumber } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.helpers";
import type { CatalogoFiltroItem } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";
defineProps<{ item: CatalogoFiltroItem; selected: boolean }>();
const emit = defineEmits<{
  select: [item: CatalogoFiltroItem, trigger: HTMLElement];
}>();
</script>

<template>
  <button
    type="button"
    class="flex min-h-24 w-full cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 text-left transition duration-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main active:scale-[0.995]"
    :class="
      selected
        ? 'border-main/40 bg-main/5 shadow-[inset_3px_0_0_var(--color-main)]'
        : 'border-gray-200'
    "
    :aria-pressed="selected"
    @click="emit('select', item, $event.currentTarget as HTMLElement)"
  >
    <span
      class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-main/7 text-main"
      ><Filter class="h-4 w-4" aria-hidden="true"
    /></span>
    <span class="min-w-0 flex-1"
      ><span class="flex flex-wrap items-start justify-between gap-2"
        ><strong class="break-words text-sm text-main">{{ item.codigo }}</strong
        ><FiltroEstadoBadge :activo="item.activo" /></span
      ><span class="mt-2 flex items-center justify-between gap-2"
        ><FiltroComprasBadge :en-compras="item.estaEnListaCompras" /><span
          class="text-xs tabular-nums text-gray-500"
          >Equipos {{ formatNumber(item.impacto.totalEquipos) }} · Asignaciones
          {{ formatNumber(item.impacto.totalAsignaciones) }}</span
        ></span
      ></span
    >
    <ChevronRight class="h-4 w-4 shrink-0 text-main" aria-hidden="true" />
  </button>
</template>
