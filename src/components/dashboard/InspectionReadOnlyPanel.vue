<script setup lang="ts">
import { computed, type CSSProperties } from "vue";
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Eye,
  Images,
  MessageSquareText,
  UserRound,
  X,
} from "lucide-vue-next";
import { parseMeetingObservation } from "@/utils/meetingRatings";
import type {
  RatingsCriterio,
  RatingsDetalle,
  RatingsInspeccionNormalizada,
} from "@/stores/ratingsStore.types";

const props = defineProps<{
  inspection: RatingsInspeccionNormalizada;
  details: RatingsDetalle[];
  criteria: RatingsCriterio[];
  supervisorName: string;
  inspectorName: string;
}>();

const emit = defineEmits<{
  close: [];
  viewPhotos: [photoUrls: string];
}>();

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

type RgbColor = {
  red: number;
  green: number;
  blue: number;
};

const badScoreColor: RgbColor = { red: 220, green: 38, blue: 38 };
const regularScoreColor: RgbColor = { red: 202, green: 138, blue: 4 };
const goodScoreColor: RgbColor = { red: 22, green: 163, blue: 74 };

const interpolateColor = (
  start: RgbColor,
  end: RgbColor,
  amount: number,
): RgbColor => ({
  red: Math.round(start.red + (end.red - start.red) * amount),
  green: Math.round(start.green + (end.green - start.green) * amount),
  blue: Math.round(start.blue + (end.blue - start.blue) * amount),
});

const getScoreColor = (score: number): RgbColor => {
  const normalizedScore = Math.min(5, Math.max(1, score));

  if (normalizedScore <= 3) {
    return interpolateColor(
      badScoreColor,
      regularScoreColor,
      (normalizedScore - 1) / 2,
    );
  }

  return interpolateColor(
    regularScoreColor,
    goodScoreColor,
    (normalizedScore - 3) / 2,
  );
};

const toRgb = (color: RgbColor): string =>
  `rgb(${color.red}, ${color.green}, ${color.blue})`;

const getScoreLabel = (score: number | null): string => {
  if (score === null) return "Sin calificación";
  if (score < 3) return "Malo";
  if (score < 4) return "Regular";
  return "Bueno";
};

const getScoreSurfaceStyle = (score: number | null): CSSProperties => {
  if (score === null) {
    return { backgroundColor: "#475569", color: "#ffffff" };
  }

  const mainColor = getScoreColor(score);
  const lightColor = interpolateColor(
    mainColor,
    { red: 255, green: 255, blue: 255 },
    0.2,
  );

  return {
    background: `linear-gradient(135deg, ${toRgb(lightColor)}, ${toRgb(mainColor)})`,
    color: "#ffffff",
  };
};

const resultSurfaceStyle = computed(() =>
  getScoreSurfaceStyle(props.inspection.puntuacion_promedio),
);

const managementSurfaceStyle = computed(() =>
  getScoreSurfaceStyle(managementScore.value),
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

      <div class="space-y-5 px-4 py-4">
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
    </article>
  </aside>
</template>
