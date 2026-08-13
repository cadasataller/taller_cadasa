<script setup lang="ts">
import { computed } from "vue";
import EquipoCatalogMultiSelect from "../seleccion/EquipoCatalogMultiSelect.vue";
import type { CatalogoIdNombre } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
import type { EquipoMultiselectOption } from "../seleccion/equipoMultiselect.types";
const props = defineProps<{
  etapas: CatalogoIdNombre[];
  seleccionadas: CatalogoIdNombre[];
  invalid?: boolean;
}>();
const emit = defineEmits<{ add: [number]; remove: [number]; blur: [] }>();
const options = computed<EquipoMultiselectOption[]>(() =>
  props.etapas.map((etapa) => ({
    key: String(etapa.id),
    label: etapa.nombre,
    $isDisabled: false,
    pendingCreation: false,
  })),
);
const selectedKeys = computed({
  get: () => props.seleccionadas.map((etapa) => String(etapa.id)),
  set: (keys: string[]) => {
    const anterior = new Set(
      props.seleccionadas.map((etapa) => String(etapa.id)),
    );
    const siguiente = new Set(keys);
    siguiente.forEach((key) => {
      if (!anterior.has(key)) emit("add", Number(key));
    });
    anterior.forEach((key) => {
      if (!siguiente.has(key)) emit("remove", Number(key));
    });
  },
});
</script>
<template>
  <div class="grid gap-1.5">
    <label class="text-xs font-semibold text-gray-700">Etapas</label
    ><EquipoCatalogMultiSelect
      v-model="selectedKeys"
      :options="options"
      placeholder="Selecciona etapas"
      :invalid="invalid"
      @close="emit('blur')"
    />
    <p v-if="invalid" class="text-xs text-danger" role="alert">
      Selecciona al menos una etapa.
    </p>
  </div>
</template>
