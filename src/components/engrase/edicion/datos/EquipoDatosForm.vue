<script setup lang="ts">
import { computed } from "vue";
import { Info } from "lucide-vue-next";
import EquipoEtapasField from "./EquipoEtapasField.vue";
import EquipoTipoField from "./EquipoTipoField.vue";
import type {
  AuxiliaresEdicionEquipo,
  EquipoEdicionDraft,
  EquipoEstado,
  TipoEquipoDraftReference,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
const props = defineProps<{
  draft: EquipoEdicionDraft;
  auxiliares: AuxiliaresEdicionEquipo;
  isDuplicateTipoEquipo: (nombre: string) => boolean;
}>();
const emit = defineEmits<{
  updateCodigo: [string];
  selectTipoEquipo: [TipoEquipoDraftReference];
  updateSubtipo: [string];
  updateEstado: [EquipoEstado];
  addEtapa: [number];
  removeEtapa: [number];
  createTipoEquipo: [string];
}>();
const codigoInvalido = computed(() => !props.draft.equipo.codigo.trim());
const subtipoInvalido = computed(() => !props.draft.equipo.subtipo.trim());
const codigo = computed({
  get: () => props.draft.equipo.codigo,
  set: (valor: string) => emit("updateCodigo", valor),
});
const subtipo = computed({
  get: () => props.draft.equipo.subtipo,
  set: (valor: string) => emit("updateSubtipo", valor),
});
</script>
<template>
  <section class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
    <div class="mb-3 flex items-start gap-2">
      <div>
        <h2 class="text-base font-bold text-gray-900">Datos del equipo</h2>
        <p class="text-xs text-gray-600">
          Los cambios se guardarán al confirmar la edición.
        </p>
      </div>
    </div>
    <div class="grid gap-3">
      <div class="grid gap-1.5">
        <label for="equipo-codigo" class="text-xs font-semibold text-gray-700"
          >Código</label
        ><input
          id="equipo-codigo"
          v-model="codigo"
          class="min-h-11 rounded-md border border-gray-300 px-3 text-base outline-none focus:border-main focus:ring-2 focus:ring-main/20 sm:min-h-9 sm:text-sm"
          :class="codigoInvalido ? 'border-danger' : ''"
        />
        <p v-if="codigoInvalido" class="text-xs text-danger" role="alert">
          El código es obligatorio.
        </p>
      </div>
      <EquipoTipoField
        :tipos="auxiliares.tiposEquipo"
        :selected="draft.tipoEquipoReferencia"
        :is-duplicate="isDuplicateTipoEquipo"
        @select="emit('selectTipoEquipo', $event)"
        @create="emit('createTipoEquipo', $event)"
      />
      <div class="grid gap-1.5">
        <label for="equipo-subtipo" class="text-xs font-semibold text-gray-700"
          >Modelo / subtipo</label
        ><input
          id="equipo-subtipo"
          v-model="subtipo"
          type="text"
          class="min-h-11 rounded-md border border-gray-300 px-3 text-base outline-none focus:border-main focus:ring-2 focus:ring-main/20 sm:min-h-9 sm:text-sm"
          :class="subtipoInvalido ? 'border-danger' : ''"
        />
        <p v-if="subtipoInvalido" class="text-xs text-danger" role="alert">
          El modelo o subtipo es obligatorio.
        </p>
      </div>
      <EquipoEtapasField
        :etapas="auxiliares.etapas"
        :seleccionadas="draft.etapas"
        :invalid="draft.etapas.length === 0"
        @add="emit('addEtapa', $event)"
        @remove="emit('removeEtapa', $event)"
      />
      <div class="grid gap-1.5">
        <span class="text-xs font-semibold text-gray-700">Estado</span>
        <div
          class="grid grid-cols-2 gap-2"
          role="group"
          aria-label="Estado del equipo"
        >
          <button
            type="button"
            class="min-h-11 rounded-md border px-3 text-xs font-semibold"
            :class="
              draft.equipo.estado === 'activo'
                ? 'cursor-pointer border-success bg-success-bg text-success'
                : 'cursor-pointer border-gray-300 bg-white text-gray-600'
            "
            :aria-pressed="draft.equipo.estado === 'activo'"
            @click="emit('updateEstado', 'activo')"
          >
            Activo</button
          ><button
            type="button"
            class="min-h-11 rounded-md border px-3 text-xs font-semibold"
            :class="
              draft.equipo.estado === 'descartado'
                ? 'cursor-pointer border-danger bg-danger-bg text-danger'
                : 'cursor-pointer border-gray-300 bg-white text-gray-600'
            "
            :aria-pressed="draft.equipo.estado === 'descartado'"
            @click="emit('updateEstado', 'descartado')"
          >
            Descartado
          </button>
        </div>
      </div>
      
      
    </div>
  </section>
</template>
