<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

interface Props {
  title: string;
  extra?: string | number;
  initiallyOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initiallyOpen: false,
});

const isOpen = ref(props.initiallyOpen);
</script>

<template>
  <div class="border border-gray-100 rounded-xl overflow-hidden bg-white mb-2">
    <div 
      @click="isOpen = !isOpen"
      class="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none bg-gray-50/80"
    >
      <div class="flex items-center gap-3">
        <div 
          class="transition-transform duration-300 transform text-gray-400"
          :class="{ 'rotate-0': isOpen, '-rotate-90': !isOpen }"
        >
          <ChevronDown class="w-4 h-4" />
        </div>
        <span class="font-bold uppercase tracking-wide text-xs text-main">
          {{ title }}
        </span>
        <slot name="title-extra" />
      </div>
      <div v-if="extra !== undefined" class="bg-gray-200 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">
        {{ extra }}
      </div>
    </div>
    
    <transition
      enter-active-class="transition-[max-height,opacity] duration-300 ease-out"
      leave-active-class="transition-[max-height,opacity] duration-200 ease-in"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[1000px] opacity-100"
      leave-from-class="max-h-[1000px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="isOpen" class="overflow-hidden">
        <div class="p-4 pt-0 border-t border-gray-50 bg-gray-50/30">
          <slot />
        </div>
      </div>
    </transition>
  </div>
</template>
