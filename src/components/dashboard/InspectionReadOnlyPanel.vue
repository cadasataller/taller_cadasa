<script setup lang="ts">
import { computed, ref, watch, type CSSProperties } from "vue";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Eye,
  Images,
  LoaderCircle,
  MessageSquareText,
  UserRound,
  X,
} from "lucide-vue-next";
import { parseMeetingObservation } from "@/utils/meetingRatings";
import AssignedHoursReadOnlyPanel from "@/components/dashboard/AssignedHoursReadOnlyPanel.vue";
import type {
  RatingsCriterio,
  RatingsDetalle,
  RatingsInspeccionNormalizada,
} from "@/stores/ratingsStore.types";
import type { PuntuacionSupervisorOtArea } from "@/stores/ratingsStore.types";
import type { AssignedHoursGroup } from "@/stores/assignedHoursStore.types";

const props = defineProps<{
  inspection: RatingsInspeccionNormalizada;
  details: RatingsDetalle[];
  criteria: RatingsCriterio[];
  supervisorName: string;
  inspectorName: string;
  closingDate: string;
  closingArea: PuntuacionSupervisorOtArea | null;
  closingLoading: boolean;
  closingError: string | null;
  assignedHoursArea: string;
  assignedHoursGroups: AssignedHoursGroup[];
  assignedHoursLoading: boolean;
  assignedHoursError: string | null;
}>();

const emit = defineEmits<{
  close: [];
  viewPhotos: [photoUrls: string];
  loadClosing: [];
  loadAssignedHours: [force: boolean];
}>();

type DrawerTab = "evaluation" | "closing";

const activeTab = ref<DrawerTab>("evaluation");

watch(
  () => props.inspection.id_inspeccion,
  () => {
    activeTab.value = "evaluation";
  },
);

const meetingCriterionId = 5;

const parsedObservation = computed(() =>
  parseMeetingObservation(props.inspection.observacion),
);

const criteriaById = computed(
  () =>
    new Map(
      props.criteria.map((criterion) => [criterion.id_criterio, criterion]),
    ),
);

const ratingRows = computed(() =>
  props.details
    .filter((detail) => detail.id_criterio !== meetingCriterionId)
    .map((detail) => ({
      id: detail.id_criterio,
      label:
        criteriaById.value.get(detail.id_criterio)?.descripcion_tarea ||
        `Criterio ${detail.id_criterio}`,
      score: detail.puntuacion,
    })),
);

const managementScore = computed(
  () =>
    props.details.find((detail) => detail.id_criterio === meetingCriterionId)
      ?.puntuacion ?? null,
);

const photoUrls = computed(() => props.inspection.foto_url ?? "");

const photoCount = computed(
  () =>
    photoUrls.value.split(",").filter((photoUrl) => photoUrl.trim() !== "")
      .length,
);

const getScoreColor = (score: number): string => {
  const normalizedScore = Math.min(5, Math.max(1, score));

  if (normalizedScore <= 1.5) return "var(--color-danger)";
  if (normalizedScore < 3)
    return "color-mix(in srgb, var(--color-danger) 45%, var(--color-accent))";
  if (normalizedScore <= 3.5) return "var(--color-accent)";
  if (normalizedScore < 5)
    return "color-mix(in srgb, var(--color-accent) 45%, var(--color-main-light))";
  return "var(--color-main-light)";
};

const getScoreLabel = (score: number | null): string => {
  if (score === null) return "Sin calificación";
  if (score < 3) return "Malo";
  if (score < 4) return "Regular";
  return "Bueno";
};

const getScoreSurfaceStyle = (score: number | null): CSSProperties => {
  if (score === null) {
    return { backgroundColor: "var(--color-gray-500)", color: "#ffffff" };
  }

  const mainColor = getScoreColor(score);

  return {
    background: `linear-gradient(135deg, color-mix(in srgb, ${mainColor} 78%, white), ${mainColor})`,
    color: "#ffffff",
  };
};

const resultSurfaceStyle = computed(() =>
  getScoreSurfaceStyle(props.inspection.puntuacion_promedio),
);

const managementSurfaceStyle = computed(() =>
  getScoreSurfaceStyle(managementScore.value),
);

const lateClosingOrders = computed(() =>
  (props.closingArea?.ots || []).filter(
    (order) => order.cumplimiento.caso === "GESTIONADO_TARDE",
  ),
);

const closingOrdersWithoutHistory = computed(() =>
  (props.closingArea?.ots || []).filter(
    (order) => order.cumplimiento.caso === "SIN_HISTORIAL",
  ),
);

const formatScore = (score: number | null): string =>
  score === null ? "Sin calificación" : `${score.toFixed(1)} / 5`;

const formatScoreWithLabel = (score: number | null): string =>
  score === null
    ? "Sin calificación"
    : `${formatScore(score)} · ${getScoreLabel(score)}`;

const formatFecha = (fecha: string): string => {
  const date = new Date(`${fecha}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-PA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replace(".", "");
};

const formatHora = (hora: string): string => {
  const [hourValue, minute = "00"] = hora.split(":");
  const numericHour = Number(hourValue);

  if (Number.isNaN(numericHour)) return hora;

  const suffix = numericHour >= 12 ? "PM" : "AM";
  const normalizedHour = numericHour % 12 || 12;
  return `${normalizedHour}:${minute.padStart(2, "0")} ${suffix}`;
};

const selectTab = (tab: DrawerTab): void => {
  activeTab.value = tab;

  if (tab === "closing") emit("loadClosing");
};
</script>

<template>
  <aside
    class="fixed inset-y-0 right-0 z-[90] w-full overflow-hidden border-l border-slate-200 bg-[#fbfcfa] shadow-2xl sm:w-[30rem] lg:w-[34rem]"
    aria-label="Detalle de calificación"
  >
    <article class="h-full w-full overflow-y-auto bg-[#fbfcfa]">
      <header
        class="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-[#fbfcfa]/95 px-4 py-3 backdrop-blur"
      >
        <div class="flex min-w-0 items-start gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-main text-white shadow-sm"
          >
            <ClipboardCheck class="h-4 w-4" />
          </div>
          <div>
            <p
              class="text-[10px] font-bold uppercase tracking-[0.14em] text-main"
            >
              Evaluación registrada
            </p>
            <h3 class="mt-0.5 text-sm font-black tracking-tight text-slate-900">
              Ficha de calificación
            </h3>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Cerrar detalle"
          @click="emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </header>

      <nav
        class="sticky top-[69px] z-10 grid grid-cols-2 border-b border-slate-200 bg-[#fbfcfa]/95 px-4 pt-2 backdrop-blur"
        aria-label="Secciones de la ficha"
      >
        <button
          type="button"
          class="inline-flex min-h-9 items-center justify-center gap-1.5 border-b-2 px-2 text-[11px] font-bold transition"
          :class="
            activeTab === 'evaluation'
              ? 'border-main text-main'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          "
          @click="selectTab('evaluation')"
        >
          <ClipboardCheck class="h-3.5 w-3.5" />
          Evaluación
        </button>
        <button
          type="button"
          class="inline-flex min-h-9 items-center justify-center gap-1.5 border-b-2 px-2 text-[11px] font-bold transition"
          :class="
            activeTab === 'closing'
              ? 'border-main text-main'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          "
          @click="selectTab('closing')"
        >
          <Clock3 class="h-3.5 w-3.5" />
          Cierre de jornada
        </button>
      </nav>

      <div v-if="activeTab === 'evaluation'" class="space-y-5 px-4 py-4">
        <section
          class="overflow-hidden rounded-2xl p-4 shadow-sm"
          :style="resultSurfaceStyle"
        >
          <div class="flex items-end justify-between gap-4">
            <div>
              <p
                class="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75"
              >
                Resultado general
              </p>
              <div class="mt-2 flex items-end gap-2">
                <span class="text-4xl font-black tracking-tighter">
                  {{ inspection.puntuacion_promedio.toFixed(1) }}
                </span>
                <span class="mb-1 text-xs font-bold text-white/75">/ 5</span>
              </div>
              <p
                class="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80"
              >
                {{ getScoreLabel(inspection.puntuacion_promedio) }}
              </p>
            </div>
            <div
              class="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-right backdrop-blur-sm"
            >
              <p
                class="text-[9px] font-bold uppercase tracking-[0.14em] text-white/70"
              >
                Equivalencia
              </p>
              <p class="mt-1 text-sm font-black">
                {{
                  Number(
                    ((inspection.puntuacion_promedio / 5) * 100).toFixed(1),
                  )
                }}%
              </p>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-2 flex items-center gap-2">
            <UserRound class="h-3.5 w-3.5 text-main" />
            <h4
              class="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
            >
              Datos de la evaluación
            </h4>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <p
                class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >
                Supervisor
              </p>
              <p class="mt-1 text-xs font-bold text-slate-800">
                {{ supervisorName }}
              </p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <p
                class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >
                Evaluador
              </p>
              <p class="mt-1 text-xs font-bold text-slate-800">
                {{ inspectorName }}
              </p>
            </div>
            <div
              class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
            >
              <CalendarDays class="h-4 w-4 text-main" />
              <div>
                <p
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Fecha
                </p>
                <p class="text-xs font-bold text-slate-800">
                  {{ formatFecha(inspection.fecha) }}
                </p>
              </div>
            </div>
            <div
              class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Clock3 class="h-4 w-4 text-main" />
              <div>
                <p
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Hora
                </p>
                <p class="text-xs font-bold text-slate-800">
                  {{ formatHora(inspection.hora) }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-2 flex items-center gap-2">
            <ClipboardCheck class="h-3.5 w-3.5 text-main" />
            <h4
              class="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
            >
              Criterios calificados
            </h4>
          </div>
          <div
            class="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div
              v-for="rating in ratingRows"
              :key="rating.id"
              class="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0"
            >
              <p class="text-xs font-semibold text-slate-700">
                {{ rating.label }}
              </p>
              <div class="flex shrink-0 items-center gap-2">
                <span
                  class="rounded-lg px-2 py-1 text-[10px] font-black text-white"
                  :style="getScoreSurfaceStyle(rating.score)"
                >
                  {{ rating.score.toFixed(1) }} ·
                  {{ getScoreLabel(rating.score) }}
                </span>
              </div>
            </div>
            <p
              v-if="ratingRows.length === 0"
              class="px-3 py-5 text-xs italic text-slate-400"
            >
              No hay criterios diarios registrados.
            </p>
          </div>
        </section>

        <AssignedHoursReadOnlyPanel
          :area="assignedHoursArea"
          :groups="assignedHoursGroups"
          :is-loading="assignedHoursLoading"
          :error="assignedHoursError"
          :inspection-date="inspection.fecha"
          @load="emit('loadAssignedHours', $event)"
        />

        <section class="rounded-xl p-3" :style="managementSurfaceStyle">
          <div class="flex items-start gap-2">
            <div class="rounded-lg bg-white/15 p-1.5 text-white">
              <Building2 class="h-4 w-4" />
            </div>
            <div class="min-w-0 flex-1">
              <p
                class="text-[10px] font-black uppercase tracking-[0.14em] text-white/80"
              >
                Asistencia a reunion dia tipico
              </p>
              <p class="mt-1 text-sm font-black text-white">
                {{ formatScoreWithLabel(managementScore) }}
              </p>
              <p
                class="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-white/90"
              >
                {{
                  parsedObservation.meetingObservation.gerencia ||
                  "Sin observación de gerencia."
                }}
              </p>
            </div>
          </div>
        </section>

        <section class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <div class="flex items-center gap-2 text-slate-500">
              <MessageSquareText class="h-3.5 w-3.5 text-main" />
              <p class="text-[10px] font-black uppercase tracking-[0.14em]">
                Observación
              </p>
            </div>
            <p
              class="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600"
            >
              {{
                parsedObservation.generalObservation ||
                "Sin observación registrada."
              }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <div class="flex items-center gap-2 text-slate-500">
              <Images class="h-3.5 w-3.5 text-main" />
              <p class="text-[10px] font-black uppercase tracking-[0.14em]">
                Evidencia fotográfica
              </p>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-slate-600">
              {{
                photoCount
                  ? `${photoCount} foto(s) disponible(s).`
                  : "No se adjuntaron fotos."
              }}
            </p>
            <button
              v-if="photoCount"
              type="button"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-main px-3 py-2 text-xs font-bold text-white transition hover:bg-main-light"
              @click="emit('viewPhotos', photoUrls)"
            >
              <Eye class="h-3.5 w-3.5" />
              Ver evidencia
            </button>
          </div>
        </section>
      </div>

      <div v-else class="space-y-4 px-4 py-4">
        <div>
          <div class="flex items-center gap-2">
            <Clock3 class="h-4 w-4 text-main" />
            <h4 class="text-xs font-black text-slate-900">
              Cumplimiento de cierre de jornada
            </h4>
          </div>
          <p class="mt-1 text-[11px] leading-relaxed text-slate-500">
            Resumen del {{ formatFecha(closingDate) }}.
          </p>
        </div>

        <div
          v-if="closingLoading"
          class="flex min-h-48 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 text-center"
        >
          <LoaderCircle class="h-5 w-5 animate-spin text-main" />
          <p class="mt-2 text-xs font-semibold text-slate-600">
            Consultando el cierre de jornada…
          </p>
        </div>

        <div
          v-else-if="closingError"
          class="rounded-xl border border-danger/25 bg-danger-bg p-3 text-xs leading-relaxed text-danger"
          role="alert"
        >
          <div class="flex items-start gap-2">
            <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
            <p>{{ closingError }}</p>
          </div>
        </div>

        <div v-else-if="closingArea" class="space-y-3">
          <section
            class="rounded-2xl p-4 shadow-sm"
            :style="getScoreSurfaceStyle(closingArea.resumen.puntuacion)"
          >
            <div class="flex items-end justify-between gap-3">
              <div>
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75"
                >
                  Puntuación de cierre
                </p>
                <p class="mt-1 text-3xl font-black tracking-tighter">
                  {{ closingArea.resumen.puntuacion?.toFixed(1) ?? "—" }}
                  <span class="text-xs text-white/75">/ 5</span>
                </p>
                <p
                  class="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80"
                >
                  {{ getScoreLabel(closingArea.resumen.puntuacion) }}
                </p>
              </div>
              <div
                class="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-right"
              >
                <p
                  class="text-[9px] font-bold uppercase tracking-[0.14em] text-white/70"
                >
                  Cumplimiento
                </p>
                <p class="mt-1 text-sm font-black">
                  {{ closingArea.resumen.porcentaje.toFixed(1) }}%
                </p>
              </div>
            </div>
          </section>

          <section class="grid grid-cols-3 gap-2">
            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <p
                class="text-[9px] font-bold uppercase tracking-wide text-slate-400"
              >
                OT
              </p>
              <p class="mt-1 text-lg font-black text-slate-800">
                {{ closingArea.resumen.total }}
              </p>
              <p class="text-[10px] text-slate-500">procesadas</p>
            </div>
            <div class="rounded-xl border border-main/15 bg-main/5 p-3">
              <p class="text-[9px] font-bold uppercase tracking-wide text-main">
                A tiempo
              </p>
              <p class="mt-1 text-lg font-black text-main">
                {{ closingArea.resumen.a_tiempo }}
              </p>
              <p class="text-[10px] text-slate-500">al corte 23:30</p>
            </div>
            <div class="rounded-xl border border-danger/20 bg-danger-bg p-3">
              <p
                class="text-[9px] font-bold uppercase tracking-wide text-danger"
              >
                Tardías
              </p>
              <p class="mt-1 text-lg font-black text-danger">
                {{ closingArea.resumen.fuera_de_tiempo }}
              </p>
              <p class="text-[10px] text-slate-500">después del corte</p>
            </div>
          </section>

          <details
            v-if="lateClosingOrders.length"
            class="group overflow-hidden rounded-xl border border-danger/25 bg-white"
          >
            <summary
              class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-bold text-danger outline-none hover:bg-danger-bg [&::-webkit-details-marker]:hidden"
            >
              <span>Ver {{ lateClosingOrders.length }} OT tardías</span>
              <ChevronRight
                class="h-4 w-4 transition-transform group-open:rotate-90"
              />
            </summary>
            <ul class="divide-y divide-slate-100 border-t border-slate-100">
              <li
                v-for="order in lateClosingOrders"
                :key="order.id"
                class="px-3 py-2.5"
              >
                <p class="text-xs font-bold text-slate-800">
                  {{ order.origen.descripcion || "Trabajo sin descripción" }}
                </p>
                <p class="mt-0.5 text-[10px] text-slate-500">
                  {{ order.estado_actual || "Sin estado registrado" }}
                </p>
              </li>
            </ul>
          </details>

          <details
            v-if="closingOrdersWithoutHistory.length"
            class="group overflow-hidden rounded-xl border border-accent/30 bg-white"
          >
            <summary
              class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-bold text-slate-700 outline-none hover:bg-accent/10 [&::-webkit-details-marker]:hidden"
            >
              <span
                >Ver {{ closingOrdersWithoutHistory.length }} OT sin
                historial</span
              >
              <ChevronRight
                class="h-4 w-4 text-accent-dark transition-transform group-open:rotate-90"
              />
            </summary>
            <ul class="divide-y divide-slate-100 border-t border-slate-100">
              <li
                v-for="order in closingOrdersWithoutHistory"
                :key="order.id"
                class="px-3 py-2.5"
              >
                <p class="text-xs font-bold text-slate-800">
                  {{ order.origen.descripcion || "Trabajo sin descripción" }}
                </p>
                <p class="mt-0.5 text-[10px] text-slate-500">
                  {{ order.estado_actual || "Sin estado registrado" }}
                </p>
              </li>
            </ul>
          </details>

          <p
            v-if="
              !lateClosingOrders.length && !closingOrdersWithoutHistory.length
            "
            class="rounded-xl border border-main/15 bg-main/5 px-3 py-2 text-[11px] text-main"
          >
            No hay OT tardías ni OT sin historial en este cierre.
          </p>
        </div>

        <div
          v-else
          class="rounded-xl border border-slate-200 bg-white p-4 text-center"
        >
          <p class="text-xs font-semibold text-slate-700">
            No hay un cierre de jornada disponible para este supervisor.
          </p>
          <p class="mt-1 text-[11px] leading-relaxed text-slate-500">
            El resumen se muestra cuando el supervisor pertenece al alcance de
            la consulta.
          </p>
        </div>
      </div>
    </article>
  </aside>
</template>
