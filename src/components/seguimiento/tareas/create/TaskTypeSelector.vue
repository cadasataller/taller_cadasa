<script setup lang="ts">
import { MapPinned, ScanLine } from "lucide-vue-next";
import type { TareaCreacionTipo } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.types";

defineProps<{ modelValue: TareaCreacionTipo | null; error?: string | null }>();
const emit = defineEmits<{ "update:modelValue": [value: TareaCreacionTipo] }>();
const types: Array<{
  value: TareaCreacionTipo;
  label: string;
  description: string;
}> = [
  {
    value: "finca",
    label: "Finca",
    description: "Punto de ruta + línea de control",
  },
  {
    value: "zona",
    label: "Zona",
    description: "Punto de ruta + zona de control",
  },
];
</script>

<template>
  <section
    aria-labelledby="create-task-type"
    class="border-b border-slate-100 py-4"
  >
    <h3
      id="create-task-type"
      class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600"
    >
      Tipo de tarea
    </h3>
    <div
      class="mt-3 grid grid-cols-2 gap-2"
      role="radiogroup"
      aria-label="Tipo de tarea"
    >
      <button
        v-for="type in types"
        :key="type.value"
        class="min-h-20 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
        :class="
          modelValue === type.value
            ? 'border-main bg-second text-main shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:border-main/50'
        "
        type="button"
        role="radio"
        :aria-checked="modelValue === type.value"
        @click="emit('update:modelValue', type.value)"
      >
        <component
          :is="type.value === 'finca' ? MapPinned : ScanLine"
          class="size-4"
          aria-hidden="true"
        />
        <span class="mt-2 block text-xs font-extrabold">{{ type.label }}</span>
        <span class="mt-0.5 block text-[10px] leading-4 text-slate-500">{{
          type.description
        }}</span>
      </button>
    </div>
    <p
      v-if="error"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ error }}
    </p>
  </section>
</template>
