<script setup lang="ts">
import { computed, shallowRef } from "vue";
import type {
  AuxiliaresEquipoEngrase,
  CrearEquipoDraft,
  EquipoEstado,
  TipoEquipoCreacionReference,
} from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
import EquipoCreacionCodigoField from "./EquipoCreacionCodigoField.vue";
import EquipoEtapasField from "../../edicion/datos/EquipoEtapasField.vue";
import EquipoModeloField from "../../edicion/datos/EquipoModeloField.vue";
import EquipoTipoField from "../../edicion/datos/EquipoTipoField.vue";
import {
  normalizarModeloEquipo,
  type EquipoModeloOption,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseModelos";
import type { TipoEquipoDraftReference } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";

const props = defineProps<{
  draft: CrearEquipoDraft;
  auxiliares: AuxiliaresEquipoEngrase;
  disabled: boolean;
  canValidate: boolean;
  validating: boolean;
  errors: string[];
  isDuplicateTipoEquipo: (nombre: string) => boolean;
}>();
const emit = defineEmits<{
  codigo: [string];
  validate: [];
  tipo: [TipoEquipoCreacionReference];
  createTipo: [string];
  subtipo: [string];
  estado: [EquipoEstado];
  addEtapa: [number];
  removeEtapa: [number];
}>();
type CampoDatos = "codigo" | "tipo" | "subtipo" | "etapas";
const camposTocados = shallowRef<Record<CampoDatos, boolean>>({
  codigo: false,
  tipo: false,
  subtipo: false,
  etapas: false,
});
const modeloInvalido = computed(
  () => camposTocados.value.subtipo && !props.draft.datos.subtipo.trim(),
);
const tipoInvalido = computed(
  () => camposTocados.value.tipo && props.draft.datos.tipoEquipo === null,
);
const etapasInvalidas = computed(
  () => camposTocados.value.etapas && props.draft.datos.etapas.length === 0,
);
const opcionesModelo = computed<EquipoModeloOption[]>(() => {
  const opciones = new Map<string, EquipoModeloOption>();
  const tipoSeleccionado = props.draft.datos.tipoEquipo;

  props.auxiliares.tiposEquipo.forEach((tipo) => {
    tipo.subtiposSugeridos.forEach((subtipo) => {
      const valor = normalizarModeloEquipo(subtipo);
      if (!valor) return;
      const existente = opciones.get(valor);
      if (existente) {
        existente.tiposEquipo.push(tipo.nombre);
        return;
      }
      opciones.set(valor, {
        key: valor,
        value: valor,
        tiposEquipo: [tipo.nombre],
        esActual: valor === normalizarModeloEquipo(props.draft.datos.subtipo),
        correspondeAlTipoActual: tipo.id === tipoSeleccionado?.id,
      });
    });
  });

  const actual = normalizarModeloEquipo(props.draft.datos.subtipo);
  if (actual && !opciones.has(actual)) {
    opciones.set(actual, {
      key: actual,
      value: actual,
      tiposEquipo: tipoSeleccionado ? [tipoSeleccionado.nombre] : [],
      esActual: true,
      correspondeAlTipoActual: true,
    });
  }

  return [...opciones.values()]
    .map((opcion) => ({
      ...opcion,
      tiposEquipo: [...new Set(opcion.tiposEquipo)].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
      esActual: opcion.value === actual,
      correspondeAlTipoActual: Boolean(
        tipoSeleccionado && opcion.tiposEquipo.includes(tipoSeleccionado.nombre),
      ),
    }))
    .sort((a, b) => {
      const prioridadA = a.esActual ? 0 : a.correspondeAlTipoActual ? 1 : 2;
      const prioridadB = b.esActual ? 0 : b.correspondeAlTipoActual ? 1 : 2;
      return prioridadA - prioridadB || a.value.localeCompare(b.value, "es");
    });
});

function seleccionarTipo(tipo: TipoEquipoDraftReference): void {
  const existente = tipo.estado === "existente"
    ? props.auxiliares.tiposEquipo.find((item) => item.id === tipo.id)
    : undefined;
  emit("tipo", {
    ...tipo,
    subtiposSugeridos: existente ? [...existente.subtiposSugeridos] : [],
  });
}

function marcarCampoTocado(campo: CampoDatos): void {
  camposTocados.value = { ...camposTocados.value, [campo]: true };
}
</script>
<template>
  <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h2 tabindex="-1" class="text-base font-bold text-main">
      Datos del equipo
    </h2>
    
    <div
      v-if="errors.length"
      class="mt-3 rounded-md bg-danger-bg p-2 text-xs text-danger"
      role="alert"
    >
      <p v-for="error in errors" :key="error">{{ error }}</p>
    </div>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <EquipoCreacionCodigoField
        :model-value="draft.datos.codigo"
        :can-validate="canValidate"
        :validating="validating"
        :validation="draft.validacionCodigo"
        :disabled="disabled"
        @update:model-value="emit('codigo', $event)"
        @validate="emit('validate')"
        @blur="marcarCampoTocado('codigo')"
      /><EquipoTipoField
        class="[&_.multiselect]:!min-h-10 [&_.multiselect]:!text-xs [&_.multiselect__input]:!mb-0 [&_.multiselect__input]:!text-xs [&_.multiselect__select]:!h-10 [&_.multiselect__single]:!mb-0 [&_.multiselect__single]:!text-xs [&_.multiselect__tags]:!min-h-10 [&_.multiselect__tags]:!px-2 [&_.multiselect__tags]:!py-1"
        :tipos="auxiliares.tiposEquipo"
        :selected="draft.datos.tipoEquipo"
        :invalid="tipoInvalido"
        :is-duplicate="isDuplicateTipoEquipo"
        @select="seleccionarTipo"
        @create="emit('createTipo', $event)"
        @blur="marcarCampoTocado('tipo')"
      /><EquipoModeloField
        class="[&_.multiselect]:!min-h-10 [&_.multiselect]:!text-xs [&_.multiselect__input]:!mb-0 [&_.multiselect__input]:!text-xs [&_.multiselect__select]:!h-10 [&_.multiselect__single]:!mb-0 [&_.multiselect__single]:!text-xs [&_.multiselect__tags]:!min-h-10 [&_.multiselect__tags]:!px-2 [&_.multiselect__tags]:!py-1"
        :model-value="draft.datos.subtipo"
        :options="opcionesModelo"
        :invalid="modeloInvalido"
        @update:model-value="emit('subtipo', $event)"
        @blur="marcarCampoTocado('subtipo')"
      />
      <EquipoEtapasField
        class="[&_.multiselect]:!min-h-10 [&_.multiselect]:!text-xs [&_.multiselect__input]:!mb-0 [&_.multiselect__input]:!text-xs [&_.multiselect__select]:!h-10 [&_.multiselect__single]:!mb-0 [&_.multiselect__single]:!text-xs [&_.multiselect__tags]:!min-h-10 [&_.multiselect__tags]:!px-2 [&_.multiselect__tags]:!py-1"
        :etapas="auxiliares.etapas"
        :seleccionadas="draft.datos.etapas"
        :invalid="etapasInvalidas"
        @add="emit('addEtapa', $event)"
        @remove="emit('removeEtapa', $event)"
        @blur="marcarCampoTocado('etapas')"
      />
      <div class="md:col-span-2">
        <span class="text-xs font-bold text-gray-700">Estado</span>
        <div class="mt-1 grid grid-cols-2 gap-2" role="group" aria-label="Estado del equipo">
          <button
            type="button"
            class="min-h-10 cursor-pointer rounded-md border px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
            :class="
              draft.datos.estado === 'activo'
                ? 'border-success bg-success-bg text-success'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            "
            :aria-pressed="draft.datos.estado === 'activo'"
            :disabled="disabled"
            @click="emit('estado', 'activo')"
          >
            Activo
          </button>
          <button
            type="button"
            class="min-h-10 cursor-pointer rounded-md border px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
            :class="
              draft.datos.estado === 'descartado'
                ? 'border-danger bg-danger-bg text-danger'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            "
            :aria-pressed="draft.datos.estado === 'descartado'"
            :disabled="disabled"
            @click="emit('estado', 'descartado')"
          >
            Descartado
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
