<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  percentage: number;
  tone: "main" | "success" | "warning" | "accent";
  percentagePosition?: "start" | "end";
  valueWidth?: "auto" | "aligned";
}>();

const barWidth = computed(
  () => `${Math.min(100, Math.max(0, props.percentage))}%`,
);
const toneClass = computed(
  () =>
    ({
      main: "bg-main",
      success: "bg-success",
      warning: "bg-warning",
      accent: "bg-accent",
    })[props.tone],
);
const valueClass = computed(() =>
  props.valueWidth === "aligned"
    ? "w-11 shrink-0 text-left text-[10px] tabular-nums text-gray-600"
    : "shrink-0 text-[10px] tabular-nums text-gray-600",
);
</script>

<template>
  <div class="flex items-center gap-1.5">
    <span v-if="props.percentagePosition !== 'end'" :class="valueClass"
      >{{ percentage }}%</span
    >
    <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"
      ><i
        class="block h-full rounded-full"
        :class="toneClass"
        :style="{ width: barWidth }"
    /></span>
    <span v-if="props.percentagePosition === 'end'" :class="valueClass"
      >{{ percentage }}%</span
    >
  </div>
</template>
