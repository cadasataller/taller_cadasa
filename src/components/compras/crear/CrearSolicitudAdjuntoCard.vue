<script setup lang="ts">
import { FileText, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, watch } from 'vue';
import { shallowRef } from 'vue';

import { formatAdjuntoDisplayName } from './crearSolicitudAdjuntos.utils';
import type { CrearSolicitudAdjuntoLocalItem } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  item: CrearSolicitudAdjuntoLocalItem;
}>();

const emit = defineEmits<{
  (e: 'view', value: CrearSolicitudAdjuntoLocalItem): void;
  (e: 'remove', value: string): void;
}>();

const previewUrl = shallowRef<string | null>(null);
const displayName = computed(() => formatAdjuntoDisplayName(props.item.displayName));

const syncPreviewUrl = (): void => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }

  if (props.item.kind === 'image') {
    previewUrl.value = URL.createObjectURL(props.item.file);
  }
};

watch(() => props.item.file, syncPreviewUrl, { immediate: true });

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <article class="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
    <button
      type="button"
      class="group relative flex h-full w-full items-center justify-center overflow-hidden bg-stone-100 text-left"
      @click="emit('view', item)"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="item.displayName"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      >
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-stone-100"
      >
        <FileText
          class="h-10 w-10 text-stone-500"
        />
      </div>

      <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-8">
        <p class="text-xs font-semibold tracking-wide text-white">
          {{ displayName }}
        </p>
      </div>
    </button>

    <button
      type="button"
      class="absolute right-2 top-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-sm transition hover:bg-white hover:text-stone-900"
      aria-label="Eliminar archivo"
      @click="emit('remove', item.localId)"
    >
      <X class="h-4 w-4" />
    </button>
  </article>
</template>
