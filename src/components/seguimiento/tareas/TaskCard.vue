<script setup lang="ts">
import { computed } from "vue";
import { CircleHelp, MapPin, Route, ScanLine } from "lucide-vue-next";
import type { TareaSeguimientoListItem } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{
  task: TareaSeguimientoListItem;
  selected: boolean;
  livePermanence?: { seconds: number; startedAt: number };
  liveNow?: number | null;
}>();
const emit = defineEmits<{ select: [taskId: string] }>();

const isDoubt = computed(() => props.task.type === "duda");
const isActive = computed(() => props.task.status === "activa");
const typeLabel = computed(() => props.task.typeName ?? "Tipo sin nombre");
const placeLabel = computed(() => {
  if (isDoubt.value) return "Zona automática de permanencia";
  if (props.task.type === "zona") return "Zona de control";
  return props.task.locationId ? "Finca vinculada" : "Ubicación por definir";
});
const workerLabel = computed(() => {
  if (props.task.assignedUserName) return props.task.assignedUserName;
  return props.task.assignedUserId
    ? "Trabajador asignado"
    : "Sin trabajador asignado";
});
const statusLabel: Record<TareaSeguimientoListItem["status"], string> = {
  pendiente: "Sin iniciar",
  en_ruta: "En ruta",
  activa: "En ubicación",
  visitada: "Visitada",
  cancelada: "Cancelada",
  duda_detectada: "Duda",
};
const estimateLabel = computed(() =>
  props.task.estimatedMinutes
    ? `${props.task.estimatedMinutes} min est.`
    : "Sin estimación",
);
const isCounting = computed(
  () =>
    Boolean(props.livePermanence) &&
    props.liveNow !== null &&
    props.liveNow !== undefined,
);
const durationLabel = computed(() => {
  const liveSeconds =
    isCounting.value &&
    props.livePermanence &&
    props.liveNow !== null &&
    props.liveNow !== undefined
      ? props.livePermanence.seconds +
        Math.max(
          0,
          Math.floor((props.liveNow - props.livePermanence.startedAt) / 1000),
        )
      : null;
  const seconds =
    liveSeconds ??
    (isActive.value || isDoubt.value
      ? props.task.currentVisitSeconds || props.task.elapsedSeconds
      : props.task.elapsedSeconds);
  if (!seconds) return estimateLabel.value;
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const pad = (value: number) => value.toString().padStart(2, "0");
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const base = `${pad(hours)}:${pad(minutes)}`;
  return isCounting.value ? `${base}:${pad(totalSeconds % 60)}` : base;
});
const durationCaption = computed(() => {
  if (isDoubt.value) return "permanencia";
  if (isActive.value && props.task.hasOpenVisit) return "en tarea";
  return props.task.elapsedSeconds ? "total" : null;
});
</script>

<template>
  <button
    class="group grid min-h-[5.75rem] w-full grid-cols-[2.125rem_minmax(0,1fr)_5.875rem] items-start gap-[0.5625rem] rounded-[0.6875rem] border p-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2"
    :class="[
      selected
        ? 'border-main bg-main/[0.045]'
        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50',
      isActive ? 'border-success/35 bg-success-bg/35' : '',
      isDoubt ? 'border-warning/25' : '',
    ]"
    type="button"
    :aria-pressed="selected"
    @click="emit('select', task.id)"
  >
    <span
      class="grid size-[2.125rem] place-items-center rounded-[0.5625rem]"
      :class="
        isDoubt
          ? 'bg-warning-bg text-warning'
          : isActive
            ? 'bg-success-bg text-success'
            : 'bg-second text-main'
      "
      aria-hidden="true"
    >
      <CircleHelp v-if="isDoubt" class="size-[1.0625rem]" />
      <Route v-else-if="task.status === 'en_ruta'" class="size-[1.0625rem]" />
      <MapPin v-else-if="task.type === 'finca'" class="size-[1.0625rem]" />
      <ScanLine v-else class="size-[1.0625rem]" />
    </span>
    <span class="min-w-0">
      <span
        class="line-clamp-2 text-xs font-bold leading-[1.25] text-slate-900"
        >{{ task.instructions || "Tarea sin indicaciones" }}</span
      >
      <span
        class="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-slate-500"
      >
        <span
          class="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.05em]"
          :class="
            isDoubt ? 'bg-warning-bg text-warning' : 'bg-second text-slate-600'
          "
          >{{ typeLabel }}</span
        >
        <span class="truncate">{{ placeLabel }}</span>
        <span v-if="isDoubt" class="sr-only">Detectada automáticamente</span>
      </span>
      <span
        class="mt-1.5 flex min-w-0 items-center gap-1.5 text-[9px] text-slate-500"
      >
        <span class="truncate">{{ workerLabel }}</span>
        <span class="size-[3px] shrink-0 rounded-full bg-slate-300" />
        <span class="truncate">{{
          task.trackerLabel || "Sin tracker asignado"
        }}</span>
      </span>
      <span
        v-if="isActive && task.estimatedMinutes"
        class="mt-1 block text-[9px] text-slate-400"
        >Duración estimada: {{ task.estimatedMinutes }} min</span
      >
    </span>
    <span
      class="flex max-w-[5.875rem] flex-wrap content-start justify-end gap-1 pt-0.5 text-right"
    >
      <span
        class="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-[9px] font-extrabold leading-none"
        :class="
          isDoubt
            ? 'bg-warning-bg text-warning'
            : task.status === 'en_ruta'
              ? 'bg-info-bg text-info'
              : isActive || task.status === 'visitada'
                ? 'bg-success-bg text-success'
                : task.status === 'cancelada'
                  ? 'bg-danger-bg text-danger'
                  : 'bg-slate-100 text-slate-600'
        "
      >
        <span class="size-1 rounded-full bg-current" />{{
          statusLabel[task.status]
        }}
      </span>
      <span
        class="w-full font-mono text-[10px] font-bold leading-none text-slate-700"
        :class="isActive ? 'text-success' : isDoubt ? 'text-warning' : ''"
        >{{ durationLabel }}</span
      >
      <span
        v-if="durationCaption"
        class="w-full text-[8px] font-semibold uppercase tracking-[0.035em] text-slate-400"
        >{{ durationCaption }}</span
      >
      <span
        v-if="isCounting"
        class="inline-flex w-full items-center justify-end gap-1 text-[8px] font-bold uppercase tracking-[0.05em] text-success"
      >
        <span class="size-1.5 animate-pulse rounded-full bg-success" />Contando
      </span>
    </span>
  </button>
</template>
