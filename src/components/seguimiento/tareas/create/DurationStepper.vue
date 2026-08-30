<script setup lang="ts">
import { Minus, Plus } from "lucide-vue-next";
const props = defineProps<{ modelValue: number | null; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: number] }>();
const update = (delta: number) => {
  const next = Math.min(10080, Math.max(15, (props.modelValue ?? 60) + delta));
  emit("update:modelValue", next);
};
</script>

<template>
  <div
    class="mt-1.5 grid grid-cols-[2.75rem_1fr_2.75rem] items-center rounded-xl border border-slate-200 bg-slate-50 p-1"
  >
    <button
      class="grid size-11 place-items-center rounded-lg text-main transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
      type="button"
      :disabled="disabled || modelValue === 15"
      aria-label="Restar 15 minutos"
      @click="update(-15)"
    >
      <Minus class="size-4" />
    </button>
    <div class="text-center">
      <strong class="text-sm text-slate-800">{{ modelValue ?? 60 }} min</strong
      ><span class="block text-[10px] text-slate-500"
        >intervalos de 15 min</span
      >
    </div>
    <button
      class="grid size-11 place-items-center rounded-lg text-main transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
      type="button"
      :disabled="disabled || modelValue === 10080"
      aria-label="Sumar 15 minutos"
      @click="update(15)"
    >
      <Plus class="size-4" />
    </button>
  </div>
</template>
