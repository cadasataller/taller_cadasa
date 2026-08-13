<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { Cog, Droplet, Info, Plus } from "lucide-vue-next";
import EquipoCatalogSelect from "@/components/engrase/edicion/seleccion/EquipoCatalogSelect.vue";
import type { EquipoMultiselectOption } from "@/components/engrase/edicion/seleccion/equipoMultiselect.types";
import type {
  CatalogoDraftReference,
  CrearEquipoAceiteDraft,
  CrearEquipoAceiteEditorState,
} from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";

const props = defineProps<{
  mode: Exclude<CrearEquipoAceiteEditorState, { kind: "closed" }>;
  asociacion?: CrearEquipoAceiteDraft;
  sistemas: CatalogoDraftReference[];
  aceites: CatalogoDraftReference[];
  crearSistema: (nombre: string) => CatalogoDraftReference | null;
  crearAceite: (nombre: string) => CatalogoDraftReference | null;
  hasSystemConflict: (sistema: CatalogoDraftReference) => boolean;
  error: string | null;
}>();
const emit = defineEmits<{
  confirm: [CatalogoDraftReference, CatalogoDraftReference];
  changed: [];
}>();

const sistema = shallowRef<CatalogoDraftReference | null>(
  props.asociacion?.sistema ?? null,
);
const aceite = shallowRef<CatalogoDraftReference | null>(
  props.asociacion?.aceite ?? null,
);
const sistemasCreados = shallowRef<CatalogoDraftReference[]>([]);
const aceitesCreados = shallowRef<CatalogoDraftReference[]>([]);

const keyOf = (referencia: CatalogoDraftReference): string =>
  referencia.estado === "existente"
    ? `existente-${referencia.id}`
    : `nuevo-${referencia.tempId}`;
const referenciasSistema = computed(() => [
  ...props.sistemas,
  ...sistemasCreados.value,
]);
const referenciasAceite = computed(() => [
  ...props.aceites,
  ...aceitesCreados.value,
]);
const crearOpciones = (
  referencias: CatalogoDraftReference[],
  tipo: "sistema" | "aceite",
): EquipoMultiselectOption[] =>
  referencias.map((referencia) => ({
    key: keyOf(referencia),
    label: referencia.nombre,
    $isDisabled: tipo === "sistema" && props.hasSystemConflict(referencia),
    pendingCreation: referencia.estado === "nuevo",
  }));
const opcionesSistema = computed(() => crearOpciones(referenciasSistema.value, "sistema"));
const opcionesAceite = computed(() => crearOpciones(referenciasAceite.value, "aceite"));
const sistemaKey = computed<string | null>({
  get: () => (sistema.value ? keyOf(sistema.value) : null),
  set: (key) => {
    sistema.value = referenciasSistema.value.find((item) => keyOf(item) === key) ?? null;
    emit("changed");
  },
});
const aceiteKey = computed<string | null>({
  get: () => (aceite.value ? keyOf(aceite.value) : null),
  set: (key) => {
    aceite.value = referenciasAceite.value.find((item) => keyOf(item) === key) ?? null;
    emit("changed");
  },
});
const puedeConfirmar = computed(() => Boolean(sistema.value && aceite.value));

function crearTemporal(nombre: string, tipo: "sistema" | "aceite"): void {
  const referencia = tipo === "sistema"
    ? props.crearSistema(nombre)
    : props.crearAceite(nombre);
  if (!referencia) return;
  if (tipo === "sistema") {
    if (!referenciasSistema.value.some((item) => keyOf(item) === keyOf(referencia)))
      sistemasCreados.value = [...sistemasCreados.value, referencia];
    sistema.value = referencia;
  } else {
    if (!referenciasAceite.value.some((item) => keyOf(item) === keyOf(referencia)))
      aceitesCreados.value = [...aceitesCreados.value, referencia];
    aceite.value = referencia;
  }
  emit("changed");
}

function confirmar(): void {
  if (!sistema.value || !aceite.value) return;
  emit("confirm", sistema.value, aceite.value);
}
</script>

<template>
  <form class="grid gap-3" @submit.prevent="confirmar">
    <div class="grid gap-2">
      <label for="crear-sistema-aceite" class="text-xs font-semibold text-gray-700">Sistema</label>
      <div class="flex items-center gap-2">
        <Cog class="h-4 w-4 shrink-0 text-main" aria-hidden="true" />
        <EquipoCatalogSelect
          id="crear-sistema-aceite"
          v-model="sistemaKey"
          class="min-w-0 flex-1"
          :options="opcionesSistema"
          placeholder="Selecciona o crea un sistema"
          :taggable="true"
          :invalid="Boolean(error) && !sistema"
          @tag="crearTemporal($event, 'sistema')"
        />
      </div>
      <p v-if="sistema?.estado === 'nuevo'" class="inline-flex w-fit items-center gap-1 rounded bg-info-bg px-2 py-1 text-xs font-semibold text-info">
        <Plus class="h-3.5 w-3.5" aria-hidden="true" />Pendiente de creación
      </p>
    </div>
    <div class="grid gap-2">
      <label for="crear-aceite-equipo" class="text-xs font-semibold text-gray-700">Aceite</label>
      <div class="flex items-center gap-2">
        <Droplet class="h-4 w-4 shrink-0 text-main" aria-hidden="true" />
        <EquipoCatalogSelect
          id="crear-aceite-equipo"
          v-model="aceiteKey"
          class="min-w-0 flex-1"
          :options="opcionesAceite"
          placeholder="Selecciona o crea un aceite"
          :taggable="true"
          :invalid="Boolean(error) && !aceite"
          @tag="crearTemporal($event, 'aceite')"
        />
      </div>
      <p v-if="aceite?.estado === 'nuevo'" class="inline-flex w-fit items-center gap-1 rounded bg-info-bg px-2 py-1 text-xs font-semibold text-info">
        <Plus class="h-3.5 w-3.5" aria-hidden="true" />Pendiente de creación
      </p>
    </div>
    <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>
    <p class="flex items-start gap-1.5 rounded-md bg-info-bg px-2.5 py-2 text-xs text-info">
      <Info class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />La asociación se creará junto con el equipo.
    </p>
    <button
      type="submit"
      :disabled="!puedeConfirmar"
      class="min-h-10 rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      :class="puedeConfirmar ? 'cursor-pointer hover:bg-main-light' : 'cursor-not-allowed'"
    >
      {{ mode.kind === "add" ? "Agregar" : "Guardar cambios" }}
    </button>
  </form>
</template>
