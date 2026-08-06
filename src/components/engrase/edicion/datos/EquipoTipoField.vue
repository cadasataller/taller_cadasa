<script setup lang="ts">
import { computed } from "vue";
import { Plus } from "lucide-vue-next";
import EquipoCatalogSelect from "../seleccion/EquipoCatalogSelect.vue";
import type {
  TipoEquipoAuxiliar,
  TipoEquipoDraftReference,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
import type { EquipoMultiselectOption } from "../seleccion/equipoMultiselect.types";
const props = defineProps<{
  tipos: TipoEquipoAuxiliar[];
  selected: TipoEquipoDraftReference;
  invalid?: boolean;
}>();
const emit = defineEmits<{ select: [TipoEquipoDraftReference]; openNew: [] }>();
const options = computed<EquipoMultiselectOption[]>(() =>
  props.tipos
    .map((tipo) => ({
      key: String(tipo.id),
      label: tipo.nombre,
      $isDisabled: false,
      pendingCreation: false,
    }))
    .concat(
      props.selected.estado === "nuevo"
        ? [
            {
              key: props.selected.tempId,
              label: `${props.selected.nombre} · Pendiente de creación`,
              $isDisabled: false,
              pendingCreation: true,
            },
          ]
        : [],
    ),
);
const selectedKey = computed({
  get: () =>
    props.selected.estado === "existente"
      ? String(props.selected.id)
      : props.selected.tempId,
  set: (key: string | null) => {
    const tipo = props.tipos.find((item) => String(item.id) === key);
    if (tipo)
      emit("select", {
        estado: "existente",
        id: tipo.id,
        nombre: tipo.nombre,
        tempId: null,
      });
  },
});
</script>
<template>
  <div class="grid gap-1.5">
    <label class="text-xs font-semibold text-gray-700">Tipo de equipo</label>
    <div class="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
      <div class="min-w-0">
        <EquipoCatalogSelect
          v-model="selectedKey"
          :options="options"
          placeholder="Selecciona un tipo"
          :invalid="invalid"
        />
      </div>
      <button
        type="button"
        class="inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-md border border-main px-3 text-xs font-semibold text-main"
        @click="emit('openNew')"
      >
        <Plus class="h-4 w-4" aria-hidden="true" /><span class="ml-1"
          >Crear tipo</span
        >
      </button>
    </div>
    <p v-if="invalid" class="text-xs text-danger" role="alert">
      Selecciona un tipo de equipo.
    </p>
  </div>
</template>
