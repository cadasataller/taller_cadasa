<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Component } from 'vue';

interface Props {
  modelValue: string | number;
  label?: string;
  type?: string;
  placeholder?: string;
  icon?: Component;
  error?: string;
  validator?: (val: any) => string | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'validate', error?: string): void;
  (e: 'blur', event: FocusEvent): void;
}>();

const localError = ref<string | undefined>(props.error);

watch(() => props.modelValue, (newVal) => {
  if (props.validator) {
    localError.value = props.validator(newVal);
    emit('validate', localError.value);
  }
});

watch(() => props.error, (newErr) => {
  localError.value = newErr;
});
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" class="text-xs font-medium text-gray-500 ml-1">
      {{ label }}
    </label>
    <div 
      class="relative flex items-center rounded-lg border bg-white focus-within:ring-2 focus-within:ring-main-light/20 transition-all duration-200"
      :class="[
        localError ? 'border-danger' : 'border-gray-200 focus-within:border-main-light'
      ]"
    >
      <div v-if="icon" class="pl-3 py-2 text-gray-400">
        <component :is="icon" class="w-4 h-4" />
      </div>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="emit('blur', $event)"
        class="w-full bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 outline-none"
      />
      <div v-if="$slots.suffix" class="pr-3 py-2 text-gray-400 flex items-center">
        <slot name="suffix" />
      </div>
    </div>
    <transition name="slide-fade">
      <span v-if="localError" class="text-[11px] font-medium text-danger ml-1">
        {{ localError }}
      </span>
    </transition>
  </div>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.15s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-5px);
  opacity: 0;
}
</style>
