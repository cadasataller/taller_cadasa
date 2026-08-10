<script setup lang="ts">
import { Pencil, Trash2, Undo2, CheckCircle2 } from "lucide-vue-next";
import type { EquipoFiltroDraft } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
import { obtenerIconoTipoFiltro } from "@/utils/filtrosEngraseIconos";
defineProps<{ filtro: EquipoFiltroDraft; canRemove: boolean }>();
const emit = defineEmits<{
  edit: [string];
  remove: [string];
  undo: [string];
}>();
</script>
<template>
  <li
    class="grid gap-2 border-b border-second-deep px-3 py-2.5 last:border-b-0 sm:grid-cols-[minmax(11rem,1.4fr)_minmax(7rem,1fr)_auto_auto] sm:items-center"
  >
    <div class="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2">
      <span class="row-span-2 flex items-center justify-center rounded-md bg-main/10 text-main">
        <component
          :is="obtenerIconoTipoFiltro(filtro.tipoFiltro.nombre).icono"
          class="h-5 w-5 shrink-0"
          aria-hidden="true"
        />
      </span>
      <p class="min-w-0 truncate self-end text-sm font-semibold text-main">
        {{ filtro.tipoFiltro.nombre }}
      </p>
      <p class="min-w-0 truncate self-start font-mono text-xs font-semibold text-gray-900">
        {{ filtro.filtro.codigo }}
      </p>
    </div>
    <div class="flex flex-wrap gap-1.5 text-xs">
      <span class="rounded bg-second px-1.5 py-0.5 text-gray-700"
        >Cantidad: ×{{ filtro.cantidad }}</span
      ><span class="rounded bg-second px-1.5 py-0.5 text-gray-700">{{
        filtro.filtro.estaEnListaCompras
          ? "En lista de compras"
          : "Fuera de lista de compras"
      }}</span
      ><span
        v-if="filtro.cantidadEquivalencias"
        class="rounded bg-info-bg px-1.5 py-0.5 text-info"
        >{{ filtro.cantidadEquivalencias }} equivalencias</span
      >
    </div>
    <span
      v-if="filtro.estadoOperacion === 'pendiente_eliminacion'"
      class="inline-flex w-fit items-center gap-1 rounded bg-warning-bg px-2 py-1 text-xs font-semibold text-warning"
      ><CheckCircle2 class="h-3.5 w-3.5" />Pendiente de eliminación</span
    >
    <span v-else class="text-xs text-gray-500">{{
      filtro.estadoOperacion === "nuevo"
        ? "Nuevo"
        : filtro.estadoOperacion === "actualizado"
          ? "Actualizado"
          : "Activo"
    }}</span>
    <div class="flex gap-1.5 sm:justify-end">
      <button
        v-if="filtro.estadoOperacion !== 'pendiente_eliminacion'"
        type="button"
        class="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border border-second-deep px-2 text-xs font-semibold text-main hover:bg-second disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Editar filtro"
        title="Editar filtro"
        @click="emit('edit', filtro.draftId)"
      >
        <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        v-if="filtro.estadoOperacion !== 'pendiente_eliminacion'"
        type="button"
        :disabled="!canRemove"
        class="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-danger/30 px-2 text-xs font-semibold text-danger hover:bg-danger-bg disabled:opacity-50"
        :class="canRemove ? 'cursor-pointer' : 'cursor-not-allowed'"
        aria-label="Quitar filtro"
        title="Quitar filtro"
        @click="emit('remove', filtro.draftId)"
      >
        <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        v-else
        type="button"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md border border-warning/30 px-2 text-xs font-semibold text-warning hover:bg-warning-bg"
        @click="emit('undo', filtro.draftId)"
      >
        <Undo2 class="h-3.5 w-3.5" />Deshacer
      </button>
    </div>
  </li>
</template>
