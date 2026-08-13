<script setup lang="ts">
import { Pencil } from "lucide-vue-next";
import type { CrearEquipoDatosDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";

defineProps<{ datos: CrearEquipoDatosDraft; disabled: boolean }>();
const emit = defineEmits<{ edit: [] }>();
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-second-deep text-xs">
    <header class="flex flex-wrap items-center justify-between gap-2 border-b border-second-deep bg-white px-3 py-2.5">
      <h3 class="text-sm font-bold text-main">Datos del equipo</h3>
      <button
        type="button"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-second-deep px-2.5 text-xs font-semibold text-main transition-colors hover:bg-second focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="disabled"
        @click="emit('edit')"
      >
        <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </header>
    <dl class="grid divide-y divide-second-deep bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
      <div class="min-w-0 p-2.5">
        <dt class="text-xs text-gray-600">Número de equipo</dt>
        <dd class="mt-0.5 font-mono text-sm font-bold text-gray-900">{{ datos.codigo }}</dd>
      </div>
      <div class="min-w-0 p-2.5">
        <dt class="text-xs text-gray-600">Tipo de equipo</dt>
        <dd class="mt-0.5 truncate text-sm font-semibold text-gray-900">{{ datos.tipoEquipo?.nombre || "—" }}</dd>
      </div>
      <div class="min-w-0 p-2.5">
        <dt class="text-xs text-gray-600">Modelo / subtipo</dt>
        <dd class="mt-0.5 truncate text-sm font-semibold text-gray-900">{{ datos.subtipo || "—" }}</dd>
      </div>
      <div class="min-w-0 p-2.5">
        <dt class="text-xs text-gray-600">Etapas</dt>
        <dd class="mt-0.5 flex flex-wrap gap-1">
          <span v-for="etapa in datos.etapas" :key="etapa.id" class="rounded bg-second px-1.5 py-0.5 text-xs font-semibold text-gray-700">{{ etapa.nombre }}</span>
          <span v-if="!datos.etapas.length" class="text-sm text-gray-500">—</span>
        </dd>
      </div>
      <div class="min-w-0 p-2.5">
        <dt class="text-xs text-gray-600">Estado</dt>
        <dd class="mt-0.5">
          <span class="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold" :class="datos.estado === 'activo' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'">{{ datos.estado === "activo" ? "Activo" : "Descartado" }}</span>
        </dd>
      </div>
    </dl>
  </section>
</template>
