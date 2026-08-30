<script setup lang="ts">
import { ListOrdered } from "lucide-vue-next";
defineProps<{ order: number | null; error?: string | null }>();
const emit = defineEmits<{ "update:order": [value: number | null] }>();
</script>

<template>
  <section
    aria-labelledby="create-task-route"
    class="border-t border-slate-100 py-4"
  >
    <div class="flex items-center gap-2">
      <ListOrdered class="size-4 text-main" />
      <h3
        id="create-task-route"
        class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600"
      >
        Posición en ruta
      </h3>
    </div>
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Orden <span class="font-normal text-slate-500">(opcional)</span
      ><input
        class="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-main focus:ring-2 focus:ring-main/15"
        type="number"
        min="1"
        step="1"
        :value="order ?? ''"
        placeholder="El backend puede asignarlo"
        @input="
          emit(
            'update:order',
            ($event.target as HTMLInputElement).value
              ? Number(($event.target as HTMLInputElement).value)
              : null,
          )
        "
    /></label>
    <p class="mt-1.5 text-[11px] leading-5 text-slate-500">
      La prioridad no define el orden. El dominio puede rechazar o reajustar
      posiciones en conflicto.
    </p>
    <p
      v-if="error"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ error }}
    </p>
  </section>
</template>
