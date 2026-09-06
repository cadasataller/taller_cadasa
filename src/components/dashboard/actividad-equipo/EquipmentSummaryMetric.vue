<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string;
  detail: string;
  id: string;
  tone?: "second";
}>();
</script>

<template>
  <article
    :id="id"
    class="flex h-full min-h-[70px] min-w-0 flex-col items-center justify-center text-center"
    :class="
      props.tone === 'second'
        ? 'bg-[linear-gradient(135deg,var(--color-second),var(--color-second-dark))]'
        : ''
    "
  >
    <span class="text-[10px] font-medium text-main-dark/70">{{ label }}</span>
    <strong
      class="mt-0.5 text-2xl font-extrabold tabular-nums text-main-dark"
      >{{ value }}</strong
    >
    <small class="text-[10px] text-main-dark/70">{{ detail }}</small>
  </article>
</template>
