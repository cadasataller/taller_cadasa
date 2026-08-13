<script setup lang="ts">
import { Plus, Trash2 } from "lucide-vue-next";
import type { CrearEquipoFiltroDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
defineProps<{
  filtros: CrearEquipoFiltroDraft[];
  disabled: boolean;
  errors: string[];
}>();
const emit = defineEmits<{ add: []; edit: [string]; remove: [string] }>();
</script>
<template>
  <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
    <header class="flex items-center justify-between border-b p-4">
      <div>
        <h2 tabindex="-1" class="font-bold text-gray-900">
          Filtros del equipo
        </h2>
        <p class="text-xs text-gray-500">
          Debe existir al menos un filtro · {{ filtros.length }} asignados
        </p>
      </div>
      <button
        type="button"
        class="min-h-10 rounded-md bg-main px-3 text-xs font-bold text-white disabled:opacity-50"
        :disabled="disabled"
        @click="emit('add')"
      >
        <Plus class="mr-1 inline h-4 w-4" />Agregar filtro
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
    <div v-if="!filtros.length" class="p-8 text-center text-sm text-gray-500">
      Aún no hay filtros. Agrega el primero para continuar.
    </div>
    <ul v-else>
      <li
        v-for="filtro in filtros"
        :key="filtro.draftId"
        class="flex items-center gap-3 border-b p-3 last:border-0"
      >
        <div class="min-w-0 flex-1">
          <p class="font-bold text-gray-800">{{ filtro.tipoFiltro.nombre }}</p>
          <p class="font-mono text-xs text-gray-500">
            {{ filtro.filtro.codigo }} · Cantidad {{ filtro.cantidad }}
          </p>
        </div>
        <span
          class="text-xs"
          :class="
            filtro.filtro.estaEnListaCompras ? 'text-success' : 'text-gray-500'
          "
          >{{
            filtro.filtro.estaEnListaCompras ? "En compras" : "Sin compras"
          }}</span
        ><button
          type="button"
          class="min-h-9 rounded border px-2 text-xs"
          :disabled="disabled"
          @click="emit('edit', filtro.draftId)"
        >
          Editar</button
        ><button
          type="button"
          class="min-h-9 rounded border border-danger/30 px-2 text-danger disabled:opacity-50"
          :disabled="disabled || filtros.length === 1"
          :title="filtros.length === 1 ? 'Debe existir al menos un filtro' : ''"
          @click="emit('remove', filtro.draftId)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </li>
    </ul>
  </section>
</template>
