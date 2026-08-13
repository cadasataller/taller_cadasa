<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { Plus } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";
import type {
  TipoEquipoAuxiliar,
  TipoEquipoDraftReference,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
const props = defineProps<{
  tipos: TipoEquipoAuxiliar[];
  selected: TipoEquipoDraftReference | null;
  invalid?: boolean;
  isDuplicate: (nombre: string) => boolean;
}>();
const emit = defineEmits<{
  select: [TipoEquipoDraftReference];
  create: [string];
  blur: [];
}>();

type Option = {
  key: string;
  label: string;
  value: TipoEquipoDraftReference;
  pendingCreation: boolean;
};

const error = shallowRef("");
const normalizar = (valor: string): string => valor.trim().replace(/\s+/g, " ");
const options = computed<Option[]>(() => [
  ...props.tipos.map((tipo): Option => ({
    key: String(tipo.id),
    label: tipo.nombre,
    value: {
      estado: "existente" as const,
      id: tipo.id,
      nombre: tipo.nombre,
      tempId: null,
    },
    pendingCreation: false,
  })),
  ...(props.selected?.estado === "nuevo"
    ? [
        {
          key: props.selected.tempId,
          label: props.selected.nombre,
          value: props.selected,
          pendingCreation: true,
        } satisfies Option,
      ]
    : []),
]);
const model = computed<Option | null>({
  get: () =>
    options.value.find(
      (option) =>
        option.value.estado === props.selected?.estado &&
        option.value.nombre === props.selected?.nombre,
    ) ?? null,
  set: (option) => {
    if (option) emit("select", option.value);
  },
});

function crearTipo(nombre: string): void {
  const normalizado = normalizar(nombre);
  if (!normalizado) {
    error.value = "El nombre del tipo es obligatorio.";
    return;
  }
  if (props.isDuplicate(normalizado)) {
    error.value = "Ya existe un tipo de equipo con este nombre.";
    return;
  }
  error.value = "";
  emit("create", normalizado);
}
</script>
<template>
  <div class="grid content-start gap-1.5">
    <label class="text-xs font-semibold text-gray-700">Tipo de equipo</label>
    <VueMultiselect
      v-model="model"
      :options="options"
      track-by="key"
      label="label"
      :searchable="true"
      :taggable="true"
      :allow-empty="false"
      tag-placeholder="Crear tipo nuevo"
      placeholder="Selecciona un tipo"
      select-label="Seleccionar"
      selected-label="Seleccionado"
      no-options="No hay tipos disponibles"
      no-result="Sin resultados"
      :class="{ 'equipo-tipo-multiselect': true, 'multiselect-invalid': invalid }"
      @tag="crearTipo"
      @close="emit('blur')"
    >
      <template #option="{ option, search }">
        <div
          v-if="option.isTag"
          class="tipo-equipo-create-option flex items-center gap-2 text-main"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          Crear “{{ search }}” como tipo nuevo
        </div>
        <div
          v-else
          class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-2"
        >
          <span class="min-w-0 whitespace-normal sm:truncate sm:whitespace-nowrap">{{
            option.label
          }}</span>
          <span
            v-if="option.pendingCreation"
            class="shrink-0 whitespace-normal rounded bg-warning-bg px-1.5 py-0.5 text-xs text-warning sm:whitespace-nowrap"
          >
            Pendiente de creación
          </span>
          <span
            v-if="model?.key === option.key"
            class="tipo-equipo-selected-label shrink-0 whitespace-nowrap text-xs font-semibold text-gray-700"
          >
            Seleccionado
          </span>
        </div>
      </template>
    </VueMultiselect>
    <p v-if="error" class="text-xs text-danger" role="alert">
      {{ error }}
    </p>
    <p v-else-if="invalid" class="text-xs text-danger" role="alert">
      Selecciona un tipo de equipo.
    </p>
    <p
      v-if="selected?.estado === 'nuevo'"
      class="inline-flex items-center gap-1 text-xs text-warning"
    >
      <Plus class="h-3.5 w-3.5" aria-hidden="true" />
      Tipo temporal pendiente de creación.
    </p>
  </div>
</template>
<style scoped>
:deep(.multiselect__option--highlight) .tipo-equipo-create-option {
  color: var(--color-white);
}

:deep(.multiselect__option--highlight) .tipo-equipo-selected-label {
  color: var(--color-white);
}

.equipo-tipo-multiselect :deep(.multiselect__option--selected::after) {
  content: none;
}
</style>
