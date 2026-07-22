<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  tone: 'success' | 'danger' | 'muted';
}>();

const chipClassName = computed(() => {
  if (props.tone === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (props.tone === 'danger') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-stone-200 bg-stone-100 text-stone-600';
});
</script>

<template>
  <span
    class="inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
    :class="chipClassName"
  >
    <span class="truncate">{{ label }}</span>
  </span>
</template>
