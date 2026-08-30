<script setup lang="ts">
import { BrushCleaning } from "lucide-vue-next";
import AutoComplete from "primevue/autocomplete";
import { computed, reactive, shallowRef, watch } from "vue";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import type {
  SeguimientoCrossFilter,
  SeguimientoTaskCatalog,
  TareasSeguimientoFilters,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

interface TrackingSearchOption {
  id: string | number;
  key: string;
  label: string;
  sourceId?: number;
  type: "worker" | "tracker";
}

interface Props {
  filters: TareasSeguimientoFilters;
  crossFilter: SeguimientoCrossFilter;
  trackers: SeguimientoTracker[];
  catalog: SeguimientoTaskCatalog;
  loading: boolean;
  disabled: boolean;
  showTrackers: boolean;
  mode?: "toolbar" | "panel";
  formId?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  apply: [filters: Partial<TareasSeguimientoFilters>];
  focus: [coordinates: SeguimientoCoordinates | null];
  "update:crossFilter": [filter: SeguimientoCrossFilter];
}>();
const draft = reactive({
  scheduledDate: props.filters.scheduledDate ?? "",
  areaId: props.filters.areaId ?? "",
  coordinates: "",
});
const primarySelection = shallowRef<TrackingSearchOption | string | null>(null);
const secondarySelection = shallowRef<TrackingSearchOption | string | null>(
  null,
);
const primarySuggestions = shallowRef<TrackingSearchOption[]>([]);
const secondarySuggestions = shallowRef<TrackingSearchOption[]>([]);
const displayMode = computed(() => props.mode ?? "toolbar");
const showAreaSelector = computed(() => props.catalog.areas.length > 1);
const selectedWorkers = computed(() =>
  props.catalog.areas
    .filter((area) => !draft.areaId || area.id === draft.areaId)
    .flatMap((area) => area.workers),
);
const primaryOptions = computed<TrackingSearchOption[]>(() =>
  [
    ...selectedWorkers.value.map((worker) => ({
      id: worker.id,
      key: `worker:${worker.id}`,
      label: worker.label,
      type: "worker" as const,
    })),
    ...(props.showTrackers ? props.trackers : []).map((tracker) => ({
      id: tracker.id,
      key: `tracker:${tracker.sourceId}`,
      label: tracker.label,
      sourceId: tracker.sourceId,
      type: "tracker" as const,
    })),
  ].sort((left, right) => left.label.localeCompare(right.label, "es")),
);
const validPrimarySelection = computed(() =>
  isTrackingSearchOption(primarySelection.value)
    ? primarySelection.value
    : null,
);
const validSecondarySelection = computed(() =>
  isTrackingSearchOption(secondarySelection.value)
    ? secondarySelection.value
    : null,
);
const secondaryOptions = computed(() => {
  const primary = validPrimarySelection.value;
  if (!primary) return [];

  return primaryOptions.value.filter((option) => option.type !== primary.type);
});
watch(
  () => props.filters,
  (filters) => {
    draft.scheduledDate = filters.scheduledDate ?? "";
    draft.areaId = filters.areaId ?? "";
  },
  { deep: true },
);
watch(validPrimarySelection, (primary, previousPrimary) => {
  if (primary?.key === previousPrimary?.key) return;
  secondarySelection.value = null;
  secondarySuggestions.value = [];
  emitCrossFilter();
});
watch(validSecondarySelection, () => emitCrossFilter());
watch(
  () => props.crossFilter,
  (filter) => {
    syncSelectionsFromFilter(filter);
  },
  { deep: true, immediate: true },
);
watch(
  () => props.catalog.areas,
  (areas) => {
    const [area] = areas;
    if (areas.length !== 1 || !area || draft.areaId === area.id) return;
    draft.areaId = area.id;
    apply();
  },
  { immediate: true },
);

function apply(): void {
  emit("apply", {
    scheduledDate: draft.scheduledDate || null,
    areaId: draft.areaId || null,
    assignedUserId: null,
    sourceId: null,
  });
}

function isTrackingSearchOption(
  value: TrackingSearchOption | string | null,
): value is TrackingSearchOption {
  return Boolean(value && typeof value === "object" && "type" in value);
}

function filterOptions(
  options: TrackingSearchOption[],
  query: string,
): TrackingSearchOption[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const matches = normalizedQuery
    ? options.filter(
        (option) =>
          option.label.toLocaleLowerCase("es").includes(normalizedQuery) ||
          String(option.id).includes(normalizedQuery),
      )
    : options;

  // PrimeVue necesita una referencia nueva aun con una búsqueda vacía para
  // reabrir su overlay después de completar una consulta previa.
  return [...matches];
}

function completePrimarySearch(event: { query: string }): void {
  primarySuggestions.value = filterOptions(primaryOptions.value, event.query);
}

function completeSecondarySearch(event: { query: string }): void {
  secondarySuggestions.value = filterOptions(
    secondaryOptions.value,
    event.query,
  );
}

function emitCrossFilter(): void {
  const selections = [
    validPrimarySelection.value,
    validSecondarySelection.value,
  ];
  const worker = selections.find((selection) => selection?.type === "worker");
  const tracker = selections.find((selection) => selection?.type === "tracker");
  emit("update:crossFilter", {
    workerId: worker ? String(worker.id) : null,
    sourceId: tracker?.sourceId ?? null,
  });
}

function clearCrossSearch(): void {
  primarySelection.value = null;
  secondarySelection.value = null;
  primarySuggestions.value = [];
  secondarySuggestions.value = [];
  emit("update:crossFilter", { workerId: null, sourceId: null });
}

function syncSelectionsFromFilter(filter: SeguimientoCrossFilter): void {
  if (!filter.workerId && filter.sourceId === null) {
    primarySelection.value = null;
    secondarySelection.value = null;
    primarySuggestions.value = [];
    secondarySuggestions.value = [];
    return;
  }

  const worker = primaryOptions.value.find(
    (option) => option.type === "worker" && option.id === filter.workerId,
  );
  const tracker = primaryOptions.value.find(
    (option) =>
      option.type === "tracker" && option.sourceId === filter.sourceId,
  );
  const primary = worker ?? tracker ?? null;
  const secondary = primary?.type === "worker" ? tracker : worker;

  if (validPrimarySelection.value?.key !== primary?.key) {
    primarySelection.value = primary;
  }
  if (validSecondarySelection.value?.key !== secondary?.key) {
    secondarySelection.value = secondary ?? null;
  }
}

function focusCoordinates(): void {
  const [latitude, longitude] = draft.coordinates
    .split(",")
    .map((value) => Number(value.trim()));
  emit(
    "focus",
    Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude }
      : null,
  );
}
</script>

<template>
  <form
    :id="props.formId"
    class="tracking-filters-bar grid min-w-0 gap-2 border border-slate-200 bg-white/95 p-2 shadow-lg shadow-slate-950/10 backdrop-blur"
    :class="[
      displayMode === 'panel'
        ? 'tracking-filters-bar--panel w-full grid-cols-1 rounded-none border-x-0 border-t-0 bg-[#f8f7f4] p-4 shadow-none'
        : 'tracking-filters-bar--toolbar grid-cols-2 rounded-none border-x-0 border-t-0',
      {
        'tracking-filters-bar--expanded': validPrimarySelection,
        'tracking-filters-bar--has-area': showAreaSelector,
      },
    ]"
    @submit.prevent="apply"
  >
    <label
      v-if="showAreaSelector"
      class="grid min-w-0 gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-slate-600"
      ><span :class="displayMode === 'toolbar' ? 'sr-only' : ''">Área</span
      ><select
        v-model="draft.areaId"
        :disabled="disabled"
        class="h-10 w-full min-w-0 rounded-[0.55rem] border border-slate-200 bg-white px-2.5 text-xs font-medium normal-case text-slate-700 outline-none transition focus:border-main focus:ring-2 focus:ring-main/20 disabled:cursor-not-allowed disabled:opacity-55"
        @change="displayMode === 'toolbar' && apply()"
      >
        <option value="">Todas</option>
        <option v-for="area in catalog.areas" :key="area.id" :value="area.id">
          {{ area.label }}
        </option>
      </select></label
    >
    <label
      class="grid min-w-0 gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-slate-600"
      ><span :class="displayMode === 'toolbar' ? 'sr-only' : ''">Fecha</span
      ><input
        v-model="draft.scheduledDate"
        :disabled="disabled"
        class="h-10 w-full min-w-0 rounded-[0.55rem] border border-slate-200 bg-white px-2.5 text-xs font-medium normal-case text-slate-700 outline-none transition focus:border-main focus:ring-2 focus:ring-main/20 disabled:cursor-not-allowed disabled:opacity-55"
        type="date"
        @change="displayMode === 'toolbar' && apply()"
    /></label>
    <label
      class="grid min-w-0 gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-slate-600"
      ><span :class="displayMode === 'toolbar' ? 'sr-only' : ''"
        >Trabajador o equipo</span
      ><AutoComplete
        v-model="primarySelection"
        :disabled="disabled"
        :suggestions="primarySuggestions"
        option-label="label"
        force-selection
        complete-on-focus
        dropdown
        input-class="tracking-autocomplete-input"
        dropdown-class="tracking-autocomplete-dropdown"
        panel-class="tracking-autocomplete-panel"
        class="tracking-autocomplete"
        placeholder="Trabajador o equipo"
        @complete="completePrimarySearch"
      >
        <template #option="{ option }">
          <div class="flex items-center justify-between gap-3 px-1 py-0.5">
            <span class="truncate">{{ option.label }}</span>
            <span
              class="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400"
            >
              {{ option.type === "worker" ? "Trabajador" : "Equipo" }}
            </span>
          </div>
        </template>
      </AutoComplete></label
    >
    <label
      v-if="validPrimarySelection"
      class="grid min-w-0 gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-slate-600"
      ><span :class="displayMode === 'toolbar' ? 'sr-only' : ''">
        {{
          validPrimarySelection.type === "worker" ? "Equipo" : "Trabajador"
        }} </span
      ><AutoComplete
        v-model="secondarySelection"
        :disabled="disabled"
        :suggestions="secondarySuggestions"
        option-label="label"
        force-selection
        complete-on-focus
        dropdown
        input-class="tracking-autocomplete-input"
        dropdown-class="tracking-autocomplete-dropdown"
        panel-class="tracking-autocomplete-panel"
        class="tracking-autocomplete"
        :placeholder="
          validPrimarySelection.type === 'worker' ? 'Equipo' : 'Trabajador'
        "
        @complete="completeSecondarySearch"
      >
        <template #option="{ option }">
          <div class="flex items-center justify-between gap-3 px-1 py-0.5">
            <span class="truncate">{{ option.label }}</span>
            <span
              class="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400"
            >
              {{ option.type === "worker" ? "Trabajador" : "Equipo" }}
            </span>
          </div>
        </template>
      </AutoComplete></label
    >
    <button
      v-if="validPrimarySelection"
      class="mt-auto grid size-10 place-items-center rounded-[0.55rem] border border-slate-200 bg-slate-50 text-main transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-55"
      :disabled="disabled"
      type="button"
      aria-label="Limpiar búsqueda cruzada"
      title="Limpiar búsqueda"
      @click="clearCrossSearch"
    >
      <BrushCleaning :size="17" aria-hidden="true" />
    </button>
    <label
      class="grid min-w-0 gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-slate-600"
      ><span :class="displayMode === 'toolbar' ? 'sr-only' : ''"
        >Latitud, longitud</span
      ><input
        v-model="draft.coordinates"
        :disabled="disabled"
        class="h-10 w-full min-w-0 rounded-[0.55rem] border border-slate-200 bg-white px-2.5 font-mono text-[11px] font-medium normal-case text-slate-700 outline-none transition focus:border-main focus:ring-2 focus:ring-main/20 disabled:cursor-not-allowed disabled:opacity-55"
        placeholder="8.43, -82.51"
        @keyup.enter.prevent="focusCoordinates"
    /></label>
    <button
      class="h-10 w-11 shrink-0 rounded-[0.55rem] bg-main px-0 text-xs font-extrabold text-white transition hover:bg-main-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main disabled:cursor-not-allowed disabled:opacity-55"
      :disabled="disabled"
      type="button"
      @click="focusCoordinates"
    >
      Ir
    </button>
  </form>
</template>

<style scoped>
.tracking-filters-bar--toolbar {
  width: auto;
  min-width: 0;
  grid-template-columns:
    minmax(0, 0.75fr) minmax(0, 1.35fr) minmax(0, 1.2fr)
    2.75rem;
  transition: grid-template-columns 200ms ease;
}

.tracking-filters-bar--toolbar.tracking-filters-bar--expanded {
  grid-template-columns:
    minmax(0, 0.65fr) minmax(0, 1fr) minmax(0, 1fr)
    2.5rem minmax(0, 1.1fr) 2.75rem;
}

.tracking-filters-bar--toolbar.tracking-filters-bar--has-area {
  grid-template-columns:
    minmax(0, 0.7fr) minmax(0, 0.7fr) minmax(0, 1.25fr)
    minmax(0, 1.1fr) 2.75rem;
}

.tracking-filters-bar--toolbar.tracking-filters-bar--has-area.tracking-filters-bar--expanded {
  grid-template-columns:
    minmax(0, 0.55fr) minmax(0, 0.55fr) minmax(0, 1fr)
    minmax(0, 1fr) 2.5rem minmax(0, 1.05fr) 2.75rem;
}

.tracking-filters-bar--panel {
  width: 100%;
}

/* Anula el tema de PrimeVue solamente para los AutoComplete de rastreo. */
.tracking-autocomplete {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 2.5rem;
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 0.55rem;
  background: white;
  transition:
    border-color 150ms,
    box-shadow 150ms;
}

.tracking-autocomplete:focus-within {
  border-color: var(--color-main);
  box-shadow: 0 0 0 2px rgb(from var(--color-main) r g b / 0.2);
}

.tracking-autocomplete:deep(.tracking-autocomplete-input) {
  min-width: 0;
  flex: 1;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0.625rem;
  color: rgb(51 65 85);
  font-size: 0.75rem;
  font-weight: 500;
  outline: 0;
}

.tracking-autocomplete:deep(.tracking-autocomplete-dropdown) {
  width: 2.5rem;
  border: 0 !important;
  border-left: 1px solid rgb(226 232 240) !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: rgb(71 85 105);
  box-shadow: none !important;
}

:global(.tracking-autocomplete-panel) {
  margin-top: 0.25rem;
  overflow: hidden;
  border: 1px solid rgb(226 232 240) !important;
  border-radius: 0.75rem !important;
  background: white !important;
  box-shadow: 0 16px 30px rgb(15 23 42 / 0.16) !important;
}

:global(.tracking-autocomplete-panel .p-autocomplete-list) {
  padding: 0.25rem !important;
}

:global(.tracking-autocomplete-panel .p-autocomplete-option) {
  margin: 0 !important;
  border-radius: 0.5rem !important;
  padding: 0.5rem 0.625rem !important;
  color: rgb(51 65 85) !important;
  font-size: 0.75rem !important;
}

:global(.tracking-autocomplete-panel .p-autocomplete-option:hover),
:global(.tracking-autocomplete-panel .p-autocomplete-option.p-focus) {
  background: rgb(241 245 249) !important;
  color: rgb(30 41 59) !important;
}

@media (max-width: 767px) {
  .tracking-filters-bar--toolbar {
    width: 100%;
    max-width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
