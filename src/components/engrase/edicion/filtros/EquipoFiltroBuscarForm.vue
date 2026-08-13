<script setup lang="ts">
import { computed, shallowRef } from "vue";
import {
  AlertTriangle,
  CheckCircle2,
  Minus,
  Plus,
  Search,
  Undo2,
} from "lucide-vue-next";
import EquipoTipoFiltroNuevoField from "./EquipoTipoFiltroNuevoField.vue";
import { obtenerIconoTipoFiltro } from "@/utils/filtrosEngraseIconos";
import type {
  FiltroExistenteDraftReference,
  FiltroNuevoDraftReference,
  ResultadoBusquedaFiltroOriginal,
  TipoFiltroAuxiliar,
  TipoFiltroDraftReference,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";

type SugerenciaBorrador = {
  id: number | null;
  codigo: string;
  estaEnListaCompras: boolean;
};

const props = defineProps<{
  tipos: TipoFiltroAuxiliar[];
  activeTypeNames: string[];
  occupiedTypeIds: number[];
  occupiedFilterIds: number[];
  occupiedFilterCodes: string[];
  assignedTypeCodes: Record<number, string>;
  draftSuggestions: SugerenciaBorrador[];
  search: (codigo: string) => Promise<ResultadoBusquedaFiltroOriginal>;
  addError?: string | null;
  pendingFilterTypeKeys: string[];
}>();
const emit = defineEmits<{
  add: [ResultadoBusquedaFiltroOriginal & { encontrado: true }, number, number];
  addTemporal: [
    FiltroExistenteDraftReference,
    TipoFiltroDraftReference,
    number,
  ];
  createNew: [string];
}>();

const codigo = shallowRef("");
const resultado = shallowRef<ResultadoBusquedaFiltroOriginal | null>(null);
const loading = shallowRef(false);
const error = shallowRef("");
const errorTipo = shallowRef("");
const tipo = shallowRef<TipoFiltroDraftReference | null>(null);
const cantidad = shallowRef(1);
const clave = (valor: string): string =>
  valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase();
const sugeridos = computed(() =>
  resultado.value?.encontrado
    ? resultado.value.tiposPosibles.map((item) => item.tipoFiltro.id)
    : [],
);
const nombresSugeridos = computed(() =>
  resultado.value?.encontrado
    ? resultado.value.tiposPosibles.map((item) => item.tipoFiltro.nombre)
    : [],
);
const sugerenciasVisibles = computed(() => {
  if (!resultado.value || resultado.value.encontrado) return [];
  const consulta = clave(resultado.value.codigoBuscado || codigo.value);
  const desdeRpc = resultado.value.sugerencias.map((sugerencia) => ({
    ...sugerencia,
    enUso: sugerenciaYaAgregada(sugerencia),
  }));
  const desdeBorrador = props.draftSuggestions
    .filter((sugerencia) => clave(sugerencia.codigo).includes(consulta))
    .map((sugerencia) => ({ ...sugerencia, enUso: true }));
  return [...desdeRpc, ...desdeBorrador].filter(
    (sugerencia, indice, lista) =>
      lista.findIndex(
        (candidato) => clave(candidato.codigo) === clave(sugerencia.codigo),
      ) === indice,
  );
});
const tipoConContexto = computed(() =>
  tipo.value?.estado === "existente"
    ? props.tipos.find((item) => item.id === tipo.value?.id)
    : undefined,
);
const puedeAgregar = computed(() =>
  Boolean(resultado.value?.encontrado && tipo.value && cantidad.value > 0),
);
const codigoEnUso = computed(() =>
  props.occupiedFilterCodes.some(
    (codigoOcupado) => clave(codigoOcupado) === clave(resultado.value?.encontrado
      ? resultado.value.filtro.codigo
      : codigo.value),
  ),
);
const seRestaurara = computed(() =>
  Boolean(
    resultado.value?.encontrado &&
    tipo.value?.estado === "existente" &&
    props.pendingFilterTypeKeys.includes(
      `${resultado.value.filtro.id}:${tipo.value.id}`,
    ),
  ),
);

function esTipoDuplicado(nombre: string): boolean {
  return props.activeTypeNames.some((item) => clave(item) === clave(nombre));
}
function sugerenciaYaAgregada(sugerencia: {
  id: number;
  codigo: string;
}): boolean {
  return (
    props.occupiedFilterIds.includes(sugerencia.id) ||
    props.occupiedFilterCodes.some(
      (codigoOcupado) => clave(codigoOcupado) === clave(sugerencia.codigo),
    )
  );
}
function crearNuevo(): void {
  if (
    props.occupiedFilterCodes.some(
      (codigoOcupado) => clave(codigoOcupado) === clave(codigo.value),
    )
  ) {
    error.value = "Este código ya está agregado al equipo.";
    return;
  }
  emit("createNew", codigo.value);
}
async function buscarPorCodigo(codigoParaBuscar: string): Promise<void> {
  const valor = codigoParaBuscar.trim().replace(/\s+/g, " ").toUpperCase();
  if (!valor) {
    error.value = "Ingrese un código original válido.";
    return;
  }
  codigo.value = valor;
  loading.value = true;
  error.value = "";
  errorTipo.value = "";
  resultado.value = null;
  tipo.value = null;
  try {
    const respuesta = await props.search(valor);
    resultado.value = respuesta;
  } catch (fallo) {
    error.value =
      fallo instanceof Error ? fallo.message : "No se pudo buscar el filtro.";
  } finally {
    loading.value = false;
  }
}
function buscar(): Promise<void> {
  return buscarPorCodigo(codigo.value);
}
function agregar(): void {
  if (!resultado.value?.encontrado || !tipo.value || cantidad.value < 1) return;
  if (tipo.value.estado === "existente") {
    emit("add", resultado.value, cantidad.value, tipo.value.id);
    return;
  }
  emit(
    "addTemporal",
    {
      estado: "existente",
      id: resultado.value.filtro.id,
      tempId: null,
      codigo: resultado.value.filtro.codigo,
      estaEnListaCompras: resultado.value.filtro.estaEnListaCompras,
    },
    tipo.value,
    cantidad.value,
  );
}
</script>

<template>
  <form class="grid gap-3" @submit.prevent="buscar">
    <div class="grid gap-1.5">
      <label for="filtro-codigo" class="text-xs font-semibold text-gray-700"
        >Código original</label
      >
      <div class="flex gap-2">
        <input
          id="filtro-codigo"
          v-model="codigo"
          class="min-h-11 min-w-0 flex-1 rounded-md border border-second-deep px-3 text-base outline-none focus:border-main focus:ring-2 focus:ring-accent/30 sm:min-h-9 sm:text-sm"
          placeholder="Ej. LFP3191"
        />
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search class="h-4 w-4" />Buscar
        </button>
      </div>
    </div>
    <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>

    <template v-if="resultado?.encontrado">
      <section
        class="grid gap-3 rounded-md border border-second-deep bg-white p-3 shadow-sm"
      >
        <header class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-second-deep bg-second text-main"
            >
              <component
                :is="
                  obtenerIconoTipoFiltro(tipoConContexto?.nombre ?? '').icono
                "
                class="h-5 w-5"
                aria-hidden="true"
              />
            </div>
            <div class="min-w-0">
              <p class="font-mono text-base font-bold text-main">
                {{ resultado.filtro.codigo }}
              </p>
              <p class="truncate text-sm text-gray-700">
                {{ tipoConContexto?.nombre ?? "Seleccione el tipo de filtro" }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1">
            <span
              v-if="codigoEnUso"
              class="rounded bg-info-bg px-2 py-1 text-xs font-semibold text-info"
            >EN USO</span>
            <span
              class="inline-flex items-center gap-1 rounded bg-success-bg px-2 py-1 text-xs font-semibold text-success"
              ><CheckCircle2 class="h-3.5 w-3.5" aria-hidden="true" />{{
                resultado.filtro.estaEnListaCompras
                  ? "EN LISTA DE COMPRAS"
                  : "FUERA DE LISTA"
              }}</span
            >
          </div>
        </header>
        <EquipoTipoFiltroNuevoField
          :tipos="tipos"
          :selected="tipo"
          :disabled-type-ids="occupiedTypeIds"
          :assigned-type-codes="assignedTypeCodes"
          :searched-code="resultado.filtro.codigo"
          :suggested-type-ids="sugeridos"
          :suggested-type-names="nombresSugeridos"
          :is-duplicate="esTipoDuplicado"
          @select="tipo = $event"
          @error="errorTipo = $event"
        />
        <p v-if="errorTipo" class="text-xs text-danger" role="alert">
          {{ errorTipo }}
        </p>
        <div class="grid gap-1">
          <span class="text-xs font-semibold text-gray-700">Cantidad</span>
          <div class="flex items-center">
            <button
              type="button"
              class="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-l-md border border-second-deep text-main hover:bg-second"
              aria-label="Disminuir cantidad"
              @click="cantidad = Math.max(1, cantidad - 1)"
            >
              <Minus class="h-3.5 w-3.5" /></button
            ><input
              v-model.number="cantidad"
              min="1"
              type="number"
              class="min-h-9 w-12 border-y border-second-deep text-center text-sm outline-none focus:bg-second"
            /><button
              type="button"
              class="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-r-md border border-second-deep text-main hover:bg-second"
              aria-label="Aumentar cantidad"
              @click="cantidad += 1"
            >
              <Plus class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <p
          v-if="seRestaurara"
          class="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning-bg px-2 py-1.5 text-xs text-warning"
          role="status"
        >
          <Undo2 class="h-3.5 w-3.5" aria-hidden="true" />Este filtro está
          pendiente de eliminación. Al confirmar, se restaurará.
        </p>
        <p
          v-if="props.addError"
          class="rounded-md bg-danger-bg px-2 py-1.5 text-xs text-danger"
          role="alert"
        >
          {{ props.addError }}
        </p>
        <button
          type="button"
          :disabled="!puedeAgregar"
          class="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          :class="
            puedeAgregar
              ? seRestaurara
                ? 'cursor-pointer bg-warning hover:bg-warning/90'
                : 'cursor-pointer bg-main hover:bg-main-light'
              : 'cursor-not-allowed bg-main'
          "
          @click="agregar"
        >
          <Undo2 v-if="seRestaurara" class="h-3.5 w-3.5" aria-hidden="true" />{{
            seRestaurara ? "Restaurar filtro" : "Agregar al equipo"
          }}
        </button>
      </section>
    </template>
    <section
      v-else-if="resultado && !resultado.encontrado"
      class="grid gap-2 rounded-md border border-warning/30 bg-warning-bg p-3"
    >
      <AlertTriangle class="h-4 w-4 text-warning" />
      <div>
        <p class="text-sm font-semibold text-gray-900">
          No encontramos una coincidencia exacta para
          {{ resultado.codigoBuscado || codigo }}
        </p>
        <p class="text-xs text-gray-600">
          Seleccione una sugerencia para consultar sus tipos o cree un filtro
          nuevo.
        </p>
      </div>
      <div
        v-if="sugerenciasVisibles.length"
        class="grid gap-1"
        aria-label="Sugerencias de códigos originales"
      >
        <p class="text-xs font-semibold text-gray-700">Códigos sugeridos</p>
        <button
          v-for="sugerencia in sugerenciasVisibles"
          :key="sugerencia.id ?? `borrador_${sugerencia.codigo}`"
          type="button"
          :disabled="loading"
          class="flex min-h-10 cursor-pointer items-center justify-between rounded-md border border-warning/30 bg-white px-3 text-left text-sm hover:border-main disabled:cursor-not-allowed disabled:opacity-50"
          @click="buscarPorCodigo(sugerencia.codigo)"
        >
          <span class="font-mono font-semibold text-main">{{
            sugerencia.codigo
          }}</span
          ><span class="text-xs text-gray-600">{{
            sugerencia.enUso
              ? "En uso"
              : sugerencia.estaEnListaCompras
                ? "En lista de compras"
                : "Fuera de lista"
          }}</span>
        </button>
      </div>
      <button
        v-if="resultado.puedeCrearse"
        type="button"
        class="min-h-9 w-fit cursor-pointer rounded-md border border-warning/30 px-3 text-xs font-semibold text-warning"
        @click="crearNuevo"
      >
        Crear filtro nuevo
      </button>
    </section>
  </form>
</template>
