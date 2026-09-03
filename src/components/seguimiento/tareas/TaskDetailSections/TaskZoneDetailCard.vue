<script setup lang="ts">
import { computed } from "vue";
import { ChevronDown, Clock3, History } from "lucide-vue-next";
import type { TareaRastreoZonaDetalleDto } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{
  zone: TareaRastreoZonaDetalleDto;
  index: number;
}>();

const zoneDescription = computed(() => {
  const role = props.zone.rol.replaceAll("_", " ");
  const type = props.zone.tipo_zona.replaceAll("_", " ");
  const origin = props.zone.origen.replaceAll("_", " ");
  return `${role} · ${type} · origen: ${origin}`;
});
const visitHistory = computed(() => [...props.zone.visitas].reverse());

function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(0, Math.floor(seconds / 60));
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
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

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("es-PA", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function visitDuration(
  visit: TareaRastreoZonaDetalleDto["visitas"][number],
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
  <details
    class="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 open:border-main/25 open:bg-white"
  >
    <summary
      class="flex min-h-11 cursor-pointer list-none items-center gap-2 p-2.5 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-main"
      :aria-label="`Mostrar detalles de la zona ${index + 1}`"
    >
      <span
        class="grid size-7 shrink-0 place-items-center rounded-md bg-second text-main"
      >
        <Clock3 class="size-3.5" aria-hidden="true" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-[10px] font-extrabold text-slate-700">
          Zona asociada {{ index + 1 }}
        </span>
        <span class="block truncate text-[9px] text-slate-500">
          {{ zoneDescription }}
        </span>
      </span>
      <span class="shrink-0 text-right">
        <span class="block text-[8px] font-extrabold uppercase text-slate-400">
          Tiempo total
        </span>
        <span class="block font-mono text-[10px] font-bold text-slate-700">
          {{ formatDuration(zone.tiempo.segundos_totales) }}
        </span>
      </span>
      <ChevronDown
        class="size-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
        aria-hidden="true"
      />
    </summary>

    <div class="border-t border-slate-100 bg-white p-2.5">
      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-md bg-slate-50 p-2">
          <p class="text-[8px] font-extrabold uppercase text-slate-400">
            Total
          </p>
          <p class="mt-0.5 font-mono text-[10px] font-bold text-slate-700">
            {{ formatDuration(zone.tiempo.segundos_totales) }}
          </p>
        </div>
        <div class="rounded-md bg-slate-50 p-2">
          <p class="text-[8px] font-extrabold uppercase text-slate-400">
            Visitas
          </p>
          <p class="mt-0.5 font-mono text-[10px] font-bold text-slate-700">
            {{ zone.tiempo.cantidad_visitas }}
          </p>
        </div>
        <div class="rounded-md bg-slate-50 p-2">
          <p class="text-[8px] font-extrabold uppercase text-slate-400">
            Cerradas
          </p>
          <p class="mt-0.5 font-mono text-[10px] font-bold text-slate-700">
            {{ formatDuration(zone.tiempo.segundos_visitas_cerradas) }}
          </p>
        </div>
        <div class="rounded-md bg-slate-50 p-2">
          <p class="text-[8px] font-extrabold uppercase text-slate-400">
            Actual
          </p>
          <p class="mt-0.5 font-mono text-[10px] font-bold text-slate-700">
            {{ formatDuration(zone.tiempo.segundos_visita_abierta) }}
          </p>
        </div>
        <div class="rounded-md bg-slate-50 p-2">
          <p class="text-[8px] font-extrabold uppercase text-slate-400">
            Estado
          </p>
          <p class="mt-0.5 text-[10px] font-bold text-slate-700">
            {{
              zone.tiempo.visita_abierta ? "Visita activa" : "Sin visita activa"
            }}
          </p>
        </div>
        <div class="rounded-md bg-slate-50 p-2">
          <p class="text-[8px] font-extrabold uppercase text-slate-400">
            Sin datos
          </p>
          <p class="mt-0.5 font-mono text-[10px] font-bold text-slate-700">
            {{ formatDuration(zone.tiempo.segundos_sin_datos) }}
          </p>
        </div>
        <div class="rounded-md bg-slate-50 p-2">
          <p class="text-[8px] font-extrabold uppercase text-slate-400">
            Primera entrada
          </p>
          <p class="mt-0.5 font-mono text-[10px] font-bold text-slate-700">
            {{ formatDateTime(zone.tiempo.primera_llegada_en) }}
          </p>
        </div>
        <div class="rounded-md bg-slate-50 p-2">
          <p class="text-[8px] font-extrabold uppercase text-slate-400">
            Llegada actual
          </p>
          <p class="mt-0.5 font-mono text-[10px] font-bold text-slate-700">
            {{ formatDateTime(zone.tiempo.llegada_actual_en) }}
          </p>
        </div>
        <div class="rounded-md bg-slate-50 p-2">
          <p class="text-[8px] font-extrabold uppercase text-slate-400">
            Última salida
          </p>
          <p class="mt-0.5 font-mono text-[10px] font-bold text-slate-700">
            {{ formatDateTime(zone.tiempo.ultima_salida_en) }}
          </p>
        </div>
      </div>

      <dl
        class="mt-2 grid gap-1.5 rounded-md border border-slate-100 bg-slate-50 p-2 text-[9px]"
      >
        <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <dt class="font-extrabold uppercase text-slate-400">
            Actualización tracker
          </dt>
          <dd class="font-mono font-bold text-slate-700">
            {{ formatDateTime(zone.tiempo.ultima_actualizacion_tracker_en) }}
          </dd>
        </div>
        <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <dt class="font-extrabold uppercase text-slate-400">
            ID visita actual
          </dt>
          <dd class="break-all text-right font-mono font-bold text-slate-700">
            {{ zone.tiempo.visita_actual_id || "—" }}
          </dd>
        </div>
      </dl>

      <div class="mt-3">
        <p class="flex items-center gap-1 text-[10px] font-extrabold text-main">
          <History class="size-3.5" aria-hidden="true" /> Historial de la zona
          <span
            class="ml-auto rounded-full bg-info-bg px-1.5 py-0.5 text-[8px] text-info"
          >
            {{ zone.visitas.length }}
          </span>
        </p>
        <div v-if="visitHistory.length" class="mt-2 grid gap-1.5">
          <article
            v-for="(visit, visitIndex) in visitHistory"
            :key="visit.id"
            class="rounded-md border border-slate-100 bg-slate-50 p-2"
          >
            <div class="flex items-center justify-between gap-2 text-[9px]">
              <strong class="text-slate-700">
                Visita {{ zone.visitas.length - visitIndex }}
              </strong>
              <span
                class="rounded-full px-1.5 py-0.5 text-[8px] font-extrabold"
                :class="
                  visit.salida_en
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-success-bg text-success'
                "
              >
                {{ visit.salida_en ? "Cerrada" : "En curso" }}
              </span>
            </div>
            <div class="mt-1.5 grid grid-cols-3 gap-1.5 text-[8px]">
              <div>
                <p class="uppercase text-slate-400">Entrada</p>
                <b class="font-mono text-slate-700">{{
                  formatTime(visit.entrada_en)
                }}</b>
              </div>
              <div>
                <p class="uppercase text-slate-400">Salida</p>
                <b class="font-mono text-slate-700">{{
                  formatTime(visit.salida_en)
                }}</b>
              </div>
              <div>
                <p class="uppercase text-slate-400">Duración</p>
                <b class="font-mono text-slate-700">{{
                  visitDuration(visit)
                }}</b>
              </div>
            </div>
          </article>
        </div>
        <p v-else class="mt-2 text-[9px] text-slate-500">
          No hay visitas registradas para esta zona.
        </p>
      </div>
    </div>
  </details>
</template>
