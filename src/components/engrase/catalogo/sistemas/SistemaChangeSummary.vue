<script setup lang="ts">
import { computed } from "vue";
import type {
  CatalogoSistemaGuardarInput,
  CatalogoSistemaItem,
} from "@/stores/dbequipos/engrase/catalogo/sistemasCatalogo.types";
const props = defineProps<{
  original: CatalogoSistemaItem;
  draft: CatalogoSistemaGuardarInput;
}>();
const changes = computed(() => {
  const result: Array<{ label: string; before: string; after: string }> = [];
  if (props.original.nombre !== props.draft.nombre.trim())
    result.push({
      label: "Nombre",
      before: props.original.nombre,
      after: props.draft.nombre.trim(),
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
  <section v-if="changes.length" aria-labelledby="system-changes-title">
    <h3 id="system-changes-title" class="text-xs font-semibold">
      Cambios que se aplicarán
    </h3>
    <dl class="mt-2 overflow-hidden rounded-md border border-gray-200">
      <div
        v-for="change in changes"
        :key="change.label"
        class="grid gap-1 border-b border-gray-100 p-2.5 text-xs last:border-b-0 sm:grid-cols-[80px_1fr]"
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
