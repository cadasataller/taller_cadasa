<script setup lang="ts">
import { Trophy, UsersRound, Wrench, CircleAlert } from "lucide-vue-next";
import ActivityTeamsRanking from "./ActivityTeamsRanking.vue";
import type {
  ActivityTeamsDay,
  ActivityTeamsRankingItem,
  ActivityTeamsTotals,
  ActivityTeamsTypePerformance,
} from "@/stores/dashboard/resumen-actividad-equipos/resumenActividadEquipos.types";

defineProps<{
  totals: ActivityTeamsTotals;
  bestDay: ActivityTeamsDay | null;
  worstDay: ActivityTeamsDay | null;
  topJobs: ActivityTeamsRankingItem[];
  topStopReasons: ActivityTeamsRankingItem[];
  typePerformance: ActivityTeamsTypePerformance[];
}>();
</script>

<template>
  <div class="space-y-3 p-3 sm:p-4">
    <section class="grid gap-3 md:grid-cols-2">
      <article class="rounded-lg border border-main/25 bg-white p-4 shadow-sm">
        <p
          class="text-[10px] font-bold uppercase tracking-[0.16em] text-main-dark"
        >
          Efectividad
        </p>
        <div class="mt-2 flex items-end justify-between gap-3">
          <strong class="font-mono text-3xl font-black text-main-dark sm:text-4xl"
            >{{ totals.effectiveness.toFixed(1) }}%</strong
          ><span class="pb-1 font-mono text-xs text-main-dark"
            >{{ totals.effectiveTime }} h efectivo</span
          >
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-main/10">
          <div
            class="h-full rounded-full bg-main-dark"
            :style="{ width: `${totals.effectiveness}%` }"
          />
        </div>
      </article>
      <article
        class="rounded-lg border border-accent/30 bg-white p-4 shadow-sm"
      >
        <p
          class="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-dark"
        >
          Tiempo parado
        </p>
        <div class="mt-2 flex items-end justify-between gap-3">
          <strong class="font-mono text-3xl font-black text-accent-dark sm:text-4xl"
            >{{ totals.stoppedPercentage.toFixed(1) }}%</strong
          ><span class="pb-1 font-mono text-xs text-accent-dark"
            >{{ totals.stoppedTime }} h</span
          >
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-accent/20">
          <div
            class="h-full rounded-full bg-accent-dark"
            :style="{ width: `${totals.stoppedPercentage}%` }"
          />
        </div>
      </article>
    </section>

    <section class="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <article class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <UsersRound class="size-4 text-main" aria-hidden="true" /><strong
          class="mt-3 block font-mono text-2xl text-main"
          >{{ totals.equipment }}</strong
        ><span
          class="text-[10px] font-bold uppercase tracking-wider text-gray-500"
          >Equipos</span
        >
      </article>
      <article class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <Wrench class="size-4 text-main" aria-hidden="true" /><strong
          class="mt-3 block font-mono text-2xl text-main"
          >{{ totals.journeys }}</strong
        ><span
          class="text-[10px] font-bold uppercase tracking-wider text-gray-500"
          >Jornadas</span
        >
      </article>
      <article class="rounded-lg border border-main/20 bg-main/5 p-3 shadow-sm">
        <Trophy class="size-4 text-main" aria-hidden="true" /><strong
          class="mt-3 block font-mono text-2xl text-main"
          >{{ bestDay?.effectiveness.toFixed(1) ?? "—" }}%</strong
        ><span
          class="mt-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500"
          >Mejor día</span
        ><small v-if="bestDay" class="font-mono text-[10px] text-main"
          >{{ bestDay.weekday }} · {{ bestDay.date }}</small
        >
      </article>
      <article
        class="rounded-lg border border-danger/20 bg-danger/5 p-3 shadow-sm"
      >
        <CircleAlert class="size-4 text-danger" aria-hidden="true" /><strong
          class="mt-3 block font-mono text-2xl text-danger"
          >{{ worstDay?.effectiveness.toFixed(1) ?? "—" }}%</strong
        ><span
          class="mt-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500"
          >Peor día</span
        ><small v-if="worstDay" class="font-mono text-[10px] text-danger"
          >{{ worstDay.weekday }} · {{ worstDay.date }}</small
        >
      </article>
    </section>

    <section class="grid gap-3 lg:grid-cols-2">
      <ActivityTeamsRanking
        title="Top labores realizadas"
        :items="topJobs"
        tone="main"
      /><ActivityTeamsRanking
        title="Top causas de parada"
        :items="topStopReasons"
        tone="gold"
      />
    </section>
    <ActivityTeamsRanking
      title="Rendimiento por tipo de equipo"
      :items="typePerformance"
      tone="main"
    />
  </div>
</template>
