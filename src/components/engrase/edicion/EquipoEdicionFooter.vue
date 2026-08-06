<script setup lang="ts">
import { Save, X } from "lucide-vue-next";
defineProps<{ canSave: boolean; saving: boolean }>();
const emit = defineEmits<{ cancel: []; save: [] }>();
</script>
<template>
  <footer
    class="sticky bottom-0 z-10 flex flex-col gap-1.5 border-t border-gray-200 bg-white/95 px-3 py-2 backdrop-blur sm:flex-row sm:justify-end sm:px-4"
  >
    <button
      type="button"
      class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
      @click="emit('cancel')"
    >
      <X class="h-3.5 w-3.5" aria-hidden="true" /> Cancelar
    </button>
    <button
      type="button"
      :disabled="!canSave || saving"
      class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-main px-3 text-xs font-semibold text-white transition hover:bg-main-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-not-allowed disabled:opacity-50"
      :class="canSave && !saving ? 'cursor-pointer' : 'cursor-not-allowed'"
      @click="emit('save')"
    >
      <Save class="h-3.5 w-3.5" aria-hidden="true" /> Guardar cambios
    </button>
  </footer>
</template>
