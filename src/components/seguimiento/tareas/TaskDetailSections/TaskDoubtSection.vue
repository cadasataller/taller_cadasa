<script setup lang="ts">
import { computed } from "vue";
import { CircleHelp } from "lucide-vue-next";
import type { TareaSeguimientoDetail } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{ task: TareaSeguimientoDetail }>();
const permanenceLabel = computed(() => {
  const minutes = Math.round(props.task.time.segundos_totales / 60);
  return minutes
    ? `${minutes} min de permanencia detectada`
    : "Sin permanencia acumulada";
});
</script>

<template>
  <section class="rounded-xl border border-warning/30 bg-warning-bg/55 p-3.5">
    <div class="flex gap-2.5">
      <CircleHelp class="mt-0.5 size-5 shrink-0 text-warning" />
      <div>
        <h3 class="text-xs font-extrabold text-warning">
          Detección automática
        </h3>
        <p class="mt-1 text-xs leading-5 text-slate-700">
          Esta duda fue detectada automáticamente por una señal de permanencia
          sin tarea identificada. Está disponible únicamente para consulta.
        </p>
      </div>
    </div>
    <dl class="mt-3 grid gap-2 border-t border-warning/20 pt-3 text-xs">
      <div class="flex justify-between gap-3">
        <dt class="text-slate-500">Permanencia</dt>
        <dd class="text-right font-bold text-slate-700">
          {{ permanenceLabel }}
        </dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-slate-500">Estado de revisión</dt>
        <dd class="font-bold text-warning">
          {{ task.operationalStatusLabel || "Pendiente de revisión" }}
        </dd>
      </div>
    </dl>
  </section>
</template>
