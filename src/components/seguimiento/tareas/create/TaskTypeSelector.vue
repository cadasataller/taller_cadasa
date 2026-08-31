<script setup lang="ts">
import { MapPinned, ScanLine } from "lucide-vue-next";
import type { TareaCreacionTipo } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.types";

defineProps<{ modelValue: TareaCreacionTipo | null; error?: string | null }>();
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
      Tipo detectado
    </h3>
    <div
      class="mt-3 flex min-h-12 items-center gap-3 rounded-xl border border-main/20 bg-second/45 px-3 text-main"
      role="status"
      aria-live="polite"
    >
      <component
        :is="modelValue === 'finca' ? MapPinned : ScanLine"
        class="size-4 shrink-0"
        aria-hidden="true"
      />
      <span class="text-xs font-extrabold">
        {{ modelValue === "finca" ? "Finca" : "Zona" }}
      </span>
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
