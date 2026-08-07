<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { CheckCircle2, Info, Minus, Plus } from "lucide-vue-next";
import EquipoTipoFiltroNuevoField from "./EquipoTipoFiltroNuevoField.vue";
import { crearTempId } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.tempIds";
import type {
  FiltroExistenteDraftReference,
  FiltroNuevoDraftReference,
  ResultadoBusquedaFiltroOriginal,
  TipoFiltroAuxiliar,
  TipoFiltroDraftReference,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
const props = defineProps<{
  mode: "nuevo" | "existente_sin_tipos";
  codigoInicial: string;
  filtroExistente?: FiltroExistenteDraftReference;
  tipos: TipoFiltroAuxiliar[];
  activeTypeNames: string[];
  isDuplicateCode: (codigo: string) => boolean;
  search: (codigo: string) => Promise<ResultadoBusquedaFiltroOriginal>;
}>();
const emit = defineEmits<{
  confirm: [
    FiltroNuevoDraftReference | FiltroExistenteDraftReference,
    TipoFiltroDraftReference,
    number,
  ];
  codeExists: [];
}>();
const codigo = shallowRef(props.codigoInicial);
const estaEnCompras = shallowRef(
  props.filtroExistente?.estaEnListaCompras ?? true,
);
const cantidad = shallowRef(1);
const tipo = shallowRef<TipoFiltroDraftReference | null>(null);
const errorTipo = shallowRef("");
const filtroTempId = shallowRef(crearTempId("filtro"));
const cantidadValida = computed(
  () => Number.isInteger(cantidad.value) && cantidad.value > 0,
);
const puedeConfirmar = computed(() =>
  Boolean(tipo.value && cantidadValida.value && codigo.value.trim()),
);
function duplicado(nombre: string): boolean {
  const clave = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim()
      .toLocaleLowerCase();
  return (
    props.tipos.some((item) => clave(item.nombre) === clave(nombre)) ||
    props.activeTypeNames.some((item) => clave(item) === clave(nombre))
  );
}
const tiposOcupadosIds = computed(() => {
  const clave = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim()
      .toLocaleLowerCase();
  return props.tipos
    .filter((item) =>
      props.activeTypeNames.some(
        (nombre) => clave(nombre) === clave(item.nombre),
      ),
    )
    .map((item) => item.id);
});
function clave(valor: string): string {
  return valor.trim().replace(/\s+/g, " ").toUpperCase();
}
async function confirmar(): Promise<void> {
  if (!tipo.value) {
    errorTipo.value = "Selecciona o crea un tipo de filtro.";
    return;
  }
  if (!cantidadValida.value) return;
  const codigoNormalizado = clave(codigo.value);
  if (props.isDuplicateCode(codigoNormalizado)) {
    errorTipo.value = "Este código ya está agregado al equipo.";
    return;
  }
  const respuesta = await props.search(codigoNormalizado);
  const existeExacto =
    respuesta.encontrado ||
    (!respuesta.encontrado &&
      respuesta.sugerencias.some(
        (sugerencia) => clave(sugerencia.codigo) === codigoNormalizado,
      ));
  if (existeExacto) {
    emit("codeExists");
    return;
  }
  const filtro =
    props.mode === "existente_sin_tipos" && props.filtroExistente
      ? props.filtroExistente
      : {
          estado: "nuevo" as const,
          id: null,
          tempId: filtroTempId.value,
          codigo: codigoNormalizado,
          estaEnListaCompras: estaEnCompras.value,
        };
  emit("confirm", filtro, tipo.value, cantidad.value);
}
</script>
<template>
  <form class="grid gap-3" @submit.prevent="confirmar">
    <div class="grid gap-1.5">
      <label class="text-xs font-semibold text-gray-700">Código original</label
      ><input
        v-model="codigo"
        :disabled="mode === 'existente_sin_tipos'"
        class="min-h-11 rounded-md border border-second-deep px-3 text-base outline-none focus:border-main sm:min-h-9 sm:text-sm disabled:bg-second"
      />
    </div>
    <EquipoTipoFiltroNuevoField
      :tipos="tipos"
      :selected="tipo"
      :disabled-type-ids="tiposOcupadosIds"
      :is-duplicate="duplicado"
      @select="tipo = $event"
      @error="errorTipo = $event"
    />
    <p v-if="errorTipo" class="text-xs text-danger" role="alert">
      {{ errorTipo }}
    </p>
    <div class="grid gap-3 sm:grid-cols-2">
      <label
        v-if="mode === 'nuevo'"
        class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-second-deep px-3 text-sm"
        ><input
          v-model="estaEnCompras"
          type="checkbox"
          class="h-4 w-4 accent-main"
        />En lista de compras</label
      >
      <p v-else class="rounded-md bg-second px-3 py-2 text-xs text-gray-700">
        <CheckCircle2 class="mr-1 inline h-3.5 w-3.5 text-success" />{{
          filtroExistente?.estaEnListaCompras
            ? "En lista de compras"
            : "Fuera de lista de compras"
        }}
      </p>
      <div class="grid gap-1">
        <label class="text-xs font-semibold text-gray-700">Cantidad</label>
        <div class="flex">
          <button
            type="button"
            class="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-l-md border border-second-deep"
            aria-label="Disminuir cantidad"
            @click="cantidad = Math.max(1, cantidad - 1)"
          >
            <Minus class="h-4 w-4" /></button
          ><input
            v-model.number="cantidad"
            min="1"
            step="1"
            type="number"
            class="min-h-11 w-14 border-y border-second-deep text-center text-sm"
          /><button
            type="button"
            class="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-r-md border border-second-deep"
            aria-label="Aumentar cantidad"
            @click="cantidad += 1"
          >
            <Plus class="h-4 w-4" />
          </button>
        </div>
        <p v-if="!cantidadValida" class="text-xs text-danger">
          La cantidad debe ser un entero mayor que cero.
        </p>
      </div>
    </div>

    <button
      type="submit"
      :disabled="!puedeConfirmar"
      class="min-h-10 rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      :class="puedeConfirmar ? 'cursor-pointer' : 'cursor-not-allowed'"
    >
      Agregar al equipo
    </button>
  </form>
</template>
