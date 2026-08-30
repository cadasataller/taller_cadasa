<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { AlertTriangle, ListFilter, Plus, SearchX } from "lucide-vue-next";
import TaskCard from "./TaskCard.vue";
import type { TareaSeguimientoListItem } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{
  tasks: TareaSeguimientoListItem[];
  selectedTaskId: string | null;
  loading: boolean;
  error: string | null;
  search: string;
  hasActiveFilters: boolean;
  showBack?: boolean;
  canCreate?: boolean;
}>();
const emit = defineEmits<{
  select: [taskId: string];
  retry: [];
  updateSearch: [value: string];
  clearFilters: [];
  back: [];
  create: [];
}>();
const localSegment = shallowRef<"all" | "active" | "doubt">("all");
const localTasks = computed(() =>
  props.tasks.filter((task) =>
    localSegment.value === "all"
      ? true
      : localSegment.value === "active"
        ? task.status === "activa" || task.status === "en_ruta"
        : task.type === "duda",
  ),
);
const panelMessage = computed(() =>
  props.hasActiveFilters
    ? "No hay coincidencias para la búsqueda actual."
    : "No hay tareas para este contexto.",
);
</script>

<template>
  <aside
    class="flex h-full min-h-0 flex-col bg-[#f8f7f4] shadow-[4px_0_16px_rgb(0_0_0_/_16%)]"
    aria-label="Listado de tareas"
  >
    <header class="border-b border-slate-200 px-4 pb-3 pt-4">
      <button
        v-if="showBack"
        class="mb-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main md:hidden"
        type="button"
        @click="emit('back')"
      >
        ← Mapa
      </button>
      <div class="flex items-center justify-between gap-3">
        <div>
          <p
            class="text-[10px] font-extrabold uppercase tracking-[0.16em] text-warning"
          >
            Seguimiento
          </p>
          <h1 class="mt-0.5 text-xl font-bold text-main">Tareas</h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="canCreate"
            class="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-main px-3 text-xs font-bold text-white transition hover:bg-main-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
            type="button"
            @click="emit('create')"
          >
            <Plus class="size-3.5" aria-hidden="true" />Nueva
          </button>
          <span
            class="rounded-full bg-second px-2.5 py-1 text-xs font-extrabold text-main"
            >{{ tasks.length }}</span
          >
        </div>
      </div>
      <p class="mt-1 text-xs leading-5 text-slate-500">
        Explora tareas, su contexto y estado operativo.
      </p>
      <label class="relative mt-3 block"
        ><span class="sr-only">Buscar tareas</span
        ><input
          class="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-main focus:ring-2 focus:ring-main/15"
          :value="search"
          placeholder="Buscar tareas"
          @input="
            emit('updateSearch', ($event.target as HTMLInputElement).value)
          " /><ListFilter
          class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
      /></label>
      <label class="mt-2 block"
        ><span class="sr-only">Segmentar listado</span
        ><select
          v-model="localSegment"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-main focus:ring-2 focus:ring-main/15"
        >
          <option value="all">Todas las tareas</option>
          <option value="active">En curso</option>
          <option value="doubt">Dudas automáticas</option>
        </select></label
      >
    </header>
    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <div v-if="loading" class="grid gap-2" aria-live="polite">
        <div
          v-for="index in 4"
          :key="index"
          class="h-24 animate-pulse rounded-xl bg-slate-200"
        />
      </div>
      <div
        v-else-if="error"
        class="rounded-xl border border-danger/25 bg-danger-bg p-4 text-center"
      >
        <AlertTriangle class="mx-auto size-5 text-danger" aria-hidden="true" />
        <p class="mt-2 text-xs leading-5 text-danger">{{ error }}</p>
        <button
          class="mt-3 rounded-lg bg-main px-3 py-2 text-xs font-bold text-white"
          type="button"
          @click="emit('retry')"
        >
          Reintentar
        </button>
      </div>
      <div v-else-if="!tasks.length" class="px-3 py-12 text-center">
        <SearchX class="mx-auto size-6 text-slate-400" aria-hidden="true" />
        <p class="mt-3 text-xs leading-5 text-slate-500">{{ panelMessage }}</p>
        <button
          v-if="hasActiveFilters"
          class="mt-3 min-h-11 rounded-lg border border-main px-3 py-2 text-xs font-bold text-main"
          type="button"
          @click="emit('clearFilters')"
        >
          Limpiar filtros
        </button>
      </div>
      <div v-else-if="!localTasks.length" class="px-3 py-12 text-center">
        <SearchX class="mx-auto size-6 text-slate-400" aria-hidden="true" />
        <p class="mt-3 text-xs leading-5 text-slate-500">
          No hay tareas para esta segmentación.
        </p>
      </div>
      <ul v-else class="grid gap-2" aria-label="Resultados de tareas">
        <li v-for="task in localTasks" :key="task.id">
          <TaskCard
            :task="task"
            :selected="task.id === selectedTaskId"
            @select="emit('select', $event)"
          />
        </li>
      </ul>
    </div>
  </aside>
</template>
