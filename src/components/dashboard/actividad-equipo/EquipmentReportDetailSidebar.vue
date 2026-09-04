<script setup lang="ts">
import { computed } from "vue";
import { CircleOff, LoaderCircle, TriangleAlert } from "lucide-vue-next";
import type {
  EquipmentContext,
  EquipmentMasterDetail,
  ReportLoadState,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

interface Props {
  detail: EquipmentMasterDetail | null;
  context: EquipmentContext | null;
  detailState: ReportLoadState;
  contextState: ReportLoadState;
  error: string | null;
}

const props = defineProps<Props>();
const hasSelection = computed(
  () => props.detailState !== "idle" || props.contextState !== "idle",
);

function displayDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Panama",
  }).format(date);
}
</script>

<template>
  <aside
    id="equipment-detail-sidebar"
    class="flex min-h-0 flex-col gap-2 overflow-y-auto pr-0.5"
  >
    <article
      id="equipment-profile-card"
      class="rounded-[10px] border border-gray-200 bg-white shadow-sm"
    >
      <header class="px-3 pb-2 pt-3">
        <h2 class="text-xs font-bold text-main">Perfil del equipo</h2>
      </header>
      <div
        v-if="detailState === 'loading'"
        class="grid place-items-center gap-2 px-3 pb-5 pt-2 text-xs text-gray-500"
      >
        <LoaderCircle class="size-4 animate-spin text-main" />
        Cargando perfil…
      </div>
      <div
        v-else-if="detailState === 'error'"
        class="flex gap-2 px-3 pb-4 text-xs text-danger"
      >
        <TriangleAlert class="size-4 shrink-0" />{{ error }}
      </div>
      <dl v-else-if="detail" class="mx-3 mb-3 border-t border-gray-100">
        <div
          v-for="row in [
            ['Tipo', detail.type ?? '—'],
            ['Modelo', detail.model ?? '—'],
            ['Marca', detail.brand ?? '—'],
            ['Código', detail.code],
            ['Total jornadas', String(context?.journeys ?? '—')],
            ['Primera actividad', displayDate(context?.firstActivity ?? null)],
            ['Última actividad', displayDate(context?.lastActivity ?? null)],
          ]"
          :key="row[0]"
          class="grid min-h-7 grid-cols-[43%_57%] gap-2 border-b border-gray-100 py-1.5 text-[10.5px]"
        >
          <dt class="text-gray-500">{{ row[0] }}</dt>
          <dd class="break-words font-medium text-gray-700">{{ row[1] }}</dd>
        </div>
      </dl>
      <p v-else-if="!hasSelection" class="px-3 pb-5 text-xs text-gray-500">
        Seleccione un equipo para ver su perfil.
      </p>
    </article>

    <article
      id="equipment-engine-usage-card"
      class="rounded-[10px] border border-gray-200 bg-white shadow-sm"
    >
      <header class="px-3 pb-2 pt-3">
        <h2 class="text-xs font-bold text-main">Uso de motor</h2>
      </header>
      <div
        v-if="contextState === 'loading'"
        class="grid place-items-center gap-2 px-3 pb-5 pt-2 text-xs text-gray-500"
      >
        <LoaderCircle class="size-4 animate-spin text-main" />
        Cargando uso de motor…
      </div>
      <div
        v-else-if="contextState === 'error'"
        class="flex gap-2 px-3 pb-4 text-xs text-danger"
      >
        <TriangleAlert class="size-4 shrink-0" />{{ error }}
      </div>
      <div v-else-if="context" class="px-3 pb-3">
        <table class="w-full table-fixed border-collapse text-[10px]">
          <thead>
            <tr class="border-b border-gray-100 text-left text-gray-500">
              <th class="py-1.5 font-semibold">Estado</th>
              <th class="w-14 py-1.5 text-right font-semibold">Tiempo</th>
              <th class="w-12 py-1.5 text-right font-semibold">%</th>
              <th class="w-14 py-1.5 text-right font-semibold">Períodos</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in context.engine"
              :key="row.engineOn"
              class="border-b border-gray-100"
            >
              <td class="py-1.5">
                <span class="inline-flex items-center gap-1.5"
                  ><i
                    class="size-1.5 rounded-full"
                    :class="row.engineOn ? 'bg-success' : 'bg-gray-400'"
                  />{{ row.state }}</span
                >
              </td>
              <td class="py-1.5 text-right">{{ row.time }}</td>
              <td class="py-1.5 text-right">{{ row.percentage }}%</td>
              <td class="py-1.5 text-right">{{ row.periods }}</td>
            </tr>
          </tbody>
        </table>
        <p
          class="mt-2 rounded-md bg-gray-50 p-2 text-[9.5px] leading-snug text-gray-500"
        >
          El estado se toma de la labor cuando trabaja y de la causa de parada
          cuando está detenido.
        </p>
      </div>
      <div
        v-else
        class="flex items-center gap-2 px-3 pb-5 text-xs text-gray-500"
      >
        <CircleOff class="size-4" />Sin datos de motor.
      </div>
    </article>
  </aside>
</template>
