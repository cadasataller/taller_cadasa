<script setup lang="ts">
import { Filter, Pencil, Plus, Trash2 } from "lucide-vue-next";
import type { CrearEquipoFiltroDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";

defineProps<{
  filtros: CrearEquipoFiltroDraft[];
  disabled: boolean;
  errors: string[];
}>();

const emit = defineEmits<{ add: []; edit: [string]; remove: [string] }>();
</script>

<template>
  <section class="rounded-lg border border-second-deep bg-white shadow-sm">
    <header class="flex flex-wrap items-center justify-between gap-2 border-b border-second-deep p-3">
      <div>
        <h2 tabindex="-1" class="text-base font-bold text-gray-900">Filtros del equipo</h2>
        <p class="text-xs text-gray-500">Mínimo 1 filtro activo requerido · {{ filtros.length }} asignados</p>
      </div>
      <button v-if="filtros.length" type="button" class="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md bg-main px-3 text-xs font-semibold text-white hover:bg-main-light disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled" @click="emit('add')">
        <Plus class="h-4 w-4" />Agregar filtro
      </button>
    </header>

    <p v-for="error in errors" :key="error" class="m-3 rounded-md bg-danger-bg px-3 py-2 text-xs text-danger" role="alert">{{ error }}</p>
    <div v-if="!filtros.length" class="grid min-h-28 place-items-center p-4">
      <button
        type="button"
        class="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border border-main/25 bg-white px-4 text-xs font-semibold text-main shadow-sm transition-colors hover:bg-second disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="disabled"
        @click="emit('add')"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        Agregar primer filtro
      </button>
    </div>

    <ul v-else>
      <li v-for="filtro in filtros" :key="filtro.draftId" class="grid gap-2 border-b border-second-deep px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(11rem,1.4fr)_minmax(7rem,1fr)_auto] sm:items-center">
        <div class="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2">
          <span class="row-span-2 flex items-center justify-center rounded-md bg-main/10 text-main"><Filter class="h-5 w-5" aria-hidden="true" /></span>
          <p class="min-w-0 truncate self-end text-sm font-semibold text-main">{{ filtro.tipoFiltro.nombre }}</p>
          <p class="min-w-0 truncate self-start font-mono text-xs font-semibold text-gray-900">{{ filtro.filtro.codigo }}</p>
        </div>
        <div class="flex flex-wrap gap-1.5 text-xs">
          <span class="rounded bg-second px-1.5 py-0.5 text-gray-700">Cantidad: ×{{ filtro.cantidad }}</span>
          <span class="rounded bg-second px-1.5 py-0.5 text-gray-700">{{ filtro.filtro.estaEnListaCompras ? "En lista de compras" : "Fuera de lista de compras" }}</span>
          <span v-if="filtro.tipoFiltro.estado === 'nuevo'" class="rounded bg-warning-bg px-1.5 py-0.5 text-warning">Tipo nuevo</span>
          <span v-if="filtro.filtro.estado === 'nuevo'" class="rounded bg-warning-bg px-1.5 py-0.5 text-warning">Filtro nuevo</span>
        </div>
        <div class="flex gap-1.5 sm:justify-end">
          <button type="button" class="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border border-second-deep px-2 text-xs font-semibold text-main hover:bg-second disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled" aria-label="Editar filtro" title="Editar filtro" @click="emit('edit', filtro.draftId)"><Pencil class="h-3.5 w-3.5" aria-hidden="true" /></button>
          <button type="button" class="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-danger/30 px-2 text-xs font-semibold text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled || filtros.length === 1" :title="filtros.length === 1 ? 'Debe existir al menos un filtro' : ''" aria-label="Quitar filtro" @click="emit('remove', filtro.draftId)"><Trash2 class="h-4 w-4" /></button>
        </div>
      </li>
    </ul>
  </section>
</template>
