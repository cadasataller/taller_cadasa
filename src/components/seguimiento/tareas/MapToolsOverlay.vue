<script setup lang="ts">
import { RotateCw } from "lucide-vue-next";
import type {
  SeguimientoMapTool,
  SeguimientoMapToolState,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";
defineProps<{ tools: SeguimientoMapToolState[]; disabled: boolean }>();
const emit = defineEmits<{
  reload: [];
  reset: [];
  toggle: [tool: SeguimientoMapTool];
  focusSelected: [];
}>();
const labels: Record<SeguimientoMapTool, string> = {
  tasks: "Tareas",
  trackers: "Trackers",
  zones: "Zonas",
  route: "Ruta",
};
</script>
<template>
  <nav
    class="grid gap-1 rounded-lg border border-gray-200 bg-white/95 p-1 shadow-md backdrop-blur"
    aria-label="Herramientas del mapa"
  >
    <button
      class="grid size-11 place-items-center rounded-md text-main transition hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-45"
      :disabled="disabled"
      title="Recargar datos del mapa"
      type="button"
      @click="emit('reload')"
    >
      <RotateCw class="size-4" />
    </button>
    <button
      class="grid size-11 place-items-center rounded-md text-lg font-extrabold text-main transition hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-45"
      :disabled="disabled"
      title="Restablecer vista"
      type="button"
      @click="emit('reset')"
    >
      ⌖</button
    ><button
      class="grid size-11 place-items-center rounded-md text-lg font-extrabold text-main transition hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-45"
      :disabled="disabled"
      title="Enfocar tarea seleccionada"
      type="button"
      @click="emit('focusSelected')"
    >
      ◎</button
    ><span class="my-1 border-t border-gray-200" aria-hidden="true"></span
    ><button
      v-for="item in tools"
      :key="item.tool"
      :aria-pressed="item.enabled"
      :class="
        item.enabled ? 'bg-main/10 text-main' : 'text-gray-600 hover:bg-second'
      "
      class="grid size-11 place-items-center rounded-md font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-45"
      :disabled="disabled"
      :title="`${item.enabled ? 'Ocultar' : 'Mostrar'} ${labels[item.tool]}`"
      type="button"
      @click="emit('toggle', item.tool)"
    >
      {{ labels[item.tool].slice(0, 1) }}
    </button>
  </nav>
</template>
