<script setup lang="ts">
import { Image as ImageIcon } from "lucide-vue-next";
defineProps<{ src: string | null; alt: string; fill?: boolean }>();
</script>
<template>
  <div
    class="grid shrink-0 place-items-center overflow-hidden border border-second-deep bg-second"
    :class="fill ? 'h-full min-h-0 w-full rounded-md' : 'h-24 w-24 rounded-md'"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="h-full w-full"
      :class="fill ? 'object-contain' : 'object-cover'"
    />
    <ImageIcon v-else class="h-7 w-7 text-gray-400" aria-hidden="true" />
  </div>
</template>
