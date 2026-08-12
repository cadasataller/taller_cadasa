<script setup lang="ts">
import { computed, shallowRef } from "vue";
import EquipoCatalogSelect from "../seleccion/EquipoCatalogSelect.vue";
import type {
  EquipoFiltroDraft,
  TipoFiltroAuxiliar,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";

const props = defineProps<{
  filtro: EquipoFiltroDraft;
  tipos: TipoFiltroAuxiliar[];
  occupiedTypeIds: number[];
}>();
const emit = defineEmits<{ save: [number | null, number] }>();
const tipoKey = shallowRef(
  props.filtro.tipoFiltroReferencia.estado === "nuevo"
    ? props.filtro.tipoFiltroReferencia.tempId
    : String(props.filtro.tipoFiltro.id),
);
const cantidad = shallowRef(props.filtro.cantidad);
const opciones = computed(() => [
  ...props.tipos.map((tipo) => ({
    key: String(tipo.id),
    label: tipo.nombre,
    $isDisabled:
      tipo.id !== props.filtro.tipoFiltro.id &&
      props.occupiedTypeIds.includes(tipo.id),
    pendingCreation: false,
  })),
  ...(props.filtro.tipoFiltroReferencia.estado === "nuevo"
    ? [
        {
          key: props.filtro.tipoFiltroReferencia.tempId,
          label: props.filtro.tipoFiltroReferencia.nombre,
          $isDisabled: false,
          pendingCreation: true,
        },
      ]
    : []),
]);
const tipoTemporalPropio = computed(
  () =>
    props.filtro.tipoFiltroReferencia.estado === "nuevo" &&
    tipoKey.value === props.filtro.tipoFiltroReferencia.tempId,
);
const valido = computed(() => cantidad.value > 0 && tipoKey.value !== null);
</script>

<template>
  <form
    class="grid gap-3"
    @submit.prevent="
      valido &&
      emit('save', tipoTemporalPropio ? null : Number(tipoKey), cantidad)
    "
  >
    <div class="grid gap-1.5">
      <label class="text-xs font-semibold text-gray-700">Código original</label
      ><input
        :value="filtro.filtro.codigo"
        disabled
        class="min-h-9 rounded-md border border-second-deep bg-second px-3 text-sm text-gray-600"
      />
      <p class="text-xs text-gray-600">
        {{
          filtro.filtro.estaEnListaCompras
            ? "En lista de compras"
            : "No está en lista de compras"
        }}
      </p>
    </div>
    <div class="grid gap-1.5">
      <label class="text-xs font-semibold text-gray-700">Tipo de filtro</label
      ><EquipoCatalogSelect
        v-model="tipoKey"
        :options="opciones"
        placeholder="Seleccione el tipo"
      />
      <p v-if="tipoTemporalPropio" class="text-xs text-warning">
        Tipo temporal pendiente de creación.
      </p>
      <p class="text-xs text-gray-600">
        Las opciones deshabilitadas ya están asignadas a este equipo.
      </p>
    </div>
    <div class="grid gap-1.5">
      <label class="text-xs font-semibold text-gray-700">Cantidad</label>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="min-h-10 min-w-10 cursor-pointer rounded-md border border-second-deep"
          aria-label="Disminuir cantidad"
          @click="cantidad = Math.max(1, cantidad - 1)"
        >
          −</button
        ><input
          v-model.number="cantidad"
          type="number"
          min="1"
          class="min-h-10 w-16 rounded-md border border-second-deep text-center text-sm"
        /><button
          type="button"
          class="min-h-10 min-w-10 cursor-pointer rounded-md border border-second-deep"
          aria-label="Aumentar cantidad"
          @click="cantidad += 1"
        >
          +
        </button>
      </div>
    </div>
    <button
      type="submit"
      :disabled="!valido"
      class="min-h-10 rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      :class="valido ? 'cursor-pointer' : 'cursor-not-allowed'"
    >
      Guardar cambios
    </button>
  </form>
</template>
