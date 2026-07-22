<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ChevronDown,
  Eraser,
  Filter,
  Plus,
  Search,
} from 'lucide-vue-next';

import SolicitudesGrupoTabs from '@/components/compras/list/SolicitudesGrupoTabs.vue';
import { prioridadOptions } from '@/components/compras/list/solicitudesListOptions';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraGrupoOption,
  SolicitudCompraListFilters,
  SolicitudCompraSeguimientoFilterOption,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = defineProps<{
  filters: SolicitudCompraListFilters;
  loading: boolean;
  searching: boolean;
  activeGrupo: SolicitudCompraGrupoListado;
  groupOptions: SolicitudCompraGrupoOption[];
  seguimientoOptions: SolicitudCompraSeguimientoFilterOption[];
  canUseCreatedByMeFilter: boolean;
  isMobile: boolean;
  canCreate?: boolean;
  createLoading?: boolean;
  canViewDrafts?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:grupo', value: SolicitudCompraGrupoListado): void;
  (e: 'update:seguimiento', value: string | null): void;
  (e: 'update:prioridad', value: string | null): void;
  (e: 'update:fechaDesde', value: string | null): void;
  (e: 'update:fechaHasta', value: string | null): void;
  (e: 'update:soloBloqueadas', value: boolean): void;
  (e: 'update:soloCreadasPorMi', value: boolean): void;
  (e: 'update:soloDiferenciaOc', value: boolean): void;
  (e: 'create'): void;
  (e: 'viewDrafts'): void;
}>();

const desktopSearchPlaceholder = 'Buscar por folio, observación, destino u orden de compra';
const mobileSearchPlaceholder = 'Buscar folio, observación o destino';

const normalizedSeguimientoValue = computed(() => props.filters.seguimientoCodigo ?? '');
const normalizedPrioridadValue = computed(() => props.filters.prioridadCodigo ?? '');
const hasGroupOptions = computed(() => props.groupOptions.length > 0);
const hasSeguimientoOptions = computed(() => props.seguimientoOptions.length > 0);
const searchPlaceholder = computed(() =>
  props.isMobile ? mobileSearchPlaceholder : desktopSearchPlaceholder
);
const mobileFiltersOpen = ref(false);
const activeMobileFiltersCount = computed(() => {
  let count = 0;

  if (props.filters.seguimientoCodigo) {
    count += 1;
  }

  if (props.filters.prioridadCodigo) {
    count += 1;
  }

  if (props.filters.fechaDesde || props.filters.fechaHasta) {
    count += 1;
  }

  if (props.filters.soloBloqueadas) {
    count += 1;
  }

  if (props.filters.soloCreadasPorMi) {
    count += 1;
  }

  if (props.filters.soloDiferenciaOc) {
    count += 1;
  }

  return count;
});
const mobileFiltersLabel = computed(() =>
  activeMobileFiltersCount.value > 0
    ? `Filtros (${activeMobileFiltersCount.value})`
    : 'Filtros'
);
const shouldShowCreateButton = computed(() => props.canCreate ?? false);
const shouldShowDraftsButton = computed(() => props.canViewDrafts ?? false);

const onSearchInput = (event: Event): void => {
  emit('update:search', (event.target as HTMLInputElement).value);
};

const onSeguimientoChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:seguimiento', value || null);
};

const onPrioridadChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:prioridad', value || null);
};

const onFechaDesdeChange = (event: Event): void => {
  const value = (event.target as HTMLInputElement).value;
  emit('update:fechaDesde', value || null);
};

const onFechaHastaChange = (event: Event): void => {
  const value = (event.target as HTMLInputElement).value;
  emit('update:fechaHasta', value || null);
};

const onSoloBloqueadasChange = (event: Event): void => {
  emit('update:soloBloqueadas', (event.target as HTMLInputElement).checked);
};

const onSoloCreadasPorMiChange = (event: Event): void => {
  emit('update:soloCreadasPorMi', (event.target as HTMLInputElement).checked);
};

const onSoloDiferenciaOcChange = (event: Event): void => {
  emit('update:soloDiferenciaOc', (event.target as HTMLInputElement).checked);
};

const toggleMobileFilters = (): void => {
  mobileFiltersOpen.value = !mobileFiltersOpen.value;
};
</script>

<template>
  <section
    class="overflow-hidden rounded-[1.75rem] border border-stone-300 bg-white/90 shadow-sm backdrop-blur"
    :class="isMobile ? 'p-3' : ''"
  >
    <div class="divide-y divide-stone-200/90">
      <div class="grid gap-3 p-3 lg:grid-cols-[minmax(0,1.55fr)_auto_auto] lg:items-center">
        <label class="flex min-h-8 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white">
          <Search class="h-4 w-4 shrink-0 text-stone-400" />
          <input
            :value="filters.busqueda"
            type="search"
            :placeholder="searchPlaceholder"
            class="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
            @input="onSearchInput"
          >
        </label>

        <SolicitudesGrupoTabs
          v-if="hasGroupOptions"
          :model-value="activeGrupo"
          :options="groupOptions"
          @update:model-value="emit('update:grupo', $event)"
        />

        <div
          id="row_filter_erase"
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
          :class="isMobile ? '' : 'lg:contents'"
        >
          

          <div 
            class="flex flex-col gap-3 md:flex-row  md:items-center sm:justify-end"
            :class="isMobile ? 'w-full' : 'lg:justify-self-end'"
          >
            <button
              v-if="shouldShowDraftsButton"
              type="button"
              class="inline-flex min-h-8 items-center justify-center gap-2 cursor-pointer rounded-2xl border border-accent bg-white px-5 text-sm font-semibold text-main shadow-sm transition hover:bg-stone-50"
              @click="emit('viewDrafts')"
            >
              <Eraser class="h-4 w-4" />
              <span>Ver borradores</span>
            </button>
            <button
            v-if="isMobile"
            type="button"
            class="inline-flex min-h-8 items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-stone-50 px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-400 hover:bg-white"
            :aria-expanded="mobileFiltersOpen"
            aria-controls="solicitudes-mobile-filters"
            @click="toggleMobileFilters"
          >
            <Filter class="h-4 w-4" />
            <span>{{ mobileFiltersLabel }}</span>
            <ChevronDown
              class="h-4 w-4 transition"
              :class="mobileFiltersOpen ? 'rotate-180' : ''"
            />
          </button>

            <button
              v-if="!isMobile && shouldShowCreateButton"
              type="button"
              class="inline-flex min-h-8 items-center justify-center gap-2 rounded-2xl border border-accent bg-accent px-5 text-sm font-semibold text-main-dark shadow-sm transition hover:bg-accent-light disabled:cursor-wait disabled:opacity-90"
              :disabled="props.createLoading"
              @click="emit('create')"
            >
              <span
                v-if="props.createLoading"
                class="h-4 w-4 animate-spin rounded-full border-2 border-main-dark/30 border-t-main-dark"
                aria-hidden="true"
              />
              <Plus
                v-else
                class="h-4 w-4"
              />
              <span>Crear</span>
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="!isMobile || mobileFiltersOpen"
        id="solicitudes-mobile-filters"
        class="flex flex-wrap items-center gap-3 px-3 py-3"
      >
        <label
          v-if="hasSeguimientoOptions"
          class="relative flex min-h-8 min-w-[15rem] flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white sm:flex-none"
        >
          <select
            :value="normalizedSeguimientoValue"
            class="w-full cursor-pointer bg-transparent pr-4 text-sm text-stone-900 outline-none"
            @change="onSeguimientoChange"
          >
            <option
              v-for="option in seguimientoOptions"
              :key="option.value ?? 'all-seguimientos'"
              :value="option.value ?? ''"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="relative flex min-h-8 min-w-[15rem] flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white sm:flex-none">
          <select
            :value="normalizedPrioridadValue"
            class="w-full cursor-pointer bg-transparent pr-6 text-sm text-stone-900 outline-none"
            @change="onPrioridadChange"
          >
            <option
              v-for="option in prioridadOptions"
              :key="option.value ?? 'all-prioridades'"
              :value="option.value ?? ''"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <span class="text-sm font-semibold text-stone-700">Fechas:</span>

        <div class="flex flex-wrap items-center gap-2">
          <label class="flex min-h-8 min-w-[8rem] items-center rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white">
            <input
              :value="filters.fechaDesde ?? ''"
              type="date"
              class="w-full bg-transparent cursor-pointer text-sm text-stone-900 outline-none"
              @input="onFechaDesdeChange"
            >
          </label>

          <span class="text-sm text-stone-500">-</span>

          <label class="flex min-h-8 min-w-[8rem] items-center rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-700 shadow-sm transition focus-within:border-stone-400 focus-within:bg-white">
            <input
              :value="filters.fechaHasta ?? ''"
              type="date"
              class="w-full bg-transparent cursor-pointer text-sm text-stone-900 outline-none"
              @input="onFechaHastaChange"
            >
          </label>
        </div>

        <label class="inline-flex min-h-8 items-center cursor-pointer gap-2 text-sm text-stone-700">
          <input
            :checked="filters.soloBloqueadas"
            type="checkbox"
            class="h-4 w-4 rounded border-stone-300 cursor-pointer text-stone-900 focus:ring-stone-400"
            @change="onSoloBloqueadasChange"
          >
          <span>Bloqueadas</span>
        </label>

        <label
          v-if="canUseCreatedByMeFilter"
          class="inline-flex min-h-8 items-center cursor-pointer gap-2 text-sm text-stone-700"
        >
          <input
            :checked="filters.soloCreadasPorMi"
            type="checkbox"
            class="h-4 w-4 rounded border-stone-300 cursor-pointer text-stone-900 focus:ring-stone-400"
            @change="onSoloCreadasPorMiChange"
          >
          <span>Creadas por mi</span>
        </label>

        <label class="inline-flex min-h-8 items-center cursor-pointer gap-2 text-sm text-stone-700">
          <input
            :checked="filters.soloDiferenciaOc"
            type="checkbox"
            class="h-4 w-4 rounded border-stone-300 cursor-pointer text-stone-900 focus:ring-stone-400"
            @change="onSoloDiferenciaOcChange"
          >
          <span>Diferencia OC</span>
        </label>
      </div>
    </div>
  </section>
</template>
