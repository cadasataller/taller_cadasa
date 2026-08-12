<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
} from "vue";
import { AlertTriangle, Loader2, RotateCcw, Trash2, X } from "lucide-vue-next";
import EquipoImagenForm from "./EquipoImagenForm.vue";
import type { ImagenSyncState } from "@/stores/dbequipos/engrase/edicion/equipoEngraseImagen.types";

const props = defineProps<{
  codigoEquipo: string;
  actualUrl: string | null;
  urlLoading: boolean;
  urlError: string | null;
  previewUrl: string | null;
  tieneImagen: boolean;
  syncState: ImagenSyncState;
  bloqueado: boolean;
}>();
const emit = defineEmits<{
  close: [];
  select: [File];
  save: ["agregar" | "actualizar"];
  remove: [];
  retryCleanup: [];
  retryMove: [];
  clearPreview: [];
  retryPreview: [];
}>();
const closeButton = useTemplateRef<HTMLButtonElement>("closeButton");
const confirmarEliminar = shallowRef(false);
const confirmarDescarte = shallowRef(false);
let overflowAnterior = "";
const procesando = computed(() => props.syncState.kind === "processing");
const imagenMostrada = computed(() => props.previewUrl ?? props.actualUrl);
const puedeGuardar = computed(
  () => Boolean(props.previewUrl) && !props.bloqueado,
);
function cerrar(): void {
  if (procesando.value) return;
  if (props.previewUrl) {
    confirmarDescarte.value = true;
    return;
  }
  emit("close");
}
function descartarVistaPrevia(): void {
  confirmarDescarte.value = false;
  emit("clearPreview");
  emit("close");
}
onMounted(async () => {
  overflowAnterior = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  await nextTick();
  closeButton.value?.focus();
});
onBeforeUnmount(() => {
  document.body.style.overflow = overflowAnterior;
});
</script>
<template>
  <Teleport to="body"
    ><div class="fixed inset-0 z-50 bg-main-dark/40" @click.self="cerrar">
      <aside
        class="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-lg bg-white shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[30rem] sm:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="imagen-title"
      >
        <header
          class="flex items-start justify-between gap-3 border-b border-second-deep p-3"
        >
          <div>
            <h2 id="imagen-title" class="text-sm font-bold text-gray-900">
              Administrar imagen
            </h2>
            <p class="mt-0.5 text-xs text-gray-600">
              Equipo {{ codigoEquipo }}
            </p>
          </div>
          <button
            ref="closeButton"
            type="button"
            :disabled="procesando"
            class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-md hover:bg-second disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
            @click="cerrar"
          >
            <X class="h-4 w-4" />
          </button>
        </header>
        <div class="flex-1 overflow-y-auto p-3">
          <EquipoImagenForm
            :preview-url="imagenMostrada"
            :processing="procesando"
            :tiene-imagen="tieneImagen"
            @select="emit('select', $event)"
          />
          <p
            v-if="urlLoading && tieneImagen && !previewUrl"
            class="mt-3 inline-flex items-center gap-1.5 text-xs text-main"
            role="status"
          >
            <Loader2 class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Cargando imagen actual…
          </p>
          <div
            v-if="urlError"
            class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-warning-bg px-2.5 py-2 text-xs text-warning"
            role="alert"
          >
            <span class="inline-flex items-start gap-1.5"><AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" />{{ urlError }}</span>
            <button type="button" class="min-h-10 cursor-pointer rounded-md border border-warning px-3 font-semibold" @click="emit('retryPreview')">Reintentar vista previa</button>
          </div>
          <p
            v-if="syncState.kind === 'error'"
            class="mt-3 flex gap-1.5 rounded-md bg-danger-bg px-2.5 py-2 text-xs text-danger"
          >
            <AlertTriangle class="h-3.5 w-3.5 shrink-0" />{{
              syncState.message
            }}
          </p>
          <p
            v-if="syncState.kind === 'cleanup_pending'"
            class="mt-3 flex gap-1.5 rounded-md bg-warning-bg px-2.5 py-2 text-xs text-warning"
          >
            <AlertTriangle class="h-3.5 w-3.5 shrink-0" />La imagen fue
            actualizada, pero queda un archivo pendiente de limpieza.
          </p>
          <p
            v-if="syncState.kind === 'move_pending'"
            class="mt-3 flex gap-1.5 rounded-md bg-warning-bg px-2.5 py-2 text-xs text-warning"
          >
            <AlertTriangle class="h-3.5 w-3.5 shrink-0" />La imagen está
            pendiente de sincronización por cambio de código.
          </p>
        </div>
        <footer
          class="flex flex-col gap-2 border-t border-second-deep p-3 sm:flex-row sm:justify-end"
        >
          <button
            v-if="syncState.kind === 'cleanup_pending'"
            type="button"
            class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-md border border-warning/30 px-3 text-sm font-semibold text-warning"
            @click="emit('retryCleanup')"
          >
            <RotateCcw class="h-4 w-4" />Reintentar limpieza</button
          ><button
            v-if="syncState.kind === 'move_pending'"
            type="button"
            class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-md border border-warning/30 px-3 text-sm font-semibold text-warning"
            @click="emit('retryMove')"
          >
            <RotateCcw class="h-4 w-4" />Reintentar mover imagen</button
          ><button
            v-if="tieneImagen && !confirmarEliminar"
            type="button"
            :disabled="bloqueado"
            class="inline-flex min-h-10 items-center justify-center gap-1 rounded-md border border-danger/30 px-3 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-50"
            :class="bloqueado ? 'cursor-not-allowed' : 'cursor-pointer'"
            @click="confirmarEliminar = true"
          >
            <Trash2 class="h-4 w-4" />Eliminar imagen</button
          ><template v-if="confirmarEliminar"
            ><button
              type="button"
              class="min-h-10 cursor-pointer rounded-md border border-second-deep px-3 text-sm font-semibold text-gray-700"
              @click="confirmarEliminar = false"
            >
              Cancelar</button
            ><button
              type="button"
              :disabled="bloqueado"
              class="min-h-10 rounded-md bg-danger px-3 text-sm font-semibold text-white disabled:cursor-not-allowed"
              :class="bloqueado ? 'cursor-not-allowed' : 'cursor-pointer'"
              @click="emit('remove')"
            >
              Confirmar eliminación
            </button></template
          ><button
            v-if="puedeGuardar"
            type="button"
            class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-md bg-main px-3 text-sm font-semibold text-white"
            @click="emit('save', tieneImagen ? 'actualizar' : 'agregar')"
          >
            <Loader2 v-if="procesando" class="h-4 w-4 animate-spin" />{{
              tieneImagen ? "Cambiar imagen" : "Agregar imagen"
            }}
          </button>
        </footer>
        <div
          v-if="confirmarDescarte"
          class="absolute inset-0 z-10 grid place-items-center bg-main-dark/30 p-3"
        >
          <section
            class="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="descartar-preview-title"
          >
            <AlertTriangle class="h-5 w-5 text-warning" aria-hidden="true" />
            <h3
              id="descartar-preview-title"
              class="mt-2 text-sm font-bold text-gray-900"
            >
              Descartar imagen seleccionada
            </h3>
            <p class="mt-1 text-xs text-gray-600">
              La vista previa no se ha guardado y se perderá al cerrar.
            </p>
            <div
              class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                class="min-h-10 cursor-pointer rounded-md border border-second-deep px-3 text-sm font-semibold text-gray-700"
                @click="confirmarDescarte = false"
              >
                Seguir editando
              </button>
              <button
                type="button"
                class="min-h-10 cursor-pointer rounded-md bg-danger px-3 text-sm font-semibold text-white"
                @click="descartarVistaPrevia"
              >
                Descartar y cerrar
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div></Teleport
  >
</template>
