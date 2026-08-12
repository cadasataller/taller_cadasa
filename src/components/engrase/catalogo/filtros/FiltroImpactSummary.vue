<script setup lang="ts">
import { formatNumber } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.helpers";
import type { CatalogoFiltroImpacto } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";
defineProps<{ impacto: CatalogoFiltroImpacto }>();
</script>
<template><section aria-labelledby="impact-title"><h3 id="impact-title" class="sr-only">Impacto actual</h3><div><p class="text-xs font-semibold text-gray-700">Total asignaciones</p><p class="mt-1 text-base font-bold tabular-nums text-main">{{ formatNumber(impacto.totalAsignaciones) }}</p></div></section></template>
