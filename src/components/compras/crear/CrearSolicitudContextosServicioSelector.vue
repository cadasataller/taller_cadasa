<script setup lang="ts">
import {
  CircleAlert,
  CircleEllipsis,
  CirclePlus,
  Layers,
  LoaderCircle,
  MapPinHouse,
  Search,
  Tractor,
  Trash,
  Warehouse,
  X,
} from 'lucide-vue-next';
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue';

import CrearSolicitudEquipoChip from './CrearSolicitudEquipoChip.vue';
import type { CatalogoContextoDestinoOption } from '@/stores/db_compras/catalogo_contexto_destino/catalogoContextoDestino.types';
import type { EquipoOption } from '@/stores/dbequipos/equipos/equipos.types';
import type {
  ContextoDestinoTipoOrigen,
  DestinoSeleccionado,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

type NormalizedServiceSourceRow =
  | {
    key: string;
    source: 'contexto';
    item: CatalogoContextoDestinoOption;
    label: string;
    tipoOrigen: CatalogoContextoDestinoOption['tipoOrigen'];
    selected: boolean;
    conflict: boolean;
  }
  | {
    key: string;
    source: 'equipo';
    item: EquipoOption;
    label: string;
    tipoOrigen: 'equipo';
    selected: boolean;
    conflict: boolean;
  };

const props = defineProps<{
  selectedItems: DestinoSeleccionado[];
  contextOptions: CatalogoContextoDestinoOption[];
  equipmentSearchResults: EquipoOption[];
  isLoading: boolean;
  isSearchingEquipment: boolean;
  loadError: string | null;
  searchError: string | null;
  fieldError?: string;
}>();

const emit = defineEmits<{
  (e: 'add', item: CatalogoContextoDestinoOption): void;
  (e: 'add:equipo', item: EquipoOption): void;
  (e: 'remove', payload: { codigo: string; tipoOrigen?: string }): void;
  (e: 'search:equipos', value: string): void;
}>();

const query = shallowRef('');
const isFocused = shallowRef(false);
let blurTimer: ReturnType<typeof setTimeout> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const selectedCodes = computed(() => new Set(props.selectedItems.map((item) => `${item.tipoOrigen}:${item.codigo}`)));
const selectedTipoOrigen = computed(() => props.selectedItems[0]?.tipoOrigen ?? null);
const normalizedQuery = computed(() => query.value.trim().toLocaleLowerCase());
const hasEquipmentSearchTerm = computed(() => normalizedQuery.value.length >= 3);
const selectedRows = computed<NormalizedServiceSourceRow[]>(() => props.selectedItems.map((item) => {
  if (item.tipoOrigen === 'equipo') {
    return {
      key: `equipo-${item.codigo}`,
      source: 'equipo' as const,
      item: {
        id: item.id,
        codEquipo: item.codigo,
        modelo: item.modelo,
        marca: item.marca,
        tipo: item.tipo,
        label: item.label,
      },
      label: item.label,
      tipoOrigen: 'equipo' as const,
      selected: true,
      conflict: false,
    };
  }

  return {
    key: `contexto-${item.codigo}`,
    source: 'contexto' as const,
    item: {
      id: item.id,
      codigo: item.codigo,
      nombre: item.label,
      tipoOrigen: item.tipoOrigen,
      restringidoAServicios: false,
      activo: true,
    },
    label: item.label,
    tipoOrigen: item.tipoOrigen,
    selected: true,
    conflict: false,
  };
}));

watch(query, (value) => {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  const normalizedValue = value.trim();

  debounceTimer = setTimeout(() => {
    emit('search:equipos', normalizedValue.length >= 3 ? normalizedValue : '');
  }, 300);
});

const contextRows = computed<NormalizedServiceSourceRow[]>(() => {
  return props.contextOptions
    .filter((item) => (
      !normalizedQuery.value
      || item.nombre.toLocaleLowerCase().includes(normalizedQuery.value)
    ))
    .map((item) => ({
      key: `contexto-${item.codigo}`,
      source: 'contexto' as const,
      item,
      label: item.nombre,
      tipoOrigen: item.tipoOrigen,
      selected: selectedCodes.value.has(`${item.tipoOrigen}:${item.codigo}`),
      conflict: selectedTipoOrigen.value !== null && selectedTipoOrigen.value !== item.tipoOrigen,
    }));
});

const equipmentRows = computed<NormalizedServiceSourceRow[]>(() => props.equipmentSearchResults
  .map((item) => ({
    key: `equipo-${item.codEquipo}`,
    source: 'equipo' as const,
    item,
    label: item.label,
    tipoOrigen: 'equipo',
    selected: selectedCodes.value.has(`equipo:${item.codEquipo}`),
    conflict: selectedTipoOrigen.value !== null && selectedTipoOrigen.value !== 'equipo',
  })));

const rows = computed<NormalizedServiceSourceRow[]>(() => {
  const nextRows = hasEquipmentSearchTerm.value
    ? [...contextRows.value, ...equipmentRows.value]
    : [...contextRows.value];

  const rowMap = new Map<string, NormalizedServiceSourceRow>(
    nextRows.map((row) => [row.key, row])
  );

  selectedRows.value.forEach((row) => {
    rowMap.set(row.key, {
      ...(rowMap.get(row.key) ?? row),
      ...row,
    });
  });

  return [
    ...selectedRows.value,
    ...[...rowMap.values()].filter((row) => !row.selected),
  ];
});

const shouldShowResults = computed(() =>
  selectedRows.value.length > 0
  || (isFocused.value && (!props.isLoading || contextRows.value.length > 0 || hasEquipmentSearchTerm.value))
);

const clearQuery = (): void => {
  query.value = '';
  emit('search:equipos', '');
};

const handleFocus = (): void => {
  if (blurTimer !== null) {
    clearTimeout(blurTimer);
    blurTimer = null;
  }

  isFocused.value = true;
};

const handleBlur = (): void => {
  blurTimer = setTimeout(() => {
    isFocused.value = false;
  }, 150);
};

const handleRowAction = (row: NormalizedServiceSourceRow): void => {
  if (row.conflict) {
    return;
  }

  if (row.selected) {
    const codigo = row.source === 'equipo' ? row.item.codEquipo : row.item.codigo;
    emit('remove', { codigo, tipoOrigen: row.tipoOrigen });
    return;
  }

  if (row.source === 'contexto') {
    emit('add', row.item);
    return;
  }

  emit('add:equipo', row.item);
};

onBeforeUnmount(() => {
  if (blurTimer !== null) {
    clearTimeout(blurTimer);
  }

  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
});

const searchStateMessage = computed(() => {
  if (props.isLoading) {
    return 'Cargando contextos...';
  }

  if (hasEquipmentSearchTerm.value) {
    return 'No hay resultados para la búsqueda actual.';
  }

  return 'No hay destinos disponibles para este tipo de solicitud.';
});

const ORIGIN_LEGEND: Array<{
  tipoOrigen: ContextoDestinoTipoOrigen;
  label: string;
  icon: typeof Tractor;
}> = [
  { tipoOrigen: 'grupo_equipo', label: 'GRUPO EQUIPO', icon: Layers },
  { tipoOrigen: 'equipo', label: 'EQUIPO', icon: Tractor },
  { tipoOrigen: 'instalacion_taller', label: 'INSTALACION TALLER', icon: Warehouse },
  { tipoOrigen: 'area_operativa', label: 'AREA OPERATIVA', icon: MapPinHouse },
  { tipoOrigen: 'otros', label: 'OTROS', icon: CircleEllipsis },
];

const getOriginLabel = (tipoOrigen: ContextoDestinoTipoOrigen): string =>
  tipoOrigen.replace(/[_-]+/g, ' ').toLocaleUpperCase();

const getOriginIcon = (tipoOrigen: ContextoDestinoTipoOrigen) => {
  if (tipoOrigen === 'grupo_equipo') {
    return Layers;
  }

  if (tipoOrigen === 'equipo') {
    return Tractor;
  }

  if (tipoOrigen === 'instalacion_taller') {
    return Warehouse;
  }

  if (tipoOrigen === 'area_operativa') {
    return MapPinHouse;
  }

  return CircleEllipsis;
};

const getRowClassName = (row: NormalizedServiceSourceRow): string => {
  if (row.conflict) {
    return 'bg-danger/8 text-danger';
  }

  if (row.selected) {
    return 'bg-main/8 text-main';
  }

  return 'bg-white text-stone-700';
};

const getActionIcon = (row: NormalizedServiceSourceRow) => {
  if (row.selected) {
    return Trash;
  }

  if (row.conflict) {
    return CircleAlert;
  }

  return CirclePlus;
};

const getActionIconClassName = (row: NormalizedServiceSourceRow): string => {
  if (row.selected) {
    return 'text-danger';
  }

  if (row.conflict) {
    return 'text-danger/80';
  }

  return 'text-main';
};

const getActionLabel = (row: NormalizedServiceSourceRow): string => {
  if (row.selected) {
    return `Quitar ${row.label}`;
  }

  if (row.conflict) {
    return `${row.label} no disponible`;
  }

  return `Agregar ${row.label}`;
};
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-3 overflow-y-auto lg:overflow-hidden">
    <label class="block text-xs font-semibold text-stone-800">
      Destino <span class="text-danger">*</span>
    </label>

    <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-2 lg:overflow-hidden">
      <div class="flex min-h-0 flex-col gap-3">
        <div
          class="rounded-lg border bg-white px-3 py-2"
          :class="fieldError ? 'border-danger bg-danger-bg/30' : 'border-stone-300'"
        >
          <div class="flex items-center gap-3">
            <Search class="h-5 w-5 text-stone-400" />
            <input
              v-model="query"
              type="text"
              placeholder="Buscar destino o equipo"
              class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              @focus="handleFocus"
              @blur="handleBlur"
            >
            <button
              v-if="query.trim().length > 0"
              type="button"
              class="rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              @mousedown.prevent
              @click="clearQuery"
            >
              <X class="h-4 w-4" />
            </button>
            <LoaderCircle
              v-if="isSearchingEquipment || isLoading"
              class="h-4 w-4 animate-spin text-main"
            />
          </div>
          <p
            v-if="query.trim().length > 0 && query.trim().length < 3"
            class="mt-2 text-xs text-stone-500"
          >
            Puedes filtrar destinos desde el primer carácter. Para equipos, ingresa al menos 3 caracteres.
          </p>
        </div>

        <div
          v-if="selectedItems.length > 0"
          class="sticky top-0 z-40 -mt-1 rounded-lg border border-stone-200 bg-stone-50/95 px-3 py-2 shadow-sm backdrop-blur lg:hidden"
        >
          <p class="mb-2 text-[10px] text-black">
            Se debe elegir solo destinos del mismo origen
          </p>
          <div class="flex flex-wrap items-start gap-2">
            <CrearSolicitudEquipoChip
              v-for="item in selectedItems"
              :key="`${item.tipoOrigen}-${item.codigo}`"
              :label="item.label"
              full-width-mobile
              @remove="emit('remove', { codigo: item.codigo, tipoOrigen: item.tipoOrigen })"
            />
          </div>
        </div>

        <div
          v-else
          class="sticky top-0 z-40 -mt-1 rounded-lg border border-dashed border-stone-300 bg-white/95 px-3 py-2 text-xs text-stone-500 shadow-sm backdrop-blur md:text-sm lg:hidden"
        >
          <p class="mb-2 text-[10px] text-black">
            Se debe elegir solo destinos del mismo origen
          </p>
          Aún no has seleccionado destinos.
        </div>

        <div
          id="result_search_servicios_fuentes"
          class="flex-1 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50"
          :class="shouldShowResults || isSearchingEquipment || isLoading ? 'min-h-[12rem] lg:min-h-0' : 'hidden lg:block lg:min-h-0'"
        >
          <div
            v-if="isLoading && rows.length === 0"
            class="flex h-full min-h-[12rem] items-center justify-center gap-2 px-4 text-center text-sm text-stone-500"
          >
            <LoaderCircle class="h-4 w-4 animate-spin text-main" />
            Cargando contextos...
          </div>

          <template v-else-if="shouldShowResults && rows.length > 0">
            <div class="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
              <div class="flex flex-wrap gap-2 px-3 py-2">
                <span
                  v-for="item in ORIGIN_LEGEND"
                  :key="item.tipoOrigen"
                  class="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-600"
                >
                  <component
                    :is="item.icon"
                    class="h-3.5 w-3.5"
                  />
                  <span>{{ item.label }}</span>
                </span>
              </div>

              <div class="grid grid-cols-[3rem_minmax(0,1fr)_9rem_3.5rem] items-center gap-2 border-t border-stone-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                <span class="text-center">Tipo</span>
                <span class="text-center">Destino</span>
                <span class="text-center">Origen</span>
                <span class="text-center">Estado</span>
              </div>
            </div>

            <div>
              <div
                v-for="row in rows"
                :key="row.key"
                class="grid grid-cols-[3rem_minmax(0,1fr)_9rem_3.5rem] items-center gap-2 border-b border-stone-200 px-3 py-2 text-xs transition last:border-b-0"
                :class="[getRowClassName(row), row.conflict ? 'cursor-not-allowed' : 'cursor-pointer']"
                :aria-label="getActionLabel(row)"
                :title="getActionLabel(row)"
                @mousedown.prevent
                @click="handleRowAction(row)"
              >
                <div class="flex justify-center">
                  <component
                    :is="getOriginIcon(row.tipoOrigen)"
                    class="h-4 w-4"
                  />
                </div>

                <div class="min-w-0 text-center">
                  <span class="block truncate font-medium">
                    {{ row.label }}
                  </span>
                </div>

                <div class="min-w-0 text-center">
                  <span class="block truncate font-semibold">
                    {{ getOriginLabel(row.tipoOrigen) }}
                  </span>
                </div>

                <div class="flex justify-center">
                  <span class="inline-flex rounded-full p-1">
                    <component
                      :is="getActionIcon(row)"
                      class="h-4 w-4"
                      :class="getActionIconClassName(row)"
                    />
                  </span>
                </div>
              </div>
            </div>
          </template>

          <div
            v-else
            class="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-stone-500"
          >
            {{ searchStateMessage }}
          </div>
        </div>
      </div>

      <div class="hidden min-h-[12rem] overflow-hidden rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 lg:block lg:min-h-0">
        <p class="mb-3 text-[10px] text-black">
          Se debe elegir solo destinos del mismo origen
        </p>
        <div
          v-if="selectedItems.length > 0"
          class="grid max-h-full grid-cols-2 items-start content-start gap-3 overflow-y-auto lg:grid-cols-3"
        >
          <CrearSolicitudEquipoChip
            v-for="item in selectedItems"
            :key="`${item.tipoOrigen}-${item.codigo}`"
            :label="item.label"
            @remove="emit('remove', { codigo: item.codigo, tipoOrigen: item.tipoOrigen })"
          />
        </div>

        <div
          v-else
          class="rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2 text-xs text-stone-500 md:text-sm"
        >
          Aún no has seleccionado destinos.
        </div>
      </div>
    </div>

    <p
      v-if="loadError"
      class="text-sm font-medium text-danger"
    >
      {{ loadError }}
    </p>

    <p
      v-if="searchError"
      class="text-sm font-medium text-danger"
    >
      {{ searchError }}
    </p>

    <p
      v-if="fieldError"
      class="text-sm font-medium text-danger"
    >
      {{ fieldError }}
    </p>
  </div>
</template>
