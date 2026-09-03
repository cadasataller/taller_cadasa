<script setup lang="ts">
import { computed } from "vue";
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  HardHat,
  LoaderCircle,
  RefreshCw,
  Wrench,
} from "lucide-vue-next";
import type {
  AssignedHoursGroup,
  AssignedHoursWorkOrder,
} from "@/stores/assignedHoursStore.types";

const props = defineProps<{
  area: string;
  groups: AssignedHoursGroup[];
  isLoading: boolean;
  error: string | null;
  inspectionDate: string;
}>();

const emit = defineEmits<{
  load: [force: boolean];
}>();

const hasGroups = computed(() => props.groups.length > 0);

const getHoursClass = (totalHours: number): string => {
  if (totalHours > 8) return "border-danger/30 bg-danger-bg text-danger";
  if (totalHours === 8) return "border-main/20 bg-main/5 text-main";
  return "border-slate-200 bg-slate-50 text-slate-600";
};

const getStatusClass = (status: string | null): string =>
  status === "Cerrada" ? "bg-main/10 text-main" : "bg-accent/15 text-slate-700";

const getWorkDescription = (order: AssignedHoursWorkOrder): string =>
  order.ORDEN_MANTENIMIENTO?.Descripcion ||
  order.OM_SG?.tipo_trabajo ||
  order.OM_SG?.ORDEN_MANTENIMIENTO?.Descripcion ||
  "Trabajo sin descripción";

const formatHours = (value: number | string | null): string => {
  const hours = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(hours) ? `${hours} h` : "0 h";
};

const formatCreatedDate = (value: string | null): string => {
  if (!value) return "Sin hora registrada";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Panama",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const getParts = (targetDate: Date): Record<string, string> =>
    Object.fromEntries(
      formatter
        .formatToParts(targetDate)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
  const parts = getParts(date);
  const today = getParts(new Date());
  const yesterday = getParts(new Date(Date.now() - 86400000));
  const dateKey = `${parts.day}-${parts.month}-${parts.year}`;
  const todayKey = `${today.day}-${today.month}-${today.year}`;
  const yesterdayKey = `${yesterday.day}-${yesterday.month}-${yesterday.year}`;
  const time = `${parts.hour}:${parts.minute}`;

  if (dateKey === todayKey) return `Hoy ${time}`;
  if (dateKey === yesterdayKey) return `Ayer ${time}`;
  return `${dateKey} ${time}`;
};

const getPreviousBusinessDate = (dateString: string): string => {
  const baseDate = new Date(`${dateString}T00:00:00-05:00`);
  if (Number.isNaN(baseDate.getTime())) return dateString;

  baseDate.setDate(baseDate.getDate() - (baseDate.getDay() === 1 ? 3 : 1));
  return baseDate.toISOString().slice(0, 10);
};

const getCutoffDate = (): Date | null => {
  const cutoffDate =
    props.area === "Servicios Generales"
      ? `${props.inspectionDate}T09:00:00-05:00`
      : `${getPreviousBusinessDate(props.inspectionDate)}T23:30:00-05:00`;
  const date = new Date(cutoffDate);

  return Number.isNaN(date.getTime()) ? null : date;
};

const isOrderAfterCutoff = (order: AssignedHoursWorkOrder): boolean => {
  if (!order.created) return false;

  const createdAt = new Date(order.created);
  const cutoff = getCutoffDate();

  return (
    !Number.isNaN(createdAt.getTime()) && cutoff !== null && createdAt > cutoff
  );
};

const getOrderRowClass = (order: AssignedHoursWorkOrder): string =>
  isOrderAfterCutoff(order) ? "bg-danger-bg" : "";

const getCreatedDateClass = (order: AssignedHoursWorkOrder): string =>
  isOrderAfterCutoff(order) ? "font-bold text-danger" : "text-slate-500";

const handleToggle = (event: Event): void => {
  if (
    event.currentTarget instanceof HTMLDetailsElement &&
    event.currentTarget.open
  ) {
    emit("load", false);
  }
};
</script>

<template>
  <details
    class="group overflow-hidden rounded-xl border border-slate-200 bg-white"
    @toggle="handleToggle"
  >
    <summary
      class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 outline-none hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
    >
      <div class="flex min-w-0 items-center gap-2">
        <div class="rounded-lg bg-main/5 p-1.5 text-main">
          <Clock3 class="h-4 w-4" />
        </div>
        <div>
          <h4
            class="text-[11px] font-black uppercase tracking-[0.12em] text-slate-700"
          >
            Horas asignadas
          </h4>
          <p class="mt-0.5 text-[10px] text-slate-500">
            {{ area || "Área no identificada" }}
          </p>
        </div>
      </div>
      <ChevronRight
        class="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90"
      />
    </summary>

    <div class="border-t border-slate-100">
      <div class="flex items-center justify-end px-3 pt-2">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-main transition hover:bg-main/5"
          :disabled="isLoading"
          @click="emit('load', true)"
        >
          <RefreshCw :class="['h-3 w-3', { 'animate-spin': isLoading }]" />
          Actualizar
        </button>
      </div>

      <div
        v-if="isLoading"
        class="flex min-h-28 items-center justify-center gap-2 p-4 text-xs text-slate-500"
      >
        <LoaderCircle class="h-4 w-4 animate-spin text-main" />
        Cargando órdenes asignadas…
      </div>

      <div
        v-else-if="error"
        class="m-3 flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-bg p-3 text-xs text-danger"
        role="alert"
      >
        <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
        <p>{{ error }}</p>
      </div>

      <div v-else-if="!hasGroups" class="p-5 text-center">
        <Wrench class="mx-auto h-5 w-5 text-slate-300" />
        <p class="mt-2 text-xs font-semibold text-slate-600">
          No hay horas asignadas para esta fecha.
        </p>
      </div>

      <div v-else class="space-y-3 p-3">
        <template v-for="group in groups" :key="`${group.kind}-${group.name}`">
          <section
            v-if="group.kind === 'team'"
            class="overflow-hidden rounded-lg border border-slate-200"
          >
            <div
              class="flex items-center justify-between gap-3 bg-second px-3 py-2"
            >
              <p
                class="text-[10px] font-black uppercase tracking-[0.12em] text-main"
              >
                {{ group.name }}
              </p>
              <span
                class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600"
              >
                {{ group.totalHours }} h
              </span>
            </div>
            <div
              v-for="worker in group.workers"
              :key="worker.name"
              class="border-t border-slate-100"
            >
              <div class="flex items-center justify-between gap-3 px-3 py-2">
                <p
                  class="flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-slate-700"
                >
                  <HardHat class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span class="truncate">{{ worker.name }}</span>
                </p>
                <span
                  class="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
                  :class="getHoursClass(worker.totalHours)"
                >
                  {{ worker.totalHours }} h
                </span>
              </div>
              <ul
                class="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/50"
              >
                <li
                  v-for="order in worker.orders"
                  :key="order.ID_OT"
                  class="px-3 py-2.5"
                  :class="getOrderRowClass(order)"
                >
                  <p
                    class="text-[11px] font-semibold leading-relaxed text-slate-800"
                  >
                    {{ getWorkDescription(order) }}
                  </p>
                  <div
                    class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]"
                  >
                    <span :class="getCreatedDateClass(order)">{{
                      formatCreatedDate(order.created)
                    }}</span>
                    <span class="font-bold text-main">{{
                      formatHours(order["Duración (horas)"])
                    }}</span>
                    <span
                      class="rounded px-1.5 py-0.5 font-bold"
                      :class="getStatusClass(order.Estatus)"
                      >{{ order.Estatus || "Abierta" }}</span
                    >
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section
            v-else
            class="overflow-hidden rounded-lg border border-slate-200"
          >
            <div class="flex items-center justify-between gap-3 px-3 py-2">
              <p
                class="flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-slate-700"
              >
                <HardHat class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span class="truncate">{{ group.name }}</span>
              </p>
              <span
                class="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
                :class="getHoursClass(group.totalHours)"
              >
                {{ group.totalHours }} h
              </span>
            </div>
            <ul
              class="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/50"
            >
              <li
                v-for="order in group.orders"
                :key="order.ID_OT"
                class="px-3 py-2.5"
                :class="getOrderRowClass(order)"
              >
                <p
                  class="text-[11px] font-semibold leading-relaxed text-slate-800"
                >
                  {{ getWorkDescription(order) }}
                </p>
                <div
                  class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]"
                >
                  <span :class="getCreatedDateClass(order)">{{
                    formatCreatedDate(order.created)
                  }}</span>
                  <span class="font-bold text-main">{{
                    formatHours(order["Duración (horas)"])
                  }}</span>
                  <span
                    class="rounded px-1.5 py-0.5 font-bold"
                    :class="getStatusClass(order.Estatus)"
                    >{{ order.Estatus || "Abierta" }}</span
                  >
                </div>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </div>
  </details>
</template>
