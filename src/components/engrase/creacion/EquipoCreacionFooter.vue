<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Save,
  X,
} from "lucide-vue-next";
defineProps<{
  step: number;
  nextDisabled: boolean;
  creating: boolean;
  imageSaving: boolean;
  canSaveImage: boolean;
  canFinish: boolean;
}>();
const emit = defineEmits<{
  cancel: [];
  back: [];
  next: [];
  create: [];
  saveImage: [];
  skip: [];
  finish: [];
}>();
</script>
<template>
  <footer
    class="sticky bottom-0 z-20 flex flex-col gap-2 border-t border-gray-200 bg-white/95 px-4 py-2 backdrop-blur sm:flex-row sm:justify-end"
  >
    <button
      v-if="step === 1"
      type="button"
      class="min-h-11 rounded-md border border-gray-300 px-3 text-xs font-bold"
      :disabled="creating"
      @click="emit('cancel')"
    >
      <X class="mr-1 inline h-4 w-4" />Cancelar</button
    ><button
      v-else-if="step < 5"
      type="button"
      class="min-h-11 rounded-md border border-gray-300 px-3 text-xs font-bold"
      :disabled="creating"
      @click="emit('back')"
    >
      <ArrowLeft class="mr-1 inline h-4 w-4" />Atrás</button
    ><button
      v-if="step < 4"
      type="button"
      class="min-h-11 rounded-md bg-main px-4 text-xs font-bold text-white disabled:opacity-50"
      :disabled="nextDisabled"
      @click="emit('next')"
    >
      Siguiente <ArrowRight class="ml-1 inline h-4 w-4" /></button
    ><button
      v-else-if="step === 4"
      type="button"
      class="min-h-11 rounded-md bg-main px-4 text-xs font-bold text-white disabled:opacity-50"
      :disabled="nextDisabled"
      @click="emit('create')"
    >
      <Loader2 v-if="creating" class="mr-1 inline h-4 w-4 animate-spin" />{{
        creating ? "Creando equipo…" : "Crear equipo"
      }}</button
    ><template v-else
      ><button
        type="button"
        class="min-h-11 rounded-md border border-gray-300 px-3 text-xs font-bold"
        :disabled="imageSaving"
        @click="emit('skip')"
      >
        Omitir por ahora</button
      ><button
        v-if="canSaveImage"
        type="button"
        class="min-h-11 rounded-md bg-main px-4 text-xs font-bold text-white"
        :disabled="imageSaving"
        @click="emit('saveImage')"
      >
        <Save class="mr-1 inline h-4 w-4" />Guardar imagen</button
      ><button
        v-else
        type="button"
        class="min-h-11 rounded-md bg-main px-4 text-xs font-bold text-white disabled:opacity-50"
        :disabled="!canFinish"
        @click="emit('finish')"
      >
        <Check class="mr-1 inline h-4 w-4" />Finalizar
      </button></template
    >
  </footer>
</template>
