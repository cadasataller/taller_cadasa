<script setup lang="ts">
import ActivityTeamsRanking from "./ActivityTeamsRanking.vue";
import type {
  ActivityTeamsDay,
  ActivityTeamsRankingItem,
} from "@/stores/dashboard/resumen-actividad-equipos/resumenActividadEquipos.types";

defineProps<{
  dailyActivity: ActivityTeamsDay[];
  bestEquipment: ActivityTeamsRankingItem[];
  worstEquipment: ActivityTeamsRankingItem[];
  topOperators: ActivityTeamsRankingItem[];
}>();

function segmentStyle(percentage: number): { flex: string } {
  const boundedPercentage = Math.max(0, Math.min(100, percentage));
  return { flex: `0 0 ${boundedPercentage}%` };
}
</script>

<template>
  <div class="space-y-3 p-3 sm:p-4">
    <section class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <h2
        class="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-main"
      >
        Actividad diaria · efectivo vs parado
      </h2>
      <div v-if="dailyActivity.length" class="space-y-2.5">
        <article
          v-for="day in dailyActivity"
          :key="day.date"
          class="grid grid-cols-[3.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 text-xs sm:grid-cols-[5rem_minmax(0,1fr)_6.5rem]"
        >
          <div>
            <strong class="block font-mono text-main">{{ day.weekday }}</strong
            ><span class="text-[10px] text-gray-500">{{ day.date }}</span>
          </div>
          <div class="flex h-5 overflow-hidden rounded-sm bg-main/10">
            <div class="bg-main" :style="segmentStyle(day.effectiveness)" />
          </div>
          <span class="text-right font-mono text-[10px] font-bold text-main"
            >{{ day.effectiveness.toFixed(1) }}%
            <span class="text-gray-500"
              >/ {{ day.stoppedPercentage.toFixed(1) }}%</span
            ></span
          >
        </article>
      </div>
      <p v-else class="py-5 text-center text-xs text-gray-500">
        Sin actividad en el rango seleccionado.
      </p>
    </section>
    <section class="grid gap-3 lg:grid-cols-3">
      <ActivityTeamsRanking
        title="Mejores equipos"
        :items="bestEquipment"
      /><ActivityTeamsRanking
        title="Equipos a revisar"
        :items="worstEquipment"
        tone="danger"
      /><ActivityTeamsRanking
        title="Operadores por tiempo efectivo"
        :items="topOperators"
      />
    </section>
  </div>
</template>
