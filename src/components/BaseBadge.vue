<script setup lang="ts">
import type { BadgeInput, BadgeItem } from '@/types';

interface Props {
  items: BadgeInput;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'click', item: string | BadgeItem): void;
}>();

const normalizedItems = (items: BadgeInput): BadgeItem[] => {
  return items.map(item => typeof item === 'string' ? { label: item } : item);
};
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="(item, index) in normalizedItems(items)"
      :key="item.id || index"
      @click="emit('click', item)"
      class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide border transition-all duration-150 bg-gray-50 text-gray-500 border-gray-200 hover:bg-main-light hover:text-white hover:border-main-light"
    >
      {{ item.label }}
    </button>
  </div>
</template>
