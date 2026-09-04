<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  detail: string;
  id: string;
}>();
</script>

<template>
  <article
    :id="id"
    class="flex min-h-[70px] min-w-0 flex-col justify-center rounded-md border border-gray-200 px-2 py-2"
  >
    <span class="text-[10px] text-gray-500">{{ label }}</span>
    <strong class="mt-0.5 text-sm tabular-nums text-main">{{ value }}</strong>
    <small class="text-[10px] text-gray-500">{{ detail }}</small>
  </article>
</template>
