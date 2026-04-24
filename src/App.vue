<script setup lang="ts">
import { onMounted, ref } from 'vue';
import DevInspector from '@/components/DevInspector.vue';

const isLoaded = ref(false);

onMounted(() => {
  // Simulate app loading
  setTimeout(() => {
    isLoaded.value = true;
  }, 1000);
});
</script>

<template>
  <div v-if="!isLoaded" class="fixed inset-0 bg-main-dark flex flex-col items-center justify-center z-[9999] transition-all duration-500" :class="{ 'opacity-0 invisible': isLoaded }">
    <div class="loader-logo font-display text-5xl text-accent tracking-[0.15em] animate-pulse">
      CADASA
    </div>
    <div class="loader-sub font-body text-xs tracking-[0.3em] uppercase text-second-deep mt-2">
      SISTEMA OPERATIVO
    </div>
  </div>

  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <DevInspector />

  <div id="toast-container" class="fixed top-6 right-6 z-[8000] flex flex-col gap-3 pointer-events-none"></div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loader-logo {
  animation: pulse-loader 1.2s ease-in-out infinite;
}

@keyframes pulse-loader {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.97); }
}
</style>
