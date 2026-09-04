<script setup lang="ts">
import { computed } from "vue";
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  UserRound,
  Wrench,
} from "lucide-vue-next";
import type { OmsgAssignmentComplianceItem } from "@/stores/omsgAssignmentCompliance.types";

const props = defineProps<{
  items: OmsgAssignmentComplianceItem[];
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  load: [force: boolean];
}>();

const hasItems = computed(() => props.items.length > 0);

const getItemKey = (
  item: OmsgAssignmentComplianceItem,
  index: number,
): string =>
  item.id_sg ??
  `${item.id_orden_base ?? "sin-orden"}-${item.email_supervisor ?? "sin-email"}-${index}`;

const formatCreatedAt = (value: string | null): string => {
  if (!value) return "Sin fecha registrada";

  const utcValue = value.endsWith("Z") ? value : `${value}Z`;
  const date = new Date(utcValue);
  const dateTimeParts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);

  if (!dateTimeParts || Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Panama",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const formatHours = (value: number | null): string =>
  value === null ? "Sin horas" : `${value} h`;

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
    class="group overflow-hidden rounded-xl border border-danger/20 bg-white"
    @toggle="handleToggle"
  >
    <summary
      class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 outline-none transition hover:bg-danger-bg/40 [&::-webkit-details-marker]:hidden"
    >
      <div class="flex min-w-0 items-center gap-2">
        <div class="rounded-lg bg-danger-bg p-1.5 text-danger">
          <AlertTriangle class="h-4 w-4" />
        </div>
        <div>
          <h4
            class="text-[11px] font-black uppercase tracking-[0.12em] text-slate-700"
          >
            Cumplimiento de asignación OMSG
          </h4>
          <p class="mt-0.5 text-[10px] text-slate-500">
            {{
              hasItems
                ? `${items.length} incumplimiento(s) encontrado(s)`
                : "Validación por supervisor y fecha"
            }}
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
          class="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-main transition hover:bg-main/5 disabled:cursor-not-allowed"
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
        Consultando cumplimiento de asignación OMSG…
      </div>

      <div
        v-else-if="error"
        class="m-3 flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-bg p-3 text-xs text-danger"
        role="alert"
      >
        <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
        <p>{{ error }}</p>
      </div>

      <div v-else-if="!hasItems" class="p-5 text-center">
        <AlertTriangle class="mx-auto h-5 w-5 text-main/50" />
        <p class="mt-2 text-xs font-semibold text-slate-600">
          No hay incumplimientos para este supervisor y fecha.
        </p>
      </div>

      <ul v-else class="space-y-3 p-3">
        <li
          v-for="(item, index) in items"
          :key="getItemKey(item, index)"
          class="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div class="border-b border-slate-100 px-3 py-3">
            <div class="flex items-start gap-2">
              <div class="rounded-lg bg-main/5 p-1.5 text-main">
                <Wrench class="h-4 w-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold leading-relaxed text-slate-800">
                  {{ item.trabajo_realizar || "Trabajo no identificado" }}
                </p>
                <p class="mt-1 text-[10px] text-slate-500">
                  {{ item.id_orden_base || "Orden sin identificar" }}
                  <span v-if="item.equipo"> · Equipo {{ item.equipo }}</span>
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-px bg-slate-100 sm:grid-cols-2">
            <div class="bg-white px-3 py-2.5">
              <div class="flex items-center gap-1.5 text-slate-500">
                <CalendarClock class="h-3.5 w-3.5 text-main" />
                <p class="text-[9px] font-bold uppercase tracking-wide">
                  Creación · Panamá
                </p>
              </div>
              <p class="mt-1 text-[11px] font-semibold text-slate-700">
                {{ formatCreatedAt(item.fecha_creacion) }}
              </p>
            </div>
            <div class="bg-white px-3 py-2.5">
              <div class="flex items-center gap-1.5 text-slate-500">
                <UserRound class="h-3.5 w-3.5 text-main" />
                <p class="text-[9px] font-bold uppercase tracking-wide">
                  Creado por
                </p>
              </div>
              <p class="mt-1 text-[11px] font-semibold text-slate-700">
                {{ item.nombre_creador || "Usuario no identificado" }}
              </p>
              <p class="mt-0.5 text-[10px] text-slate-500">
                {{ item.area_creador || "Área no identificada" }}
              </p>
            </div>
            <div class="bg-white px-3 py-2.5">
              <p
                class="text-[9px] font-bold uppercase tracking-wide text-slate-500"
              >
                Trabajaron en la orden
              </p>
              <p class="mt-1 text-[11px] font-semibold text-slate-700">
                {{ item.mecanicos || "Sin mecánicos registrados" }}
              </p>
              <p class="mt-0.5 text-[10px] text-slate-500">
                {{ item.cantidad_ot ?? 0 }} OT ·
                {{ formatHours(item.horas_trabajadas) }}
              </p>
            </div>
            <div class="bg-white px-3 py-2.5">
              <p
                class="text-[9px] font-bold uppercase tracking-wide text-slate-500"
              >
                Supervisor responsable
              </p>
              <p
                class="mt-1 break-all text-[11px] font-semibold text-slate-700"
              >
                {{ item.email_supervisor || "Supervisor no identificado" }}
              </p>
              <p class="mt-0.5 text-[10px] text-slate-500">
                {{ item.area_objetivo || "Área objetivo no identificada" }}
              </p>
            </div>
          </div>

          <div
            class="flex items-start gap-2 border-t border-danger/15 bg-danger-bg px-3 py-2.5 text-danger"
          >
            <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p class="text-[9px] font-bold uppercase tracking-wide">
                Motivo del incumplimiento
              </p>
              <p class="mt-0.5 text-[11px] font-bold leading-relaxed">
                {{ item.motivo_incumplimiento || "Motivo no identificado" }}
              </p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </details>
</template>
