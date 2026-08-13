<script setup lang="ts">
import { ArrowLeft, CheckCircle2, Circle } from "lucide-vue-next";
defineProps<{ created: boolean; creating: boolean }>();
const emit = defineEmits<{ back: [] }>();
</script>
<template>
  <header class="mx-auto w-full max-w-6xl px-3 pt-3 sm:px-5">
    <div
      class="flex min-h-14 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 shadow-sm"
    >
      <button
        type="button"
        class="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-main hover:bg-main/10"
        @click="emit('back')"
      >
        <ArrowLeft class="h-4 w-4" />
        <span class="hidden sm:inline">Volver a la lista de equipos</span
        ><span class="sm:hidden">Volver</span>
      </button>
      <span class="hidden h-7 w-px bg-gray-200 sm:block" />
      <div>
        <h1 class="text-sm font-bold text-gray-900">Nuevo equipo</h1>
        <p class="text-[11px] text-gray-500">Creación</p>
      </div>
      <span
        class="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
        :class="created ? 'bg-success-bg text-success' : 'bg-main/10 text-main'"
      >
        <CheckCircle2 v-if="created" class="h-3.5 w-3.5" /><Circle
          v-else
          class="h-3.5 w-3.5 fill-current"
        />{{ creating ? "Creando…" : created ? "Creado" : "Borrador" }}
      </span>
    </div>
  </header>
</template>
