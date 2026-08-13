<script setup lang="ts">
import { Cog, Droplet, Pencil, Plus, Trash2 } from "lucide-vue-next";
import type { CrearEquipoAceiteDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
defineProps<{
  aceites: CrearEquipoAceiteDraft[];
  disabled: boolean;
  errors: string[];
}>();
const emit = defineEmits<{ add: []; edit: [string]; remove: [string] }>();
</script>
<template>
  <section class="rounded-lg border border-second-deep bg-white shadow-sm">
    <header class="flex flex-wrap items-center justify-between gap-2 border-b border-second-deep p-3">
      <div>
        <h2 tabindex="-1" class="text-base font-bold text-gray-900">Aceites asociados</h2>
        <p class="text-xs text-gray-500">
          Opcional · {{ aceites.length }} asociaciones
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md bg-main px-3 text-xs font-semibold text-white hover:bg-main-light disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="disabled"
        @click="emit('add')"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />Agregar aceite
      </button>
    </header>
    <p
      v-for="error in errors"
      :key="error"
      class="m-3 rounded bg-danger-bg p-2 text-xs text-danger"
      role="alert"
    >
      {{ error }}
    </p>
    <div
      v-if="!aceites.length"
      class="grid place-items-center gap-2 p-8 text-center"
    >
      <Droplet class="h-5 w-5 text-gray-400" aria-hidden="true" />
      <p class="text-sm font-semibold text-gray-700">No hay aceites asociados.</p>
      <p class="text-xs text-gray-600">Agrega el sistema y el aceite que utiliza este equipo.</p>
      <button type="button" class="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md border border-second-deep px-3 text-xs font-semibold text-main hover:bg-second disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled" @click="emit('add')">
        <Plus class="h-3.5 w-3.5" aria-hidden="true" />Agregar aceite
      </button>
    </div>
    <ul v-else>
      <li
        v-for="aceite in aceites"
        :key="aceite.draftId"
        class="grid gap-2 border-b border-second-deep px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_auto_auto] sm:items-center"
      >
        <div class="min-w-0">
          <p class="flex items-center gap-1.5 text-xs text-gray-600"><Cog class="h-3.5 w-3.5 text-main" aria-hidden="true" />Sistema</p>
          <p class="truncate text-sm font-semibold text-main">{{ aceite.sistema.nombre }}</p>
          <span v-if="aceite.sistema.estado === 'nuevo'" class="mt-1 inline-flex rounded bg-info-bg px-1.5 py-0.5 text-xs font-semibold text-info">Nuevo</span>
        </div>
        <div class="min-w-0">
          <p class="flex items-center gap-1.5 text-xs text-gray-600"><Droplet class="h-3.5 w-3.5 text-main" aria-hidden="true" />Aceite</p>
          <p class="truncate text-sm font-semibold text-gray-900">{{ aceite.aceite.nombre }}</p>
          <span v-if="aceite.aceite.estado === 'nuevo'" class="mt-1 inline-flex rounded bg-info-bg px-1.5 py-0.5 text-xs font-semibold text-info">Nuevo</span>
        </div>
        <button type="button" class="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border border-second-deep px-2 text-xs font-semibold text-main hover:bg-second disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled" aria-label="Editar aceite" title="Editar aceite" @click="emit('edit', aceite.draftId)"><Pencil class="h-3.5 w-3.5" aria-hidden="true" /></button>
        <button type="button" class="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border border-danger/30 px-2 text-xs font-semibold text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled" aria-label="Quitar aceite" title="Quitar aceite" @click="emit('remove', aceite.draftId)"><Trash2 class="h-3.5 w-3.5" aria-hidden="true" /></button>
      </li>
    </ul>
  </section>
</template>
