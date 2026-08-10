<script setup lang="ts">
import { Plus, Info } from "lucide-vue-next";
import EquipoFiltroDraftRow from "./EquipoFiltroDraftRow.vue";
import type { EquipoFiltroDraft } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
defineProps<{ filtros: EquipoFiltroDraft[]; activeCount: number }>();
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
        <h2 class="text-base font-bold text-gray-900">Filtros del equipo</h2>
      </div>
      <button
        type="button"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md bg-main px-3 text-xs font-semibold text-white hover:bg-main-light"
        @click="emit('add')"
      >
        <Plus class="h-4 w-4" />Agregar filtro
      </button>
    </header>
    <p
      v-if="filtros.length === 0"
      class="mx-3 mt-2 rounded-md bg-info-bg px-2 py-1.5 text-xs text-info"
      role="status"
    >
      <Info class="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
      Mínimo 1 filtro activo requerido.
    </p>
    <ul>
      <EquipoFiltroDraftRow
        v-for="filtro in filtros"
        :key="filtro.draftId"
        :filtro="filtro"
        :can-remove="activeCount > 1"
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
        @undo="emit('undo', $event)"
      />
    </ul>
  </section>
</template>
