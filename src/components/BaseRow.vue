<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  data: any;
  gridCols?: string; // e.g. "grid-cols-4"
}

const props = withDefaults(defineProps<Props>(), {
  gridCols: 'grid-cols-1 md:grid-cols-4',
});
</script>

<template>
  <div 
    class="grid gap-4 items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors bg-white first:rounded-t-xl last:rounded-b-xl"
    :class="gridCols"
  >
    <!-- Use slots for each column defined by the parent -->
    <slot :data="data" />
  </div>
</template>
