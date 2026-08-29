<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import type { TareasSeguimientoFilters } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";
interface Props {
  filters: TareasSeguimientoFilters;
  trackers: SeguimientoTracker[];
  loading: boolean;
  disabled: boolean;
  showTrackers: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  apply: [filters: Partial<TareasSeguimientoFilters>];
  focus: [coordinates: SeguimientoCoordinates | null];
}>();
const draft = reactive({
  scheduledDate: props.filters.scheduledDate ?? "",
  assignedUserId: props.filters.assignedUserId ?? "",
  sourceId: props.filters.sourceId?.toString() ?? "",
  coordinates: "",
});
const trackerOptions = computed(() => props.trackers);
watch(
  () => props.filters,
  (filters) => {
    draft.scheduledDate = filters.scheduledDate ?? "";
    draft.assignedUserId = filters.assignedUserId ?? "";
    draft.sourceId = filters.sourceId?.toString() ?? "";
  },
  { deep: true },
);
function apply(): void {
  emit("apply", {
    scheduledDate: draft.scheduledDate || null,
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
    class="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white/95 p-2 shadow-md backdrop-blur"
    @submit.prevent="apply"
  >
    <label
      class="grid min-w-32 flex-1 gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-gray-600"
      ><span>Fecha operativa</span
      ><input
        v-model="draft.scheduledDate"
        :disabled="disabled"
        class="h-10 rounded-md border border-gray-300 bg-white px-2 text-sm font-medium normal-case text-gray-700 outline-none focus:border-main focus:ring-2 focus:ring-main/20 disabled:cursor-not-allowed disabled:opacity-55"
        type="date"
    /></label>
    <label
      class="grid min-w-32 flex-1 gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-gray-600"
      ><span>Trabajador</span
      ><input
        v-model="draft.assignedUserId"
        :disabled="disabled"
        class="h-10 rounded-md border border-gray-300 bg-white px-2 text-sm font-medium normal-case text-gray-700 outline-none focus:border-main focus:ring-2 focus:ring-main/20 disabled:cursor-not-allowed disabled:opacity-55"
        placeholder="ID de trabajador"
    /></label>
    <label
      v-if="showTrackers"
      class="grid min-w-32 flex-1 gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-gray-600"
      ><span>Tracker / equipo</span
      ><select
        v-model="draft.sourceId"
        :disabled="disabled"
        class="h-10 rounded-md border border-gray-300 bg-white px-2 text-sm font-medium normal-case text-gray-700 outline-none focus:border-main focus:ring-2 focus:ring-main/20 disabled:cursor-not-allowed disabled:opacity-55"
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
      class="grid min-w-44 flex-[2] gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-gray-600"
      ><span>Coordenadas</span
      ><input
        v-model="draft.coordinates"
        :disabled="disabled"
        class="h-10 rounded-md border border-gray-300 bg-white px-2 text-sm font-medium normal-case text-gray-700 outline-none focus:border-main focus:ring-2 focus:ring-main/20 disabled:cursor-not-allowed disabled:opacity-55"
        placeholder="8.43, -82.51"
        @keyup.enter.prevent="focusCoordinates"
    /></label>
    <button
      class="h-10 rounded-md bg-second-dark px-3 text-sm font-bold text-main transition hover:bg-second-deep disabled:cursor-not-allowed disabled:opacity-55"
      :disabled="disabled"
      type="button"
      @click="focusCoordinates"
    >
      Ir
    </button>
    <button
      class="h-10 rounded-md bg-main px-3 text-sm font-bold text-white transition hover:bg-main-light disabled:cursor-not-allowed disabled:opacity-55"
      :disabled="disabled || loading"
      type="submit"
    >
      {{ loading ? "Aplicando…" : "Aplicar" }}
    </button>
  </form>
</template>
