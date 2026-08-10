<script setup lang="ts">
import { Image as ImageIcon } from "lucide-vue-next";
defineProps<{ src: string | null; alt: string }>();
</script>
<template>
  <div
    class="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-md border border-second-deep bg-second"
  >
    <img v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover" />
    <ImageIcon v-else class="h-7 w-7 text-gray-400" aria-hidden="true" />
  </div>
</template>
