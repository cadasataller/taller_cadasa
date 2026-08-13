<script setup lang="ts">
import { CheckCircle2 } from "lucide-vue-next";
import type { CrearEquipoDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
defineProps<{ draft: CrearEquipoDraft; errors: string[]; creating: boolean }>();
</script>
<template>
  <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h2 tabindex="-1" class="font-bold text-gray-900">Revisar creación</h2>
    <p class="mt-1 text-sm text-gray-500">
      Confirma la información antes de crear el equipo.
    </p>
    <div
      v-if="errors.length"
      class="mt-3 rounded bg-danger-bg p-3 text-sm text-danger"
      role="alert"
    >
      <p class="font-bold">Hay errores por corregir</p>
      <ul class="mt-1 list-disc pl-4">
        <li v-for="error in errors" :key="error">{{ error }}</li>
      </ul>
    </div>
    <div v-else class="mt-4 grid gap-3 sm:grid-cols-2">
      <div class="rounded-lg bg-second p-3">
        <p class="text-xs text-gray-500">Equipo</p>
        <p class="font-mono font-bold">{{ draft.datos.codigo }}</p>
        <p class="text-sm">
          {{ draft.datos.tipoEquipo?.nombre }} · {{ draft.datos.subtipo }}
        </p>
      </div>
      <div class="rounded-lg bg-second p-3">
        <p class="text-xs text-gray-500">Configuración</p>
        <p class="text-sm">
          {{ draft.datos.etapas.length }} etapas ·
          {{ draft.filtros.length }} filtros ·
          {{ draft.aceites.length }} aceites
        </p>
      </div>
    </div>
    <p class="mt-4 inline-flex items-center gap-1 text-xs text-main">
      <CheckCircle2 class="h-4 w-4" />La imagen se podrá agregar en el siguiente
      paso.
    </p>
  </section>
</template>
