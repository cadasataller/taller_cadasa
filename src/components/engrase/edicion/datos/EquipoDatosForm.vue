<script setup lang="ts">
import { computed } from "vue";
import EquipoEtapasField from "./EquipoEtapasField.vue";
import EquipoModeloField from "./EquipoModeloField.vue";
import EquipoTipoField from "./EquipoTipoField.vue";
import type { EquipoModeloOption } from "@/stores/dbequipos/engrase/edicion/equipoEngraseModelos";
import type {
  AuxiliaresEdicionEquipo,
  EquipoEdicionDraft,
  EquipoEstado,
  TipoEquipoDraftReference,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
const props = defineProps<{
  draft: EquipoEdicionDraft;
  auxiliares: AuxiliaresEdicionEquipo;
  modelOptions: EquipoModeloOption[];
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
</script>
<template>
  <section
    class="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm sm:p-3"
  >
    <h2
      class="mb-2 text-xs font-bold uppercase tracking-wide text-main sm:text-sm"
    >
      Datos del equipo
    </h2>
    <div
      class="grid gap-3 lg:grid-cols-[minmax(180px,240px)_minmax(0,1fr)] lg:items-stretch"
    >
      <div class="aspect-video w-full sm:aspect-[4/3] lg:aspect-square lg:self-start">
        <slot name="imagen" />
      </div>
      <div
        class="grid gap-3 lg:h-full lg:content-between"
      >
        <div class="grid gap-2.5 md:grid-cols-2 xl:gap-3">
          <div class="grid content-start gap-1.5">
            <label
              for="equipo-codigo"
              class="text-xs font-semibold text-gray-700"
            >
              Código <span class="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              id="equipo-codigo"
              v-model="codigo"
              class="min-h-10 rounded-md border border-gray-300 px-2.5 text-xs outline-none focus:border-main focus:ring-2 focus:ring-main/20 sm:min-h-9 sm:text-sm"
              :class="codigoInvalido ? 'border-danger' : ''"
            />
            <p v-if="codigoInvalido" class="text-xs text-danger" role="alert">
              El código es obligatorio.
            </p>
          </div>
          <EquipoTipoField
            class="[&_.multiselect]:!min-h-9 [&_.multiselect]:!text-xs [&_.multiselect__input]:!mb-0 [&_.multiselect__input]:!text-xs [&_.multiselect__select]:!h-9 [&_.multiselect__single]:!mb-0 [&_.multiselect__single]:!text-xs [&_.multiselect__tags]:!min-h-9 [&_.multiselect__tags]:!px-2.5 [&_.multiselect__tags]:!py-1"
            :tipos="auxiliares.tiposEquipo"
            :selected="draft.tipoEquipoReferencia"
            :is-duplicate="isDuplicateTipoEquipo"
            @select="emit('selectTipoEquipo', $event)"
            @create="emit('createTipoEquipo', $event)"
          />
        </div>
        <div class="grid gap-2.5 md:grid-cols-2 xl:gap-3">
          <EquipoModeloField
            class="[&_.multiselect]:!min-h-9 [&_.multiselect]:!text-xs [&_.multiselect__input]:!mb-0 [&_.multiselect__input]:!text-xs [&_.multiselect__select]:!h-9 [&_.multiselect__single]:!mb-0 [&_.multiselect__single]:!text-xs [&_.multiselect__tags]:!min-h-9 [&_.multiselect__tags]:!px-2.5 [&_.multiselect__tags]:!py-1"
            :model-value="draft.equipo.subtipo"
            :options="modelOptions"
            :invalid="subtipoInvalido"
            @update:model-value="emit('updateSubtipo', $event)"
          />
          <EquipoEtapasField
            class="[&_.multiselect]:!min-h-9 [&_.multiselect]:!text-xs [&_.multiselect__input]:!mb-0 [&_.multiselect__input]:!text-xs [&_.multiselect__select]:!h-9 [&_.multiselect__single]:!mb-0 [&_.multiselect__single]:!text-xs [&_.multiselect__tags]:!min-h-9 [&_.multiselect__tags]:!px-2.5 [&_.multiselect__tags]:!py-1"
            :etapas="auxiliares.etapas"
            :seleccionadas="draft.etapas"
            :invalid="draft.etapas.length === 0"
            @add="emit('addEtapa', $event)"
            @remove="emit('removeEtapa', $event)"
          />
        </div>
        <div class="grid gap-1.5">
          <span class="text-xs font-semibold text-gray-700">
            Estado <span class="text-danger" aria-hidden="true">*</span>
          </span>
          <div
            class="grid grid-cols-2 gap-2"
            role="group"
            aria-label="Estado del equipo"
          >
            <button
              type="button"
              class="min-h-9 cursor-pointer rounded-md border px-2.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
              :class="
                draft.equipo.estado === 'activo'
                  ? 'border-success bg-success-bg text-success'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              "
              :aria-pressed="draft.equipo.estado === 'activo'"
              @click="emit('updateEstado', 'activo')"
            >
              Activo
            </button>
            <button
              type="button"
              class="min-h-9 cursor-pointer rounded-md border px-2.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
              :class="
                draft.equipo.estado === 'descartado'
                  ? 'border-danger bg-danger-bg text-danger'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              "
              :aria-pressed="draft.equipo.estado === 'descartado'"
              @click="emit('updateEstado', 'descartado')"
            >
              Descartado
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
