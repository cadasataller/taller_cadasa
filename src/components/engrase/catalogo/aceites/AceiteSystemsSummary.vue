<script setup lang="ts">
import type { CatalogoSistemaRelacionado } from "@/stores/dbequipos/engrase/catalogo/aceitesCatalogo.types";
defineProps<{ items: readonly CatalogoSistemaRelacionado[] }>();
</script>
<template><div v-if="items.length" class="flex flex-wrap items-center gap-1.5"><span v-for="item in items.slice(0,2)" :key="item.id" class="rounded-md bg-main/6 px-2 py-1 text-xs text-main">{{ item.nombre }}</span><span v-if="items.length > 2" class="rounded-md border border-main/15 bg-white px-2 py-1 text-xs font-semibold text-main" :aria-label="`${items.length - 2} sistemas adicionales; abre los detalles para verlos`">+{{ items.length - 2 }}</span></div><span v-else class="text-xs text-gray-500">Sin sistemas asociados</span></template>
