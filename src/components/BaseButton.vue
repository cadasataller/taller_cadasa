<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
});

const variantClasses = {
  primary: 'bg-main text-white hover:bg-main-light shadow-md active:scale-95',
  secondary: 'bg-accent text-gray-900 hover:bg-accent-light shadow-md active:scale-95',
  tertiary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:scale-95',
  outline: 'bg-transparent text-gray-500 border border-current hover:bg-gray-50 active:scale-95',
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="px-4 py-2 rounded-lg font-body font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    :class="variantClasses[variant]"
  >
    <slot />
  </button>
</template>
