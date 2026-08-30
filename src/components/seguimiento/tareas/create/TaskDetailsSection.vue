<script setup lang="ts">
import { CalendarDays, ClipboardPenLine } from "lucide-vue-next";
import DurationStepper from "./DurationStepper.vue";
import type { TareaCreacionDetalles } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.types";
defineProps<{ details: TareaCreacionDetalles; error?: string | null }>();
const emit = defineEmits<{
  "update:details": [value: Partial<TareaCreacionDetalles>];
}>();
</script>

<template>
  <section aria-labelledby="create-task-details" class="py-4">
    <div class="flex items-center gap-2">
      <ClipboardPenLine class="size-4 text-main" aria-hidden="true" />
      <h3
        id="create-task-details"
        class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600"
      >
        Detalles
      </h3>
    </div>
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Indicaciones <span class="text-danger">*</span
      ><textarea
        class="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs leading-5 text-slate-800 outline-none focus:border-main focus:ring-2 focus:ring-main/15"
        :value="details.instructions"
        placeholder="Describe el trabajo a realizar"
        @input="
          emit('update:details', {
            instructions: ($event.target as HTMLTextAreaElement).value,
          })
        "
      />
    </label>
    <label class="mt-3 block text-xs font-bold text-slate-700"
      ><span class="inline-flex items-center gap-1"
        ><CalendarDays class="size-3.5" />Fecha programada
        <span class="text-danger">*</span></span
      ><input
        class="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-main focus:ring-2 focus:ring-main/15"
        type="date"
        :value="details.scheduledDate ?? ''"
        @input="
          emit('update:details', {
            scheduledDate: ($event.target as HTMLInputElement).value || null,
          })
        "
    /></label>
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Prioridad <span class="text-danger">*</span
      ><input
        class="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-main focus:ring-2 focus:ring-main/15"
        type="number"
        min="1"
        step="1"
        :value="details.priorityId ?? ''"
        placeholder="Define la prioridad operativa"
        @input="
          emit('update:details', {
            priorityId: ($event.target as HTMLInputElement).value
              ? Number(($event.target as HTMLInputElement).value)
              : null,
          })
        "
    /></label>
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Duración estimada <span class="text-danger">*</span
      ><DurationStepper
        :model-value="details.estimatedMinutes"
        @update:model-value="
          emit('update:details', { estimatedMinutes: $event })
        "
    /></label>
    <p
      v-if="error"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ error }}
    </p>
  </section>
</template>
