<script setup lang="ts">
import { watch, onBeforeUnmount } from "vue";
import { X } from "lucide-vue-next";
import FiltroEquivalenciasList from "./FiltroEquivalenciasList.vue";
import type {
  EquipoEngraseListItem,
  EquipoFiltroDetalle,
  FiltroEquivalenciaRow,
} from "@/stores/dbequipos/engrase/filtrosEngrase.types";
const props = defineProps<{
  open: boolean;
  equipo: EquipoEngraseListItem | null;
  filtro: EquipoFiltroDetalle | null;
  equivalencias: FiltroEquivalenciaRow[];
  loadingEquivalencias: boolean;
  errorEquivalencias: string | null;
}>();
const emit = defineEmits<{ close: []; retryEquivalencias: [] }>();
const esc = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.open) emit("close");
};
watch(
  () => props.open,
  (x) =>
    x
      ? window.addEventListener("keydown", esc)
      : window.removeEventListener("keydown", esc),
);
onBeforeUnmount(() => window.removeEventListener("keydown", esc));
</script>
<template>
  <aside
    class="min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white p-3 shadow-sm max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:max-h-[76vh]"
    :class="open ? 'max-md:translate-y-0' : 'max-md:translate-y-full'"
    :aria-hidden="!open"
  >
    <template v-if="filtro"
      ><header class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-main">Detalle del filtro</h2>
        <button
          class="rounded p-1 text-gray-500 hover:bg-second hover:text-main"
          @click="$emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </header>
      <section class="mt-3 border-t border-gray-100 pt-3">
        <h3 class="text-sm font-semibold text-main">
          {{ filtro.tipoFiltro.nombre }}
        </h3>
        <dl class="mt-2 grid grid-cols-2 gap-y-2 text-xs">
          <dt class="text-gray-500">Código original</dt>
          <dd class="text-right font-mono font-semibold">
            {{ filtro.filtro.codigo }}
          </dd>
          <dt class="text-gray-500">Cantidad</dt>
          <dd class="text-right">x{{ filtro.cantidad }}</dd>
          <dt class="text-gray-500">Etapas</dt>
          <dd class="text-right">
            {{ equipo?.etapas.map((x) => x.nombre).join(", ") || "Sin etapa" }}
          </dd>
          <dt class="text-gray-500">En compras</dt>
          <dd class="text-right">
            {{ filtro.filtro.esta_en_lista_compras ? "Sí" : "No" }}
          </dd>
        </dl>
      </section>
      <section class="mt-3 border-t border-gray-100 pt-3">
        <h3 class="mb-2 text-sm font-semibold text-main">Equivalencias</h3>
        <p v-if="loadingEquivalencias" class="text-xs text-gray-500">
          Cargando…
        </p>
        <p v-else-if="errorEquivalencias" class="text-xs text-danger">
          {{ errorEquivalencias }}
          <button
            class="font-semibold underline"
            @click="$emit('retryEquivalencias')"
          >
            Reintentar
          </button>
        </p>
        <FiltroEquivalenciasList
          v-else
          :equivalencias="equivalencias"
        /></section
    ></template>
    <p v-else class="p-4 text-center text-xs text-gray-500">
      Seleccione un filtro para revisar su detalle.
    </p>
  </aside>
</template>
