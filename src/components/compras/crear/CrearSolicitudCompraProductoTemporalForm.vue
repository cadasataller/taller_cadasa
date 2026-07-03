<script setup lang="ts">
import { AlertCircle, Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-vue-next';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, useTemplateRef, watch } from 'vue';
import { shallowRef } from 'vue';

import { useUnidadMedidaOptions } from '@/composables/compras/useUnidadMedidaOptions';
import type { UnidadMedidaOption } from '@/stores/db_compras/unidad/unidadMedida.types';
import type { ProductoTemporalDraft } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  mode: 'create' | 'edit';
  initialDraft: ProductoTemporalDraft;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submit', value: ProductoTemporalDraft): void;
}>();

const formState = reactive<ProductoTemporalDraft>({
  nombre: props.initialDraft.nombre,
  descripcion: props.initialDraft.descripcion,
  unidadCodigo: props.initialDraft.unidadCodigo,
  unidadLabel: props.initialDraft.unidadLabel,
});

const fieldErrors = reactive<{
  nombre?: string;
  descripcion?: string;
  unidadCodigo?: string;
}>({});

const nombreFieldRef = useTemplateRef<HTMLTextAreaElement>('nombreField');
const unitFieldOpen = shallowRef(false);
const unitFieldRef = useTemplateRef<HTMLElement>('unitField');

const {
  filteredOptions,
  selectedOption,
  loading,
  error,
  query,
  setQuery,
  selectOption,
  clearSelection,
  syncSelection,
} = useUnidadMedidaOptions();

const title = computed(() => props.mode === 'edit'
  ? 'Editar producto manual'
  : 'Agregar producto manual');
const submitLabel = computed(() => props.mode === 'edit' ? 'Guardar cambios' : 'Agregar');
const shouldShowUnitResults = computed(() => unitFieldOpen.value && !error.value);
const nombreCharacterCount = computed(() => formState.nombre.length);

const normalizeText = (value: string): string => value.trim().toUpperCase();

const resizeNombreField = (): void => {
  const textarea = nombreFieldRef.value;

  if (!textarea) {
    return;
  }

  textarea.style.height = '0px';
  textarea.style.height = `${textarea.scrollHeight}px`;
};

watch(() => props.initialDraft, (nextDraft) => {
  formState.nombre = nextDraft.nombre;
  formState.descripcion = nextDraft.descripcion;
  formState.unidadCodigo = nextDraft.unidadCodigo;
  formState.unidadLabel = nextDraft.unidadLabel;
  syncSelection(nextDraft.unidadCodigo || null, nextDraft.unidadLabel);
  fieldErrors.nombre = undefined;
  fieldErrors.descripcion = undefined;
  fieldErrors.unidadCodigo = undefined;
}, { immediate: true, deep: true });

watch(() => formState.nombre, async () => {
  await nextTick();
  resizeNombreField();
}, { immediate: true });

watch(query, (value) => {
  const normalizedValue = value.trim();

  if (!selectedOption.value) {
    if (!normalizedValue) {
      formState.unidadCodigo = '';
      formState.unidadLabel = '';
    }
    return;
  }

  if (normalizedValue !== selectedOption.value.descripcion) {
    clearSelection();
    formState.unidadCodigo = '';
    formState.unidadLabel = '';
  }
});

const handleSelectUnidad = (option: UnidadMedidaOption): void => {
  selectOption(option);
  formState.unidadCodigo = option.codigo;
  formState.unidadLabel = option.descripcion;
  fieldErrors.unidadCodigo = undefined;
  unitFieldOpen.value = false;
};

const handleClickOutside = (event: MouseEvent): void => {
  const root = unitFieldRef.value;
  const target = event.target;

  if (!(target instanceof Node) || !root || root.contains(target)) {
    return;
  }

  unitFieldOpen.value = false;

  if (!formState.unidadCodigo) {
    setQuery('');
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

const validateForm = (): boolean => {
  fieldErrors.nombre = formState.nombre.trim()
    ? (formState.nombre.trim().length <= 56
      ? undefined
      : 'El nombre del producto temporal no puede superar los 56 caracteres.')
    : 'El nombre del producto temporal es obligatorio.';
  fieldErrors.unidadCodigo = formState.unidadCodigo.trim()
    ? undefined
    : 'La unidad del producto temporal es obligatoria.';

  return !fieldErrors.nombre && !fieldErrors.unidadCodigo;
};

const handleSubmit = (): void => {
  if (!validateForm()) {
    return;
  }

  emit('submit', {
    nombre: normalizeText(formState.nombre),
    descripcion: formState.descripcion?.trim()
      ? normalizeText(formState.descripcion)
      : null,
    unidadCodigo: formState.unidadCodigo.trim(),
    unidadLabel: formState.unidadCodigo.trim(),
  });
};
</script>

<template>
  <div class="flex flex-col lg:h-full">
    <div class="shrink-0 border-b border-stone-200 px-4 py-4 lg:px-6">
      <p class="font-display text-2xl leading-none tracking-wide text-main">
        {{ title }}
      </p>
      <p class="mt-2 text-sm text-stone-600">
        Completa el nombre y la unidad. La descripcion es opcional.
      </p>
    </div>

    <div class="px-4 py-4 lg:flex-1 lg:overflow-y-auto lg:px-6">
      <div class="space-y-4">
        <div class="space-y-2">
          <label
            for="producto-temporal-nombre"
            class="text-sm font-semibold text-stone-900"
          >
            Nombre
          </label>
          <textarea
            id="producto-temporal-nombre"
            ref="nombreField"
            v-model="formState.nombre"
            rows="1"
            class="min-h-8 w-full resize-none overflow-hidden whitespace-pre-wrap break-words rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-main"
            :class="fieldErrors.nombre ? 'border-danger/40' : 'border-stone-300'"
            maxlength="56"
            placeholder="Ej. Producto no catalogado"
            @input="resizeNombreField"
          />
          <div class="flex items-center justify-between gap-3 text-xs text-stone-500">
            <p class="font-semibold text-stone-600">
              {{ nombreCharacterCount }}/56
            </p>
          </div>
          <p
            v-if="fieldErrors.nombre"
            class="text-sm font-medium text-danger"
          >
            {{ fieldErrors.nombre }}
          </p>
        </div>

        <div class="space-y-2">
          <label
            for="producto-temporal-descripcion"
            class="text-sm font-semibold text-stone-900"
          >
            Descripcion
          </label>
          <textarea
            id="producto-temporal-descripcion"
            v-model="formState.descripcion"
            rows="2"
            class="min-h-16 w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-main"
            :class="fieldErrors.descripcion ? 'border-danger/40' : 'border-stone-300'"
            placeholder="Opcional"
          />
          <p
            v-if="fieldErrors.descripcion"
            class="text-sm font-medium text-danger"
          >
            {{ fieldErrors.descripcion }}
          </p>
        </div>

        <div
          ref="unitField"
          class="space-y-2"
        >
          <label
            for="producto-temporal-unidad"
            class="text-sm font-semibold text-stone-900"
          >
            Unidad de medida
          </label>

          <div class="relative">
            <div
              class="flex min-h-11 items-center gap-3 rounded-xl border bg-white px-3 py-2 transition focus-within:border-main"
              :class="fieldErrors.unidadCodigo ? 'border-danger/40' : 'border-stone-300'"
            >
              <Search class="h-4 w-4 shrink-0 text-stone-400" />
              <input
                id="producto-temporal-unidad"
                :value="query"
                type="text"
                class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                placeholder="Buscar unidad por descripcion, codigo, abreviatura o id"
                @focus="unitFieldOpen = true"
                @input="setQuery(($event.target as HTMLInputElement).value)"
              >
              <button
                v-if="query.length > 0"
                type="button"
                class="inline-flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                @click="() => { setQuery(''); clearSelection(); formState.unidadCodigo = ''; formState.unidadLabel = ''; }"
              >
                <X class="h-4 w-4" />
              </button>
              <LoaderCircle
                v-else-if="loading"
                class="h-4 w-4 shrink-0 animate-spin text-main"
              />
              <ChevronDown
                v-else
                class="h-4 w-4 shrink-0 text-stone-400"
              />
            </div>

            <div
              v-if="shouldShowUnitResults"
              class="mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl lg:absolute lg:inset-x-0 lg:top-full lg:z-20"
            >
              <div
                v-if="loading"
                class="flex items-center justify-center gap-2 px-4 py-4 text-sm text-stone-500"
              >
                <LoaderCircle class="h-4 w-4 animate-spin text-main" />
                Cargando unidades...
              </div>

              <div
                v-else-if="filteredOptions.length === 0"
                class="px-4 py-4 text-sm text-stone-500"
              >
                No encontramos unidades para esta busqueda.
              </div>

              <div
                v-else
                class="max-h-64 overflow-y-auto py-1"
              >
                <button
                  v-for="option in filteredOptions"
                  :key="option.codigo"
                  type="button"
                  class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-second"
                  @click="handleSelectUnidad(option)"
                >
                  <span class="min-w-0 break-words">{{ option.descripcion }}</span>
                  <Check
                    v-if="formState.unidadCodigo === option.codigo"
                    class="h-4 w-4 shrink-0 text-main"
                  />
                </button>
              </div>
            </div>
          </div>

          <p
            v-if="error"
            class="flex items-start gap-2 text-sm font-medium text-danger"
          >
            <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
            {{ error }}
          </p>
          <p
            v-else-if="fieldErrors.unidadCodigo"
            class="text-sm font-medium text-danger"
          >
            {{ fieldErrors.unidadCodigo }}
          </p>
        </div>
      </div>
    </div>

    <div class="shrink-0 border-t border-stone-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-6">
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center rounded-xl bg-main px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-main-light"
          @click="handleSubmit"
        >
          {{ submitLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
