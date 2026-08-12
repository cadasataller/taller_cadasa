<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from "vue";
import { ArrowLeft, Filter, X } from "lucide-vue-next";
import EquipoFiltroBuscarForm from "./EquipoFiltroBuscarForm.vue";
import EquipoFiltroEditarForm from "./EquipoFiltroEditarForm.vue";
import EquipoFiltroNuevoForm from "./EquipoFiltroNuevoForm.vue";
import type {
  EquipoFiltroDraft,
  FiltroExistenteDraftReference,
  FiltroNuevoDraftReference,
  ResultadoBusquedaFiltroOriginal,
  TipoFiltroAuxiliar,
  TipoFiltroDraftReference,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
const props = defineProps<{
  mode: "add" | "edit";
  filtro?: EquipoFiltroDraft;
  tipos: TipoFiltroAuxiliar[];
  occupiedTypeIds: number[];
  occupiedFilterIds: number[];
  occupiedFilterCodes: string[];
  draftSuggestions: {
    id: number | null;
    codigo: string;
    estaEnListaCompras: boolean;
  }[];
  activeTypeNames: string[];
  search: (codigo: string) => Promise<ResultadoBusquedaFiltroOriginal>;
  addError?: string | null;
  pendingFilterTypeKeys: string[];
}>();
const emit = defineEmits<{
  close: [];
  add: [ResultadoBusquedaFiltroOriginal & { encontrado: true }, number, number];
  addTemporal: [
    FiltroNuevoDraftReference | FiltroExistenteDraftReference,
    TipoFiltroDraftReference,
    number,
  ];
  edit: [number | null, number];
}>();
const dirty = shallowRef(false);
const codigoExiste = shallowRef(false);
let previousOverflow = "";
type CreacionTemporal = { mode: "nuevo"; codigo: string };
const creacion = shallowRef<CreacionTemporal | null>(null);
function esCodigoDuplicado(codigo: string): boolean {
  return props.occupiedFilterCodes.some(
    (ocupado) =>
      ocupado.trim().replace(/\s+/g, " ").toUpperCase() ===
      codigo.trim().replace(/\s+/g, " ").toUpperCase(),
  );
}
function close(): void {
  if (
    !dirty.value ||
    window.confirm("Se perderán los cambios escritos. ¿Continuar?")
  ) {
    codigoExiste.value = false;
    emit("close");
  }
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") close();
}
onMounted(() => {
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow;
  window.removeEventListener("keydown", onKeydown);
});
</script>
<template>
  <Teleport to="body"
    ><div class="fixed inset-0 z-50 bg-main-dark/40" @click.self="close">
      <aside
        class="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-lg bg-white shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[30rem] sm:rounded-none"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="
          mode === 'add' ? 'agregar-filtro-title' : 'editar-filtro-title'
        "
      >
        <header
          class="flex items-start justify-between gap-3 border-b border-second-deep p-4"
        >
          <div v-if="creacion" class="flex min-w-0 items-center gap-2">
            <button
              type="button"
              class="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1 rounded-md px-1 text-xs font-semibold text-main hover:bg-second"
              aria-label="Volver a búsqueda"
              @click="creacion = null"
            >
              <ArrowLeft class="h-4 w-4" />
              Volver
            </button>
            <span class="h-8 w-px shrink-0 bg-second-deep" aria-hidden="true" />
            <Filter class="h-5 w-5 shrink-0 text-main" />
            <div class="min-w-0">
              <h2
                id="agregar-filtro-title"
                class="text-base font-bold text-gray-900"
              >
                Crear filtro nuevo
              </h2>
            </div>
          </div>
          <div v-else>
            <h2
              :id="
                mode === 'add' ? 'agregar-filtro-title' : 'editar-filtro-title'
              "
              class="text-base font-bold text-gray-900"
            >
              {{ mode === "add" ? "Agregar filtro" : "Editar filtro" }}
            </h2>
            <p class="text-xs text-gray-600">
              {{
                mode === "add"
                  ? "Busque un filtro existente por código original."
                  : "Modifique el tipo y la cantidad de la asignación."
              }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-md text-gray-700 hover:bg-second"
            aria-label="Cerrar"
            @click="close"
          >
            <X class="h-4 w-4" />
          </button>
        </header>
        <div class="flex-1 overflow-y-auto p-4">
          <EquipoFiltroNuevoForm
            v-if="creacion"
            mode="nuevo"
            :codigo-inicial="creacion.codigo"
            :tipos="tipos"
            :active-type-names="activeTypeNames"
            :is-duplicate-code="esCodigoDuplicado"
            :search="search"
            @code-exists="codigoExiste = true"
            @confirm="
              (filtro, tipo, cantidad) =>
                emit('addTemporal', filtro, tipo, cantidad)
            "
          /><EquipoFiltroBuscarForm
            v-else-if="mode === 'add'"
            :tipos="tipos"
            :active-type-names="activeTypeNames"
            :occupied-type-ids="occupiedTypeIds"
            :occupied-filter-ids="occupiedFilterIds"
            :occupied-filter-codes="occupiedFilterCodes"
            :draft-suggestions="draftSuggestions"
            :search="search"
            :add-error="addError"
            :pending-filter-type-keys="pendingFilterTypeKeys"
            @add="
              (resultado, cantidad, tipoId) =>
                emit('add', resultado, cantidad, tipoId)
            "
            @add-temporal="
              (filtro, tipo, cantidad) =>
                emit('addTemporal', filtro, tipo, cantidad)
            "
            @create-new="(codigo) => (creacion = { mode: 'nuevo', codigo })"
          /><EquipoFiltroEditarForm
            v-else-if="filtro"
            :filtro="filtro"
            :tipos="tipos"
            :occupied-type-ids="occupiedTypeIds"
            @save="(tipo, cantidad) => emit('edit', tipo, cantidad)"
          />
        </div>
        <div
          v-if="codigoExiste"
          class="absolute inset-0 z-10 grid place-items-center bg-main-dark/30 p-4"
        >
          <section
            class="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="codigo-existe-title"
          >
            <h3
              id="codigo-existe-title"
              class="text-base font-bold text-gray-900"
            >
              El código ya existe
            </h3>
            <p class="mt-1 text-sm text-gray-600">
              No se puede registrar un filtro con un código existente.
            </p>
            <button
              type="button"
              class="mt-4 min-h-10 w-full cursor-pointer rounded-md bg-main px-3 text-xs font-semibold text-white"
              @click="codigoExiste = false"
            >
              OK
            </button>
          </section>
        </div>
      </aside>
    </div></Teleport
  >
</template>
