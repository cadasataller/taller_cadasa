<script setup lang="ts">
import { computed } from "vue";

interface Props {
  id: string;
  kind: "effective" | "stopped";
  effectiveness: number;
  stoppedSeconds: number;
  totalSeconds: number;
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
  () => `${percentageFormatter.format(stoppedPercentage.value)}%`,
);
const metric = computed(() =>
  props.kind === "effective"
    ? {
        label: "Efectividad",
        value: effectivenessLabel.value,
        detail: "Del tiempo registrado",
        className:
          "bg-[linear-gradient(135deg,var(--color-main),#004643)] text-white",
      }
    : {
        label: "Paradas",
        value: stoppedLabel.value,
        detail: "Del tiempo registrado",
        className:
          "bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-dark))] text-white",
      },
);
</script>

<template>
  <article
    :id="id"
    class="flex h-full min-h-[70px] min-w-0 flex-col items-center justify-center text-center"
    :class="metric.className"
  >
    <span class="text-[10px] font-medium text-white/80">{{
      metric.label
    }}</span>
    <strong class="mt-0.5 text-2xl font-extrabold tabular-nums">
      {{ metric.value }}
    </strong>
    <small class="text-[10px] text-white/80">{{ metric.detail }}</small>
  </article>
</template>
