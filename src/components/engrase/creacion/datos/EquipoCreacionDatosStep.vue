<script setup lang="ts">
import type {
  AuxiliaresEquipoEngrase,
  CrearEquipoDraft,
  EquipoEstado,
  TipoEquipoCreacionReference,
} from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
import EquipoCreacionCodigoField from "./EquipoCreacionCodigoField.vue";
const props = defineProps<{
  draft: CrearEquipoDraft;
  auxiliares: AuxiliaresEquipoEngrase;
  disabled: boolean;
  canValidate: boolean;
  validating: boolean;
  errors: string[];
}>();
const emit = defineEmits<{
  codigo: [string];
  validate: [];
  tipo: [TipoEquipoCreacionReference];
  subtipo: [string];
  estado: [EquipoEstado];
  addEtapa: [number];
  removeEtapa: [number];
}>();
const estados: EquipoEstado[] = ["activo", "descartado"];
function seleccionarTipo(event: Event): void {
  const id = Number((event.target as HTMLSelectElement).value);
  const tipo = props.auxiliares.tiposEquipo.find((x) => x.id === id);
  if (tipo)
    emit("tipo", {
      estado: "existente",
      id: tipo.id,
      tempId: null,
      nombre: tipo.nombre,
      subtiposSugeridos: [...tipo.subtiposSugeridos],
    });
}
function actualizarSubtipo(event: Event): void {
  emit("subtipo", (event.target as HTMLInputElement).value);
}
function cambiarEtapa(id: number, event: Event): void {
  (event.target as HTMLInputElement).checked
    ? emit("addEtapa", id)
    : emit("removeEtapa", id);
}
</script>
<template>
  <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h2 tabindex="-1" class="text-base font-bold text-gray-900">
      Datos del equipo
    </h2>
    <p class="mt-1 text-xs text-gray-500">
      La imagen se agregará después de crear el equipo.
    </p>
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
      /><label class="grid gap-1 text-xs font-bold text-gray-700"
        >Tipo de equipo<select
          class="min-h-10 rounded-md border px-2"
          :disabled="disabled"
          :value="
            draft.datos.tipoEquipo?.estado === 'existente'
              ? draft.datos.tipoEquipo.id
              : ''
          "
          @change="seleccionarTipo"
        >
          <option value="">Selecciona…</option>
          <option
            v-for="tipo in auxiliares.tiposEquipo"
            :key="tipo.id"
            :value="tipo.id"
          >
            {{ tipo.nombre }}
          </option>
        </select></label
      ><label class="grid gap-1 text-xs font-bold text-gray-700"
        >Modelo / subtipo<input
          class="min-h-10 rounded-md border px-2"
          :disabled="disabled"
          :value="draft.datos.subtipo"
          @input="actualizarSubtipo"
      /></label>
      <div class="grid gap-1 text-xs font-bold text-gray-700">
        <span>Etapas</span>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="etapa in auxiliares.etapas"
            :key="etapa.id"
            class="inline-flex items-center gap-1 rounded border px-2 py-1 font-normal"
            ><input
              type="checkbox"
              :checked="draft.datos.etapas.some((x) => x.id === etapa.id)"
              :disabled="disabled"
              @change="cambiarEtapa(etapa.id, $event)"
            />{{ etapa.nombre }}</label
          >
        </div>
      </div>
      <div class="md:col-span-2">
        <span class="text-xs font-bold text-gray-700">Estado</span>
        <div class="mt-1 flex gap-2">
          <button
            v-for="estado in estados"
            :key="estado"
            type="button"
            class="min-h-10 rounded-md border px-3 text-xs font-bold capitalize"
            :class="
              draft.datos.estado === estado
                ? 'border-main bg-main/10 text-main'
                : ''
            "
            :disabled="disabled"
            @click="emit('estado', estado)"
          >
            {{ estado }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
