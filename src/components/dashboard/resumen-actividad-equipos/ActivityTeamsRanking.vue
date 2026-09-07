<script setup lang="ts">
import type { ActivityTeamsRankingItem } from "@/stores/dashboard/resumen-actividad-equipos/resumenActividadEquipos.types";

withDefaults(
  defineProps<{
    title: string;
    items: ActivityTeamsRankingItem[];
    tone?: "main" | "danger" | "gold";
  }>(),
  { tone: "main" },
);

function barWidth(percentage: number): string {
  return `${Math.max(0, Math.min(100, percentage))}%`;
}
</script>

<template>
  <section class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
    <h2
      class="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-main"
    >
      {{ title }}
    </h2>
    <ol v-if="items.length" class="space-y-3">
      <li
        v-for="(item, index) in items"
        :key="`${item.label}-${index}`"
        class="min-w-0"
      >
        <div class="flex items-baseline gap-2 text-xs">
          <span class="w-3 shrink-0 font-mono font-bold text-main/55">{{
            index + 1
          }}</span>
          <span class="min-w-0 flex-1 truncate font-semibold text-gray-800">{{
            item.label
          }}</span>
          <span
            class="shrink-0 font-mono font-bold"
            :class="
              tone === 'gold'
                ? 'text-accent-dark'
                : tone === 'danger'
                  ? 'text-danger'
                  : 'text-main'
            "
            >{{ item.value }}</span
          >
        </div>
        <div class="ml-5 mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            class="h-full rounded-full"
            :class="
              tone === 'danger'
                ? 'bg-danger'
                : tone === 'gold'
                  ? 'bg-accent'
                  : 'bg-main'
            "
            :style="{ width: barWidth(item.percentage) }"
          />
        </div>
        <p v-if="item.secondary" class="ml-5 mt-1 text-[10px] text-gray-500">
          {{ item.secondary }} 
          <strong
          v-if="item.supportingMetric"
          class="uppercase tracking-wide "
        >
          {{ item.supportingMetric }}
        </strong>
        </p>
        
      </li>
    </ol>
    <p v-else class="py-4 text-center text-xs text-gray-500">
      Sin datos para este rango.
    </p>
  </section>
</template>
