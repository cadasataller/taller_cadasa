<script setup lang="ts">
import FiltroMobileCard from "./FiltroMobileCard.vue";
import type { CatalogoFiltroItem } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";
defineProps<{ items: readonly CatalogoFiltroItem[]; selectedId: number | null }>();
const emit = defineEmits<{ select: [item: CatalogoFiltroItem, trigger: HTMLElement] }>();
</script>
<template><div class="space-y-2 lg:hidden"><FiltroMobileCard v-for="item in items" :key="item.id" :item="item" :selected="selectedId === item.id" @select="(selected, trigger) => emit('select', selected, trigger)" /></div></template>
