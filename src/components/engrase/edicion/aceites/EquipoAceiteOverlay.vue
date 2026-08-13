<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
} from "vue";
import { AlertTriangle, Droplet, X } from "lucide-vue-next";
import EquipoAceiteForm from "./EquipoAceiteForm.vue";
import type {
  CatalogoAceiteDraftReference,
  CatalogoIdNombre,
  EquipoAceiteDraft,
  EquipoAceiteFormMode,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";

const props = defineProps<{
  mode: EquipoAceiteFormMode;
  aceite?: EquipoAceiteDraft;
  sistemas: CatalogoIdNombre[];
  aceites: CatalogoIdNombre[];
  hasSystemConflict: (sistema: CatalogoAceiteDraftReference) => boolean;
}>();
const emit = defineEmits<{
  close: [];
  confirm: [CatalogoAceiteDraftReference, CatalogoAceiteDraftReference];
}>();
const trigger = useTemplateRef<HTMLButtonElement>("closeButton");
const continueButton = useTemplateRef<HTMLButtonElement>("continueButton");
const formChanged = shallowRef(false);
const showDiscardConfirmation = shallowRef(false);
let overflowPrevio = "";
const title = computed(() =>
  props.mode.kind === "add" ? "Agregar aceite" : "Editar aceite",
);
async function cerrar(): Promise<void> {
  if (!formChanged.value) {
    emit("close");
    return;
  }
  showDiscardConfirmation.value = true;
  await nextTick();
  continueButton.value?.focus();
}
function continuarEditando(): void {
  showDiscardConfirmation.value = false;
  trigger.value?.focus();
}
function descartarYCerrar(): void {
  showDiscardConfirmation.value = false;
  emit("close");
}
function confirmar(
  sistema: CatalogoAceiteDraftReference,
  aceite: CatalogoAceiteDraftReference,
): void {
  emit("confirm", sistema, aceite);
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  if (showDiscardConfirmation.value) continuarEditando();
  else cerrar();
}
onMounted(async () => {
  overflowPrevio = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", onKeydown);
  await nextTick();
  trigger.value?.focus();
});
onBeforeUnmount(() => {
  document.body.style.overflow = overflowPrevio;
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 bg-main-dark/40" @click.self="cerrar">
      <aside
        class="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-lg bg-white shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[30rem] sm:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aceite-overlay-title"
      >
        <header
          class="flex items-start justify-between gap-3 border-b border-second-deep p-3"
        >
          <div class="flex min-w-0 items-start gap-2">
            <Droplet class="mt-0.5 h-5 w-5 shrink-0 text-main" />
            <div>
              <h2
                id="aceite-overlay-title"
                class="text-sm font-bold text-gray-900"
              >
                {{ title }}
              </h2>
              <p class="mt-0.5 text-xs text-gray-600">
                Asocia un aceite a un sistema del equipo.
              </p>
            </div>
          </div>
          <button
            ref="closeButton"
            type="button"
            class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-md text-gray-700 hover:bg-second"
            aria-label="Cerrar"
            @click="cerrar"
          >
            <X class="h-4 w-4" />
          </button>
        </header>
        <div
          class="flex-1 overflow-y-auto p-3"
          data-equipo-overlay-scroll
        >
          <EquipoAceiteForm
            :mode="mode"
            :aceite="aceite"
            :sistemas="sistemas"
            :aceites="aceites"
            :has-system-conflict="hasSystemConflict"
            @confirm="confirmar"
            @changed="formChanged = true"
          />
        </div>
      </aside>
      <div
        v-if="showDiscardConfirmation"
        class="absolute inset-0 z-10 grid place-items-center bg-main-dark/40 p-3"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="discard-oil-title"
        aria-describedby="discard-oil-description"
        @click.self="continuarEditando"
      >
        <section class="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
          <AlertTriangle class="h-5 w-5 text-warning" aria-hidden="true" />
          <h3 id="discard-oil-title" class="mt-2 text-sm font-bold text-gray-900">
            Descartar cambios del aceite
          </h3>
          <p id="discard-oil-description" class="mt-1 text-xs leading-5 text-gray-600">
            Los cambios escritos en este formulario no se conservarán.
          </p>
          <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref="continueButton"
              type="button"
              class="min-h-11 cursor-pointer rounded-md border border-gray-300 px-3 text-xs font-semibold text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
              @click="continuarEditando"
            >
              Seguir editando
            </button>
            <button
              type="button"
              class="min-h-11 cursor-pointer rounded-md bg-danger px-3 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
              @click="descartarYCerrar"
            >
              Descartar cambios
            </button>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>
