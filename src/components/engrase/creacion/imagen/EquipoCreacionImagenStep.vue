<script setup lang="ts">
import { AlertTriangle, Loader2, RotateCcw } from "lucide-vue-next";
import EquipoImagenForm from "@/components/engrase/edicion/imagen/EquipoImagenForm.vue";
import type { CrearEquipoImagenState } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
defineProps<{
  previewUrl: string | null;
  currentImageUrl: string | null;
  currentImageLoading: boolean;
  currentImageError: string | null;
  state: CrearEquipoImagenState;
  hasImage: boolean;
  warning: string | null;
}>();
const emit = defineEmits<{
  select: [File];
  retryCleanup: [];
  retryCurrentImage: [];
}>();
</script>
<template>
  <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h2 tabindex="-1" class="font-bold text-gray-900">Imagen del equipo</h2>
    <p class="mt-1 text-sm text-gray-500">
      La imagen es opcional. El equipo ya fue creado.
    </p>
    <div class="mt-4">
      <EquipoImagenForm
        :preview-url="previewUrl ?? currentImageUrl"
        :processing="
          state.kind === 'preparing' ||
          state.kind === 'uploading' ||
          state.kind === 'registering'
        "
        :tiene-imagen="hasImage"
        @select="emit('select', $event)"
      />
    </div>
    <p
      v-if="currentImageLoading && hasImage && !previewUrl"
      class="mt-3 inline-flex items-center gap-1.5 text-xs text-main"
      role="status"
    >
      <Loader2 class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      Cargando imagen actual…
    </p>
    <div
      v-if="currentImageError"
      class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded bg-warning-bg p-2 text-xs text-warning"
      role="alert"
    >
      <span class="inline-flex items-start gap-1.5"><AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" />{{ currentImageError }}</span>
      <button
        type="button"
        class="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded border border-warning/30 px-2.5 font-semibold"
        @click="emit('retryCurrentImage')"
      >
        <RotateCcw class="h-3.5 w-3.5" />Reintentar
      </button>
    </div>
    <p
      v-if="state.kind === 'error' || state.kind === 'cleanup_pending'"
      class="mt-3 rounded bg-danger-bg p-2 text-xs text-danger"
      role="alert"
    >
      {{ state.message }}
    </p>
    <button
      v-if="state.kind === 'cleanup_pending'"
      class="mt-2 min-h-10 cursor-pointer rounded border px-3 text-xs font-bold"
      @click="emit('retryCleanup')"
    >
      Reintentar limpieza
    </button>
    <p
      v-if="warning"
      class="mt-3 rounded bg-warning-bg p-2 text-xs text-warning"
    >
      {{ warning }}
    </p>
  </section>
</template>
