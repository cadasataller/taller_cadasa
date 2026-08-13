<script setup lang="ts">
import EquipoImagenForm from "@/components/engrase/edicion/imagen/EquipoImagenForm.vue";
import type { CrearEquipoImagenState } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
defineProps<{
  previewUrl: string | null;
  state: CrearEquipoImagenState;
  hasImage: boolean;
  warning: string | null;
}>();
const emit = defineEmits<{ select: [File]; retryCleanup: [] }>();
</script>
<template>
  <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h2 tabindex="-1" class="font-bold text-gray-900">Imagen del equipo</h2>
    <p class="mt-1 text-sm text-gray-500">
      La imagen es opcional. El equipo ya fue creado.
    </p>
    <div class="mt-4">
      <EquipoImagenForm
        :preview-url="previewUrl"
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
