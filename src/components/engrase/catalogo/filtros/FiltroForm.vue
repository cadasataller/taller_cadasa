<script setup lang="ts">
import { computed } from "vue";
import { FILTRO_CODIGO_MAX, type CatalogoFiltroFieldErrors, type CatalogoFiltroGuardarInput } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";
const props = defineProps<{ draft: CatalogoFiltroGuardarInput; errors: CatalogoFiltroFieldErrors; disabled?: boolean }>();
const emit = defineEmits<{ updateDraft: [draft: CatalogoFiltroGuardarInput]; blurCode: [] }>();
const codeLength = computed(() => props.draft.codigo.length);
function updateCode(event: Event): void { emit("updateDraft", { ...props.draft, codigo: (event.target as HTMLInputElement).value }); }
function updatePurchases(value: boolean): void { emit("updateDraft", { ...props.draft, esta_en_lista_compras: value }); }
function updateActive(value: boolean): void { emit("updateDraft", { ...props.draft, activo: value }); }
</script>

<template>
  <form class="space-y-5" @submit.prevent>
    <div><label for="filtro-code" class="mb-1.5 block text-xs font-semibold text-gray-800">Código del filtro <span class="text-danger" aria-hidden="true">*</span></label><input id="filtro-code" :value="draft.codigo" type="text" required :maxlength="FILTRO_CODIGO_MAX + 1" autocomplete="off" class="min-h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 md:min-h-9 md:text-sm" :class="errors.codigo ? 'border-danger focus:ring-danger/15' : 'border-gray-300 focus:border-main focus:ring-main/15'" :disabled="disabled" :aria-invalid="Boolean(errors.codigo)" :aria-describedby="errors.codigo ? 'filtro-code-error filtro-code-count' : 'filtro-code-count'" @input="updateCode" @blur="emit('blurCode')" /><div class="mt-1 flex min-h-5 justify-between gap-2 text-xs"><p v-if="errors.codigo" id="filtro-code-error" class="text-danger" role="alert">{{ errors.codigo }}</p><span v-else /><span id="filtro-code-count" class="tabular-nums text-gray-500">{{ codeLength }}/{{ FILTRO_CODIGO_MAX }}</span></div></div>
    <fieldset :disabled="disabled"><legend class="mb-1.5 text-xs font-semibold text-gray-800">En compras <span class="text-danger" aria-hidden="true">*</span></legend><div class="grid grid-cols-2 gap-2"><button v-for="option in [{label:'Sí',value:true},{label:'No',value:false}]" :key="option.label" type="button" role="radio" :aria-checked="draft.esta_en_lista_compras === option.value" class="min-h-11 rounded-md border px-3 text-sm font-semibold md:min-h-9 md:text-xs" :class="[draft.esta_en_lista_compras === option.value ? 'border-main bg-main text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer']" @click="updatePurchases(option.value)">{{ option.label }}</button></div></fieldset>
    <fieldset :disabled="disabled"><legend class="mb-1.5 text-xs font-semibold text-gray-800">Estado <span class="text-danger" aria-hidden="true">*</span></legend><div class="grid grid-cols-2 gap-2"><button v-for="option in [{label:'Activo',value:true},{label:'Desactivado',value:false}]" :key="option.label" type="button" role="radio" :aria-checked="draft.activo === option.value" class="min-h-11 rounded-md border px-3 text-sm font-semibold md:min-h-9 md:text-xs" :class="[draft.activo === option.value ? 'border-main bg-main text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer']" @click="updateActive(option.value)">{{ option.label }}</button></div></fieldset>
  </form>
</template>
