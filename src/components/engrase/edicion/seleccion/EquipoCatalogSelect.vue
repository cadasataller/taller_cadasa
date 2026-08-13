<script setup lang="ts">
import { computed } from "vue";
import VueMultiselect from "vue-multiselect";
import { useEquipoOverlayMultiselect } from "@/composables/engrase/useEquipoOverlayMultiselect";
import type { EquipoMultiselectOption } from "./equipoMultiselect.types";
const props = defineProps<{
  options: EquipoMultiselectOption[];
  modelValue: string | null;
  placeholder: string;
  invalid?: boolean;
  taggable?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [string | null]; tag: [string] }>();
const { multiselect, acomodarOpcionesEnOverlay } =
  useEquipoOverlayMultiselect();
const selected = computed({
  get: (): EquipoMultiselectOption | null =>
    props.options.find((option) => option.key === props.modelValue) ?? null,
  set: (option: EquipoMultiselectOption | null) =>
    emit("update:modelValue", option?.key ?? null),
});
</script>
<template>
  <VueMultiselect
    ref="multiselect"
    v-model="selected"
    :options="options"
    track-by="key"
    label="label"
    :searchable="true"
    open-direction="below"
    :allow-empty="false"
    :taggable="taggable"
    :append-to-body="true"
    :options-limit="200"
    :placeholder="placeholder"
    select-label="Seleccionar"
    selected-label="Seleccionado"
    deselect-label="Quitar"
    tag-placeholder="Agregar"
    no-options="No hay opciones"
    no-result="Sin resultados"
    class="equipo-catalog-select-menu"
    :class="{ 'multiselect-invalid': invalid }"
    @open="acomodarOpcionesEnOverlay"
    @tag="emit('tag', $event)"
  />
</template>
