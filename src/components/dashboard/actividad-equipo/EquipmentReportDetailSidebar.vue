<script setup lang="ts">
import { computed } from "vue";
import {
  CircleOff,
  LoaderCircle,
  MapPin,
  TriangleAlert,
} from "lucide-vue-next";
import EquipmentSummaryImplementsCard from "./EquipmentSummaryImplementsCard.vue";
import { formatOperationalNumber } from "@/utils/formatOperationalNumber";
import { formatCompactPanamaDateTime } from "@/utils/formatCompactPanamaDate";
import type {
  EquipmentContext,
  EquipmentMasterDetail,
  EquipmentSummary,
  ReportLoadState,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

interface Props {
  detail: EquipmentMasterDetail | null;
  context: EquipmentContext | null;
  detailState: ReportLoadState;
  contextState: ReportLoadState;
  summary: EquipmentSummary | null;
  summaryState: ReportLoadState;
  summaryError: string | null;
  error: string | null;
}

const props = defineProps<Props>();
const hasSelection = computed(
  () => props.detailState !== "idle" || props.contextState !== "idle",
);

function displayDate(value: string | null): string {
  return formatCompactPanamaDateTime(value);
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
            ['Código', formatOperationalNumber(detail.code)],
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
        <div
          v-if="summary?.recentLocation?.farmName"
          class="border-b border-gray-100 py-2"
        >
          <dt
            class="mb-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400"
          >
            Última ubicación registrada
          </dt>
          <dd class="flex items-start gap-1.5 pl-1">
            <MapPin class="mt-0.5 size-3.5 shrink-0 text-gray-500" />
            <div class="min-w-0">
              <p class="truncate text-[10.5px] font-semibold text-gray-700">
                {{ summary.recentLocation.farmName }}
              </p>
              <p class="mt-0.5 text-[10px] text-gray-500">
                {{
                  formatCompactPanamaDateTime(summary.recentLocation.occurredAt)
                }}
              </p>
            </div>
          </dd>
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
              :key="`${row.state}-${row.time}-${row.percentage}-${row.periods}`"
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
      </div>
      <div
        v-else
        class="flex items-center gap-2 px-3 pb-5 text-xs text-gray-500"
      >
        <CircleOff class="size-4" />Sin datos de motor.
      </div>
    </article>

    <EquipmentSummaryImplementsCard
      :summary="summary"
      :load-state="summaryState"
      :error="summaryError"
    />
  </aside>
</template>
