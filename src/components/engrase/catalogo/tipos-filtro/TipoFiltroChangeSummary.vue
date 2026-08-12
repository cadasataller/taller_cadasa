<script setup lang="ts">
import { computed } from "vue";
import type {
  CatalogoTipoFiltroGuardarInput,
  CatalogoTipoFiltroItem,
} from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

const props = defineProps<{
  original: CatalogoTipoFiltroItem;
  draft: CatalogoTipoFiltroGuardarInput;
}>();

const changes = computed(() => {
  const result: { label: string; before: string; after: string }[] = [];
  if (props.original.nombre !== props.draft.nombre.trim()) {
    result.push({ label: "Nombre", before: props.original.nombre, after: props.draft.nombre.trim() });
  }
  if (props.original.activo !== props.draft.activo) {
    result.push({
      label: "Estado",
      before: props.original.activo ? "Activo" : "Desactivado",
      after: props.draft.activo ? "Activo" : "Desactivado",
    });
  }
  return result;
});
</script>

<template>
  <section v-if="changes.length" aria-labelledby="changes-title">
    <h3 id="changes-title" class="text-xs font-semibold text-gray-800">Cambios que se aplicarán</h3>
    <dl class="mt-2 overflow-hidden rounded-md border border-gray-200">
      <div v-for="change in changes" :key="change.label" class="grid gap-1 border-b border-gray-100 p-2.5 text-xs last:border-b-0 sm:grid-cols-[90px_1fr]">
        <dt class="font-semibold text-gray-600">{{ change.label }}</dt>
        <dd class="min-w-0 text-gray-700"><span class="break-words">{{ change.before }}</span> <span class="mx-1 text-main">→</span> <strong class="break-words text-main">{{ change.after }}</strong></dd>
      </div>
    </dl>
  </section>
</template>
