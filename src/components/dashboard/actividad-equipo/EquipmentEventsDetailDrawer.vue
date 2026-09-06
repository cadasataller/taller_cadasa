<script setup lang="ts">
import { computed } from "vue";
import { ChevronDown, Loader2, X } from "lucide-vue-next";
import { formatCompactPanamaDateTime } from "@/utils/formatCompactPanamaDate";
import type { JornadaEventoDetalle } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

const props = defineProps<{
  detail: JornadaEventoDetalle | null;
  loading: boolean;
  error: string | null;
}>();
const emit = defineEmits<{ close: [] }>();

const duration = (seconds: number | null): string => {
  if (seconds === null) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const technicalFields = computed(() => {
  if (!props.detail) return [];
  const event = props.detail.evento;
  return [
    ["Evento ID", event.id],
    ["Client event ID", event.clientEventId],
    ["Jornada ID", event.jornadaId],
    ["Asignación ID", event.asignacionId],
    ["Período ID", event.periodoId],
    ["Secuencia", event.secuencia === null ? null : String(event.secuencia)],
    ["Creado por", event.creadoPorAuthUserId],
    ["Ocurrió", formatCompactPanamaDateTime(event.ocurrioEn)],
    ["Registrado", formatCompactPanamaDateTime(event.registradoEn)],
    ["Sincronizado", formatCompactPanamaDateTime(event.sincronizadoEn)],
    [
      "Retroactivo",
      event.retroactivoMinutos === null
        ? null
        : `${event.retroactivoMinutos} min`,
    ],
    ["Latitud", event.latitud === null ? null : String(event.latitud)],
    ["Longitud", event.longitud === null ? null : String(event.longitud)],
    ["Creado en", formatCompactPanamaDateTime(event.creadoEn)],
  ].filter(
    (field): field is [string, string] => field[1] !== null && field[1] !== "—",
  );
});
const jsonData = computed(() =>
  props.detail ? JSON.stringify(props.detail.raw, null, 2) : "{}",
);
</script>

<template>
  <aside
    class="flex min-h-0 w-full shrink-0 self-stretch flex-col overflow-hidden border border-gray-200 bg-white shadow-xl lg:w-[min(42vw,560px)]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="event-detail-title"
  >
    <header
      class="flex min-h-14 items-center justify-between border-b border-gray-200 px-4"
    >
      <div class="min-w-0">
        <p
          v-if="detail"
          class="text-[10px] font-bold uppercase tracking-wider text-main"
        >
          {{ detail.evento.tipoEvento.replaceAll("_", " ") }}
        </p>
        <h2
          id="event-detail-title"
          class="truncate text-sm font-bold text-main"
        >
          Detalle del evento
        </h2>
      </div>
      <button
        type="button"
        class="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-md hover:bg-gray-100"
        aria-label="Cerrar detalle"
        @click="emit('close')"
      >
        <X class="size-4" />
      </button>
    </header>

    <div
      v-if="loading"
      class="grid flex-1 place-items-center text-xs text-gray-500"
    >
      <span class="inline-flex items-center gap-2"
        ><Loader2 class="size-4 animate-spin text-main" />Cargando
        detalle...</span
      >
    </div>
    <div
      v-else-if="error"
      class="grid flex-1 place-items-center p-4 text-center text-xs text-danger"
    >
      {{ error }}
    </div>
    <div
      v-else-if="detail"
      class="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-xs"
    >
      <section>
        <p class="font-bold uppercase tracking-wider text-main">
          {{ detail.evento.tipoEvento.replaceAll("_", " ") }}
        </p>
        <p class="mt-1 text-gray-600">
          {{ formatCompactPanamaDateTime(detail.evento.ocurrioEn) }}
        </p>
      </section>
      <section class="rounded-md border border-gray-200 p-3">
        <h3 class="font-bold text-main">Contexto</h3>
        <dl class="mt-3 space-y-2">
          <div class="flex justify-between gap-4">
            <dt class="text-gray-500">Operador</dt>
            <dd class="text-right font-medium">
              {{ detail.contexto.operador ?? "—" }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-gray-500">Equipo</dt>
            <dd class="text-right font-medium">
              {{ detail.contexto.equipo ?? "—" }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-gray-500">Labor</dt>
            <dd class="text-right font-medium">
              {{ detail.contexto.labor ?? "—" }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-gray-500">Implemento</dt>
            <dd class="text-right font-medium">
              {{ detail.contexto.implemento ?? "—" }}
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <h3 class="font-bold text-main">Intervalos</h3>
        <div class="mt-2 space-y-2">
          <article
            v-for="intervalo in detail.intervalos"
            :key="`${intervalo.tipo}-${intervalo.id ?? intervalo.etiqueta}`"
            class="rounded-md border border-gray-200 p-3"
          >
            <h4 class="font-semibold text-gray-800">
              {{ intervalo.etiqueta }}
            </h4>
            <dl class="mt-2 space-y-1.5 text-gray-600">
              <div v-if="intervalo.equipo" class="flex justify-between gap-4">
                <dt>Equipo</dt>
                <dd class="text-right">{{ intervalo.equipo }}</dd>
              </div>
              <div
                v-if="intervalo.implemento"
                class="flex justify-between gap-4"
              >
                <dt>Implemento</dt>
                <dd class="text-right">{{ intervalo.implemento }}</dd>
              </div>
              <div v-if="intervalo.labor" class="flex justify-between gap-4">
                <dt>Labor</dt>
                <dd class="text-right">{{ intervalo.labor }}</dd>
              </div>
              <div v-if="intervalo.inicio" class="flex justify-between gap-4">
                <dt>Inicio</dt>
                <dd class="text-right">
                  {{ formatCompactPanamaDateTime(intervalo.inicio) }}
                </dd>
              </div>
              <div v-if="intervalo.fin" class="flex justify-between gap-4">
                <dt>Fin</dt>
                <dd class="text-right">
                  {{ formatCompactPanamaDateTime(intervalo.fin) }}
                </dd>
              </div>
              <div
                v-if="intervalo.duracionSegundos !== null"
                class="flex justify-between gap-4"
              >
                <dt>Duración</dt>
                <dd class="text-right">
                  {{ duration(intervalo.duracionSegundos) }}
                </dd>
              </div>
              <div
                v-if="intervalo.clasificacion"
                class="flex justify-between gap-4"
              >
                <dt>Clasificación</dt>
                <dd class="text-right">{{ intervalo.clasificacion }}</dd>
              </div>
              <div
                v-if="intervalo.motorEncendido !== null"
                class="flex justify-between gap-4"
              >
                <dt>Motor</dt>
                <dd class="text-right">
                  {{ intervalo.motorEncendido ? "Encendido" : "Apagado" }}
                </dd>
              </div>
            </dl>
          </article>
        </div>
      </section>
      <details class="group rounded-md border border-gray-200">
        <summary
          class="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 font-semibold text-main [&::-webkit-details-marker]:hidden"
        >
          Datos técnicos
          <ChevronDown
            class="size-4 transition-transform group-open:rotate-180"
          />
        </summary>
        <dl class="space-y-2 border-t border-gray-200 p-3">
          <div
            v-for="[label, value] in technicalFields"
            :key="label"
            class="flex justify-between gap-4"
          >
            <dt class="text-gray-500">{{ label }}</dt>
            <dd class="break-all text-right">{{ value }}</dd>
          </div>
        </dl>
      </details>
      <details class="group rounded-md border border-gray-200">
        <summary
          class="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 font-semibold text-main [&::-webkit-details-marker]:hidden"
        >
          JSON original
          <ChevronDown
            class="size-4 transition-transform group-open:rotate-180"
          />
        </summary>
        <pre
          class="overflow-x-auto border-t border-gray-200 p-3 font-mono text-[10px] leading-4 text-gray-700"
          >{{ jsonData }}</pre>
      </details>
    </div>
  </aside>
</template>
