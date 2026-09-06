<script setup lang="ts">
import type { OperatorDetail } from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";
import { formatCompactPanamaDateTime } from "@/utils/formatCompactPanamaDate";
defineProps<{ detail: OperatorDetail }>();
</script>
<template>
  <section class="grid min-h-0 gap-2 lg:grid-cols-[0.38fr_0.62fr]">
    <article
      id="operator-implements-card"
      class="flex min-h-32 flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">
        Implementos usados por operador
      </h3>
      <div class="min-h-0 flex-1 overflow-auto">
        <table class="w-full min-w-[400px] table-fixed text-[10px]">
          <thead class="sticky top-0 bg-gray-50 text-left text-gray-600">
            <tr>
              <th class="p-1 font-semibold">Implemento</th>
              <th class="p-1 font-semibold">Tipo / Nombre</th>
              <th class="w-16 p-1 text-right font-semibold">Jornadas</th>
              <th class="w-16 p-1 text-right font-semibold">Tiempo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in detail.implements"
              :key="row.implementId"
              class="border-t border-gray-100"
            >
              <td class="p-1 font-semibold">{{ row.number }}</td>
              <td class="p-1 leading-tight break-words">
                {{ row.description }}
              </td>
              <td class="p-1 text-right tabular-nums">{{ row.journeys }}</td>
              <td class="p-1 text-right tabular-nums">{{ row.time }}</td>
            </tr>
            <tr v-if="!detail.implements.length">
              <td colspan="4" class="p-3 text-center text-gray-500">
                Sin implementos registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
    <article
      id="operator-history-card"
      class="flex min-h-40 flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-white p-2.5 shadow-sm"
    >
      <h3 class="mb-1.5 text-xs font-bold text-main">
        Historial reciente · 10 últimos · hora de Panamá
      </h3>
      <div
        id="operator-history-scroll"
        class="min-h-0 flex-1 overflow-y-auto rounded-md border border-gray-100"
      >
        <div class="min-w-[550px]">
          <table class="w-full table-fixed text-[10px]">
            <thead class="sticky top-0 z-10 bg-gray-50 text-left text-gray-600">
              <tr>
                <th class="w-28 border-b border-gray-100 p-1.5 font-bold">
                  Inicio
                </th>
                <th class="w-28 border-b border-gray-100 p-1.5 font-bold">
                  Fin
                </th>
                <th class="border-b border-gray-100 p-1.5 font-bold">
                  Labor / Motivo
                </th>
                <th
                  class="w-16 border-b border-gray-100 p-1.5 text-right font-bold"
                >
                  Tiempo
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in detail.history"
                :key="`${row.startAt}-${row.endAt}-${row.detail}`"
                class="border-b border-gray-100 last:border-0"
              >
                <td class="p-1.5 align-top whitespace-nowrap">
                  {{ formatCompactPanamaDateTime(row.startAt) }}
                </td>
                <td class="p-1.5 align-top whitespace-nowrap">
                  {{ formatCompactPanamaDateTime(row.endAt) }}
                </td>
                <td class="p-1.5 align-top leading-tight break-words">
                  {{ row.detail }}
                </td>
                <td class="p-1.5 text-right align-top tabular-nums">
                  {{ row.time }}
                </td>
              </tr>
              <tr v-if="!detail.history.length">
                <td colspan="4" class="p-3 text-center text-gray-500">
                  Sin historial reciente.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
  </section>
</template>
