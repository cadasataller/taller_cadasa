<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import {
  ArrowDownAZ,
  LoaderCircle,
  Search,
  TriangleAlert,
  X,
} from "lucide-vue-next";
import type {
  EquipmentListItem,
  ReportLoadState,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
import { formatOperationalNumber } from "@/utils/formatOperationalNumber";

interface Props {
  equipment: EquipmentListItem[];
  selectedCode: string | null;
  loadState: ReportLoadState;
  error: string | null;
  resetSearchSignal: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  select: [code: string];
  retry: [];
}>();

const searchTerm = shallowRef("");
const sortMode = shallowRef<"equipmentNumber" | "mostHours">("mostHours");
const nextSortLabel = computed(() =>
  sortMode.value === "equipmentNumber" ? "Horas" : "# Equipo",
);
const sortAriaLabel = computed(
  () => `Ordenar por ${nextSortLabel.value.toLocaleLowerCase()}`,
);
const equipmentNumberCollator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});
const visibleEquipment = computed(() => {
  const normalized = searchTerm.value.trim().toLocaleLowerCase();
  const filteredEquipment = normalized
    ? props.equipment.filter((equipment) =>
        `${equipment.code} ${equipment.type ?? ""}`
          .toLocaleLowerCase()
          .includes(normalized),
      )
    : props.equipment;

  return [...filteredEquipment].sort((first, second) => {
    if (sortMode.value === "mostHours") {
      const timeDifference =
        (second.totalSeconds ?? 0) - (first.totalSeconds ?? 0);
      if (timeDifference !== 0) return timeDifference;
    }

    return equipmentNumberCollator.compare(first.code, second.code);
  });
});

function toggleSortMode(): void {
  sortMode.value =
    sortMode.value === "equipmentNumber" ? "mostHours" : "equipmentNumber";
}

function clearSearch(): void {
  searchTerm.value = "";
}

watch(() => props.resetSearchSignal, clearSearch);
</script>

<template>
  <aside
    id="equipment-sidebar"
    class="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm"
  >
    <div
      id="equipment-sidebar-header"
      class="flex items-center justify-between gap-2 px-3 pb-2 pt-3"
    >
      <h2 class="text-xs font-bold text-main">Equipos</h2>
      <button
        type="button"
        class="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2 text-[10px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        :aria-label="sortAriaLabel"
        @click="toggleSortMode"
      >
        Ordenar por {{ nextSortLabel }}
        <ArrowDownAZ class="size-3" aria-hidden="true" />
      </button>
    </div>
    <div class="px-3 pb-2" role="search">
      <label
        class="flex h-8 items-center rounded-md border border-gray-200 bg-white px-2"
      >
        <Search
          class="mr-2 size-3.5 shrink-0 text-gray-400"
          aria-hidden="true"
        />
        <input
          v-model="searchTerm"
          class="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none placeholder:text-gray-400"
          placeholder="Buscar equipo..."
        />
        <button
          v-if="searchTerm"
          type="button"
          class="grid size-6 cursor-pointer place-items-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Limpiar búsqueda de equipos"
          title="Limpiar búsqueda"
          @click="clearSearch"
        >
          <X class="size-3.5" aria-hidden="true" />
        </button>
      </label>
    </div>

    <div
      id="equipment-sidebar-list"
      class="min-h-0 flex-1 overflow-y-auto px-2 pb-2"
    >
      <div
        v-if="loadState === 'loading'"
        class="grid place-items-center gap-2 py-12 text-xs text-gray-500"
      >
        <LoaderCircle
          class="size-5 animate-spin text-main"
          aria-hidden="true"
        />
        Cargando equipos…
      </div>
      <div
        v-else-if="loadState === 'error'"
        class="m-1 rounded-md border border-danger/20 bg-danger/5 p-3 text-xs text-danger"
      >
        <div class="flex gap-2">
          <TriangleAlert class="size-4 shrink-0" aria-hidden="true" /><span>{{
            error
          }}</span>
        </div>
        <button
          type="button"
          class="mt-2 cursor-pointer font-semibold underline"
          @click="emit('retry')"
        >
          Reintentar
        </button>
      </div>
      <p
        v-else-if="loadState === 'empty' || visibleEquipment.length === 0"
        class="px-2 py-8 text-center text-xs text-gray-500"
      >
        No hay equipos para este rango.
      </p>
      <template v-else>
        <button
          v-for="item in visibleEquipment"
          :key="item.code"
          :id="`equipment-row-${item.code}`"
          type="button"
          class="mb-1.5 grid min-h-12 w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors"
          :class="
            selectedCode === item.code
              ? 'border-main/40 bg-success/10'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          "
          :aria-pressed="selectedCode === item.code"
          @click="emit('select', item.code)"
        >
          <span class="min-w-0"
            ><strong class="block text-xs text-gray-900">{{
              formatOperationalNumber(item.code)
            }}</strong
            ><span class="mt-0.5 block truncate text-[10px] text-gray-500">{{
              item.type ?? "—"
            }}</span></span
          >
          <span class="text-right"
            ><strong class="block text-xs text-gray-900">{{
              item.totalTime ?? "—"
            }}</strong
            ><span
              class="mt-0.5 block whitespace-nowrap text-[10px] text-gray-500"
              >{{ item.journeys ?? "—" }} jornadas</span
            ></span
          >
        </button>
      </template>
    </div>
  </aside>
</template>
