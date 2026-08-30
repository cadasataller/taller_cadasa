<script setup lang="ts">
import { computed } from "vue";
import {
  CircleHelp,
  Clock3,
  MapPinned,
  Route,
  ScanLine,
} from "lucide-vue-next";
import type { TareaSeguimientoListItem } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{
  task: TareaSeguimientoListItem;
  selected: boolean;
}>();
const emit = defineEmits<{ select: [taskId: string] }>();
const isDoubt = computed(() => props.task.type === "duda");
const typeLabel = computed(() =>
  isDoubt.value
    ? "Duda automática"
    : props.task.type === "zona"
      ? "Zona"
      : "Finca",
);
const statusLabel: Record<TareaSeguimientoListItem["status"], string> = {
  pendiente: "Sin iniciar",
  en_ruta: "En ruta",
  activa: "En ubicación",
  visitada: "Visitada",
  cancelada: "Cancelada",
  duda_detectada: "En revisión",
};
const timeLabel = computed(() =>
  props.task.estimatedMinutes
    ? `${props.task.estimatedMinutes} min estimados`
    : "Sin duración estimada",
);
</script>

<template>
  <button
    class="group grid w-full grid-cols-[2.15rem_minmax(0,1fr)] gap-2.5 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 sm:grid-cols-[2.15rem_minmax(0,1fr)_5.8rem]"
    :class="[
      selected
        ? 'border-main bg-main/5 shadow-[inset_3px_0_0_#004643]'
        : 'border-slate-200 bg-white hover:border-main-light hover:bg-slate-50',
      isDoubt ? 'border-warning/40 bg-warning-bg/30' : '',
    ]"
    type="button"
    :aria-pressed="selected"
    @click="emit('select', task.id)"
  >
    <span
      class="flex size-[2.15rem] items-center justify-center rounded-lg"
      :class="
        isDoubt
          ? 'bg-warning-bg text-warning'
          : task.status === 'activa'
            ? 'bg-success-bg text-success'
            : 'bg-second text-main'
      "
      aria-hidden="true"
    >
      <CircleHelp v-if="isDoubt" class="size-5" /><MapPinned
        v-else-if="task.type === 'finca'"
        class="size-4"
      /><ScanLine v-else class="size-4" />
    </span>
    <span class="min-w-0"
      ><span
        class="block truncate text-xs font-bold leading-4 text-slate-800"
        >{{ task.instructions || "Tarea sin indicaciones" }}</span
      ><span class="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500"
        ><span
          class="rounded-full px-1.5 py-0.5 font-bold uppercase tracking-wide"
          :class="
            isDoubt ? 'bg-warning-bg text-warning' : 'bg-second text-main'
          "
          >{{ typeLabel }}</span
        ><span v-if="isDoubt" class="truncate">Detectada automáticamente</span
        ><span v-else class="truncate">{{
          task.locationId
            ? `Ubicación ${task.locationId}`
            : "Ubicación sin definir"
        }}</span></span
      ><span class="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500"
        ><Route class="size-3 shrink-0" /><span class="truncate">{{
          task.trackerLabel || "Sin tracker asignado"
        }}</span></span
      ></span
    >
    <span
      class="col-start-2 flex items-center gap-1 pt-0.5 text-[10px] text-slate-500 sm:col-start-3 sm:row-start-1 sm:justify-end"
      ><Clock3 class="size-3" />{{ timeLabel }}</span
    >
    <span
      class="col-start-2 rounded-full px-2 py-1 text-center text-[10px] font-bold sm:col-start-3 sm:row-start-1 sm:mt-6"
      :class="
        isDoubt ? 'bg-warning-bg text-warning' : 'bg-slate-100 text-slate-600'
      "
      >{{ statusLabel[task.status] }}</span
    >
  </button>
</template>
