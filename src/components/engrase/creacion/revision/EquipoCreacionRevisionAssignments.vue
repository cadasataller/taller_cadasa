<script setup lang="ts">
import { Droplet, Pencil } from "lucide-vue-next";
import type { CrearEquipoAceiteDraft, CrearEquipoFiltroDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
import { obtenerIconoTipoFiltro } from "@/utils/filtrosEngraseIconos";

defineProps<{
  filtros: CrearEquipoFiltroDraft[];
  aceites: CrearEquipoAceiteDraft[];
  disabled: boolean;
}>();
const emit = defineEmits<{ editFilters: []; editOils: [] }>();
</script>

<template>
  <div class="grid gap-2.5 text-xs">
    <section class="overflow-hidden rounded-xl border border-second-deep">
      <header class="flex flex-wrap items-center justify-between gap-2 border-b border-second-deep bg-white px-3 py-2.5">
        <div>
          <h3 class="text-sm font-bold text-main">Filtros asignados</h3>
        </div>
        <button type="button" class="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-second-deep px-2.5 text-xs font-semibold text-main transition-colors hover:bg-second focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled" @click="emit('editFilters')">
          <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </header>
      <ul class="grid gap-2.5 bg-white p-3 lg:grid-cols-3">
        <li v-for="filtro in filtros" :key="filtro.draftId" class="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2 rounded-lg border border-second-deep bg-white p-2 shadow-sm">
          <span class="grid h-9 w-9 self-center place-items-center rounded-md bg-main/10 text-main">
            <component :is="obtenerIconoTipoFiltro(filtro.tipoFiltro.nombre).icono" class="h-4 w-4" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold leading-4 text-main">{{ filtro.tipoFiltro.nombre }}</p>
            <p class="mt-0.5 truncate font-mono text-xs font-semibold leading-4 text-gray-900">{{ filtro.filtro.codigo }}</p>
            <div class="mt-1.5 flex flex-wrap gap-1 text-[10px] leading-3">
              <span class="rounded bg-second px-1.5 py-0.5 text-gray-700">Cantidad: ×{{ filtro.cantidad }}</span>
              <span class="rounded bg-second px-1.5 py-0.5 text-gray-700">{{ filtro.filtro.estaEnListaCompras ? "En lista de compras" : "Fuera de lista de compras" }}</span>
              <span v-if="filtro.tipoFiltro.estado === 'nuevo'" class="rounded bg-warning-bg px-1.5 py-0.5 text-warning">Tipo nuevo</span>
              <span v-if="filtro.filtro.estado === 'nuevo'" class="rounded bg-warning-bg px-1.5 py-0.5 text-warning">Filtro nuevo</span>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <section class="overflow-hidden rounded-xl border border-second-deep">
      <header class="flex flex-wrap items-center justify-between gap-2 border-b border-second-deep bg-white px-3 py-2.5">
        <div>
          <h3 class="text-sm font-bold text-main">Aceites asociados</h3>
        </div>
        <button type="button" class="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-second-deep px-2.5 text-xs font-semibold text-main transition-colors hover:bg-second focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled" @click="emit('editOils')">
          <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </header>
      <div v-if="!aceites.length" class="flex items-center gap-2.5 bg-white px-3 py-3 text-sm text-gray-600">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-second text-gray-500"><Droplet class="h-5 w-5" aria-hidden="true" /></span>
        <p>Sin aceites asociados — esta sección es opcional.</p>
      </div>
      <ul v-else class="grid gap-2.5 bg-white p-3 lg:grid-cols-3">
        <li v-for="aceite in aceites" :key="aceite.draftId" class="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 rounded-lg border border-second-deep bg-white p-2 shadow-sm">
          <span class="grid h-9 w-9 self-center place-items-center rounded-md bg-main/10 text-main"><Droplet class="h-4 w-4" aria-hidden="true" /></span>
          <div class="min-w-0">
            <p class="text-xs text-gray-600">Aceite</p>
            <p class="mt-0.5 truncate text-sm font-semibold leading-4 text-gray-900">{{ aceite.aceite.nombre }}</p>
            <span v-if="aceite.aceite.estado === 'nuevo'" class="mt-1 inline-flex rounded bg-info-bg px-1.5 py-0.5 text-[10px] font-semibold leading-3 text-info">Nuevo</span>
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-600">Sistema</p>
            <p class="mt-0.5 truncate text-sm font-semibold leading-4 text-main">{{ aceite.sistema.nombre }}</p>
            <span v-if="aceite.sistema.estado === 'nuevo'" class="mt-1 inline-flex rounded bg-info-bg px-1.5 py-0.5 text-[10px] font-semibold leading-3 text-info">Nuevo</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
