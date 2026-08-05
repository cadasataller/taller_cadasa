<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { Search, X } from "lucide-vue-next";
import type { FiltroCodigoSugerencia } from "@/stores/dbequipos/engrase/filtrosEngrase.types";
const props = defineProps<{
  modelValue: string;
  sugerencias: FiltroCodigoSugerencia[];
  loading: boolean;
  resetSignal: number;
}>();
const emit = defineEmits<{
  "update:modelValue": [string];
  search: [string];
  select: [FiltroCodigoSugerencia];
  clear: [];
}>();
const open = shallowRef(false),
  active = shallowRef(-1),
  query = shallowRef(props.modelValue),
  isEditing = shallowRef(false);
const hasSuggestions = computed(() => props.sugerencias.length > 0);
watch(
  () => props.modelValue,
  (value) => {
    if (!isEditing.value || value) query.value = value;
  },
);
watch(() => props.resetSignal, () => {
  isEditing.value = false;
  query.value = "";
  open.value = false;
  active.value = -1;
});
function input(value: string) {
  isEditing.value = true;
  query.value = value;
  emit("update:modelValue", value);
  open.value = true;
  active.value = -1;
  emit("search", value);
}
function choose(item: FiltroCodigoSugerencia) {
  isEditing.value = false;
  query.value = item.codigo;
  emit("select", item);
  emit("search", "");
  open.value = false;
}
function clear() {
  isEditing.value = false;
  query.value = "";
  emit("clear");
  emit("search", "");
  open.value = false;
}
function closeOnFocusOut(event: FocusEvent) {
  const currentTarget = event.currentTarget as HTMLElement | null;
  const nextTarget = event.relatedTarget as Node | null;
  if (!nextTarget || !currentTarget?.contains(nextTarget)) {
    open.value = false;
  }
}
function keydown(e: KeyboardEvent) {
  if (e.key === "Escape") open.value = false;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    active.value = Math.min(active.value + 1, props.sugerencias.length - 1);
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    active.value = Math.max(active.value - 1, 0);
  }
  if (e.key === "Enter" && active.value >= 0) {
    e.preventDefault();
    choose(props.sugerencias[active.value]);
  }
}
</script>
<template>
  <div class="relative" @focusout="closeOnFocusOut">
    <div class="relative">
      <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" /><input
        id="codigo-filtro"
        :value="query"
        class="h-9 w-full rounded-md border border-gray-200 bg-white pl-8 pr-8 text-sm text-gray-700 outline-none transition focus:border-main focus:ring-2 focus:ring-main/10"
        role="combobox"
        aria-label="Buscar por código de filtro"
        :aria-expanded="open && hasSuggestions"
        placeholder="Código original o equivalente"
        @focus="open = true"
        @input="input(($event.target as HTMLInputElement).value)"
        @keydown="keydown"
      /><button
        v-if="query"
        class="absolute right-1.5 top-1.5 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-main"
        @click="clear"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
    <div
      v-if="open && (hasSuggestions || loading)"
      class="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
    >
      <p v-if="loading" class="px-3 py-2 text-xs text-gray-500">
        Buscando códigos…
      </p>
      <button
        v-for="(item, index) in sugerencias"
        :key="item.codigo"
        class="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-main/5"
        :class="{ 'bg-main/10': active === index }"
        @mousedown.prevent="choose(item)"
      >
        <b class="font-mono text-xs text-main">{{ item.codigo }}</b
        ><span class="text-xs text-gray-500">{{
          item.esOriginal && item.esEquivalente
            ? "Original y equivalente"
            : item.esOriginal
              ? "Original"
              : "Equivalente"
        }}</span>
      </button>
    </div>
  </div>
</template>
