<script setup lang="ts">
import { Check, LoaderCircle, PackageSearch, Plus, Search, Trash2, X,SquarePen  } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';
import { shallowRef } from 'vue';

import type {
  ProductoCatalogoOption,
  ProductoSolicitudItem,
  ProductoSolicitudTemporalItem,
  ServicioSolicitudItem,
  SolicitudCompraTipoSolicitud,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
  searchQuery: string;
  searchResults: ProductoCatalogoOption[];
  isSearching: boolean;
  searchError?: string | null;
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
  productosError?: string;
  serviciosError?: string;
}>();

const emit = defineEmits<{
  (e: 'update:search-query', value: string): void;
  (e: 'search:productos', value: string): void;
  (e: 'add-producto-existente', value: ProductoCatalogoOption): void;
  (e: 'remove-producto', localId: string): void;
  (e: 'remove-servicio', localId: string): void;
  (e: 'manual-request', value: string): void;
  (e: 'edit-producto-temporal', value: ProductoSolicitudTemporalItem): void;
}>();

const isServicio = computed(() => props.tipoSolicitud === 'servicio');
const sectionTitle = computed(() => isServicio.value ? 'Paso 2 · Servicios' : 'Paso 2 · Productos');
const sectionDescription = computed(() => isServicio.value
  ? 'El flujo visual actual del paso 2 esta enfocado en productos.'
  : 'Busca productos confirmados y agregalos a la solicitud con un clic.'
);
const fieldError = computed(() => isServicio.value ? props.serviciosError : props.productosError);
const localQuery = shallowRef(props.searchQuery);
const isSearchFocused = shallowRef(false);
const searchRootRef = useTemplateRef<HTMLElement>('searchRoot');

type SearchRow =
  | {
    kind: 'manual';
    key: string;
    label: string;
  }
  | {
    kind: 'product';
    key: string;
    item: ProductoCatalogoOption;
    selected: boolean;
    localId: string | null;
  }
  | {
    kind: 'selected';
    key: string;
    localId: string;
    codProducto: string;
    nombre: string;
    unidadLabel: string;
    selected: true;
  };

watch(() => props.searchQuery, (value) => {
  if (value !== localQuery.value) {
    localQuery.value = value;
  }
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(localQuery, (value) => {
  emit('update:search-query', value);

  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    emit('search:productos', value);
  }, 300);
});

onBeforeUnmount(() => {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
});

const normalizedQuery = computed(() => localQuery.value.trim());
const selectedProducts = computed(() => props.productos.map((item) => ({
  item,
  localId: item.localId,
  codProducto: item.tipo === 'existente' ? item.codProducto : 'MANUAL',
  nombre: item.nombre,
  unidadLabel: item.unidadLabel,
  isTemporal: item.tipo === 'temporal',
})));
const selectedExistingByCode = computed(() => {
  const entries = props.productos
    .filter((item): item is Extract<ProductoSolicitudItem, { tipo: 'existente' }> => item.tipo === 'existente')
    .map((item) => [item.codProducto, item.localId] as const);

  return new Map(entries);
});
const searchRows = computed<SearchRow[]>(() => {
  if (isServicio.value) {
    return [];
  }

  if (!normalizedQuery.value) {
    return selectedProducts.value.map((item) => ({
      kind: 'selected',
      key: `selected-${item.localId}`,
      localId: item.localId,
      codProducto: item.codProducto,
      nombre: item.nombre,
      unidadLabel: item.unidadLabel,
      selected: true,
    }));
  }

  if (normalizedQuery.value.length < 2) {
    return [];
  }

  return [
    {
      kind: 'manual',
      key: `manual-${normalizedQuery.value}`,
      label: normalizedQuery.value,
    },
    ...props.searchResults.map((item) => ({
      kind: 'product' as const,
      key: item.productoId,
      item,
      selected: selectedExistingByCode.value.has(item.codProducto),
      localId: selectedExistingByCode.value.get(item.codProducto) ?? null,
    })),
  ];
});
const shouldShowResults = computed(() =>
  !isServicio.value
  && isSearchFocused.value
  && (
    normalizedQuery.value.length === 0
    || normalizedQuery.value.length >= 2
    || props.isSearching
  )
);
const hasVisibleRows = computed(() => searchRows.value.length > 0);

const handleClickOutside = (event: MouseEvent): void => {
  const root = searchRootRef.value;
  const target = event.target;

  if (!(target instanceof Node) || !root || root.contains(target)) {
    return;
  }

  isSearchFocused.value = false;
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

const clearSearch = (): void => {
  localQuery.value = '';
};

const onEditTemporal = (item: ProductoSolicitudItem): void => {
  if (item.tipo !== 'temporal') {
    return;
  }

  emit('edit-producto-temporal', item);
};

const onSelectRow = (
  row: SearchRow
): void => {
  if (row.kind === 'manual') {
    emit('manual-request', row.label);
    return;
  }

  if (row.kind === 'selected') {
    emit('remove-producto', row.localId);
    return;
  }

  if (row.selected && row.localId) {
    emit('remove-producto', row.localId);
    return;
  }

  emit('add-producto-existente', row.item);
};
</script>

<template>
  <section class="flex h-full flex-col rounded-lg border border-stone-200 bg-white px-3 py-4 shadow-sm lg:px-4">
    
    <template v-if="!isServicio">
      <div
        ref="searchRoot"
      >
        

        <div class="mt-1 flex items-start gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-3 rounded-lg border border-stone-300 bg-white px-3 py-2 transition focus-within:border-main">
              <Search class="h-4 w-4 shrink-0 text-stone-400" />
              <input
                v-model="localQuery"
                type="text"
                class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                placeholder="Buscar por codigo, nombre o unidad"
                @focus="isSearchFocused = true"
              >
              <button
                v-if="localQuery.length > 0"
                type="button"
                class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                @click="clearSearch"
              >
                <X class="h-4 w-4" />
              </button>
              <LoaderCircle
                v-if="isSearching"
                class="h-4 w-4 shrink-0 animate-spin text-main"
              />
            </div>

            <div
              v-if="shouldShowResults"
              class="sticky top-0 z-20 mt-3 w-full rounded-lg border border-stone-200 bg-white shadow-lg"
            >
              <div class="max-h-72 overflow-y-auto">
                <div
                  v-if="isSearching"
                  class="flex items-center justify-center gap-2 px-4 py-5 text-sm text-stone-500"
                >
                  <LoaderCircle class="h-4 w-4 animate-spin text-main" />
                  Buscando productos...
                </div>

                <button
                  v-for="row in searchRows"
                  :key="row.key"
                  type="button"
                  class="w-full border-b border-stone-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-second"
                  :class="row.kind !== 'manual' && row.selected ? 'bg-main/10' : 'bg-white'"
                  @click="onSelectRow(row)"
                >
                  <div class="hidden grid-cols-[10rem_8rem_minmax(0,1fr)_3.25rem] items-center gap-4 text-center md:grid">
                    <template v-if="row.kind === 'manual'">
                      <p class="break-words text-sm font-semibold text-main">
                        MANUAL
                      </p>
                      <p class="break-words text-xs text-stone-500">
                        Sin unidad
                      </p>
                      <p class="break-words text-sm text-stone-600">
                        {{ row.label }}
                      </p>
                    </template>

                    <template v-else-if="row.kind === 'selected'">
                      <p class="break-words font-semibold text-stone-900">
                        {{ row.codProducto }}
                      </p>
                      <p class="break-words text-xs text-stone-500">
                        {{ row.unidadLabel }}
                      </p>
                      <p class="break-words text-stone-700">
                        {{ row.nombre }}
                      </p>
                    </template>

                    <template v-else>
                      <p class="break-words font-semibold text-stone-900">
                        {{ row.item.codProducto }}
                      </p>
                      <p class="break-words text-xs text-stone-500">
                        {{ row.item.unidadLabel }}
                      </p>
                      <p class="break-words text-stone-700">
                        {{ row.item.nombre }}
                      </p>
                    </template>

                    <div class="flex justify-center">
                      <span
                        class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        :class="row.kind === 'manual'
                          ? 'bg-accent/20 text-main-dark'
                          : row.selected
                            ? 'bg-danger-bg text-danger'
                            : 'bg-main/10 text-main'"
                      >
                        <Plus
                          v-if="row.kind === 'manual'"
                          class="h-4 w-4"
                        />
                        <Trash2
                          v-else-if="row.selected"
                          class="h-4 w-4"
                        />
                        <Check
                          v-else
                          class="h-4 w-4"
                        />
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between gap-3 md:hidden">
                    <div class="min-w-0 flex-1 break-words text-sm text-stone-700">
                      <template v-if="row.kind === 'manual'">
                        <span class="font-semibold text-main">MANUAL</span>
                        {{ ' ' }}·{{ ' ' }}{{ row.label }}
                      </template>

                      <template v-else-if="row.kind === 'selected'">
                        <span class="font-semibold text-stone-900">{{ row.codProducto }}</span>
                        {{ ' ' }}·{{ ' ' }}
                        <span class="text-xs text-stone-500">{{ row.unidadLabel }}</span>
                        {{ ' ' }}·{{ ' ' }}{{ row.nombre }}
                      </template>

                      <template v-else>
                        <span class="font-semibold text-stone-900">{{ row.item.codProducto }}</span>
                        {{ ' ' }}·{{ ' ' }}
                        <span class="text-xs text-stone-500">{{ row.item.unidadLabel }}</span>
                        {{ ' ' }}·{{ ' ' }}{{ row.item.nombre }}
                      </template>
                    </div>

                    <span
                      class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      :class="row.kind === 'manual'
                        ? 'bg-accent/20 text-main-dark'
                        : row.selected
                          ? 'bg-danger-bg text-danger'
                          : 'bg-main/10 text-main'"
                    >
                      <Plus
                        v-if="row.kind === 'manual'"
                        class="h-4 w-4"
                      />
                      <Trash2
                        v-else-if="row.selected"
                        class="h-4 w-4"
                      />
                      <Check
                        v-else
                        class="h-4 w-4"
                      />
                    </span>
                  </div>
                </button>

                <div
                  v-if="!isSearching && !searchError && !hasVisibleRows && normalizedQuery.length >= 2"
                  class="px-4 py-5 text-sm text-stone-500"
                >
                  No encontramos productos para esta busqueda.
                </div>

                <div
                  v-if="!isSearching && !searchError && !hasVisibleRows && normalizedQuery.length === 0"
                  class="px-4 py-5 text-sm text-stone-500"
                >
                  No hay productos elegidos todavia.
                </div>
              </div>
            </div>
          </div>

          <button
            v-if="!isSearchFocused"
            type="button"
            class="inline-flex min-h-9 shrink-0 self-start items-center justify-center gap-2 rounded-lg border border-main bg-white px-4 text-sm font-semibold text-main transition hover:bg-main/5"
            @click="$emit('manual-request', '')"
          >
            <Plus class="h-4 w-4" />
            <span class="md:hidden">
              Manual
            </span>
            <span class="hidden md:inline">
              Producto manual
            </span>
          </button>
        </div>

        <p
          v-if="normalizedQuery.length > 0 && normalizedQuery.length < 2"
          class="mt-2 text-xs text-stone-500"
        >
          Escribe al menos 2 caracteres para buscar productos.
        </p>

        <p
          v-if="searchError"
          class="mt-3 text-sm font-medium text-danger"
        >
          {{ searchError }}
        </p>
      </div>

      <div class="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-4">
        <div
          v-if="selectedProducts.length > 0"
          class="  lg:max-h-65    space-y-2 overflow-y-auto pr-1"
        >
          <div
            v-for="item in selectedProducts"
            :key="item.localId"
            class="rounded-lg border border-stone-200 bg-white px-3 py-3"
          >
            <div class="hidden grid-cols-[10rem_8rem_minmax(0,1fr)_3.8rem] items-center gap-4 text-center text-sm md:grid">
              <p class="break-words font-semibold text-stone-900">
                {{ item.codProducto }}
              </p>
              <p class="break-words text-xs text-stone-500">
                {{ item.unidadLabel }}
              </p>
              <p class="break-words text-stone-700">
                {{ item.nombre }}
              </p>
              <div class="flex justify-center gap-1">
                <button
                  v-if="item.isTemporal"
                  type="button"
                  class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-main/25  text-main transition hover:bg-main/5"
                  @click="onEditTemporal(item.item)"
                >
                  <SquarePen  class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:border-danger/40 hover:bg-danger-bg hover:text-danger"
                  @click="$emit('remove-producto', item.localId)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 md:hidden">
              <p class="min-w-0 flex-1 break-words text-sm text-stone-700">
                <span class="font-semibold text-stone-900">{{ item.codProducto }}</span>
                {{ ' ' }}·{{ ' ' }}
                <span class="text-xs text-stone-500">{{ item.unidadLabel }}</span>
                {{ ' ' }}·{{ ' ' }}{{ item.nombre }}
              </p>

              <div class="flex shrink-0 items-center gap-2">
                <button
                  v-if="item.isTemporal"
                  type="button"
                  class="inline-flex h-9 items-center justify-center rounded-lg border border-main/25 px-3 text-xs font-semibold text-main transition hover:bg-main/5"
                  @click="onEditTemporal(item.item)"
                >
                  <SquarePen  class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:border-danger/40 hover:bg-danger-bg hover:text-danger"
                  @click="$emit('remove-producto', item.localId)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex min-h-32 items-center justify-center rounded-lg bg-stone-100 px-4 text-center text-sm text-stone-500"
        >
          Sin productos seleccionados.
        </div>

        <p
          v-if="fieldError"
          class="mt-3 text-sm font-medium text-danger"
        >
          {{ fieldError }}
        </p>
      </div>
    </template>

    <div
      v-else
      class="mt-4 rounded-lg border border-warning/30 bg-warning-bg px-4 py-4"
    >
      <div class="flex items-start gap-3">
        <PackageSearch class="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <p class="text-sm font-semibold text-stone-900">
            El paso 2 actual esta enfocado en productos.
          </p>
          <p class="mt-1 text-sm text-stone-600">
            La busqueda visual de servicios no forma parte de este ajuste.
          </p>
          <p
            v-if="fieldError"
            class="mt-2 text-sm font-medium text-danger"
          >
            {{ fieldError }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
