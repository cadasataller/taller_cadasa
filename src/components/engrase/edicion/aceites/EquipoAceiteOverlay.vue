<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
} from "vue";
import { Droplet, X } from "lucide-vue-next";
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
const formChanged = shallowRef(false);
let overflowPrevio = "";
const title = computed(() =>
  props.mode.kind === "add" ? "Agregar aceite" : "Editar aceite",
);
function cerrar(): void {
  if (
    !formChanged.value ||
    window.confirm("Se perderán los cambios escritos. ¿Continuar?")
  )
    emit("close");
}
function confirmar(
  sistema: CatalogoAceiteDraftReference,
  aceite: CatalogoAceiteDraftReference,
): void {
  emit("confirm", sistema, aceite);
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") cerrar();
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
        <div class="flex-1 overflow-y-auto p-3">
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
    </div>
  </Teleport>
</template>
