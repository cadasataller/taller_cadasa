<script setup lang="ts">
import { computed } from "vue";
import {
  AlertTriangle,
  CircleHelp,
  Clock3,
  MapPinned,
  RotateCw,
  ScanLine,
  X,
} from "lucide-vue-next";
import TaskDoubtSection from "./TaskDetailSections/TaskDoubtSection.vue";
import TaskGeometrySection from "./TaskDetailSections/TaskGeometrySection.vue";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type { TareaSeguimientoDetail } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{
  task: TareaSeguimientoDetail | null;
  loading: boolean;
  error: string | null;
}>();
const emit = defineEmits<{
  close: [];
  focus: [coordinates: SeguimientoCoordinates | null];
  retry: [];
}>();
const isDoubt = computed(() => props.task?.type === "duda");
const typeLabel = computed(() =>
  isDoubt.value
    ? "Duda automática"
    : props.task?.type === "zona"
      ? "Zona"
      : "Finca",
);
const statusLabel = computed(() =>
  props.task?.status === "activa"
    ? "En ubicación"
    : props.task?.status === "en_ruta"
      ? "En ruta"
      : props.task?.status === "visitada"
        ? "Visitada"
        : props.task?.status === "cancelada"
          ? "Cancelada"
          : isDoubt.value
            ? "En revisión"
            : "Sin iniciar",
);
const durationLabel = computed(() =>
  props.task?.estimatedMinutes
    ? `${props.task.estimatedMinutes} min`
    : "Sin estimación",
);
const currentTimeLabel = computed(() =>
  props.task
    ? `${Math.round(props.task.time.segundos_totales / 60)} min acumulados`
    : null,
);
</script>

<template>
  <aside
    class="flex h-full min-h-0 flex-col bg-white shadow-[-4px_0_16px_rgb(0_0_0_/_16%)]"
    aria-label="Detalle de tarea"
  >
    <header class="border-b border-slate-200 p-4">
      <div class="flex items-start gap-3">
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-lg"
          :class="
            isDoubt ? 'bg-warning-bg text-warning' : 'bg-second text-main'
          "
        >
          <CircleHelp v-if="isDoubt" class="size-5" /><MapPinned
            v-else-if="task?.type === 'finca'"
            class="size-5"
          /><ScanLine v-else class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="text-[10px] font-extrabold uppercase tracking-[0.14em] text-warning"
          >
            {{ isDoubt ? "Duda detectada" : "Detalle de tarea" }}
          </p>
          <h2 class="mt-1 text-sm font-bold leading-5 text-slate-800">
            {{
              task?.instructions ||
              (loading ? "Cargando tarea" : "Tarea seleccionada")
            }}
          </h2>
          <p class="mt-1 text-[11px] text-slate-500">
            {{
              isDoubt
                ? "Señal automática para revisión operativa."
                : "Información operativa de solo lectura."
            }}
          </p>
        </div>
        <button
          class="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Cerrar detalle"
          type="button"
          @click="emit('close')"
        >
          <X class="size-5" />
        </button>
      </div>
      <div v-if="task" class="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          class="rounded-full bg-second px-2 py-1 text-[10px] font-bold text-main"
          >{{ typeLabel }}</span
        ><span
          class="rounded-full px-2 py-1 text-[10px] font-bold"
          :class="
            isDoubt
              ? 'bg-warning-bg text-warning'
              : 'bg-slate-100 text-slate-600'
          "
          >{{ statusLabel }}</span
        ><span
          v-if="currentTimeLabel"
          class="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500"
          ><Clock3 class="size-3" />{{ currentTimeLabel }}</span
        >
      </div>
    </header>
    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <div v-if="loading" class="grid gap-3" aria-live="polite">
        <div
          v-for="index in 5"
          :key="index"
          class="h-14 animate-pulse rounded-lg bg-slate-100"
        />
      </div>
      <div
        v-else-if="error"
        class="rounded-xl border border-danger/25 bg-danger-bg p-4 text-center"
      >
        <AlertTriangle class="mx-auto size-5 text-danger" aria-hidden="true" />
        <p class="mt-2 text-xs leading-5 text-danger">{{ error }}</p>
        <button
          class="mt-3 inline-flex items-center gap-1 rounded-lg bg-main px-3 py-2 text-xs font-bold text-white"
          type="button"
          @click="emit('retry')"
        >
          <RotateCw class="size-3.5" />Reintentar
        </button>
      </div>
      <template v-else-if="task">
        <TaskDoubtSection v-if="isDoubt" :task="task" />
        <section class="border-b border-slate-100 py-4">
          <h3
            class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600"
          >
            Asignación y tiempo
          </h3>
          <dl class="mt-3 grid gap-2.5 text-xs">
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Trabajador asignado</dt>
              <dd
                class="max-w-48 truncate text-right font-bold text-slate-700"
                :title="task.assignedUserId || undefined"
              >
                {{ task.assignedUserId || "Sin asignar" }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Tracker / equipo</dt>
              <dd class="text-right font-bold text-slate-700">
                {{ task.trackerLabel || "Sin asignar" }}
              </dd>
            </div>
            <div v-if="task.companionNames.length" class="grid gap-1">
              <dt class="text-slate-500">Acompañantes</dt>
              <dd class="flex flex-wrap justify-end gap-1">
                <span
                  v-for="name in task.companionNames"
                  :key="name"
                  class="rounded-full bg-second px-2 py-0.5 text-[11px] font-bold text-main"
                >
                  {{ name }}
                </span>
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Fecha programada</dt>
              <dd class="text-right font-bold text-slate-700">
                {{ task.scheduledDate }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Duración estimada</dt>
              <dd class="font-bold text-slate-700">{{ durationLabel }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Visitas</dt>
              <dd class="font-bold text-slate-700">
                {{ task.time.cantidad_visitas
                }}{{ task.time.visita_abierta ? " (una activa)" : "" }}
              </dd>
            </div>
          </dl>
        </section>
        <TaskGeometrySection
          class="py-4"
          :task="task"
          @focus="emit('focus', $event)"
        />
        <section v-if="!isDoubt" class="py-4">
          <h3
            class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600"
          >
            Ruta
          </h3>
          <div class="mt-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <span
              class="flex size-7 items-center justify-center rounded-full bg-main text-xs font-extrabold text-white"
              >{{ task.routeOrder ?? "—" }}</span
            >
            <p class="text-xs text-slate-600">
              {{
                task.route?.id
                  ? `Posición en ruta (${task.route.estado_calculo || "sin estado"})`
                  : "Sin ruta planificada asociada"
              }}
            </p>
          </div>
        </section>
      </template>
    </div>
  </aside>
</template>
