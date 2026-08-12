<script setup lang="ts">
import { computed } from "vue";
import VueMultiselect from "vue-multiselect";
const props = defineProps<{
  options: string[];
  modelValue: string;
  invalid?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [string]; tag: [string] }>();
const selected = computed({
  get: (): string => props.modelValue,
  set: (value: string) => emit("update:modelValue", value),
});
function crearTag(valor: string): void {
  const limpio = valor.trim();
  if (limpio) {
    emit("tag", limpio);
    emit("update:modelValue", limpio);
  }
}
</script>
<template>
  <VueMultiselect
    v-model="selected"
    :options="options"
    :taggable="true"
    :searchable="true"
    :allow-empty="false"
    placeholder="Escribe o selecciona un modelo"
    select-label="Seleccionar"
    selected-label="Seleccionado"
    deselect-label="Quitar"
    tag-placeholder="Usar este texto"
    no-options="Escribe un modelo"
    no-result="Presiona Enter para usarlo"
    :class="{ 'multiselect-invalid': invalid }"
    @tag="crearTag"
  />
</template>
