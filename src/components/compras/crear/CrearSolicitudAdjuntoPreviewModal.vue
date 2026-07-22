<script setup lang="ts">
import { ExternalLink, FileText, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { shallowRef } from 'vue';

import type { CrearSolicitudAdjuntoLocalItem } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  item: CrearSolicitudAdjuntoLocalItem;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const objectUrl = shallowRef<string | null>(null);
const pdfFallback = shallowRef(false);

const openInNewContext = (): void => {
  if (!objectUrl.value) {
    return;
  }

  window.open(objectUrl.value, '_blank', 'noopener,noreferrer');
};

const syncObjectUrl = (): void => {
  pdfFallback.value = false;

  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }

  objectUrl.value = URL.createObjectURL(props.item.file);
};

const handleEscape = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

const title = computed(() => props.item.displayName);

watch(() => props.item, syncObjectUrl, { immediate: true, deep: true });

onMounted(() => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', handleEscape);

  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
  }
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] bg-black/80">
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-white lg:px-6">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold lg:text-base">
              {{ title }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
              @click="openInNewContext"
            >
              <ExternalLink class="h-4 w-4" />
              Abrir
            </button>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              @click="emit('close')"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="flex min-h-0 flex-1 items-center justify-center p-4 lg:p-6">
          <img
            v-if="item.kind === 'image' && objectUrl"
            :src="objectUrl"
            :alt="item.displayName"
            class="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
          >

          <div
            v-else-if="item.kind === 'pdf'"
            class="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white"
          >
            <iframe
              v-if="!pdfFallback && objectUrl"
              :src="objectUrl"
              title="Vista previa PDF"
              class="h-full w-full"
              @error="pdfFallback = true"
            />

            <div
              v-else
              class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
            >
              <FileText class="h-10 w-10 text-stone-500" />
              <p class="max-w-md text-sm font-medium text-stone-700">
                No fue posible mostrar el PDF en este visor. Puedes abrirlo en otra pestaña.
              </p>
              <button
                type="button"
                class="rounded-full bg-main px-4 py-2 text-sm font-semibold text-white transition hover:bg-main-light"
                @click="openInNewContext"
              >
                Abrir documento
              </button>
            </div>
          </div>

          <div
            v-else
            class="flex max-w-lg flex-col items-center gap-4 rounded-[2rem] bg-white px-6 py-8 text-center shadow-2xl"
          >
            <FileText class="h-10 w-10 text-stone-500" />
            <p class="text-base font-semibold text-stone-900">
              Este archivo no tiene vista previa embebida.
            </p>
            <p class="text-sm text-stone-600">
              Puedes abrir el documento para revisarlo en otra pestaña.
            </p>
            <button
              type="button"
              class="rounded-full bg-main px-4 py-2 text-sm font-semibold text-white transition hover:bg-main-light"
              @click="openInNewContext"
            >
              Abrir documento
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
