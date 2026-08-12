<script setup lang="ts">
defineProps<{ activo: boolean }>();
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold" :class="activo ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-600'">
    <span class="h-1.5 w-1.5 rounded-full" :class="activo ? 'bg-success' : 'bg-gray-400'" aria-hidden="true" />
    {{ activo ? "Activo" : "Desactivado" }}
  </span>
</template>
