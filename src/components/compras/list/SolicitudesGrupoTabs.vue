<script setup lang="ts">
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraGrupoOption,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = defineProps<{
  modelValue: SolicitudCompraGrupoListado;
  options: SolicitudCompraGrupoOption[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: SolicitudCompraGrupoListado): void;
}>();

const isActiveTab = (value: SolicitudCompraGrupoListado): boolean =>
  props.modelValue === value;

const selectTab = (value: SolicitudCompraGrupoListado): void => {
  if (value === props.modelValue) {
    return;
  }

  emit('update:modelValue', value);
};
</script>

<template>
  <div
    class="flex w-full rounded-2xl border border-stone-300 bg-white p-1 shadow-sm md:w-auto md:rounded-xl"
    role="tablist"
    aria-label="Grupo de solicitudes"
  >
    <button
      v-for="tab in options"
      :key="tab.value"
      type="button"
      role="tab"
      :aria-selected="isActiveTab(tab.value)"
      :tabindex="isActiveTab(tab.value) ? 0 : -1"
      class="min-w-0 flex-1 cursor-pointer rounded-xl px-2 py-2.5 text-center text-[11px] font-semibold leading-tight transition sm:px-3 md:min-w-[9.5rem] md:flex-none md:px-4 md:py-1.5 md:text-xs"
      :class="isActiveTab(tab.value)
        ? 'bg-teal-800 text-white shadow-sm'
        : 'bg-transparent text-stone-700 hover:bg-stone-100'"
      @click="selectTab(tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
