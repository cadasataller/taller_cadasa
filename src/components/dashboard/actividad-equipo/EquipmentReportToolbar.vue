<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import { es } from "date-fns/locale";
import "@vuepic/vue-datepicker/dist/main.css";
import { CalendarDays, Filter, RotateCcw } from "lucide-vue-next";
import type {
  ReportFilters,
  ReportTab,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

interface Props {
  filters: ReportFilters;
  activeTab: ReportTab;
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
];

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
  const formatter = new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return dates.map((date) => formatter.format(date)).join(" - ");
}

const selectedRange = computed<[Date, Date]>({
  get: () => [
    dateFromIso(props.filters.startDate),
    dateFromIso(props.filters.endDate),
  ],
  set: (range) =>
    emit("updateDateRange", toIsoDate(range[0]), toIsoDate(range[1])),
});
const isFiltersOpen = shallowRef(false);

function updateRange(value: Date | Date[] | null): void {
  if (!Array.isArray(value) || value.length !== 2) return;
  const [startDate, endDate] = value;
  if (!startDate || !endDate) return;
  selectedRange.value = [startDate, endDate];
}
</script>

<template>
  <section
    id="equipment-report-toolbar"
    class="flex shrink-0 flex-col gap-3 bg-second px-4 py-3 md:px-5 lg:flex-row lg:items-end lg:justify-between"
  >
    <div class="flex min-w-0 flex-wrap items-end gap-2">
      <div id="equipment-report-date-filter" class="flex flex-col gap-1">
        
        <div
          class="flex h-8 min-w-56 items-center  "
        >
          
          <VueDatePicker
            :model-value="selectedRange"
            range
            :enable-time-picker="false"
            auto-apply
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
          v-for="tab in tabs"
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
