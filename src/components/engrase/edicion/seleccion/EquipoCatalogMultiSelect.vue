<script setup lang="ts">
import { computed } from "vue";
import VueMultiselect from "vue-multiselect";
import type { EquipoMultiselectOption } from "./equipoMultiselect.types";
const props = defineProps<{
  options: EquipoMultiselectOption[];
  modelValue: string[];
  placeholder: string;
  invalid?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [string[]]; close: [] }>();
const selected = computed({
  get: (): EquipoMultiselectOption[] =>
    props.options.filter((option) => props.modelValue.includes(option.key)),
  set: (options: EquipoMultiselectOption[]) =>
    emit(
      "update:modelValue",
      options.map((option) => option.key),
    ),
});
</script>
<template>
  <VueMultiselect
    v-model="selected"
    :options="options"
    :multiple="true"
    track-by="key"
    label="label"
    :searchable="true"
    :allow-empty="false"
    :close-on-select="false"
    :hide-selected="true"
    :placeholder="placeholder"
    select-label="Seleccionar"
    selected-label="Seleccionado"
    deselect-label="Quitar"
    tag-placeholder="Agregar"
    no-options="No hay opciones"
    no-result="Sin resultados"
    :class="{ 'multiselect-invalid': invalid }"
    @close="emit('close')"
  />
</template>
