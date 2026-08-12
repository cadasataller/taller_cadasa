<script setup lang="ts">
defineProps<{ enCompras: boolean }>();
</script>

<template>
  <span class="inline-flex rounded-md px-2 py-1 text-xs font-semibold" :class="enCompras ? 'bg-main/8 text-main' : 'bg-gray-100 text-gray-600'">
    {{ enCompras ? "Sí" : "No" }}
  </span>
</template>
