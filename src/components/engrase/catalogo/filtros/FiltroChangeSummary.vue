<script setup lang="ts">
import { computed } from "vue";
import type {
  CatalogoFiltroGuardarInput,
  CatalogoFiltroItem,
} from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";
const props = defineProps<{
  original: CatalogoFiltroItem;
  draft: CatalogoFiltroGuardarInput;
}>();
const changes = computed(() => {
  const result: Array<{ label: string; before: string; after: string }> = [];
  if (props.original.codigo !== props.draft.codigo.trim())
    result.push({
      label: "Código",
      before: props.original.codigo,
      after: props.draft.codigo.trim(),
    });
  if (props.original.estaEnListaCompras !== props.draft.esta_en_lista_compras)
    result.push({
      label: "En compras",
      before: props.original.estaEnListaCompras ? "Sí" : "No",
      after: props.draft.esta_en_lista_compras ? "Sí" : "No",
    });
  if (props.original.activo !== props.draft.activo)
    result.push({
      label: "Estado",
      before: props.original.activo ? "Activo" : "Desactivado",
      after: props.draft.activo ? "Activo" : "Desactivado",
    });
  return result;
});
</script>
<template>
  <section v-if="changes.length" aria-labelledby="filter-changes-title">
    <h3 id="filter-changes-title" class="text-xs font-semibold text-gray-800">
      Cambios que se aplicarán
    </h3>
    <dl class="mt-2 overflow-hidden rounded-md border border-gray-200">
      <div
        v-for="change in changes"
        :key="change.label"
        class="grid gap-1 border-b border-gray-100 p-2.5 text-xs last:border-b-0 sm:grid-cols-[90px_1fr]"
      >
        <dt class="font-semibold text-gray-600">{{ change.label }}</dt>
        <dd class="flex min-w-0 flex-wrap items-center gap-1.5">
          <span class="break-words text-gray-500">{{ change.before }}</span
          ><span class="text-main" aria-hidden="true">→</span
          ><strong class="break-words text-main-dark">{{
            change.after
          }}</strong>
        </dd>
      </div>
    </dl>
  </section>
</template>
