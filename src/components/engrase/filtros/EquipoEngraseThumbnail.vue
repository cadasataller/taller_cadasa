<script setup lang="ts">
import { shallowRef } from 'vue'
import { ImageOff } from 'lucide-vue-next'
defineProps<{ src?: string | null; alt: string }>()
const failed = shallowRef(false)
</script>
<template><img v-if="src && !failed" class="thumb" :src="src" :alt="alt" loading="lazy" @error="failed = true"><div v-else class="fallback" :aria-label="`Sin imagen: ${alt}`"><ImageOff class="w-5 h-5"/></div></template><style scoped>.thumb,.fallback{width:44px;height:44px;border-radius:.65rem;object-fit:cover;flex:none}.fallback{display:grid;place-items:center;background:#eef2f7;color:#71809b}</style>
