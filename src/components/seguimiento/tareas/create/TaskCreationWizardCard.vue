<script setup lang="ts">
import {
  Crosshair,
  FilePenLine,
  MapPinPlus,
  PencilRuler,
  Plus,
  X,
} from "lucide-vue-next";
import { computed } from "vue";
import type { TareaCreacionPasoWizard } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.types";

const props = defineProps<{
  step: TareaCreacionPasoWizard;
  showAddZone?: boolean;
}>();
const emit = defineEmits<{
  action: [];
  addZone: [];
  cancel: [];
}>();

const content = computed(() => {
  switch (props.step) {
    case "ready":
      return {
        icon: MapPinPlus,
        title: "Definir datos de tarea",
        action: "Nueva tarea",
        cancelable: false,
      };
    case "selecting-control-point":
      return {
        icon: Crosshair,
        title: "Elegir punto de control",
        action: null,
        cancelable: true,
      };
    case "drawing-initial-zone":
      return {
        icon: PencilRuler,
        title: "Dibuje la zona de tareas",
        action: null,
        cancelable: true,
      };
    case "details-pending":
      return {
        icon: FilePenLine,
        title: "Definir detalles de tarea",
        action: "Definir detalles",
        cancelable: true,
      };
    case "drawing-extra-zone":
      return {
        icon: PencilRuler,
        title: "Dibuje la zona de control",
        action: null,
        cancelable: true,
      };
    case "editing-details":
      return {
        icon: Plus,
        title: "Agregar zona de control",
        action: "Agregar zona",
        cancelable: false,
      };
  }
});
</script>

<template>
  <section
    class="flex w-auto max-w-[calc(100%-2rem)] items-center gap-1.5 rounded-lg border border-white/75 bg-white/95 px-2 py-1.5 shadow-md shadow-slate-950/15 backdrop-blur"
    aria-live="polite"
  >
    <div
      class="grid size-7 shrink-0 place-items-center rounded-md bg-second text-main"
    >
      <component :is="content.icon" class="size-4" aria-hidden="true" />
    </div>
    <p class="truncate text-[11px] font-extrabold text-slate-800">
      {{ content.title }}
    </p>
    <div class="flex shrink-0 items-center gap-1">
      <button
        v-if="content.action"
        class="h-7 rounded-md bg-main px-2 text-[10px] font-extrabold text-white transition hover:bg-main-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
        type="button"
        @click="emit('action')"
      >
        {{ content.action }}
      </button>
      <button
        v-if="showAddZone"
        class="h-7 rounded-md border border-main/25 bg-white px-2 text-[10px] font-extrabold text-main transition hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
        type="button"
        @click="emit('addZone')"
      >
        Agregar zona
      </button>
      <button
        v-if="content.cancelable"
        class="grid size-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
        type="button"
        aria-label="Cancelar creación"
        @click="emit('cancel')"
      >
        <X class="size-3.5" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>
