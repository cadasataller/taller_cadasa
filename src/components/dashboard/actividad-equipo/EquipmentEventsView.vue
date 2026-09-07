<script setup lang="ts">
import { computed, shallowRef } from "vue";
import VueMultiselect from "vue-multiselect";
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  CirclePlay,
  CircleStop,
  Pencil,
  RefreshCw,
  Undo2,
} from "lucide-vue-next";
import EquipmentEventsDetailDrawer from "./EquipmentEventsDetailDrawer.vue";
import EquipmentReportMobileDrawer from "./EquipmentReportMobileDrawer.vue";
import { useJornadaEventos } from "@/composables/dashboard/useJornadaEventos";
import { formatCompactPanamaDateTime } from "@/utils/formatCompactPanamaDate";
import "vue-multiselect/dist/vue-multiselect.css";

interface FilterOption {
  id: string;
  label: string;
}

const props = defineProps<{
  equipo: string | null;
  desde: string;
  hasta: string;
}>();
const {
  filters,
  items,
  isLoading,
  error,
  selectedDetail,
  isDetailLoading,
  detailError,
  canGoPrevious,
  canGoNext,
  currentPage,
  refresh,
  goToNextPage,
  goToPreviousPage,
  selectEvent,
  closeDetail,
} = useJornadaEventos(() => ({
  equipos: props.equipo ? [props.equipo] : null,
  desde: props.desde,
  hasta: props.hasta,
}));

const contextLabel = computed(
  () =>
    `${props.equipo ?? "Todos los equipos"} · ${props.desde} — ${props.hasta}`,
);
const eventTypeOptions = computed<FilterOption[]>(() =>
  [
    ...new Map(
      items.value.map((item) => [
        item.tipoEvento,
        { id: item.tipoEvento, label: item.evento },
      ]),
    ).values(),
  ].sort((left, right) => left.label.localeCompare(right.label)),
);
const detailOptions = computed<FilterOption[]>(() =>
  [
    ...new Set(
      items.value
        .map((item) => item.detalle)
        .filter((detail): detail is string => Boolean(detail)),
    ),
  ]
    .map((detail) => ({ id: detail, label: detail }))
    .sort((left, right) => left.label.localeCompare(right.label)),
);
const detailFilterId = shallowRef<string | null>(null);
const selectedDetailFilter = computed<FilterOption | null>({
  get: () =>
    detailOptions.value.find((option) => option.id === detailFilterId.value) ??
    null,
  set: (option) => {
    detailFilterId.value = option?.id ?? null;
  },
});
const visibleItems = computed(() => {
  if (!selectedDetailFilter.value) return items.value;
  return items.value.filter((item) => item.detalle === detailFilterId.value);
});
const visibleRecordsLabel = computed(
  () => `${visibleItems.value.length} registros`,
);
const selectedEventType = computed<FilterOption | null>({
  get: () =>
    eventTypeOptions.value.find((option) => option.id === filters.tipoEvento) ??
    null,
  set: (option) => {
    filters.tipoEvento = option?.id ?? null;
  },
});

function eventIcon(type: string) {
  if (type === "inicio_jornada" || type === "reanudar") return CirclePlay;
  if (type === "finalizar_jornada") return CircleStop;
  if (type === "inicio_parada") return CirclePause;
  if (type.startsWith("editar_")) return Pencil;
  if (type.startsWith("cancelar_")) return Undo2;
  return ArrowRightLeft;
}
function eventColor(type: string): string {
  if (type === "inicio_jornada" || type === "reanudar") return "text-success";
  if (type === "finalizar_jornada" || type.startsWith("cancelar_"))
    return "text-danger";
  if (type === "inicio_parada") return "text-warning";
  if (type.startsWith("editar_")) return "text-accent";
  return "text-info";
}
</script>

<template>
  <section
    class="flex min-h-0 flex-col gap-3 overflow-visible rounded-[10px] border border-gray-200 bg-white p-3 shadow-sm lg:h-full lg:overflow-hidden"
  >
    <div
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-visible lg:overflow-hidden lg:flex-row"
    >
      <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <header
          class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between"
        >
          <div>
            <h2 class="text-sm font-bold text-main">Historial de eventos</h2>

            <p class="mt-1 text-[10px] text-gray-400">{{ contextLabel }}</p>
          </div>
          <button
            type="button"
            class="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 self-start rounded-md border border-gray-200 px-2.5 text-xs font-semibold text-main hover:bg-main/5"
            @click="refresh"
          >
            <RefreshCw class="size-3.5" />Actualizar
          </button>
        </header>

        <div class="grid gap-2 lg:grid-cols-2">
          <label class="text-[10px] font-semibold text-gray-600"
            >Tipo de evento
            <VueMultiselect
              v-model="selectedEventType"
              :options="eventTypeOptions"
              track-by="id"
              label="label"
              :allow-empty="true"
              :searchable="true"
              :show-labels="false"
              placeholder="Todos"
              class="event-filter mt-1 cursor-pointer"
            />
          </label>
          <label class="text-[10px] font-semibold text-gray-600"
            >Detalle
            <VueMultiselect
              v-model="selectedDetailFilter"
              :options="detailOptions"
              track-by="id"
              label="label"
              :allow-empty="true"
              :searchable="true"
              :show-labels="false"
              placeholder="Todos"
              class="event-filter mt-1 cursor-pointer"
            />
          </label>
        </div>

        <div class="flex min-h-0 flex-1 flex-col">
          <div class="flex min-h-0 min-w-0 flex-1 flex-col">
            <div v-if="isLoading" class="space-y-2 lg:hidden">
              <div
                v-for="row in 6"
                :key="row"
                class="space-y-3 rounded-md border border-gray-200 p-3"
              >
                <i class="block h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                <i class="block h-3 w-full animate-pulse rounded bg-gray-100" />
                <i class="block h-3 w-4/5 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
            <div v-else-if="visibleItems.length" class="space-y-2 lg:hidden">
              <button
                v-for="row in visibleItems"
                :key="row.eventoId"
                type="button"
                class="w-full cursor-pointer rounded-md border border-gray-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-main/5"
                @click="selectEvent(row.eventoId)"
              >
                <span class="flex items-start justify-between gap-3">
                  <span
                    class="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-gray-800"
                  >
                    <component
                      :is="eventIcon(row.tipoEvento)"
                      class="size-4 shrink-0"
                      :class="eventColor(row.tipoEvento)"
                    />
                    <span class="truncate">{{ row.evento }}</span>
                  </span>
                  <ChevronRight
                    class="size-4 shrink-0 text-main"
                    aria-hidden="true"
                  />
                </span>
                <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                  <div>
                    <dt class="text-gray-400">Fecha</dt>
                    <dd class="mt-0.5 font-medium text-gray-700">
                      {{ formatCompactPanamaDateTime(row.fechaHora) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-gray-400">Operador</dt>
                    <dd class="mt-0.5 truncate font-medium text-gray-700">
                      {{ row.operador }}
                    </dd>
                  </div>
                  <div class="col-span-2">
                    <dt class="text-gray-400">Detalle</dt>
                    <dd class="mt-0.5 line-clamp-2 text-gray-700">
                      {{ row.detalle ?? "—" }}
                    </dd>
                  </div>
                </dl>
              </button>
            </div>
            <p
              v-else
              class="rounded-md border border-gray-200 px-3 py-10 text-center text-xs text-gray-500 lg:hidden"
            >
              {{ error ?? "No hay eventos para los filtros seleccionados." }}
            </p>
            <div
              class="hidden min-h-0 flex-1 overflow-auto rounded-md border border-gray-200 lg:block"
            >
              <table
                class="w-full min-w-[760px] border-collapse text-left text-xs"
              >
                <thead
                  class="sticky top-0 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500"
                >
                  <tr>
                    <th class="px-3 py-2 font-semibold">Fecha / hora</th>
                    <th class="px-3 py-2 font-semibold">Operador</th>
                    <th class="px-3 py-2 font-semibold">Evento</th>
                    <th class="px-3 py-2 font-semibold">Detalle</th>
                    <th class="px-3 py-2 font-semibold">Labor</th>
                    <th class="w-10 px-2 py-2">
                      <span class="sr-only">Ver detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody v-if="isLoading">
                  <tr
                    v-for="row in 6"
                    :key="row"
                    class="border-t border-gray-100"
                  >
                    <td v-for="cell in 6" :key="cell" class="px-3 py-3">
                      <i class="block h-3 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                </tbody>
                <tbody v-else-if="visibleItems.length">
                  <tr
                    v-for="row in visibleItems"
                    :key="row.eventoId"
                    class="cursor-pointer border-t border-gray-100 text-gray-700 hover:bg-main/5"
                    tabindex="0"
                    @click="selectEvent(row.eventoId)"
                    @keydown.enter="selectEvent(row.eventoId)"
                  >
                    <td class="whitespace-nowrap px-3 py-2.5">
                      {{ formatCompactPanamaDateTime(row.fechaHora) }}
                    </td>
                    <td class="px-3 py-2.5 font-medium">{{ row.operador }}</td>
                    <td class="px-3 py-2.5">
                      <span class="inline-flex items-center gap-1.5 font-medium"
                        ><component
                          :is="eventIcon(row.tipoEvento)"
                          class="size-3.5"
                          :class="eventColor(row.tipoEvento)"
                        />{{ row.evento }}</span
                      >
                    </td>
                    <td
                      class="max-w-60 truncate px-3 py-2.5"
                      :title="row.detalle ?? undefined"
                    >
                      {{ row.detalle ?? "—" }}
                    </td>
                    <td class="px-3 py-2.5">{{ row.labor }}</td>
                    <td class="px-2 py-2.5">
                      <button
                        type="button"
                        class="grid min-h-8 min-w-8 cursor-pointer place-items-center rounded hover:bg-main/10"
                        aria-label="Ver detalle del evento"
                        @click.stop="selectEvent(row.eventoId)"
                      >
                        <ChevronRight class="size-4 text-main" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tbody v-else>
                  <tr>
                    <td
                      colspan="6"
                      class="px-3 py-10 text-center text-xs text-gray-500"
                    >
                      {{
                        error ??
                        "No hay eventos para los filtros seleccionados."
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <footer
              class="mt-3 flex items-center justify-between gap-2 text-xs"
            >
              <button
                type="button"
                class="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2.5 font-semibold text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canGoPrevious || isLoading"
                @click="goToPreviousPage"
              >
                <ChevronLeft class="size-3.5" />Anterior
              </button>
              <span class="text-gray-500">
                {{ visibleRecordsLabel }} · Página {{ currentPage }}
              </span>
              <button
                type="button"
                class="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2.5 font-semibold text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canGoNext || isLoading"
                @click="goToNextPage"
              >
                Siguiente<ChevronRight class="size-3.5" />
              </button>
            </footer>
          </div>
        </div>
      </div>
      <Transition name="event-drawer">
        <EquipmentEventsDetailDrawer
          v-if="selectedDetail || isDetailLoading || detailError"
          class="hidden lg:flex"
          :detail="selectedDetail"
          :loading="isDetailLoading"
          :error="detailError"
          @close="closeDetail"
        />
      </Transition>
    </div>
    <EquipmentReportMobileDrawer
      v-if="selectedDetail || isDetailLoading || detailError"
      title="Detalle del evento"
      hide-header
      @close="closeDetail"
    >
      <EquipmentEventsDetailDrawer
        class="h-full"
        :detail="selectedDetail"
        :loading="isDetailLoading"
        :error="detailError"
        @close="closeDetail"
      />
    </EquipmentReportMobileDrawer>
  </section>
</template>

<style scoped>
.event-drawer-enter-active,
.event-drawer-leave-active {
  transition:
    transform 180ms ease-out,
    opacity 180ms ease-out;
}
.event-drawer-enter-from,
.event-drawer-leave-to {
  transform: translateX(1rem);
  opacity: 0;
}
.event-filter :deep(.multiselect__tags) {
  min-height: 2rem;
  border-color: rgb(229 231 235);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  padding-block: 0.3rem;
}
.event-filter :deep(.multiselect__single),
.event-filter :deep(.multiselect__input) {
  margin-bottom: 0;
  font-size: 0.75rem;
}
.event-filter :deep(.multiselect__select) {
  height: 2rem;
}
</style>
