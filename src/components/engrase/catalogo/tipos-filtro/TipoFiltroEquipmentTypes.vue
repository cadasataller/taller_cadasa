<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { ChevronDown, ChevronUp } from "lucide-vue-next";
import type { CatalogoTipoEquipoImpacto } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

const props = defineProps<{ items: readonly CatalogoTipoEquipoImpacto[] }>();
const expanded = shallowRef(false);
const ordered = computed(() => [...props.items].sort((left, right) =>
  right.cantidadEquipos - left.cantidadEquipos
  || left.nombre.localeCompare(right.nombre, "es", { sensitivity: "base" }),
));
const visible = computed(() => expanded.value ? ordered.value : ordered.value.slice(0, 4));
const remaining = computed(() => Math.max(ordered.value.length - 4, 0));
</script>

<template>
  <section aria-labelledby="equipment-types-title">
    <h3 id="equipment-types-title" class="text-xs font-semibold text-gray-800">
      Tipos de equipo asociados
    </h3>
    <p v-if="!items.length" class="mt-2 text-xs text-gray-500">Sin equipos asociados</p>
    <div v-else class="mt-2 flex flex-wrap gap-1.5">
      <span
        v-for="item in visible"
        :key="item.id"
        class="inline-flex items-center gap-2 rounded-md bg-main/6 px-2 py-1.5 text-xs text-main"
      >
        {{ item.nombre }}
        <strong class="tabular-nums">{{ new Intl.NumberFormat('es').format(item.cantidadEquipos) }}</strong>
      </span>
      <button
        v-if="remaining > 0 || expanded"
        type="button"
        class="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md border border-main/15 bg-white px-2 text-xs font-semibold text-main hover:bg-main/5 focus-visible:outline-2 focus-visible:outline-main"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Ver menos' : `+${remaining}` }}
        <component :is="expanded ? ChevronUp : ChevronDown" class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>
