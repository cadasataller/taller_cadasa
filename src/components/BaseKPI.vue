<script setup lang="ts">
interface Props {
  name: string;
  value: string | number;
  color?: string; // Optional border color override
}

const props = withDefaults(defineProps<Props>(), {
  color: 'border-main'
});
const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <div 
    @click="emit('click')"
    class="bg-white p-5 rounded-xl border border-gray-100 border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    :class="color"
  >
    <div class="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-main transition-colors">
      {{ name }}
    </div>
    <div class="text-3xl font-bold tracking-tight text-gray-900 mt-1">
      {{ value }}
    </div>
  </div>
</template>
