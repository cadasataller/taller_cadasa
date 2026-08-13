<script setup lang="ts">
import { Droplet, Plus, Trash2 } from "lucide-vue-next";
import type { CrearEquipoAceiteDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
defineProps<{
  aceites: CrearEquipoAceiteDraft[];
  disabled: boolean;
  errors: string[];
}>();
const emit = defineEmits<{ add: []; edit: [string]; remove: [string] }>();
</script>
<template>
  <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
    <header class="flex items-center justify-between border-b p-4">
      <div>
        <h2 tabindex="-1" class="font-bold text-gray-900">Aceites asociados</h2>
        <p class="text-xs text-gray-500">
          Opcional · {{ aceites.length }} asociaciones
        </p>
      </div>
      <button
        type="button"
        class="min-h-10 rounded-md bg-main px-3 text-xs font-bold text-white disabled:opacity-50"
        :disabled="disabled"
        @click="emit('add')"
      >
        <Plus class="mr-1 inline h-4 w-4" />Agregar aceite
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
      class="grid place-items-center gap-2 p-8 text-sm text-gray-500"
    >
      <Droplet class="h-5 w-5" />No hay aceites asociados.
    </div>
    <ul v-else>
      <li
        v-for="aceite in aceites"
        :key="aceite.draftId"
        class="flex items-center gap-3 border-b p-3 last:border-0"
      >
        <div class="flex-1">
          <p class="font-bold">{{ aceite.sistema.nombre }}</p>
          <p class="text-xs text-gray-500">{{ aceite.aceite.nombre }}</p>
        </div>
        <button
          type="button"
          class="min-h-9 rounded border px-2 text-xs"
          :disabled="disabled"
          @click="emit('edit', aceite.draftId)"
        >
          Editar</button
        ><button
          type="button"
          class="min-h-9 rounded border border-danger/30 px-2 text-danger disabled:opacity-50"
          :disabled="disabled"
          @click="emit('remove', aceite.draftId)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </li>
    </ul>
  </section>
</template>
