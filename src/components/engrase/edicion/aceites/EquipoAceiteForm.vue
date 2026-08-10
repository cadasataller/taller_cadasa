<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { Cog, Droplet, Info, Plus } from "lucide-vue-next";
import EquipoCatalogSelect from "@/components/engrase/edicion/seleccion/EquipoCatalogSelect.vue";
import { crearTempId } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.tempIds";
import type {
  CatalogoAceiteDraftReference,
  CatalogoIdNombre,
  EquipoAceiteDraft,
  EquipoAceiteFormMode,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
import type { EquipoMultiselectOption } from "@/components/engrase/edicion/seleccion/equipoMultiselect.types";

const props = defineProps<{
  mode: EquipoAceiteFormMode;
  aceite?: EquipoAceiteDraft;
  sistemas: CatalogoIdNombre[];
  aceites: CatalogoIdNombre[];
  hasSystemConflict: (sistema: CatalogoAceiteDraftReference) => boolean;
}>();
const emit = defineEmits<{
  confirm: [CatalogoAceiteDraftReference, CatalogoAceiteDraftReference];
  changed: [];
}>();
const sistema = shallowRef<CatalogoAceiteDraftReference | null>(
  props.aceite?.sistemaReferencia ?? null,
);
const aceite = shallowRef<CatalogoAceiteDraftReference | null>(
  props.aceite?.aceiteReferencia ?? null,
);
const sistemasTemporales = shallowRef<CatalogoAceiteDraftReference[]>([]);
const aceitesTemporales = shallowRef<CatalogoAceiteDraftReference[]>([]);
const error = shallowRef("");
const normalizar = (valor: string): string => valor.trim().replace(/\s+/g, " ");
const clave = (valor: string): string =>
  normalizar(valor)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
const keyOf = (referencia: CatalogoAceiteDraftReference): string =>
  referencia.estado === "existente"
    ? `existente-${referencia.id}`
    : `nuevo-${referencia.tempId}`;
const referenciasSistema = computed<CatalogoAceiteDraftReference[]>(() => [
  ...props.sistemas.map((item) => ({
    ...item,
    estado: "existente" as const,
    tempId: null,
  })),
  ...sistemasTemporales.value,
]);
const referenciasAceite = computed<CatalogoAceiteDraftReference[]>(() => [
  ...props.aceites.map((item) => ({
    ...item,
    estado: "existente" as const,
    tempId: null,
  })),
  ...aceitesTemporales.value,
]);
const opcionesSistema = computed<EquipoMultiselectOption[]>(() =>
  referenciasSistema.value.map((item) => ({
    key: keyOf(item),
    label: item.nombre,
    $isDisabled: false,
    pendingCreation: item.estado === "nuevo",
  })),
);
const opcionesAceite = computed<EquipoMultiselectOption[]>(() =>
  referenciasAceite.value.map((item) => ({
    key: keyOf(item),
    label: item.nombre,
    $isDisabled: false,
    pendingCreation: item.estado === "nuevo",
  })),
);
const sistemaKey = computed({
  get: () => (sistema.value ? keyOf(sistema.value) : null),
  set: (key: string | null) => {
    sistema.value =
      referenciasSistema.value.find((item) => keyOf(item) === key) ?? null;
    error.value = "";
  },
});
const aceiteKey = computed({
  get: () => (aceite.value ? keyOf(aceite.value) : null),
  set: (key: string | null) => {
    aceite.value =
      referenciasAceite.value.find((item) => keyOf(item) === key) ?? null;
    error.value = "";
  },
});
const puedeConfirmar = computed(() => Boolean(sistema.value && aceite.value));
function crearTemporal(nombre: string, tipo: "sistema" | "aceite"): void {
  const normalizado = normalizar(nombre);
  const destino = tipo === "sistema" ? sistemasTemporales : aceitesTemporales;
  const existentes =
    tipo === "sistema" ? referenciasSistema : referenciasAceite;
  const etiqueta = tipo === "sistema" ? "sistema" : "aceite";
  if (!normalizado) {
    error.value = `Ingresa un nombre para crear el ${etiqueta}.`;
    return;
  }
  const existente = existentes.value.find(
    (item) => clave(item.nombre) === clave(normalizado),
  );
  if (existente) {
    if (tipo === "sistema") sistema.value = existente;
    else aceite.value = existente;
    error.value = "";
    return;
  }
  const nuevo: CatalogoAceiteDraftReference = {
    estado: "nuevo",
    id: null,
    tempId: crearTempId(tipo === "sistema" ? "sistema_aceite" : "aceite"),
    nombre: normalizado,
  };
  destino.value = [...destino.value, nuevo];
  if (tipo === "sistema") sistema.value = nuevo;
  else aceite.value = nuevo;
  error.value = "";
}
function confirmar(): void {
  if (!sistema.value) {
    error.value = "Selecciona o crea un sistema.";
    return;
  }
  if (!aceite.value) {
    error.value = "Selecciona o crea un aceite.";
    return;
  }
  if (props.hasSystemConflict(sistema.value)) {
    error.value = "Este equipo ya tiene un aceite asociado a ese sistema.";
    return;
  }
  emit("confirm", sistema.value, aceite.value);
}
</script>

<template>
  <form
    class="grid gap-3"
    @input="emit('changed')"
    @change="emit('changed')"
    @submit.prevent="confirmar"
  >
    <div class="grid gap-2">
      <label class="text-xs font-semibold text-gray-700" for="sistema-aceite"
        >Sistema</label
      >
      <div class="flex items-center gap-2">
        <Cog class="h-4 w-4 shrink-0 text-main" /><EquipoCatalogSelect
          id="sistema-aceite"
          v-model="sistemaKey"
          class="min-w-0 flex-1"
          :options="opcionesSistema"
          placeholder="Selecciona o crea un sistema"
          :taggable="true"
          :invalid="Boolean(error) && !sistema"
          @tag="crearTemporal($event, 'sistema')"
        />
      </div>
      <p
        v-if="sistema?.estado === 'nuevo'"
        class="inline-flex w-fit items-center gap-1 rounded bg-info-bg px-2 py-1 text-xs font-semibold text-info"
      >
        <Plus class="h-3.5 w-3.5" />Pendiente de creación
      </p>
    </div>
    <div class="grid gap-2">
      <label class="text-xs font-semibold text-gray-700" for="aceite-equipo"
        >Aceite</label
      >
      <div class="flex items-center gap-2">
        <Droplet class="h-4 w-4 shrink-0 text-main" /><EquipoCatalogSelect
          id="aceite-equipo"
          v-model="aceiteKey"
          class="min-w-0 flex-1"
          :options="opcionesAceite"
          placeholder="Selecciona o crea un aceite"
          :taggable="true"
          :invalid="Boolean(error) && !aceite"
          @tag="crearTemporal($event, 'aceite')"
        />
      </div>
      <p
        v-if="aceite?.estado === 'nuevo'"
        class="inline-flex w-fit items-center gap-1 rounded bg-info-bg px-2 py-1 text-xs font-semibold text-info"
      >
        <Plus class="h-3.5 w-3.5" />Pendiente de creación
      </p>
    </div>
    <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>
    <p
      class="flex items-start gap-1.5 rounded-md bg-info-bg px-2.5 py-2 text-xs text-info"
    >
      <Info class="mt-0.5 h-3.5 w-3.5 shrink-0" />La asociación se aplicará al
      guardar los cambios del equipo.
    </p>
    <button
      type="submit"
      :disabled="!puedeConfirmar"
      class="min-h-10 rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      :class="puedeConfirmar ? 'cursor-pointer' : 'cursor-not-allowed'"
    >
      {{ mode.kind === "add" ? "Agregar" : "Guardar cambios" }}
    </button>
  </form>
</template>
