<script setup lang="ts">
import { ClipboardPenLine } from "lucide-vue-next";
import DurationStepper from "./DurationStepper.vue";
import type { TareaCreacionDetalles } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.types";
const props = defineProps<{
  details: TareaCreacionDetalles;
  instructionsError?: string | null;
  estimatedMinutesError?: string | null;
}>();
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
        :aria-invalid="Boolean(instructionsError)"
        placeholder="Describe el trabajo a realizar"
        @input="
          emit('update:details', {
            instructions: ($event.target as HTMLTextAreaElement).value,
          })
        "
      />
    </label>
    <p
      v-if="instructionsError"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ instructionsError }}
    </p>
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Duración estimada <span class="text-danger">*</span
      ><DurationStepper
        :model-value="details.estimatedMinutes"
        @update:model-value="
          emit('update:details', { estimatedMinutes: $event })
        "
    /></label>
    <p
      v-if="estimatedMinutesError"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ estimatedMinutesError }}
    </p>
  </section>
</template>
