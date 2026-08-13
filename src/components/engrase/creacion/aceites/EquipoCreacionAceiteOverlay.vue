<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from "vue";
import { AlertTriangle, Droplet, X } from "lucide-vue-next";
import EquipoCreacionAceiteForm from "./EquipoCreacionAceiteForm.vue";
import type {
  CatalogoDraftReference,
  CrearEquipoAceiteDraft,
  CrearEquipoAceiteEditorState,
} from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";

defineProps<{
  mode: Exclude<CrearEquipoAceiteEditorState, { kind: "closed" }>;
  asociacion?: CrearEquipoAceiteDraft;
  sistemas: CatalogoDraftReference[];
  aceites: CatalogoDraftReference[];
  crearSistema: (nombre: string) => CatalogoDraftReference | null;
  crearAceite: (nombre: string) => CatalogoDraftReference | null;
  hasSystemConflict: (sistema: CatalogoDraftReference) => boolean;
  error: string | null;
}>();
const emit = defineEmits<{
  close: [];
  confirm: [CatalogoDraftReference, CatalogoDraftReference];
}>();

const closeButton = useTemplateRef<HTMLButtonElement>("closeButton");
const continueButton = useTemplateRef<HTMLButtonElement>("continueButton");
const changed = shallowRef(false);
const showDiscardConfirmation = shallowRef(false);
let previousOverflow = "";

function title(mode: Exclude<CrearEquipoAceiteEditorState, { kind: "closed" }>): string {
  return mode.kind === "add" ? "Agregar aceite" : "Editar aceite";
}
async function close(): Promise<void> {
  if (!changed.value) {
    emit("close");
    return;
  }
  showDiscardConfirmation.value = true;
  await nextTick();
  continueButton.value?.focus();
}
function continueEditing(): void {
  showDiscardConfirmation.value = false;
  closeButton.value?.focus();
}
function discard(): void {
  showDiscardConfirmation.value = false;
  emit("close");
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  if (showDiscardConfirmation.value) continueEditing();
  else void close();
}
onMounted(async () => {
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", onKeydown);
  await nextTick();
  closeButton.value?.focus();
});
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow;
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 bg-main-dark/40" @click.self="close">
      <aside class="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-lg bg-white shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[30rem] sm:rounded-none" role="dialog" aria-modal="true" aria-labelledby="crear-aceite-overlay-title">
        <header class="flex items-start justify-between gap-3 border-b border-second-deep p-3">
          <div class="flex min-w-0 items-start gap-2">
            <Droplet class="mt-0.5 h-5 w-5 shrink-0 text-main" aria-hidden="true" />
            <div>
              <h2 id="crear-aceite-overlay-title" class="text-sm font-bold text-gray-900">{{ title(mode) }}</h2>
              <p class="mt-0.5 text-xs text-gray-600">Asocia un aceite a un sistema del equipo.</p>
            </div>
          </div>
          <button ref="closeButton" type="button" class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-md text-gray-700 hover:bg-second focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main" aria-label="Cerrar" @click="close">
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div class="flex-1 overflow-y-auto p-3 overscroll-contain" data-equipo-overlay-scroll>
          <EquipoCreacionAceiteForm
            :mode="mode"
            :asociacion="asociacion"
            :sistemas="sistemas"
            :aceites="aceites"
            :crear-sistema="crearSistema"
            :crear-aceite="crearAceite"
            :has-system-conflict="hasSystemConflict"
            :error="error"
            @changed="changed = true"
            @confirm="(sistema, aceite) => emit('confirm', sistema, aceite)"
          />
        </div>
      </aside>
      <div v-if="showDiscardConfirmation" class="absolute inset-0 z-10 grid place-items-center bg-main-dark/40 p-3" role="alertdialog" aria-modal="true" aria-labelledby="crear-descartar-aceite-title" @click.self="continueEditing">
        <section class="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
          <AlertTriangle class="h-5 w-5 text-warning" aria-hidden="true" />
          <h3 id="crear-descartar-aceite-title" class="mt-2 text-sm font-bold text-gray-900">Descartar cambios del aceite</h3>
          <p class="mt-1 text-xs leading-5 text-gray-600">Los cambios escritos en este formulario no se conservarán.</p>
          <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button ref="continueButton" type="button" class="min-h-11 cursor-pointer rounded-md border border-gray-300 px-3 text-xs font-semibold text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main" @click="continueEditing">Seguir editando</button>
            <button type="button" class="min-h-11 cursor-pointer rounded-md bg-danger px-3 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main" @click="discard">Descartar cambios</button>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>
