<script setup lang="ts">
import { ListOrdered } from "lucide-vue-next";
import { computed } from "vue";
const props = defineProps<{
  order: number | null;
  totalTasks: number;
  error?: string | null;
}>();
const automaticOrder = computed(() => props.order ?? props.totalTasks + 1);
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
    <div
      class="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
    >
      <p class="text-xs font-bold text-slate-700">Orden {{ automaticOrder }}</p>
      <p class="mt-1 text-[11px] leading-5 text-slate-500">
        Se asigna automáticamente como la siguiente posición de la ruta.
      </p>
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
