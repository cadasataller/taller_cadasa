<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import type { TareasSeguimientoFilters } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";
import type { SeguimientoTaskCatalog } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";
interface Props {
  filters: TareasSeguimientoFilters;
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
}>();
const draft = reactive({
  scheduledDate: props.filters.scheduledDate ?? "",
  assignedUserId: props.filters.assignedUserId ?? "",
  areaId: props.filters.areaId ?? "",
  sourceId: props.filters.sourceId?.toString() ?? "",
  coordinates: "",
});
const trackerOptions = computed(() => props.trackers);
const displayMode = computed(() => props.mode ?? "toolbar");
const showAreaSelector = computed(() => props.catalog.areas.length > 1);
const toolbarGridClass = computed(() => {
  if (showAreaSelector.value && props.showTrackers) {
    return "md:grid-cols-[minmax(0,.7fr)_minmax(0,.8fr)_minmax(0,.9fr)_minmax(0,1fr)_minmax(0,1.25fr)_2.75rem]";
  }

  if (showAreaSelector.value) {
    return "md:grid-cols-[minmax(0,.8fr)_minmax(0,.9fr)_minmax(0,1fr)_minmax(0,1.25fr)_2.75rem]";
  }

  if (props.showTrackers) {
    return "md:grid-cols-[minmax(0,.8fr)_minmax(0,.9fr)_minmax(0,1fr)_minmax(0,1.25fr)_2.75rem]";
  }

  return "md:grid-cols-[minmax(0,.9fr)_minmax(0,1fr)_minmax(0,1.25fr)_2.75rem]";
});
const workerOptions = computed(
  () =>
    props.catalog.areas.find((area) => area.id === draft.areaId)?.workers ?? [],
);
watch(
  () => props.filters,
  (filters) => {
    draft.scheduledDate = filters.scheduledDate ?? "";
    draft.assignedUserId = filters.assignedUserId ?? "";
    draft.areaId = filters.areaId ?? "";
    draft.sourceId = filters.sourceId?.toString() ?? "";
  },
  { deep: true },
);
watch(
  () => props.catalog.areas,
  (areas) => {
    const [area] = areas;

    if (areas.length !== 1 || !area || draft.areaId === area.id) {
      return;
    }

    draft.areaId = area.id;
    apply();
  },
  { immediate: true },
);
function apply(): void {
  emit("apply", {
    scheduledDate: draft.scheduledDate || null,
    areaId: draft.areaId || null,
    assignedUserId: draft.assignedUserId || null,
    sourceId: draft.sourceId ? Number(draft.sourceId) : null,
  });
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
    class="grid min-w-0 gap-2 border border-slate-200 bg-white/95 p-2 shadow-lg shadow-slate-950/10 backdrop-blur"
    :class="[
      displayMode === 'panel'
        ? 'w-full grid-cols-1 rounded-none border-x-0 border-t-0 bg-[#f8f7f4] p-4 shadow-none'
        : 'w-auto grid-cols-2 rounded-none border-x-0 border-t-0',
      displayMode === 'toolbar' ? toolbarGridClass : '',
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
        >Trabajador</span
      ><select
        v-model="draft.assignedUserId"
        :disabled="disabled"
        class="h-10 w-full min-w-0 rounded-[0.55rem] border border-slate-200 bg-white px-2.5 text-xs font-medium normal-case text-slate-700 outline-none transition focus:border-main focus:ring-2 focus:ring-main/20 disabled:cursor-not-allowed disabled:opacity-55"
        @change="displayMode === 'toolbar' && apply()"
      >
        <option value="">Todos</option>
        <option
          v-for="worker in workerOptions"
          :key="worker.id"
          :value="worker.id"
        >
          {{ worker.label }}
        </option>
      </select></label
    >
    <label
      v-if="showTrackers"
      class="grid min-w-0 gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-slate-600"
      ><span :class="displayMode === 'toolbar' ? 'sr-only' : ''">Tracker</span
      ><select
        v-model="draft.sourceId"
        :disabled="disabled"
        class="h-10 w-full min-w-0 rounded-[0.55rem] border border-slate-200 bg-white px-2.5 text-xs font-medium normal-case text-slate-700 outline-none transition focus:border-main focus:ring-2 focus:ring-main/20 disabled:cursor-not-allowed disabled:opacity-55"
        @change="displayMode === 'toolbar' && apply()"
      >
        <option value="">Todos</option>
        <option
          v-for="tracker in trackerOptions"
          :key="tracker.id"
          :value="tracker.sourceId"
        >
          {{ tracker.label }}
        </option>
      </select></label
    >
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
