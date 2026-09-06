<script setup lang="ts">
import { computed } from "vue";

interface Props {
  id: string;
  effectiveness: number;
  stoppedSeconds: number;
  totalSeconds: number;
  stoppedTime: string;
}

const props = defineProps<Props>();

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, value));
}

const effectivePercentage = computed(() =>
  clampPercentage(props.effectiveness),
);
const stoppedPercentage = computed(() => {
  if (props.totalSeconds > 0)
    return clampPercentage((props.stoppedSeconds / props.totalSeconds) * 100);

  return clampPercentage(100 - effectivePercentage.value);
});
const percentageFormatter = new Intl.NumberFormat("es", {
  maximumFractionDigits: 1,
});
const effectivenessLabel = computed(
  () => `${percentageFormatter.format(effectivePercentage.value)}%`,
);
const stoppedLabel = computed(
  () => `${percentageFormatter.format(stoppedPercentage.value)}% detenido`,
);
const effectivenessStroke = computed(
  () => `${effectivePercentage.value} ${100 - effectivePercentage.value}`,
);
</script>

<template>
  <article
    :id="id"
    class="flex min-h-[70px] min-w-0 items-center justify-between gap-2 rounded-md border border-gray-200 px-2 py-2"
  >
    <div class="min-w-0">
      <span class="text-[10px] text-gray-500">Efectividad</span>
      <strong class="mt-0.5 block text-sm tabular-nums text-main">
        {{ effectivenessLabel }}
      </strong>
      <small class="block truncate text-[10px] text-gray-500">
         {{ stoppedLabel }}
      </small>
    </div>
    <div class="relative grid size-[58px] shrink-0 place-items-center">
      <svg class="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          class="stroke-danger/20"
          stroke-width="4"
        />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          class="stroke-success"
          stroke-linecap="round"
          stroke-width="4"
          pathLength="100"
          :stroke-dasharray="effectivenessStroke"
        />
      </svg>
      <span class="absolute text-[10px] font-bold tabular-nums text-main">
        {{ effectivenessLabel }}
      </span>
    </div>
  </article>
</template>
