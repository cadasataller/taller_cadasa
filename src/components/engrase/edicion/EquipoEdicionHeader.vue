<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import type { EquipoEdicionDraft } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
defineProps<{ draft: EquipoEdicionDraft; stagesCount: number }>();
const emit = defineEmits<{ back: [] }>();
</script>
<template>
  <header class="border-b border-gray-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
    <button
      type="button"
      class="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-main transition hover:bg-main/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
      @click="emit('back')"
    >
      <ArrowLeft class="h-4 w-4" aria-hidden="true" /> Volver a equipos
    </button>
    <div class="mt-1.5 flex flex-wrap items-end justify-between gap-2">
      <div>
        <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-main">
          Edición operativa
        </p>
        <h1
          class="font-mono text-lg font-bold leading-tight text-gray-900 sm:text-xl"
        >
          Editar equipo · {{ draft.equipo.codigo }}
        </h1>
        <p class="mt-0.5 text-xs text-gray-600">
          {{ draft.equipo.tipoEquipo }} ·
          {{ draft.equipo.subtipo || "Sin modelo / subtipo" }}
        </p>
      </div>
      <div class="flex items-center gap-1.5 text-[11px] font-semibold">
        <span
          class="rounded-full px-2 py-0.5"
          :class="
            draft.equipo.estado === 'activo'
              ? 'bg-success-bg text-success'
              : 'bg-danger-bg text-danger'
          "
          >{{ draft.equipo.estado }}</span
        ><span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700"
          >{{ stagesCount }} etapas</span
        >
      </div>
    </div>
  </header>
</template>
