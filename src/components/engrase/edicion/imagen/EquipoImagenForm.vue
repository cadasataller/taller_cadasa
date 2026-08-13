<script setup lang="ts">
import { Camera, FolderOpen, Loader2, Upload } from "lucide-vue-next";
import { shallowRef, useTemplateRef } from "vue";
import EquipoImagenPreview from "./EquipoImagenPreview.vue";
import EquipoImagenCropper from "./EquipoImagenCropper.vue";
import { IMAGEN_EQUIPO_MAX_BYTES } from "@/stores/dbequipos/engrase/edicion/equipoEngraseImagen.types";
defineProps<{
  previewUrl: string | null;
  processing: boolean;
  tieneImagen: boolean;
}>();
const emit = defineEmits<{ select: [File] }>();
const galleryInput = useTemplateRef<HTMLInputElement>("galleryInput");
const cameraInput = useTemplateRef<HTMLInputElement>("cameraInput");
const archivoParaRecorte = shallowRef<File | null>(null);
const errorArchivo = shallowRef("");
function seleccionar(event: Event): void {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
  const archivo = input.files[0];
  input.value = "";
  if (!archivo.type.startsWith("image/")) {
    errorArchivo.value = "Selecciona un archivo de imagen válido.";
    return;
  }
  if (archivo.size > IMAGEN_EQUIPO_MAX_BYTES) {
    errorArchivo.value = "La imagen no puede superar 5 MB.";
    return;
  }
  errorArchivo.value = "";
  archivoParaRecorte.value = archivo;
}
</script>
<template>
  <EquipoImagenCropper
    v-if="archivoParaRecorte"
    :file="archivoParaRecorte"
    @cancel="archivoParaRecorte = null"
    @confirm="
      (archivo) => {
        archivoParaRecorte = null;
        emit('select', archivo);
      }
    "
  />
  <div v-else class="grid gap-3">
    <div class="flex items-center gap-3">
      <EquipoImagenPreview
        :src="previewUrl"
        alt="Vista previa de la imagen del equipo"
      />
      <div class="grid gap-1">
        <p class="text-sm font-semibold text-gray-900">
          {{
            previewUrl
              ? "Vista previa local"
              : tieneImagen
                ? "Imagen actual"
                : "Selecciona una imagen"
          }}
        </p>
        <p class="text-xs text-gray-600">
          Se convertirá a WebP antes de subirla. Máximo 5 MB.
        </p>
      </div>
    </div>
    <div class="grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        :disabled="processing"
        class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-second-deep px-3 text-sm font-semibold text-main hover:bg-second disabled:cursor-not-allowed disabled:opacity-50"
        :class="processing ? 'cursor-wait' : 'cursor-pointer'"
        @click="galleryInput?.click()"
      >
        <FolderOpen class="h-4 w-4" />Galería
      </button>
      <button
        type="button"
        :disabled="processing"
        class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-second-deep px-3 text-sm font-semibold text-main hover:bg-second disabled:cursor-not-allowed disabled:opacity-50"
        :class="processing ? 'cursor-wait' : 'cursor-pointer'"
        @click="cameraInput?.click()"
      >
        <Camera class="h-4 w-4" />Tomar foto
      </button>
    </div>
    <input
      ref="galleryInput"
      type="file"
      class="sr-only"
      accept="image/*"
      :disabled="processing"
      @change="seleccionar"
    />
    <input
      ref="cameraInput"
      type="file"
      class="sr-only"
      accept="image/*"
      capture="environment"
      :disabled="processing"
      @change="seleccionar"
    />
    <p v-if="errorArchivo" class="text-xs text-danger" role="alert">
      {{ errorArchivo }}
    </p>
    <p
      class="flex items-center gap-1.5 rounded-md bg-info-bg px-2.5 py-2 text-xs text-info"
    >
      <Upload class="h-3.5 w-3.5" />Los cambios de imagen se aplican
      inmediatamente y no dependen de “Guardar cambios”.
    </p>
    <p
      v-if="processing"
      class="inline-flex items-center gap-1.5 text-xs text-main"
    >
      <Loader2 class="h-4 w-4 animate-spin" />Procesando imagen…
    </p>
  </div>
</template>
