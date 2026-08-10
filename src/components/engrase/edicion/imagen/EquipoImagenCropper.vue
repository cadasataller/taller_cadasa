<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from "vue";
import { Move, ZoomIn } from "lucide-vue-next";
import { IMAGEN_EQUIPO_MAX_SIDE } from "@/stores/dbequipos/engrase/edicion/equipoEngraseImagen.types";

const props = defineProps<{ file: File }>();
const emit = defineEmits<{ confirm: [File]; cancel: [] }>();
const sourceUrl = URL.createObjectURL(props.file);
const sourceWidth = shallowRef(0);
const sourceHeight = shallowRef(0);
const zoom = shallowRef(1);
const centerX = shallowRef(0);
const centerY = shallowRef(0);
const dragging = shallowRef<{
  clientX: number;
  clientY: number;
  centerX: number;
  centerY: number;
  width: number;
} | null>(null);
const minSide = computed(() => Math.min(sourceWidth.value, sourceHeight.value));
const cropSide = computed(() => minSide.value / zoom.value);
const imageStyle = computed(() => {
  if (!minSide.value) return {};
  const width = (sourceWidth.value / minSide.value) * 100 * zoom.value;
  const height = (sourceHeight.value / minSide.value) * 100 * zoom.value;
  return {
    width: `${width}%`,
    height: `${height}%`,
    left: `${50 - (centerX.value / sourceWidth.value) * width}%`,
    top: `${50 - (centerY.value / sourceHeight.value) * height}%`,
  };
});
function limitarCentro(): void {
  const medio = cropSide.value / 2;
  centerX.value = Math.min(
    sourceWidth.value - medio,
    Math.max(medio, centerX.value),
  );
  centerY.value = Math.min(
    sourceHeight.value - medio,
    Math.max(medio, centerY.value),
  );
}
function cargarImagen(event: Event): void {
  const imagen = event.target;
  if (!(imagen instanceof HTMLImageElement)) return;
  sourceWidth.value = imagen.naturalWidth;
  sourceHeight.value = imagen.naturalHeight;
  centerX.value = imagen.naturalWidth / 2;
  centerY.value = imagen.naturalHeight / 2;
}
function iniciarArrastre(event: PointerEvent): void {
  const marco = event.currentTarget;
  if (!(marco instanceof HTMLElement) || !cropSide.value) return;
  marco.setPointerCapture(event.pointerId);
  dragging.value = {
    clientX: event.clientX,
    clientY: event.clientY,
    centerX: centerX.value,
    centerY: centerY.value,
    width: marco.getBoundingClientRect().width,
  };
}
function moverArrastre(event: PointerEvent): void {
  const inicio = dragging.value;
  if (!inicio || !inicio.width) return;
  const escala = cropSide.value / inicio.width;
  centerX.value = inicio.centerX - (event.clientX - inicio.clientX) * escala;
  centerY.value = inicio.centerY - (event.clientY - inicio.clientY) * escala;
  limitarCentro();
}
function terminarArrastre(): void {
  dragging.value = null;
}
function cambiarZoom(event: Event): void {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  zoom.value = Number(input.value);
  limitarCentro();
}
async function confirmar(): Promise<void> {
  if (!cropSide.value) return;
  const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
    const elemento = new Image();
    elemento.onload = () => resolve(elemento);
    elemento.onerror = () =>
      reject(new Error("No se pudo preparar el recorte."));
    elemento.src = sourceUrl;
  });
  const ladoSalida = Math.min(
    IMAGEN_EQUIPO_MAX_SIDE,
    Math.max(1, Math.round(cropSide.value)),
  );
  const canvas = document.createElement("canvas");
  canvas.width = ladoSalida;
  canvas.height = ladoSalida;
  const contexto = canvas.getContext("2d");
  if (!contexto) return;
  const origenX = centerX.value - cropSide.value / 2;
  const origenY = centerY.value - cropSide.value / 2;
  contexto.drawImage(
    imagen,
    origenX,
    origenY,
    cropSide.value,
    cropSide.value,
    0,
    0,
    ladoSalida,
    ladoSalida,
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (resultado) =>
        resultado
          ? resolve(resultado)
          : reject(new Error("No se pudo crear el recorte.")),
      "image/png",
    ),
  );
  emit(
    "confirm",
    new File([blob], "recorte-equipo.png", {
      type: "image/png",
      lastModified: Date.now(),
    }),
  );
}
onBeforeUnmount(() => URL.revokeObjectURL(sourceUrl));
</script>

<template>
  <section class="grid gap-3">
    <div>
      <h3 class="text-sm font-semibold text-gray-900">Recortar imagen</h3>
      <p class="mt-0.5 text-xs text-gray-600">
        Arrastra la imagen y ajusta el zoom. El resultado será cuadrado.
      </p>
    </div>
    <div
      class="relative mx-auto aspect-square w-full max-w-xs touch-none overflow-hidden rounded-md bg-main-dark"
      @pointerdown="iniciarArrastre"
      @pointermove="moverArrastre"
      @pointerup="terminarArrastre"
      @pointercancel="terminarArrastre"
    >
      <img
        :src="sourceUrl"
        alt="Imagen para recortar"
        class="absolute max-w-none select-none"
        :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
        :style="imageStyle"
        draggable="false"
        @load="cargarImagen"
      />
      <div
        class="pointer-events-none absolute inset-0 border-2 border-white/90"
        aria-hidden="true"
      />
    </div>
    <label class="grid gap-1.5 text-xs font-semibold text-gray-700"
      ><span class="inline-flex items-center gap-1"
        ><ZoomIn class="h-3.5 w-3.5" />Ampliación</span
      ><input
        :value="zoom"
        type="range"
        min="1"
        max="3"
        step="0.01"
        class="h-2 w-full cursor-pointer accent-main"
        @input="cambiarZoom"
    /></label>
    <p class="inline-flex items-center gap-1 text-xs text-gray-600">
      <Move class="h-3.5 w-3.5" />Arrastra para encuadrar.
    </p>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        class="min-h-10 cursor-pointer rounded-md border border-second-deep px-3 text-sm font-semibold text-gray-700"
        @click="emit('cancel')"
      >
        Cancelar</button
      ><button
        type="button"
        :disabled="!sourceWidth"
        class="min-h-10 rounded-md bg-main px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        :class="sourceWidth ? 'cursor-pointer' : 'cursor-not-allowed'"
        @click="confirmar"
      >
        Usar recorte
      </button>
    </div>
  </section>
</template>
