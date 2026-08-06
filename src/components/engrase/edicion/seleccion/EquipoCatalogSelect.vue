<script setup lang="ts">
import { computed } from "vue";
import VueMultiselect from "vue-multiselect";
import type { EquipoMultiselectOption } from "./equipoMultiselect.types";
const props = defineProps<{
  options: EquipoMultiselectOption[];
  modelValue: string | null;
  placeholder: string;
  invalid?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [string | null] }>();
const selected = computed({
  get: (): EquipoMultiselectOption | null =>
    props.options.find((option) => option.key === props.modelValue) ?? null,
  set: (option: EquipoMultiselectOption | null) =>
    emit("update:modelValue", option?.key ?? null),
});
</script>
<template>
  <VueMultiselect
    v-model="selected"
    :options="options"
    track-by="key"
    label="label"
    :searchable="true"
    :allow-empty="false"
    :placeholder="placeholder"
    select-label="Seleccionar"
    selected-label="Seleccionado"
    deselect-label="Quitar"
    tag-placeholder="Agregar"
    no-options="No hay opciones"
    no-result="Sin resultados"
    :class="{ 'multiselect-invalid': invalid }"
  />
</template>
