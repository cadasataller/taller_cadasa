<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import { es } from "date-fns/locale";
import "@vuepic/vue-datepicker/dist/main.css";
import { Filter, RotateCcw } from "lucide-vue-next";
import { z } from "zod";
import { formatCompactDate } from "@/utils/formatCompactPanamaDate";
import type {
  ReportFilters,
  ReportTab,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

interface Props {
  filters: ReportFilters;
  activeTab: ReportTab;
  availableTabs: readonly ReportTab[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  updateDateRange: [startDate: string, endDate: string];
  setTab: [tab: ReportTab];
  clear: [];
}>();

const tabs: { key: ReportTab; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "paradas", label: "Paradas" },
  { key: "operadores", label: "Operadores" },
  { key: "eventos", label: "Eventos" },
];
const visibleTabs = computed(() =>
  tabs.filter((tab) => props.availableTabs.includes(tab.key)),
);
const dateRangeSchema = z.array(z.date().nullable()).min(1).max(2);

function dateFromIso(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateRange(value: Date | Date[]): string {
  const dates = Array.isArray(value) ? value : [value];

  return dates.map(formatCompactDate).join(" - ");
}

type DateRangeSelection = [Date | null, Date | null];

const selectedRange = shallowRef<DateRangeSelection>([
  dateFromIso(props.filters.startDate),
  dateFromIso(props.filters.endDate),
]);
const isFiltersOpen = shallowRef(false);

watch(
  () => [props.filters.startDate, props.filters.endDate] as const,
  ([startDate, endDate]) => {
    selectedRange.value = [dateFromIso(startDate), dateFromIso(endDate)];
  },
);

function updateRange(value: Date | Date[] | null): void {
  const parsedRange = dateRangeSchema.safeParse(value);
  if (!parsedRange.success) return;
  const [startDate = null, endDate = null] = parsedRange.data;
  selectedRange.value = [startDate, endDate];
  if (!startDate || !endDate) return;
  emit("updateDateRange", toIsoDate(startDate), toIsoDate(endDate));
}
</script>

<template>
  <section
    id="equipment-report-toolbar"
    class="flex shrink-0 flex-col gap-3 bg-second px-4 py-3 md:px-5 lg:flex-row lg:items-end lg:justify-between"
  >
    <div class="flex min-w-0 flex-wrap items-end gap-2">
      <div id="equipment-report-date-filter" class="flex flex-col gap-1">
        <div class="flex h-8 min-w-56 items-center">
          <VueDatePicker
            :model-value="selectedRange"
            range
            :enable-time-picker="false"
            auto-apply
            :config="{ closeOnAutoApply: false }"
            :formats="{ input: formatDateRange }"
            :locale="es"
            input-class-name="equipment-report-date-input"
            @update:model-value="updateRange"
          />
        </div>
      </div>

      <nav
        id="equipment-report-tabs"
        class="flex h-8 overflow-hidden rounded-md border border-gray-200 bg-white"
        aria-label="Análisis de equipo"
      >
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          type="button"
          class="min-w-24 cursor-pointer border-r border-gray-200 px-3 text-xs font-semibold transition-colors last:border-r-0"
          :class="
            activeTab === tab.key
              ? 'bg-main text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          "
          :aria-pressed="activeTab === tab.key"
          @click="emit('setTab', tab.key)"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-main px-3 text-xs font-semibold text-main transition-colors hover:bg-main/5"
        :aria-pressed="isFiltersOpen"
        @click="isFiltersOpen = !isFiltersOpen"
      >
        <Filter class="size-3.5" aria-hidden="true" />
        Filtros
      </button>
      <button
        type="button"
        class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
        @click="emit('clear')"
      >
        <RotateCcw class="size-3.5" aria-hidden="true" />
        Limpiar
      </button>
    </div>
  </section>
</template>
