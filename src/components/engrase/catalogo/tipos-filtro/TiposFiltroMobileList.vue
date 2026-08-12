<script setup lang="ts">
import TipoFiltroMobileCard from "./TipoFiltroMobileCard.vue";
import type { CatalogoTipoFiltroItem } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

defineProps<{
  items: readonly CatalogoTipoFiltroItem[];
  selectedId: number | null;
}>();

const emit = defineEmits<{ select: [item: CatalogoTipoFiltroItem] }>();
</script>

<template>
  <div class="grid gap-2 md:hidden">
    <TipoFiltroMobileCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :selected="selectedId === item.id"
      @select="emit('select', $event)"
    />
  </div>
</template>
