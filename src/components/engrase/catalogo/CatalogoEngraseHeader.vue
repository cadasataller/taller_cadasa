<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";

const emit = defineEmits<{
  back: [];
}>();
</script>

<template>
  <header
    class="flex min-h-13 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-sm sm:min-h-12 sm:px-3"
  >
    <button
      type="button"
      class="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-main transition-colors duration-150 hover:bg-main/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main active:bg-main/15 sm:min-h-8 sm:px-1.5 sm:text-xs"
      aria-label="Volver a filtros de engrase"
      @click="emit('back')"
    >
      <ArrowLeft class="h-4 w-4" aria-hidden="true" />
      <span class="hidden sm:inline">Volver</span>
    </button>

    <span class="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden="true" />

    <div class="min-w-0">
      <p
        class="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 md:block"
      >
        Engrase / Catalogo
      </p>
      <h1
        class="truncate text-base font-bold leading-tight text-main sm:text-[17px]"
      >
        <span class="sm:hidden">Catálogo de engrase</span>
        <span class="hidden sm:inline">Catálogo de filtros y engrase</span>
      </h1>
    </div>
  </header>
</template>
