<script setup lang="ts">
import { AlertCircle, Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-vue-next';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, useTemplateRef, watch } from 'vue';
import { shallowRef } from 'vue';

import { useUnidadMedidaOptions } from '@/composables/compras/useUnidadMedidaOptions';
import type { UnidadMedidaOption } from '@/stores/db_compras/unidad/unidadMedida.types';
import type { ServicioSolicitudDraft } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const DEFAULT_UNIDAD_CODIGO = 'un';

const props = defineProps<{
  mode: 'create' | 'edit';
  initialDraft: ServicioSolicitudDraft;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submit', value: ServicioSolicitudDraft): void;
}>();

const formState = reactive({
  cantidad: String(props.initialDraft.cantidad || 1),
  descripcion: props.initialDraft.descripcion,
  unidadCodigo: props.initialDraft.unidadCodigo,
  unidadLabel: props.initialDraft.unidadLabel,
});

const fieldErrors = reactive<{
  cantidad?: string;
  descripcion?: string;
  unidadCodigo?: string;
}>({});

const descripcionFieldRef = useTemplateRef<HTMLTextAreaElement>('descripcionField');
const unitFieldOpen = shallowRef(false);
const unitFieldRef = useTemplateRef<HTMLElement>('unitField');

const {
  allOptions,
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
  ? 'Editar servicio'
  : 'Agregar servicio');
const submitLabel = computed(() => props.mode === 'edit' ? 'Guardar cambios' : 'Agregar');
const shouldShowUnitResults = computed(() => unitFieldOpen.value && !error.value);

const normalizeDescripcion = (value: string): string => value.trim().toUpperCase();

const resizeDescripcionField = (): void => {
  const textarea = descripcionFieldRef.value;

  if (!textarea) {
    return;
  }

  textarea.style.height = '0px';
  textarea.style.height = `${textarea.scrollHeight}px`;
};

const applyDefaultUnidad = (): void => {
  if (props.mode === 'edit' || formState.unidadCodigo || allOptions.value.length === 0) {
    return;
  }

  const defaultOption = allOptions.value.find((option) => option.codigo === DEFAULT_UNIDAD_CODIGO);

  if (!defaultOption) {
    return;
  }

  handleSelectUnidad(defaultOption);
};

watch(() => props.initialDraft, (nextDraft) => {
  formState.cantidad = String(nextDraft.cantidad || 1);
  formState.descripcion = nextDraft.descripcion;
  formState.unidadCodigo = nextDraft.unidadCodigo;
  formState.unidadLabel = nextDraft.unidadLabel;
  syncSelection(nextDraft.unidadCodigo || null, nextDraft.unidadLabel);
  fieldErrors.cantidad = undefined;
  fieldErrors.descripcion = undefined;
  fieldErrors.unidadCodigo = undefined;
}, { immediate: true, deep: true });

watch(allOptions, () => {
  applyDefaultUnidad();
}, { immediate: true });

watch(() => formState.descripcion, async () => {
  await nextTick();
  resizeDescripcionField();
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
  formState.unidadLabel = option.abreviatura || option.descripcion;
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

const parseCantidad = (): number | null => {
  const normalizedValue = formState.cantidad.trim();

  if (!normalizedValue) {
    return 1;
  }

  const parsed = Number(normalizedValue);

  if (Number.isNaN(parsed)) {
    return null;
  }

  if (parsed === 0) {
    return 1;
  }

  return parsed;
};

const validateForm = (): ServicioSolicitudDraft | null => {
  const cantidad = parseCantidad();

  fieldErrors.cantidad = undefined;
  fieldErrors.descripcion = formState.descripcion.trim()
    ? undefined
    : 'La descripcion del servicio es obligatoria.';
  fieldErrors.unidadCodigo = formState.unidadCodigo.trim()
    ? undefined
    : 'La unidad del servicio es obligatoria.';

  if (cantidad === null) {
    fieldErrors.cantidad = 'La cantidad del servicio debe ser un numero valido.';
  } else if (cantidad < 0) {
    fieldErrors.cantidad = 'La cantidad del servicio no puede ser negativa.';
  }

  if (cantidad === null || fieldErrors.cantidad || fieldErrors.descripcion || fieldErrors.unidadCodigo) {
    return null;
  }

  return {
    cantidad,
    descripcion: normalizeDescripcion(formState.descripcion),
    unidadCodigo: formState.unidadCodigo.trim(),
    unidadLabel: formState.unidadLabel.trim() || formState.unidadCodigo.trim(),
  };
};

const handleSubmit = (): void => {
  const draft = validateForm();

  if (!draft) {
    return;
  }

  emit('submit', draft);
};
</script>

<template>
  <div class="flex flex-col lg:h-full">
    <div class="shrink-0 border-b border-stone-200 px-4 py-4 lg:px-6">
      <p class="font-display text-2xl leading-none tracking-wide text-main">
        {{ title }}
      </p>
      <p class="mt-2 text-sm text-stone-600">
        Completa cantidad, descripcion y unidad del servicio.
      </p>
    </div>

    <div class="px-4 py-4 lg:flex-1 lg:overflow-y-auto lg:px-6">
      <div class="space-y-4">
        <div class="space-y-2">
          <label
            for="servicio-cantidad"
            class="text-sm font-semibold text-stone-900"
          >
            Cantidad
          </label>
          <input
            id="servicio-cantidad"
            v-model="formState.cantidad"
            type="text"
            inputmode="decimal"
            class="min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-main"
            :class="fieldErrors.cantidad ? 'border-danger/40' : 'border-stone-300'"
            placeholder="1"
          >
          <p
            v-if="fieldErrors.cantidad"
            class="text-sm font-medium text-danger"
          >
            {{ fieldErrors.cantidad }}
          </p>
        </div>

        <div class="space-y-2">
          <label
            for="servicio-descripcion"
            class="text-sm font-semibold text-stone-900"
          >
            Descripcion
          </label>
          <textarea
            id="servicio-descripcion"
            ref="descripcionField"
            v-model="formState.descripcion"
            rows="1"
            class="min-h-11 w-full resize-none overflow-hidden whitespace-pre-wrap break-words rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-main"
            :class="fieldErrors.descripcion ? 'border-danger/40' : 'border-stone-300'"
            placeholder="Ej. Servicio de torno externo"
            @input="resizeDescripcionField"
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
            for="servicio-unidad"
            class="text-sm font-semibold text-stone-900"
          >
            Unidad
          </label>

          <div class="relative">
            <div
              class="flex min-h-11 items-center gap-3 rounded-xl border bg-white px-3 py-2 transition focus-within:border-main"
              :class="fieldErrors.unidadCodigo ? 'border-danger/40' : 'border-stone-300'"
            >
              <Search class="h-4 w-4 shrink-0 text-stone-400" />
              <input
                id="servicio-unidad"
                :value="query"
                type="text"
                class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                placeholder="Buscar unidad por descripcion, codigo o abreviatura"
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
                  <span class="min-w-0 break-words">
                    {{ option.descripcion }}
                    <span
                      v-if="option.abreviatura"
                      class="text-xs text-stone-500"
                    >
                      · {{ option.abreviatura }}
                    </span>
                  </span>
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
            v-if="fieldErrors.unidadCodigo"
            class="text-sm font-medium text-danger"
          >
            {{ fieldErrors.unidadCodigo }}
          </p>
        </div>
      </div>
    </div>

    <div class="shrink-0 border-t border-stone-200 px-4 py-4 lg:px-6">
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center rounded-xl bg-main px-4 text-sm font-semibold text-white transition hover:bg-main-dark"
          @click="handleSubmit"
        >
          {{ submitLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
