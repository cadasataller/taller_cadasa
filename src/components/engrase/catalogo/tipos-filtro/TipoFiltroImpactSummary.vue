<script setup lang="ts">
import type { CatalogoImpacto } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

defineProps<{ impacto: CatalogoImpacto }>();
</script>

<template>
  <div>
    <div>
      <p class="text-xs font-semibold text-gray-700">Total de asignaciones</p>
      <p class="mt-1 text-base font-bold tabular-nums text-main">
        {{ new Intl.NumberFormat('es').format(impacto.totalAsignaciones) }}
      </p>
    </div>
  </div>
</template>
