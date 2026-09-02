<script setup lang="ts">
import { computed } from "vue";
import {
  Activity,
  AlertTriangle,
  CircleHelp,
  FileText,
  History,
  MapPinned,
  MessageSquareMore,
  Reply,
  RotateCw,
  Route,
  ScanLine,
  Timer,
  UsersRound,
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
  livePermanence?: { seconds: number; startedAt: number };
  liveNow?: number | null;
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
const visitHistory = computed(() => [...(props.task?.visits ?? [])].reverse());
const observationThreads = computed(() => {
  const observations = props.task?.observations ?? [];
  const observationIds = new Set(
    observations.map((observation) => observation.id),
  );
  const repliesByOrigin = new Map<string, typeof observations>();
  observations.forEach((observation) => {
    if (!observation.observacion_origen_id) return;
    const replies =
      repliesByOrigin.get(observation.observacion_origen_id) ?? [];
    replies.push(observation);
    repliesByOrigin.set(observation.observacion_origen_id, replies);
  });
  return observations
    .filter(
      (observation) =>
        !observation.observacion_origen_id ||
        !observationIds.has(observation.observacion_origen_id),
    )
    .map((observation) => ({
      observation,
      replies: [...(repliesByOrigin.get(observation.id) ?? [])].sort(
        (left, right) =>
          new Date(left.creado_en).getTime() -
          new Date(right.creado_en).getTime(),
      ),
    }))
    .sort(
      (left, right) =>
        new Date(right.observation.creado_en).getTime() -
        new Date(left.observation.creado_en).getTime(),
    );
});
const isCounting = computed(
  () =>
    Boolean(props.livePermanence) &&
    props.liveNow !== null &&
    props.liveNow !== undefined,
);
const liveCurrentVisitSeconds = computed(() => {
  if (
    !isCounting.value ||
    !props.livePermanence ||
    props.liveNow === null ||
    props.liveNow === undefined
  )
    return props.task?.time.segundos_visita_abierta ?? 0;
  return (
    props.livePermanence.seconds +
    Math.max(
      0,
      Math.floor((props.liveNow - props.livePermanence.startedAt) / 1000),
    )
  );
});
const liveTotalSeconds = computed(() => {
  if (!props.task) return 0;
  if (!isCounting.value) return props.task.time.segundos_totales;
  return Math.max(
    0,
    props.task.time.segundos_totales -
      props.task.time.segundos_visita_abierta +
      liveCurrentVisitSeconds.value,
  );
});

function formatDuration(seconds: number, includeSeconds = false): string {
  if (!seconds) return "0 min";
  if (includeSeconds) {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const pad = (value: number) => value.toString().padStart(2, "0");
    return `${pad(Math.floor(totalSeconds / 3600))}:${pad(
      Math.floor((totalSeconds % 3600) / 60),
    )}:${pad(totalSeconds % 60)}`;
  }
  const minutes = Math.round(seconds / 60);
  return minutes ? `${minutes} min` : `${seconds} s`;
}

function formatDate(value: string | null): string {
  if (!value) return "Sin registro";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-PA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
}

function formatTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("es-PA", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function visitDuration(
  visit: TareaSeguimientoDetail["visits"][number],
): string {
  if (!visit.salida_en) return "En curso";
  const startedAt = new Date(visit.entrada_en).getTime();
  const endedAt = new Date(visit.salida_en).getTime();
  return Number.isFinite(startedAt) && Number.isFinite(endedAt)
    ? formatDuration(Math.max(0, Math.round((endedAt - startedAt) / 1000)))
    : "—";
}
</script>

<template>
  <aside
    class="flex h-full min-h-0 flex-col bg-white shadow-[-4px_0_16px_rgb(0_0_0_/_16%)]"
    aria-label="Detalle de tarea"
  >
    <header class="border-b border-slate-100 bg-white p-3.5">
      <div class="flex items-start gap-2.5">
        <div
          class="grid size-[2.125rem] shrink-0 place-items-center rounded-[0.5625rem]"
          :class="
            isDoubt ? 'bg-warning-bg text-warning' : 'bg-second text-main'
          "
        >
          <CircleHelp v-if="isDoubt" class="size-[1.0625rem]" />
          <MapPinned
            v-else-if="task?.type === 'finca'"
            class="size-[1.0625rem]"
          />
          <ScanLine v-else class="size-[1.0625rem]" />
        </div>
        <div class="min-w-0 flex-1">
          <h2
            class="line-clamp-2 text-sm font-bold leading-[1.2] text-slate-900"
          >
            {{
              task?.instructions ||
              (loading ? "Cargando tarea" : "Tarea seleccionada")
            }}
          </h2>
        </div>
        <button
          v-if="task?.routePoint || task?.visualLocation"
          class="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-main px-2.5 text-[10px] font-extrabold text-main transition hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main xl:hidden"
          type="button"
          @click="emit('focus', task.routePoint ?? task.visualLocation)"
        >
          <MapPinned class="size-3.5" aria-hidden="true" />Ver mapa
        </button>
        <button
          class="grid size-7 shrink-0 place-items-center rounded-[0.4375rem] bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
          aria-label="Cerrar detalle"
          type="button"
          @click="emit('close')"
        >
          <X class="size-4" />
        </button>
      </div>
      <div v-if="task" class="mt-2.5 flex flex-wrap gap-1.5">
        <span
          class="inline-flex items-center gap-1 rounded-full bg-second px-2 py-1 text-[9px] font-extrabold text-main"
        >
          <span class="size-1 rounded-full bg-current" />{{ typeLabel }}
        </span>
        <span
          class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold"
          :class="
            isDoubt
              ? 'bg-warning-bg text-warning'
              : task.status === 'activa' || task.status === 'visitada'
                ? 'bg-success-bg text-success'
                : task.status === 'en_ruta'
                  ? 'bg-info-bg text-info'
                  : 'bg-slate-100 text-slate-600'
          "
        >
          <span class="size-1 rounded-full bg-current" />{{ statusLabel }}
        </span>
        <span
          class="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-1 text-[9px] font-extrabold text-warning"
        >
          <span class="size-1 rounded-full bg-current" />{{
            task.priorityLabel || "Sin prioridad"
          }}
        </span>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto bg-[#f8f7f4] p-2.5">
      <div v-if="loading" class="grid gap-2" aria-live="polite">
        <div
          v-for="index in 5"
          :key="index"
          class="h-20 animate-pulse rounded-[10px] bg-slate-200"
        />
      </div>
      <div
        v-else-if="error"
        class="rounded-[10px] border border-danger/25 bg-danger-bg p-4 text-center"
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
        <TaskDoubtSection v-if="isDoubt" class="mb-2" :task="task" />

        <section
          class="mb-2 rounded-[10px] border border-slate-100 bg-white p-3"
        >
          <h3
            class="flex items-center gap-1.5 text-[11px] font-extrabold text-main"
          >
            <Activity class="size-4" />Estado de la tarea
          </h3>
          <div class="mt-2.5 grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Administrativo
              </p>
              <p class="mt-1 text-[10px] font-extrabold text-slate-700">
                {{ task.administrativeStatusLabel || "Sin estado" }}
              </p>
            </div>
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Operativo
              </p>
              <p class="mt-1 text-[10px] font-extrabold text-slate-700">
                {{ task.operationalStatusLabel || statusLabel }}
              </p>
            </div>
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Prioridad
              </p>
              <p class="mt-1 text-[10px] font-extrabold text-slate-700">
                {{ task.priorityLabel || "Sin prioridad" }}
              </p>
            </div>
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Visita actual
              </p>
              <p class="mt-1 text-[10px] font-extrabold text-slate-700">
                {{ task.time.visita_abierta ? "Activa" : "Sin visita activa" }}
              </p>
            </div>
          </div>
        </section>

        <section
          class="mb-2 rounded-[10px] border border-slate-100 bg-white p-3"
        >
          <h3
            class="flex items-center gap-1.5 text-[11px] font-extrabold text-main"
          >
            <Timer class="size-4" />Tiempo en la tarea
          </h3>
          <div class="mt-2.5 grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Tiempo total
              </p>
              <p class="mt-1 font-mono text-[11px] font-bold text-slate-700">
                {{ formatDuration(liveTotalSeconds, isCounting) }}
              </p>
            </div>
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Visita actual
              </p>
              <p class="mt-1 font-mono text-[11px] font-bold text-slate-700">
                {{ formatDuration(liveCurrentVisitSeconds, isCounting) }}
              </p>
              <p
                v-if="isCounting"
                class="mt-1 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.05em] text-success"
              >
                <span
                  class="size-1.5 animate-pulse rounded-full bg-success"
                />Contando
              </p>
            </div>
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Número de visitas
              </p>
              <p class="mt-1 font-mono text-[11px] font-bold text-slate-700">
                {{ task.time.cantidad_visitas }}
              </p>
            </div>
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Sin datos
              </p>
              <p class="mt-1 font-mono text-[11px] font-bold text-slate-700">
                {{ formatDuration(task.time.segundos_sin_datos) }}
              </p>
            </div>
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Primera entrada
              </p>
              <p class="mt-1 font-mono text-[11px] font-bold text-slate-700">
                {{ formatTime(task.time.primera_llegada_en) }}
              </p>
            </div>
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Última salida
              </p>
              <p class="mt-1 font-mono text-[11px] font-bold text-slate-700">
                {{ formatTime(task.time.ultima_salida_en) }}
              </p>
            </div>
          </div>
        </section>

        <section
          class="mb-2 rounded-[10px] border border-slate-100 bg-white p-3"
        >
          <h3
            class="flex items-center gap-1.5 text-[11px] font-extrabold text-main"
          >
            <UsersRound class="size-4" />Asignación
          </h3>
          <dl class="mt-2.5 grid gap-2">
            <div
              class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-[10px]"
            >
              <dt
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Trabajador
              </dt>
              <dd class="truncate text-right font-bold text-slate-700">
                {{ task.assignedUserName || "Sin asignar" }}
              </dd>
            </div>
            <div
              class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-[10px]"
            >
              <dt
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Tracker
              </dt>
              <dd class="truncate text-right font-bold text-slate-700">
                {{ task.trackerLabel || "Sin asignar" }}
              </dd>
            </div>
            <div
              v-if="task.companionNames.length"
              class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-[10px]"
            >
              <dt
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Acompañantes
              </dt>
              <dd class="text-right font-bold text-slate-700">
                {{ task.companionNames.join(", ") }}
              </dd>
            </div>
            <div
              class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-[10px]"
            >
              <dt
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Tipo
              </dt>
              <dd class="text-right font-bold text-slate-700">
                {{ typeLabel }}
              </dd>
            </div>
          </dl>
        </section>

        <section
          class="mb-2 rounded-[10px] border border-slate-100 bg-white p-3"
        >
          <h3
            class="flex items-center gap-1.5 text-[11px] font-extrabold text-main"
          >
            <FileText class="size-4" />Detalles
          </h3>
          <dl class="mt-2.5 grid gap-2">
            <div
              class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-[10px]"
            >
              <dt
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Indicaciones
              </dt>
              <dd class="text-right font-bold leading-[1.35] text-slate-700">
                {{ task.instructions || "Sin indicaciones" }}
              </dd>
            </div>
            <div
              class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-[10px]"
            >
              <dt
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Fecha
              </dt>
              <dd class="text-right font-bold text-slate-700">
                {{ formatDate(task.scheduledDate) }}
              </dd>
            </div>
            <div
              class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-[10px]"
            >
              <dt
                class="text-[8px] font-extrabold uppercase tracking-[0.04em] text-slate-400"
              >
                Duración estimada
              </dt>
              <dd class="font-mono text-right font-bold text-slate-700">
                {{ durationLabel }}
              </dd>
            </div>
          </dl>
        </section>

        <section
          class="mb-2 rounded-[10px] border border-slate-100 bg-white p-3"
        >
          <div class="flex items-center justify-between gap-2">
            <h3
              class="flex items-center gap-1.5 text-[11px] font-extrabold text-main"
            >
              <History class="size-4" />Historial de visitas
            </h3>
            <span
              class="rounded-full bg-info-bg px-2 py-0.5 text-[8px] font-extrabold text-info"
              >{{ task.visits.length }} visitas</span
            >
          </div>
          <div
            v-if="visitHistory.length"
            class="relative mt-2.5 grid gap-2 border-l border-slate-200 pl-3"
          >
            <article
              v-for="(visit, index) in visitHistory"
              :key="visit.id"
              class="relative rounded-lg border border-slate-100 bg-white p-2 before:absolute before:-left-[1.05rem] before:top-3 before:size-2 before:rounded-full before:border-2 before:border-info before:bg-white"
            >
              <div class="flex items-center justify-between gap-2">
                <strong class="text-[10px] text-slate-700"
                  >Visita {{ task.visits.length - index }}</strong
                ><span
                  class="rounded-full px-1.5 py-0.5 text-[8px] font-extrabold"
                  :class="
                    visit.salida_en
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-success-bg text-success'
                  "
                  >{{ visit.salida_en ? "Cerrada" : "En curso" }}</span
                >
              </div>
              <div class="mt-2 grid grid-cols-3 gap-2 text-[8px]">
                <div>
                  <p class="uppercase text-slate-400">Entrada</p>
                  <b class="mt-0.5 block font-mono text-slate-700">{{
                    formatTime(visit.entrada_en)
                  }}</b>
                </div>
                <div>
                  <p class="uppercase text-slate-400">Salida</p>
                  <b class="mt-0.5 block font-mono text-slate-700">{{
                    formatTime(visit.salida_en)
                  }}</b>
                </div>
                <div>
                  <p class="uppercase text-slate-400">Duración</p>
                  <b class="mt-0.5 block font-mono text-slate-700">{{
                    visitDuration(visit)
                  }}</b>
                </div>
              </div>
            </article>
          </div>
          <p v-else class="mt-2.5 text-[10px] text-slate-500">
            No hay visitas registradas para esta tarea.
          </p>
        </section>

        <TaskGeometrySection
          class="mb-2"
          :task="task"
          @focus="emit('focus', $event)"
        />

        <section
          v-if="!isDoubt"
          class="rounded-[10px] border border-slate-100 bg-white p-3"
        >
          <h3
            class="flex items-center gap-1.5 text-[11px] font-extrabold text-main"
          >
            <Route class="size-4" />Posición en ruta
          </h3>
          <div class="mt-2.5 flex items-center gap-2.5">
            <span
              class="grid size-7 shrink-0 place-items-center rounded-full bg-main text-[10px] font-extrabold text-white"
              >{{ task.routeOrder ?? "—" }}</span
            >
            <p class="text-[10px] leading-[1.35] text-slate-600">
              {{
                task.route?.id
                  ? `Posición en ruta (${task.route.estado_calculo || "sin estado"})`
                  : "Sin ruta planificada asociada"
              }}
            </p>
          </div>
        </section>

        <section class="rounded-[10px] border border-slate-100 bg-white p-3">
          <div class="flex items-center justify-between gap-2">
            <h3
              class="flex items-center gap-1.5 text-[11px] font-extrabold text-main"
            >
              <MessageSquareMore class="size-4" />Observaciones
            </h3>
            <span
              class="rounded-full bg-second px-2 py-0.5 text-[8px] font-extrabold text-main"
              >{{ task.observations.length }}</span
            >
          </div>
          <div v-if="observationThreads.length" class="mt-2.5 grid gap-2">
            <article
              v-for="thread in observationThreads"
              :key="thread.observation.id"
              class="rounded-lg border border-slate-100 bg-slate-50 p-2"
            >
              <div class="flex items-start justify-between gap-2">
                <span
                  class="rounded-full bg-warning-bg px-1.5 py-0.5 text-[8px] font-extrabold text-warning"
                  >{{ thread.observation.tipo_observacion_nombre }}</span
                >
                <time class="shrink-0 text-[8px] text-slate-400">
                  {{ formatTime(thread.observation.capturada_en) }}
                </time>
              </div>
              <p class="mt-1.5 text-[10px] leading-[1.45] text-slate-700">
                {{ thread.observation.descripcion }}
              </p>
              <p class="mt-1.5 text-[8px] font-bold text-slate-500">
                {{ thread.observation.usuario_nombre || "Usuario" }}
              </p>
              <div
                v-if="thread.replies.length"
                class="mt-2 grid gap-1.5 border-l-2 border-main/20 pl-2"
              >
                <div
                  v-for="reply in thread.replies"
                  :key="reply.id"
                  class="rounded-md bg-white p-1.5"
                >
                  <p
                    class="flex items-center gap-1 text-[8px] font-extrabold text-main"
                  >
                    <Reply class="size-3" />Aclaración ·
                    {{ reply.usuario_nombre || "Usuario" }}
                  </p>
                  <p class="mt-1 text-[9px] leading-[1.4] text-slate-600">
                    {{ reply.descripcion }}
                  </p>
                </div>
              </div>
            </article>
          </div>
          <p v-else class="mt-2.5 text-[10px] text-slate-500">
            No hay observaciones registradas para esta tarea.
          </p>
        </section>
      </template>
    </div>
  </aside>
</template>
