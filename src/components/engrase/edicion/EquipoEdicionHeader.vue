<script setup lang="ts">
import { ArrowLeft, Circle } from "lucide-vue-next";
import type { EquipoEdicionDraft } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
defineProps<{ draft: EquipoEdicionDraft }>();
const emit = defineEmits<{ back: [] }>();
</script>
<template>
  <header class="mx-auto w-full max-w-[1600px] px-2 pt-2 sm:px-3 sm:pt-3">
    <div
      class="flex min-h-12 flex-wrap items-center gap-x-1.5 gap-y-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-sm sm:px-3"
    >
      <h1 class="sr-only">Editar equipo {{ draft.equipo.codigo }}</h1>
      <button
        type="button"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-xs font-semibold text-main transition hover:bg-main/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
        @click="emit('back')"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        <span class="hidden sm:inline">Volver a la lista de equipos</span>
        <span class="sm:hidden">Volver</span>
      </button>
      <span class="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden="true" />
      <span
        class="rounded-md bg-gray-50 px-2.5 py-1.5 font-mono text-sm font-bold leading-none text-main"
      >
        {{ draft.equipo.codigo }}
      </span>
      <span
        class="rounded-md bg-main/5 px-2.5 py-1.5 text-xs font-semibold leading-none text-main"
      >
        {{ draft.equipo.tipoEquipo }}
      </span>
      <span class="min-w-0 text-xs text-gray-500 sm:ml-0.5">
        <span class="hidden md:inline">Modelo / subtipo:</span>
        <strong class="ml-1 font-semibold text-main">
          {{ draft.equipo.subtipo || "Sin modelo / subtipo" }}
        </strong>
      </span>
      <div class="ml-auto flex items-center">
        <span
          class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize"
          :class="
            draft.equipo.estado === 'activo'
              ? 'bg-success-bg text-success'
              : 'bg-danger-bg text-danger'
          "
        >
          <Circle
            class="h-2.5 w-2.5 fill-current"
            aria-hidden="true"
          />
          {{ draft.equipo.estado }}
        </span>
      </div>
    </div>
  </header>
</template>
