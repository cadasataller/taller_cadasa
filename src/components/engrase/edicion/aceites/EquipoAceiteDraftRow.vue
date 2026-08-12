<script setup lang="ts">
import {
  CheckCircle2,
  Cog,
  Droplet,
  Pencil,
  Trash2,
  Undo2,
} from "lucide-vue-next";
import type { EquipoAceiteDraft } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";

defineProps<{ aceite: EquipoAceiteDraft }>();
const emit = defineEmits<{
  edit: [string];
  remove: [string];
  undo: [string];
}>();
</script>

<template>
  <li
    class="grid gap-2 border-b border-second-deep px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_auto_auto] sm:items-center"
  >
    <div class="min-w-0">
      <p class="flex items-center gap-1.5 text-xs text-gray-600">
        <Cog class="h-3.5 w-3.5 text-main" />Sistema
      </p>
      <p class="truncate text-sm font-semibold text-main">
        {{ aceite.sistemaReferencia.nombre }}
      </p>
    </div>
    <div class="min-w-0">
      <p class="flex items-center gap-1.5 text-xs text-gray-600">
        <Droplet class="h-3.5 w-3.5 text-main" />Aceite
      </p>
      <p class="truncate text-sm font-semibold text-gray-900">
        {{ aceite.aceiteReferencia.nombre }}
      </p>
    </div>
    <span
      v-if="aceite.estadoOperacion === 'pendiente_eliminacion'"
      class="inline-flex w-fit items-center gap-1 rounded bg-warning-bg px-2 py-1 text-xs font-semibold text-warning"
      ><CheckCircle2 class="h-3.5 w-3.5" />Pendiente de eliminación</span
    >
    <span v-else class="text-xs text-gray-500">{{
      aceite.estadoOperacion === "nuevo"
        ? "Nuevo"
        : aceite.estadoOperacion === "actualizado"
          ? "Actualizado"
          : "Activo"
    }}</span>
    <div class="flex gap-1.5 sm:justify-end">
      <button
        v-if="aceite.estadoOperacion !== 'pendiente_eliminacion'"
        type="button"
        class="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border border-second-deep px-2 text-xs font-semibold text-main hover:bg-second"
        aria-label="Editar aceite"
        title="Editar aceite"
        @click="emit('edit', aceite.draftId)"
      >
        <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        v-if="aceite.estadoOperacion !== 'pendiente_eliminacion'"
        type="button"
        class="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border border-danger/30 px-2 text-xs font-semibold text-danger hover:bg-danger-bg"
        aria-label="Quitar aceite"
        title="Quitar aceite"
        @click="emit('remove', aceite.draftId)"
      >
        <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        v-else
        type="button"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md border border-warning/30 px-2 text-xs font-semibold text-warning hover:bg-warning-bg"
        @click="emit('undo', aceite.draftId)"
      >
        <Undo2 class="h-3.5 w-3.5" />Deshacer
      </button>
    </div>
  </li>
</template>
