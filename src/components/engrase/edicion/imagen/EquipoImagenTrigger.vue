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
    class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-second-deep bg-white px-2 text-left hover:bg-second disabled:cursor-not-allowed disabled:opacity-50"
    @click="emit('open')"
  >
    <EquipoImagenPreview :src="src" alt="Imagen principal del equipo" />
    <span class="grid gap-0.5"
      ><span class="text-sm font-semibold text-main">{{
        tieneImagen ? "Imagen principal" : "Sin imagen principal"
      }}</span
      ><span class="text-xs text-gray-600">{{
        tieneImagen ? "Administrar imagen" : "Agregar imagen"
      }}</span></span
    >
    <Pencil
      v-if="tieneImagen"
      class="ml-1 h-4 w-4 text-main"
      aria-hidden="true"
    /><ImagePlus v-else class="ml-1 h-4 w-4 text-main" aria-hidden="true" />
  </button>
</template>
