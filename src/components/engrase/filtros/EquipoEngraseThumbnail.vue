<script setup lang="ts">
import { shallowRef } from 'vue'
import { ImageOff } from 'lucide-vue-next'
defineProps<{ src?: string | null; alt: string }>()
const failed = shallowRef(false)
</script>
<template><img v-if="src && !failed" class="h-11 w-11 shrink-0 rounded-md object-cover" :src="src" :alt="alt" loading="lazy" @error="failed = true"><div v-else class="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-second-dark text-gray-400" :aria-label="`Sin imagen: ${alt}`"><ImageOff class="h-4 w-4"/></div></template>
