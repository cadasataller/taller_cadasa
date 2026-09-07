<script setup lang="ts">
import { shallowRef, watch } from "vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import { CalendarDays } from "lucide-vue-next";
import { es } from "date-fns/locale";
import "@vuepic/vue-datepicker/dist/main.css";
import { formatCompactDate } from "@/utils/formatCompactPanamaDate";
import type {
  ActivityTeamsFilters,
  ActivityTeamsSummaryTab,
} from "@/stores/dashboard/resumen-actividad-equipos/resumenActividadEquipos.types";

const props = defineProps<{
  filters: ActivityTeamsFilters;
  activeTab: ActivityTeamsSummaryTab;
}>();
const emit = defineEmits<{
  updateDateRange: [startDate: string, endDate: string];
  setTab: [tab: ActivityTeamsSummaryTab];
}>();

type DateRange = [Date, Date];

function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultWeekRange(): DateRange {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  return [startDate, endDate];
}

const selectedRange = shallowRef<DateRange>([
  fromIsoDate(props.filters.startDate),
  fromIsoDate(props.filters.endDate),
]);

watch(
  () => [props.filters.startDate, props.filters.endDate] as const,
  ([startDate, endDate]) => {
    selectedRange.value = [fromIsoDate(startDate), fromIsoDate(endDate)];
  },
);

function formatRange(value: Date | Date[]): string {
  return (Array.isArray(value) ? value : [value])
    .map(formatCompactDate)
    .join(" — ");
}

function updateRange(value: Date | Date[] | null): void {
  if (!Array.isArray(value) || value.length !== 2) {
    const [startDate, endDate] = getDefaultWeekRange();
    selectedRange.value = [startDate, endDate];
    emit("updateDateRange", toIsoDate(startDate), toIsoDate(endDate));
    return;
  }

  const [startDate, endDate] = value;
  if (!startDate || !endDate) {
    const [defaultStartDate, defaultEndDate] = getDefaultWeekRange();
    selectedRange.value = [defaultStartDate, defaultEndDate];
    emit(
      "updateDateRange",
      toIsoDate(defaultStartDate),
      toIsoDate(defaultEndDate),
    );
    return;
  }

  selectedRange.value = [startDate, endDate];
  emit("updateDateRange", toIsoDate(startDate), toIsoDate(endDate));
}
</script>

<template>
  <header class="border-b border-main/15 bg-white px-3 py-3 sm:px-4">
    <div
      class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <p
          class="text-[10px] font-bold uppercase tracking-[0.18em] text-main/70"
        >
          Reporte ejecutivo
        </p>
        <h1
          class="mt-0.5 text-base font-black uppercase tracking-tight text-main sm:text-lg"
        >
          Resumen de actividad de equipos
        </h1>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div class="flex h-9 min-w-0 items-center px-2 sm:w-72">
          <VueDatePicker
            class="min-w-0 flex-1"
            :model-value="selectedRange"
            range
            auto-apply
            :enable-time-picker="false"
            :config="{ closeOnAutoApply: false }"
            :formats="{ input: formatRange }"
            :locale="es"
            input-class-name="activity-teams-summary-date-input"
            @update:model-value="updateRange"
          />
        </div>
        <nav
          class="flex h-9 overflow-hidden rounded-md border border-main/20 bg-white"
          aria-label="Secciones del resumen de actividad"
        >
          <button
            type="button"
            class="cursor-pointer px-4 text-xs font-bold transition-colors"
            :class="
              activeTab === 'general'
                ? 'bg-main text-white'
                : 'text-main hover:bg-main/5'
            "
            :aria-pressed="activeTab === 'general'"
            @click="emit('setTab', 'general')"
          >
            General
          </button>
          <button
            type="button"
            class="cursor-pointer border-l border-main/20 px-4 text-xs font-bold transition-colors"
            :class="
              activeTab === 'desglose'
                ? 'bg-main text-white'
                : 'text-main hover:bg-main/5'
            "
            :aria-pressed="activeTab === 'desglose'"
            @click="emit('setTab', 'desglose')"
          >
            Desglose
          </button>
        </nav>
      </div>
    </div>
  </header>
</template>
