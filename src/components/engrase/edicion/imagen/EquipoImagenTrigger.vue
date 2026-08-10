<script setup lang="ts">
import { ImagePlus, Pencil } from "lucide-vue-next";
import EquipoImagenPreview from "./EquipoImagenPreview.vue";
defineProps<{ src: string | null; tieneImagen: boolean; disabled?: boolean }>();
const emit = defineEmits<{ open: [] }>();
</script>
<template>
  <button
    type="button"
    :disabled="disabled"
    class="group relative flex h-full min-h-0 w-full cursor-pointer overflow-hidden rounded-md text-left shadow-sm ring-1 ring-second-deep transition hover:ring-2 hover:ring-main/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-not-allowed disabled:opacity-50"
    :aria-label="tieneImagen ? 'Administrar imagen principal' : 'Agregar imagen principal'"
    @click="emit('open')"
  >
    <EquipoImagenPreview
      :src="src"
      alt="Imagen principal del equipo"
      fill
    />
    <span
      class="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-main shadow-md transition group-hover:scale-105"
      aria-hidden="true"
    >
      <Pencil v-if="tieneImagen" class="h-4 w-4" />
      <ImagePlus v-else class="h-4 w-4" />
    </span>
    <span
      v-if="!tieneImagen"
      class="absolute inset-x-2.5 bottom-2.5 rounded bg-main/90 px-2.5 py-1.5 text-center text-xs font-semibold text-white shadow-sm"
    >
      Agregar imagen principal
    </span>
  </button>
</template>
