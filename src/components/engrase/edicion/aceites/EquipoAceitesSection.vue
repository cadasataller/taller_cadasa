<script setup lang="ts">
import { Droplet, Info, Plus } from "lucide-vue-next";
import EquipoAceiteDraftRow from "./EquipoAceiteDraftRow.vue";
import type { EquipoAceiteDraft } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";

defineProps<{ aceites: EquipoAceiteDraft[]; activeCount: number }>();
const emit = defineEmits<{
  add: [];
  edit: [string];
  remove: [string];
  undo: [string];
}>();
</script>

<template>
  <section class="rounded-lg border border-second-deep bg-white shadow-sm">
    <header
      class="flex flex-wrap items-center justify-between gap-2 border-b border-second-deep p-3"
    >
      <div>
        <h2 class="text-sm font-bold text-gray-900">3. Aceites asociados</h2>
        <p class="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-600">
          <Info class="h-3.5 w-3.5" />{{ activeCount }} activo{{
            activeCount === 1 ? "" : "s"
          }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md bg-main px-3 text-xs font-semibold text-white hover:bg-main-light"
        @click="emit('add')"
      >
        <Plus class="h-4 w-4" />Agregar aceite
      </button>
    </header>
    <div
      v-if="aceites.length === 0"
      class="grid place-items-center gap-2 p-5 text-center"
    >
      <Droplet class="h-5 w-5 text-gray-400" aria-hidden="true" />
      <p class="text-sm font-semibold text-gray-700">
        No hay aceites asociados.
      </p>
      <p class="text-xs text-gray-600">
        Agrega el sistema y el aceite que utiliza este equipo.
      </p>
      <button
        type="button"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md border border-second-deep px-3 text-xs font-semibold text-main hover:bg-second"
        @click="emit('add')"
      >
        <Plus class="h-3.5 w-3.5" />Agregar aceite
      </button>
    </div>
    <ul v-else>
      <EquipoAceiteDraftRow
        v-for="aceite in aceites"
        :key="aceite.draftId"
        :aceite="aceite"
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
        @undo="emit('undo', $event)"
      />
    </ul>
  </section>
</template>
