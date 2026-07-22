<script setup lang="ts">
import { FileText, FileUp, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { shallowRef } from 'vue';

import {
  buildAdjuntoFingerprint,
  buildAdjuntoDisplayName,
  buildAdjuntoDefaultBaseName,
  formatAdjuntoSize,
  validateAdjuntosSelection,
} from './crearSolicitudAdjuntos.utils';
import type {
  CrearSolicitudAdjuntoDraftInput,
  CrearSolicitudAdjuntoLocalItem,
  CrearSolicitudAdjuntoValidationIssue,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

interface AdjuntoSubmitPayload {
  items: CrearSolicitudAdjuntoDraftInput[];
  hasInvalidFiles: boolean;
}

interface SelectedAdjuntoDraft {
  localId: string;
  file: File;
  customName: string;
  defaultBaseName: string;
}

const props = defineProps<{
  existingAdjuntos: CrearSolicitudAdjuntoLocalItem[];
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submit', value: AdjuntoSubmitPayload): void;
}>();

const viewportWidth = shallowRef(typeof window === 'undefined' ? 1280 : window.innerWidth);
const selectedFiles = shallowRef<SelectedAdjuntoDraft[]>([]);
const validationIssues = shallowRef<CrearSolicitudAdjuntoValidationIssue[]>([]);
const previewUrls = shallowRef<Record<string, string>>({});

const isDesktop = computed(() => viewportWidth.value >= 1024);

const syncViewportWidth = (): void => {
  viewportWidth.value = window.innerWidth;
};

const blockEscapeClose = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
  }
};

const releasePreviewUrls = (): void => {
  Object.values(previewUrls.value).forEach((url) => {
    URL.revokeObjectURL(url);
  });
  previewUrls.value = {};
};

const syncPreviewUrls = (): void => {
  releasePreviewUrls();

  previewUrls.value = selectedFiles.value.reduce<Record<string, string>>((acc, item) => {
    if (item.file.type.startsWith('image/')) {
      acc[item.localId] = URL.createObjectURL(item.file);
    }
    return acc;
  }, {});
};

const handleFileSelection = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  const incomingFiles = Array.from(input.files ?? []);
  const knownFingerprints = new Set(selectedFiles.value.map((item) => buildAdjuntoFingerprint(item.file)));
  const baseIndex = selectedFiles.value.length + 1;

  selectedFiles.value = [
    ...selectedFiles.value,
    ...incomingFiles
      .filter((file) => !knownFingerprints.has(buildAdjuntoFingerprint(file)))
      .map((file, index) => ({
        localId: crypto.randomUUID(),
        file,
        customName: '',
        defaultBaseName: buildAdjuntoDefaultBaseName(baseIndex + index),
      })),
  ];
  validationIssues.value = [];
  input.value = '';
};

const removeSelectedFile = (localId: string): void => {
  selectedFiles.value = selectedFiles.value.filter((item) => item.localId !== localId);
};

const handleSubmit = (): void => {
  const itemsToValidate = selectedFiles.value.map<CrearSolicitudAdjuntoDraftInput>((item, index) => ({
    file: item.file,
    displayName: buildAdjuntoDisplayName(item.customName, item.file.name, index + 1),
  }));
  const { acceptedItems, invalidIssues } = validateAdjuntosSelection(itemsToValidate, props.existingAdjuntos);
  const invalidNames = new Set(invalidIssues.map((issue) => issue.fileName));

  validationIssues.value = invalidIssues;

  if (acceptedItems.length > 0) {
    emit('submit', {
      items: acceptedItems,
      hasInvalidFiles: invalidIssues.length > 0,
    });
  }

  if (invalidIssues.length > 0) {
    selectedFiles.value = selectedFiles.value.filter((item) => invalidNames.has(item.file.name));
  }
};

watch(selectedFiles, syncPreviewUrls, { deep: true });

onMounted(() => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('resize', syncViewportWidth);
  window.addEventListener('keydown', blockEscapeClose, true);
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  window.removeEventListener('resize', syncViewportWidth);
  window.removeEventListener('keydown', blockEscapeClose, true);
  releasePreviewUrls();
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[90] bg-[#EEECE4]/45 backdrop-blur-[3px]">
      <div
        class="flex h-full w-full"
        :class="isDesktop ? 'justify-end p-4' : 'items-end'"
      >
        <div
          class="flex w-full flex-col border border-stone-200 bg-white shadow-2xl"
          :class="isDesktop
            ? 'h-full max-w-[36rem] overflow-hidden rounded-[2rem]'
            : 'max-h-[92vh] overflow-hidden rounded-t-[2rem] border-b-0'"
        >
          <div class="shrink-0 border-b border-stone-200 px-4 py-4 lg:px-6">
            <p class="font-display text-2xl leading-none tracking-wide text-main">
              Agregar archivo
            </p>
            <p class="mt-2 text-sm text-stone-600">
              Selecciona imagenes, PDF o DOCX. Puedes cargar varios archivos en una sola operacion.
            </p>
          </div>

          <div class="space-y-4 px-4 py-4 lg:flex-1 lg:overflow-y-auto lg:px-6">
            <label class="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-main/30 bg-main/5 px-4 py-8 text-center transition hover:border-main/50 hover:bg-main/10">
              <FileUp class="h-8 w-8 text-main" />
              <span class="mt-3 text-sm font-semibold text-main">Seleccionar archivos</span>
              <span class="mt-1 text-xs text-stone-500">PNG, JPG, WEBP, PDF o DOCX hasta 20 MB por archivo</span>
              <input
                accept=".png,.jpg,.jpeg,.webp,.pdf,.docx"
                multiple
                type="file"
                class="sr-only"
                @change="handleFileSelection"
              >
            </label>

            <div
              v-if="selectedFiles.length > 0"
              class="space-y-3"
            >
              <div
                v-for="(item, index) in selectedFiles"
                :key="item.localId"
                class="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3"
              >
                <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  <img
                    v-if="previewUrls[item.localId]"
                    :src="previewUrls[item.localId]"
                    :alt="item.file.name"
                    class="h-full w-full object-cover"
                  >
                  <FileText
                    v-else
                    class="h-6 w-6 text-stone-500"
                  />
                </div>

                <div class="min-w-0 flex-1 space-y-2">
                  <p class="truncate text-sm font-semibold text-stone-900">
                    {{ item.file.name }}
                  </p>
                  <p class="mt-1 text-xs text-stone-500">
                    {{ formatAdjuntoSize(item.file.size) }}
                  </p>
                  <div class="space-y-1">
                    <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Nombre del archivo
                    </label>
                    <input
                      v-model="item.customName"
                      type="text"
                      maxlength="50"
                      class="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-main"
                      :placeholder="item.defaultBaseName"
                    >
                    <p class="text-xs text-stone-500">
                      Si lo dejas vacio se usara {{ buildAdjuntoDisplayName('', item.file.name, index + 1) }}.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition hover:bg-white hover:text-stone-700"
                  @click="removeSelectedFile(item.localId)"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              v-if="validationIssues.length > 0"
              class="rounded-2xl border border-danger/20 bg-danger-bg/70 px-4 py-3"
            >
              <p class="text-sm font-semibold text-danger">
                Algunos archivos no se pudieron agregar.
              </p>
              <ul class="mt-2 space-y-1 text-sm text-danger">
                <li
                  v-for="issue in validationIssues"
                  :key="issue.localId"
                >
                  <span class="font-medium">{{ issue.fileName }}</span>: {{ issue.message }}
                </li>
              </ul>
            </div>
          </div>

          <div class="shrink-0 border-t border-stone-200 px-4 py-4 lg:px-6">
            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                @click="emit('cancel')"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="rounded-full bg-main px-4 py-2 text-sm font-semibold text-white transition hover:bg-main-light disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="selectedFiles.length === 0"
                @click="handleSubmit"
              >
                Agregar archivo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
