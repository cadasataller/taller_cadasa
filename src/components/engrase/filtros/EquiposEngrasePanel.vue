<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { ArrowLeft, ChevronDown, ChevronUp, CirclePlus, Eraser, LibraryBig } from "lucide-vue-next";
import EquipoEngraseListItem from "./EquipoEngraseListItem.vue";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import type {
  EquipoEngraseListItem as EquipoItem,
  FiltrosEngraseQuery,
} from "@/stores/dbequipos/engrase/filtrosEngrase.types";
const props = defineProps<{
  equipos: EquipoItem[];
  selectedEquipoId: number | null;
  filters: FiltrosEngraseQuery;
  countsByTipo: [string, number][];
  loading: boolean;
  error: string | null;
  resetSignal: number;
}>();
const emit = defineEmits<{
  selectEquipo: [number];
  imageVisible: [number];
  retry: [];
  filterTipo: [number | null];
  filterModelo: [string];
  clearTipoModelo: [];
  openCatalogo: [];
}>();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const canEditFiltrosEngrase = computed(() =>
  isFeatureAccessLoaded.value
  && featureAccessStore.tieneFuncionalidad("editar_filtros_engrase"),
);
const search = shallowRef(""),
  showCounts = shallowRef(false),
  showEquipoMenu = shallowRef(false);
const visible = computed(() => {
  const q = search.value.toLowerCase();
  return props.equipos.filter(
    (x) =>
      !q ||
      [x.codigo, x.tipo_equipo, x.subtipo ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      ),
  );
});
const tiposOrdenados = computed(() =>
  Object.entries(visible.value.reduce<Record<string, number>>((counts, equipo) => {
    counts[equipo.tipo_equipo] = (counts[equipo.tipo_equipo] ?? 0) + 1;
    return counts;
  }, {})).sort(([a], [b]) => a.localeCompare(b)),
);
const selectedTipoId = computed(() => props.filters.tipoEquipoId);
const selectedTipoNombre = computed(
  () =>
    visible.value.find((equipo) => equipo.tipo_equipo_id === selectedTipoId.value)
      ?.tipo_equipo ?? "",
);
const selectedModelo = computed(() => props.filters.modelo);
const hayFiltrosDeChipsActivos = computed(
  () => selectedTipoId.value !== null || Boolean(selectedModelo.value),
);
const hayFiltrosLocalesActivos = computed(
  () => Boolean(search.value) || hayFiltrosDeChipsActivos.value,
);
const tipoActivoId = computed(() =>
  selectedTipoId.value ?? (tiposOrdenados.value.length === 1
    ? visible.value[0]?.tipo_equipo_id ?? null
    : null),
);
const mostrarModelos = computed(() => tipoActivoId.value !== null);
const modelosVisibles = computed(() =>
  Object.entries(
    visible.value
      .filter((x) => x.tipo_equipo_id === tipoActivoId.value)
      .reduce<Record<string, number>>((a, x) => {
        const model = x.subtipo?.trim() || "Sin modelo";
        a[model] = (a[model] ?? 0) + 1;
        return a;
      }, {}),
  ).sort(([a], [b]) => a.localeCompare(b)),
);
const modelos = modelosVisibles;
const etiquetaCantidad = computed(() =>
  selectedTipoId.value === null
    ? "Cantidad por tipo de equipo"
    : ["Cantidad", selectedTipoNombre.value, selectedModelo.value]
        .filter(Boolean)
        .join(" · "),
);
watch(() => props.resetSignal, () => {
  search.value = "";
  showCounts.value = false;
});
function seleccionarTipo(id: number) {
  emit("filterTipo", id);
}
function seleccionarModelo(modelo: string) {
  emit("filterModelo", modelo === "Sin modelo" ? "" : modelo);
}
function volverTipos() {
  emit("clearTipoModelo");
}
function limpiarFiltros() {
  volverTipos();
}
function limpiarBusquedaYFiltros() {
  search.value = "";
  volverTipos();
}
function cerrarChips() {
  showCounts.value = false;
}
function alternarMenuEquipo() {
  showEquipoMenu.value = !showEquipoMenu.value;
}
function cerrarMenuEquipo() {
  showEquipoMenu.value = false;
}
function abrirCatalogo() {
  cerrarMenuEquipo();
  emit("openCatalogo");
}
</script>
<template>
  <section
    class="flex min-h-0 flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
  >
    <header class="flex shrink-0 items-center justify-between gap-2">
      <h2 class="text-sm font-bold text-main">
        Equipos
        <span class="font-normal text-gray-500">({{ equipos.length }})</span>
      </h2>
      <div
        v-if="canEditFiltrosEngrase"
        class="relative"
        @keydown.esc="cerrarMenuEquipo"
      >
        <button
          id="menu-equipos-trigger"
          type="button"
          class="flex cursor-pointer items-center rounded bg-main/10 p-1 text-main transition-colors hover:bg-main/20"
          aria-label="Abrir acciones de equipos"
          aria-haspopup="menu"
          :aria-expanded="showEquipoMenu"
          aria-controls="menu-equipos"
          @click="alternarMenuEquipo"
        >
          <ChevronDown
            class="h-4 w-4 transition-transform"
            :class="{ 'rotate-180': showEquipoMenu }"
          />
        </button>
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="-translate-y-1 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="-translate-y-1 opacity-0"
        >
          <div
            v-if="showEquipoMenu"
            id="menu-equipos"
            class="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            role="menu"
            aria-labelledby="menu-equipos-trigger"
          >
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-700 transition-colors hover:bg-main/5 hover:text-main"
              role="menuitem"
              @click="cerrarMenuEquipo"
            >
              <CirclePlus class="h-4 w-4" aria-hidden="true" />
              Agregar Equipo
            </button>
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-700 transition-colors hover:bg-main/5 hover:text-main"
              role="menuitem"
              @click="abrirCatalogo"
            >
              <LibraryBig class="h-4 w-4" aria-hidden="true" />
              Ver catálogo
            </button>
          </div>
        </Transition>
      </div>
    </header>
    <div class="relative shrink-0">
      <input
        v-model="search"
        class="h-8 w-full rounded-md border border-gray-200 px-2 pr-9 text-sm"
        placeholder="Buscar equipo o tipo de equipo…"
      />
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-md transition"
        :class="
          hayFiltrosLocalesActivos
            ? 'bg-accent-light/45 text-main-dark hover:bg-accent-light/70'
            : 'text-main hover:bg-main/10'
        "
        aria-label="Limpiar búsqueda y filtros de chips"
        :title="hayFiltrosLocalesActivos ? 'Limpiar búsqueda y filtros aplicados' : 'Sin filtros locales para limpiar'"
        @click="limpiarBusquedaYFiltros"
      >
        <Eraser class="h-4 w-4" />
      </button>
    </div>
    <div v-if="tiposOrdenados.length" class="shrink-0">
      <div>
      <button
        type="button"
        class="flex h-8 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-2 text-xs font-semibold text-main hover:bg-main/5"
        :aria-expanded="showCounts"
        @click="showCounts = !showCounts"
      >
        <span>{{ etiquetaCantidad }}</span>
        <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': showCounts }" />
      </button>
      </div>
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 scale-95 opacity-0"
        enter-to-class="translate-y-0 scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 scale-100 opacity-100"
        leave-to-class="-translate-y-2 scale-95 opacity-0"
        ><div
          v-if="showCounts"
          class="mt-2 overflow-hidden rounded-md bg-second p-2"
        >
          <div class="mb-2 flex items-center justify-end gap-1">
            <button
              v-if="selectedTipoId !== null"
              type="button"
              class="rounded p-1 text-main hover:bg-main/10"
              aria-label="Volver a tipos"
              @click="volverTipos"
            >
              <ArrowLeft class="h-4 w-4" /></button
            ><button
              type="button"
              class="rounded p-1 transition"
              :class="
                hayFiltrosDeChipsActivos
                  ? 'bg-accent-light/45 text-main-dark hover:bg-accent-light/70'
                  : 'text-main hover:bg-main/10'
              "
              aria-label="Limpiar filtros de chips"
              :title="hayFiltrosDeChipsActivos ? 'Limpiar filtros de chips' : 'Sin filtros de chips para limpiar'"
              @click="limpiarFiltros"
            >
              <Eraser class="h-4 w-4" />
            </button>
          </div>
          <Transition
            mode="out-in"
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="translate-x-4 opacity-0"
            enter-to-class="translate-x-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-x-0 opacity-100"
            leave-to-class="-translate-x-4 opacity-0"
            ><div :key="tipoActivoId ?? 'tipos'" class="flex flex-wrap gap-1">
              <template v-if="!mostrarModelos"
                ><button
                  v-for="[name, count] in tiposOrdenados"
                  :key="name"
                  type="button"
                  class="rounded bg-white px-1.5 py-1 text-xs text-gray-600 shadow-sm hover:bg-main hover:text-white"
                  @click="
                    seleccionarTipo(
                      equipos.find((x) => x.tipo_equipo === name)
                        ?.tipo_equipo_id!,
                    )
                  "
                >
                  {{ name }} <b>{{ count }}</b>
                </button></template
              ><template v-else
                ><button
                  v-for="[modelo, count] in modelos"
                  :key="modelo"
                  type="button"
                  class="rounded px-1.5 py-1 text-xs shadow-sm hover:bg-main hover:text-white"
                  :class="selectedModelo === modelo ? 'bg-main text-white' : 'bg-white text-gray-600'"
                  @click="seleccionarModelo(modelo)"
                >
                  {{ modelo }} <b>{{ count }}</b>
                </button></template
              >
            </div></Transition
          >
          <button
            type="button"
            class="mt-2 flex h-7 w-full items-center justify-center rounded border border-gray-200 bg-white text-main hover:bg-main/5"
            aria-label="Cerrar chips"
            @click="cerrarChips"
          >
            <ChevronUp class="h-4 w-4" />
          </button>
        </div></Transition
      >
    </div>
    <p v-if="loading" class="p-3 text-center text-xs text-gray-500">
      Cargando equipos…
    </p>
    <p v-else-if="error" class="p-3 text-center text-xs text-danger">
      {{ error }}
      <button class="font-semibold underline" @click="$emit('retry')">
        Reintentar
      </button>
    </p>
    <p
      v-else-if="!visible.length"
      class="p-3 text-center text-xs text-gray-500"
    >
      No hay equipos con estos filtros.
    </p>
    <div v-else class="grid min-h-0 flex-1 auto-rows-max content-start gap-2 overflow-y-auto pr-1">
      <EquipoEngraseListItem
        v-for="equipo in visible"
        :key="equipo.id"
        :equipo="equipo"
        :selected="equipo.id === selectedEquipoId"
        @select="$emit('selectEquipo', $event)"
        @image-visible="$emit('imageVisible', $event)"
      />
    </div>
  </section>
</template>
