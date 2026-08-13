<script setup lang="ts">
import { computed } from "vue";
import { Plus } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";
import {
  normalizarModeloEquipo,
  type EquipoModeloOption,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseModelos";

const props = defineProps<{
  modelValue: string;
  options: EquipoModeloOption[];
  invalid?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const selected = computed<EquipoModeloOption | null>({
  get: () => {
    const normalizado = normalizarModeloEquipo(props.modelValue);
    return props.options.find((option) => option.value === normalizado) ?? null;
  },
  set: (option) => {
    if (option) emit("update:modelValue", normalizarModeloEquipo(option.value));
  },
});

function crearModelo(valor: string): void {
  const normalizado = normalizarModeloEquipo(valor);
  if (normalizado) emit("update:modelValue", normalizado);
}
</script>

<template>
  <div class="grid content-start gap-1.5">
    <label for="equipo-subtipo" class="text-xs font-semibold text-gray-700">
      Modelo / subtipo
      <span class="text-danger" aria-hidden="true">*</span>
    </label>
    <VueMultiselect
      id="equipo-subtipo"
      v-model="selected"
      :options="options"
      track-by="key"
      label="value"
      :taggable="true"
      :searchable="true"
      :allow-empty="false"
      placeholder="Escribe o selecciona un modelo"
      tag-placeholder="Crear modelo"
      select-label="Seleccionar"
      selected-label=""
      deselect-label=""
      no-options="No hay modelos registrados"
      no-result="Presiona Enter para crear el modelo"
      :class="{ 'equipo-modelo-multiselect': true, 'multiselect-invalid': invalid }"
      @tag="crearModelo"
    >
      <template #singleLabel="{ option }">
        <span class="font-medium">{{ option.value }}</span>
      </template>
      <template #option="{ option, search }">
        <div
          v-if="option.isTag"
          class="equipo-modelo-create flex items-center gap-2 text-main"
        >
          <Plus class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Crear “{{ normalizarModeloEquipo(search) }}”</span>
        </div>
        <div v-else class="grid min-w-0 gap-1">
          <div class="flex min-w-0 items-center justify-between gap-2">
            <span class="truncate font-semibold">{{ option.value }}</span>
            <span
              v-if="option.esActual"
              class="equipo-modelo-actual shrink-0 rounded bg-main/10 px-1.5 py-0.5 text-[11px] font-bold text-main"
            >
              Modelo actual
            </span>
          </div>
          <div v-if="option.tiposEquipo.length" class="flex flex-wrap gap-1">
            <span
              v-for="tipo in option.tiposEquipo"
              :key="tipo"
              class="equipo-modelo-tipo rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600"
            >
              {{ tipo }}
            </span>
          </div>
        </div>
      </template>
    </VueMultiselect>
    <p v-if="invalid" class="text-xs text-danger" role="alert">
      El modelo o subtipo es obligatorio.
    </p>
  </div>
</template>

<style scoped>
:deep(.multiselect__option--highlight) .equipo-modelo-create,
:deep(.multiselect__option--highlight) .equipo-modelo-actual,
:deep(.multiselect__option--highlight) .equipo-modelo-tipo {
  color: var(--color-white);
}

:deep(.multiselect__option--highlight) .equipo-modelo-actual,
:deep(.multiselect__option--highlight) .equipo-modelo-tipo {
  background: rgb(255 255 255 / 18%);
}

.equipo-modelo-multiselect :deep(.multiselect__option--selected::after) {
  content: none;
}
</style>
