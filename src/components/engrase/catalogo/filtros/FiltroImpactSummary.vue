<script setup lang="ts">
import { Info } from "lucide-vue-next";
import { formatNumber } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.helpers";
import type { CatalogoFiltroImpacto } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";
defineProps<{ impacto: CatalogoFiltroImpacto }>();
</script>
<template><section class="space-y-3" aria-labelledby="impact-title"><h3 id="impact-title" class="sr-only">Impacto actual</h3><div class="flex gap-3 rounded-md border border-main/25 bg-main/5 p-3 text-main"><Info class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p class="text-xs leading-5"><template v-if="impacto.totalEquipos">Esta actualización se reflejará en <strong>{{ formatNumber(impacto.totalEquipos) }} {{ impacto.totalEquipos === 1 ? 'equipo' : 'equipos' }}</strong>.</template><template v-else>Este filtro todavía no se utiliza en equipos.</template><span class="mt-1 block text-gray-600">Solo informa el alcance; las asociaciones no se modificarán.</span></p></div><div><p class="text-xs font-semibold text-gray-700">Total asignaciones</p><p class="mt-1 text-base font-bold tabular-nums text-main">{{ formatNumber(impacto.totalAsignaciones) }}</p></div></section></template>
