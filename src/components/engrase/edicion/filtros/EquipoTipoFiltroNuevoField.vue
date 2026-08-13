<script setup lang="ts">
import { computed, shallowRef } from "vue";
import VueMultiselect from "vue-multiselect";
import { Info, Plus, Truck } from "lucide-vue-next";
import { crearTempId } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.tempIds";
import type {
  TipoFiltroAuxiliar,
  TipoFiltroDraftReference,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";

const props = defineProps<{
  tipos: TipoFiltroAuxiliar[];
  selected: TipoFiltroDraftReference | null;
  disabledTypeIds?: number[];
  assignedTypeCodes?: Record<number, string>;
  searchedCode?: string;
  suggestedTypeIds?: number[];
  suggestedTypeNames?: string[];
  isDuplicate: (nombre: string) => boolean;
}>();
const emit = defineEmits<{
  select: [TipoFiltroDraftReference | null];
  error: [string];
}>();

type Option = {
  key: string;
  label: string;
  value: TipoFiltroDraftReference;
  suggested: boolean;
  assignedToSearchedCode: boolean;
  $isDisabled: boolean;
};

const temporal = shallowRef<TipoFiltroDraftReference[]>([]);
const normalizar = (valor: string): string => valor.trim().replace(/\s+/g, " ");
const clave = (valor: string): string =>
  normalizar(valor)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
const codigoNormalizado = (valor: string): string =>
  valor.trim().replace(/\s+/g, " ").toUpperCase();
const estaAsignadoAlCodigoBuscado = (tipoId: number): boolean =>
  props.disabledTypeIds?.includes(tipoId) === true &&
  codigoNormalizado(props.assignedTypeCodes?.[tipoId] ?? "") ===
    codigoNormalizado(props.searchedCode ?? "") &&
  Boolean(codigoNormalizado(props.searchedCode ?? ""));
const options = computed<Option[]>(() => [
  ...props.tipos.map((tipo) => ({
    key: `tipo_${tipo.id}`,
    label: tipo.nombre,
    value: {
      estado: "existente" as const,
      id: tipo.id,
      tempId: null,
      nombre: tipo.nombre,
    },
    suggested: !estaAsignadoAlCodigoBuscado(tipo.id) && (
      props.suggestedTypeIds?.includes(tipo.id) === true ||
      props.suggestedTypeNames?.some(
        (nombre) => clave(nombre) === clave(tipo.nombre),
      ) === true
    ),
    assignedToSearchedCode: estaAsignadoAlCodigoBuscado(tipo.id),
    $isDisabled: props.disabledTypeIds?.includes(tipo.id) ?? false,
  })),
  ...temporal.value.map((tipo) => ({
    key: tipo.estado === "nuevo" ? tipo.tempId : `tipo_${tipo.id}`,
    label: tipo.nombre,
    value: tipo,
    suggested: false,
    assignedToSearchedCode: false,
    $isDisabled: false,
  })),
]);
const model = computed<Option | null>({
  get: () =>
    options.value.find(
      (option) =>
        option.value.estado === props.selected?.estado &&
        option.value.nombre === props.selected?.nombre,
    ) ?? null,
  set: (option) => emit("select", option?.value ?? null),
});
const tipoConContexto = computed(() => {
  const seleccionado = props.selected;
  return seleccionado?.estado === "existente"
    ? (props.tipos.find((tipo) => tipo.id === seleccionado.id) ?? null)
    : null;
});

function crearTipo(nombre: string): void {
  const normalizado = normalizar(nombre);
  if (!normalizado) {
    emit("error", "El nombre del tipo es obligatorio.");
    return;
  }
  if (
    props.isDuplicate(normalizado) ||
    temporal.value.some(
      (tipo) =>
        tipo.nombre.localeCompare(normalizado, undefined, {
          sensitivity: "base",
        }) === 0,
    )
  ) {
    emit("error", "Ya existe un tipo de filtro con este nombre.");
    return;
  }
  const nuevo: TipoFiltroDraftReference = {
    estado: "nuevo",
    id: null,
    tempId: crearTempId("tipo_filtro"),
    nombre: normalizado,
  };
  temporal.value = [...temporal.value, nuevo];
  emit("error", "");
  emit("select", nuevo);
}
</script>

<template>
  <div class="grid gap-1.5">
    <label class="text-xs font-semibold text-gray-700">Tipo de filtro</label>
    <VueMultiselect
      v-model="model"
      :options="options"
      track-by="key"
      label="label"
      :searchable="true"
      :taggable="true"
      tag-placeholder="Crear tipo nuevo"
      select-label="Seleccionar"
      selected-label="Seleccionado"
      no-options="No hay tipos disponibles"
      no-result="Sin resultados"
      @tag="crearTipo"
    >
      <template #option="{ option }">
        <div v-if="option.isTag" class="flex items-center gap-2 text-main">
          <Plus class="h-4 w-4" aria-hidden="true" />
          Crear “{{ option.label }}” como tipo nuevo
        </div>
        <div v-else class="flex items-center justify-between gap-2">
          <span>{{ option.label }}</span>
          <span
            v-if="option.assignedToSearchedCode"
            class="rounded bg-info-bg px-1.5 py-0.5 text-xs font-semibold leading-none text-info"
          >Asignado a este código</span>
          <span
            v-if="option.suggested"
            class="rounded bg-info-bg px-1 py-0.5 text-xs font-semibold leading-none text-info"
            >Sugerido</span
          >
          <span
            v-if="option.value.estado === 'nuevo'"
            class="rounded bg-warning-bg px-1.5 py-0.5 text-xs text-warning"
          >
            Pendiente de creación
          </span>
        </div>
      </template>
    </VueMultiselect>
    <p
      v-if="selected?.estado === 'nuevo'"
      class="inline-flex items-center gap-1 text-xs text-warning"
    >
      <Plus class="h-3.5 w-3.5" />Tipo temporal pendiente de creación.
    </p>
    <section
      v-if="tipoConContexto"
      class="rounded-md border border-info/30 bg-info-bg p-2.5"
    >
      <div class="flex items-center gap-1.5 text-xs font-semibold text-info">
        <Info class="h-4 w-4" aria-hidden="true" />Tipos de equipo que utilizan
        este filtro
      </div>
      <ul
        v-if="tipoConContexto.tiposEquipoQueLoUsan.length"
        class="mt-2 grid gap-1 text-sm text-gray-700 sm:grid-cols-2"
      >
        <li
          v-for="tipoEquipo in tipoConContexto.tiposEquipoQueLoUsan"
          :key="tipoEquipo"
          class="flex items-center gap-1.5"
        >
          <Truck class="h-3.5 w-3.5 shrink-0 text-info" aria-hidden="true" />
          {{ tipoEquipo }}
        </li>
      </ul>
      <p v-else class="mt-1 text-xs text-gray-600">
        No hay equipos registrados para este tipo.
      </p>
    </section>
  </div>
</template>
