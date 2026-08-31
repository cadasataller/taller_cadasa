<script setup lang="ts">
import { computed } from "vue";
import { Crosshair, MapPin } from "lucide-vue-next";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type { TareaSeguimientoDetail } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{ task: TareaSeguimientoDetail }>();
const emit = defineEmits<{
  focus: [coordinates: SeguimientoCoordinates | null];
}>();
const routePoint = computed(() => {
  const point = props.task.routePoint;
  return point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
    ? point
    : null;
});
const pointLabel = computed(() =>
  routePoint.value
    ? `${routePoint.value.latitude.toFixed(5)}, ${routePoint.value.longitude.toFixed(5)}`
    : "Sin punto de enrutado",
);
const controlZoneCount = computed(() => props.task.controlZones?.length ?? 0);
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
            v-if="routePoint"
            class="grid size-11 place-items-center rounded-md text-main hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
            type="button"
            aria-label="Enfocar punto de enrutado"
            @click="emit('focus', routePoint)"
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
                controlZoneCount
                  ? `${controlZoneCount} ${controlZoneCount === 1 ? "zona" : "zonas"} de control`
                  : "Sin zonas asociadas"
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
