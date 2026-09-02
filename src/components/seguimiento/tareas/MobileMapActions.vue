<script setup lang="ts">
import { ListTodo, SlidersHorizontal } from "lucide-vue-next";

defineProps<{ taskCount: number }>();
const emit = defineEmits<{ openFilters: []; openTasks: [] }>();
</script>

<template>
  <div
    class="fixed inset-x-0 bottom-4 z-[31] grid grid-cols-2 gap-2 bg-transparent px-3 max-lg:bottom-20 xl:hidden"
  >
    <button
      class="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-main bg-white px-3 text-xs font-bold text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
      type="button"
      @click="emit('openFilters')"
    >
      <SlidersHorizontal class="size-4" aria-hidden="true" />Filtros
    </button>
    <button
      class="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-main px-3 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      type="button"
      @click="emit('openTasks')"
    >
      <ListTodo class="size-4" aria-hidden="true" />Tareas
      <span class="rounded-full bg-white/20 px-1.5 py-0.5">{{
        taskCount
      }}</span>
    </button>
  </div>
</template>
