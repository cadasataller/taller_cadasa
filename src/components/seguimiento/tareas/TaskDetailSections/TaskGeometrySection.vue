<script setup lang="ts">
import { computed } from "vue";
import { Crosshair, MapPin } from "lucide-vue-next";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type { TareaSeguimientoDetail } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{ task: TareaSeguimientoDetail }>();
const emit = defineEmits<{
  focus: [coordinates: SeguimientoCoordinates | null];
}>();
const pointLabel = computed(() =>
  props.task.routePoint
    ? `${props.task.routePoint.latitude.toFixed(5)}, ${props.task.routePoint.longitude.toFixed(5)}`
    : "Sin punto de enrutado",
);
</script>

<template>
  <section class="border-b border-slate-100 pb-4">
    <h3
      class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600"
    >
      Ubicación y geometría
    </h3>
    <div class="mt-3 grid gap-2">
      <div class="rounded-lg bg-slate-50 p-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold text-slate-700">Punto de enrutado</p>
            <p class="mt-0.5 text-[11px] text-slate-500">{{ pointLabel }}</p>
          </div>
          <button
            v-if="task.routePoint"
            class="grid size-11 place-items-center rounded-md text-main hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
            type="button"
            aria-label="Enfocar punto de enrutado"
            @click="emit('focus', task.routePoint)"
          >
            <Crosshair class="size-4" />
          </button>
        </div>
      </div>
      <div class="rounded-lg bg-slate-50 p-3">
        <p class="text-xs font-bold text-slate-700">Línea de control</p>
        <p class="mt-0.5 text-[11px] text-slate-500">
          {{
            task.controlLine
              ? `${task.controlLine.coordinates.flat().length} puntos de control`
              : "No definida"
          }}
        </p>
      </div>
      <div class="rounded-lg bg-slate-50 p-3">
        <div class="flex items-center gap-2">
          <MapPin class="size-4 text-main" />
          <div>
            <p class="text-xs font-bold text-slate-700">Zonas asociadas</p>
            <p class="mt-0.5 text-[11px] text-slate-500">
              {{
                task.controlZones.length
                  ? `${task.controlZones.length} ${task.controlZones.length === 1 ? "zona" : "zonas"} de control`
                  : "Sin zonas asociadas"
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
