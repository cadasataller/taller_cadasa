<script setup lang="ts">
import { Info } from "lucide-vue-next";
import { formatoEquipos } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.helpers";
import type { CatalogoImpacto } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

defineProps<{ impacto: CatalogoImpacto }>();
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-3 rounded-md border border-main/25 bg-main/5 p-3 text-main">
      <Info class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p class="text-xs leading-5">
        <template v-if="impacto.totalEquipos > 0">
          Esta actualización se reflejará en
          <strong>{{ formatoEquipos(impacto.totalEquipos) }}</strong>.
        </template>
        <template v-else>Este tipo de filtro todavía no se utiliza en equipos.</template>
      </p>
    </div>
    <div>
      <p class="text-xs font-semibold text-gray-700">Total de asignaciones</p>
      <p class="mt-1 text-base font-bold tabular-nums text-main">
        {{ new Intl.NumberFormat('es').format(impacto.totalAsignaciones) }}
      </p>
    </div>
  </div>
</template>
