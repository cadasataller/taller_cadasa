<script setup lang="ts">
import { ListOrdered } from "lucide-vue-next";
import { computed } from "vue";
const props = defineProps<{
  order: number | null;
  totalTasks: number;
  error?: string | null;
}>();
const emit = defineEmits<{
  "update:order": [value: number | null];
}>();

const displayedOrder = computed(() => props.order ?? props.totalTasks + 1);

function updateOrder(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  emit("update:order", value === "" ? null : Number(value));
}
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
      <label
        for="create-task-route-order"
        class="text-xs font-bold text-slate-700"
      >
        Orden de ruta
      </label>
      <input
        id="create-task-route-order"
        :value="displayedOrder"
        class="mt-2 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-main focus:ring-2 focus:ring-main/15"
        type="number"
        min="1"
        :max="totalTasks + 1"
        step="1"
        inputmode="numeric"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? 'create-task-route-order-error' : undefined"
        @input="updateOrder"
      />
      <p class="mt-1 text-[11px] leading-5 text-slate-500">
        Se propone la siguiente posición automáticamente. Puedes cambiarla antes
        de guardar.
      </p>
    </div>
    <p
      v-if="error"
      id="create-task-route-order-error"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ error }}
    </p>
  </section>
</template>
