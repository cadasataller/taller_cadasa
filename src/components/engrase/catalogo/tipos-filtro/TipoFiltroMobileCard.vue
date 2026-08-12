<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";
import TipoFiltroEstadoBadge from "./TipoFiltroEstadoBadge.vue";
import { formatoEquipos } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.helpers";
import { obtenerIconoTipoFiltro } from "@/utils/filtrosEngraseIconos";
import type { CatalogoTipoFiltroItem } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

defineProps<{
  item: CatalogoTipoFiltroItem;
  selected: boolean;
}>();

const emit = defineEmits<{ select: [item: CatalogoTipoFiltroItem] }>();
</script>

<template>
  <button
    type="button"
    class="flex min-h-20 w-full cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 text-left transition duration-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main active:scale-[0.995] active:bg-main/7"
    :class="
      selected
        ? 'border-main/40 bg-main/5 shadow-[inset_3px_0_0_var(--color-main)]'
        : 'border-gray-200'
    "
    :aria-pressed="selected"
    @click="emit('select', item)"
  >
    <span
      class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-main/7 text-main"
    >
      <component
        :is="obtenerIconoTipoFiltro(item.nombre).icono"
        class="h-4 w-4"
        aria-hidden="true"
      />
    </span>
    <span class="min-w-0 flex-1">
      <span class="flex flex-wrap items-start justify-between gap-2">
        <span class="min-w-0 flex-1 truncate text-sm font-semibold text-main">{{
          item.nombre
        }}</span>
        <TipoFiltroEstadoBadge :activo="item.activo" />
      </span>
      <span class="mt-1 block text-xs tabular-nums text-gray-500">
        Usado en {{ formatoEquipos(item.impacto.totalEquipos) }}
        <span
          v-if="item.impacto.totalAsignaciones !== item.impacto.totalEquipos"
        >
          ·
          {{
            new Intl.NumberFormat("es").format(item.impacto.totalAsignaciones)
          }}
          asignaciones
        </span>
      </span>
    </span>
    <ChevronRight class="h-4 w-4 shrink-0 text-main" aria-hidden="true" />
  </button>
</template>
