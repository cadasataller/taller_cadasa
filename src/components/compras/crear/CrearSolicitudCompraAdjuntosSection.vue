<script setup lang="ts">
import { FileUp, X } from 'lucide-vue-next';
import { computed } from 'vue';
import { shallowRef } from 'vue';

import CrearSolicitudAdjuntoCard from './CrearSolicitudAdjuntoCard.vue';
import CrearSolicitudAdjuntoPreviewModal from './CrearSolicitudAdjuntoPreviewModal.vue';
import CrearSolicitudCompraAdjuntosForm from './CrearSolicitudCompraAdjuntosForm.vue';
import type {
  CrearSolicitudAdjuntoDraftInput,
  CrearSolicitudAdjuntoLocalItem,
  CrearSolicitudAdjuntoValidationIssue,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

interface AdjuntoSubmitPayload {
  items: CrearSolicitudAdjuntoDraftInput[];
  hasInvalidFiles: boolean;
}

const props = defineProps<{
  adjuntos: CrearSolicitudAdjuntoLocalItem[];
  adjuntosError?: string;
  adjuntosErroresRecientes: CrearSolicitudAdjuntoValidationIssue[];
}>();

const emit = defineEmits<{
  (e: 'add:adjuntos', value: CrearSolicitudAdjuntoDraftInput[]): void;
  (e: 'remove:adjunto', value: string): void;
  (e: 'clear:adjuntos-errors'): void;
}>();

const isFormOpen = shallowRef(false);
const previewItem = shallowRef<CrearSolicitudAdjuntoLocalItem | null>(null);

const hasAdjuntosErrors = computed(() => props.adjuntosErroresRecientes.length > 0 || Boolean(props.adjuntosError));

const handleSubmit = ({ items, hasInvalidFiles }: AdjuntoSubmitPayload): void => {
  emit('add:adjuntos', items);

  if (!hasInvalidFiles) {
    isFormOpen.value = false;
  }
};

const openForm = (): void => {
  isFormOpen.value = true;
};
</script>

<template>
  <div class="space-y-3">
   
    <button
      type="button"
      class="flex w-full items-center gap-3 rounded-[1.5rem] border border-dashed border-main/30 bg-main/5 px-4 py-2 text-left transition hover:border-main/50 hover:bg-main/10"
      @click="openForm"
    >
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-main shadow-sm">
        <FileUp class="h-5 w-5" />
      </div>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-stone-900">
          Agregar archivo
        </p>
        <p class="text-sm text-stone-500">
          PNG, JPG, WEBP, PDF o DOCX hasta 20 MB por archivo.
        </p>
      </div>
    </button>

    <div
      v-if="adjuntos.length > 0"
      class="flex flex-wrap gap-3"
    >
      <CrearSolicitudAdjuntoCard
        v-for="item in adjuntos"
        :key="item.localId"
        :item="item"
        @view="previewItem = $event"
        @remove="emit('remove:adjunto', $event)"
      />
    </div>

    <div
      v-if="hasAdjuntosErrors"
      class="rounded-2xl border border-danger/20 bg-danger-bg/70 px-4 py-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-danger">
            Archivos no agregados
          </p>
          <ul class="mt-2 space-y-1 text-sm text-danger">
            <li
              v-for="issue in adjuntosErroresRecientes"
              :key="issue.localId"
            >
              <span class="font-medium">{{ issue.fileName }}</span>: {{ issue.message }}
            </li>
          </ul>
          <p
            v-if="adjuntosErroresRecientes.length === 0 && adjuntosError"
            class="mt-2 text-sm text-danger"
          >
            {{ adjuntosError }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full text-danger transition hover:bg-white/60"
          @click="emit('clear:adjuntos-errors')"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <p
      v-if="adjuntos.length === 0"
      class="text-sm text-stone-500"
    >
      Sin adjuntos agregados.
    </p>

    <CrearSolicitudCompraAdjuntosForm
      v-if="isFormOpen"
      :existing-adjuntos="adjuntos"
      @cancel="isFormOpen = false"
      @submit="handleSubmit"
    />

    <CrearSolicitudAdjuntoPreviewModal
      v-if="previewItem"
      :item="previewItem"
      @close="previewItem = null"
    />
  </div>
</template>
