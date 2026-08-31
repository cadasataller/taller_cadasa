<script setup lang="ts">
import { computed } from "vue";
import { Crosshair, MapPinned, PencilLine, Route } from "lucide-vue-next";
import type { SeguimientoOperationalGeography } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";
import type {
  TareaCreacionGeometria,
  TareaCreacionCampoError,
  TareaCreacionModoGeometria,
  TareaCreacionTipo,
} from "@/stores/seguimiento/tareas/creacion/tareaCreacion.types";

const props = defineProps<{
  type: TareaCreacionTipo | null;
  geometry: TareaCreacionGeometria;
  geography: SeguimientoOperationalGeography[];
  areaId: string | null;
  mode: TareaCreacionModoGeometria;
  locationError?: string | null;
  routePointError?: string | null;
  controlLineError?: string | null;
  controlZoneError?: string | null;
}>();
const emit = defineEmits<{
  "update:location": [value: string | null];
  edit: [mode: Exclude<TareaCreacionModoGeometria, null>];
  finish: [];
  "skip:field": [
    field: Extract<
      TareaCreacionCampoError,
      "location" | "routePoint" | "controlLine" | "controlZone"
    >,
  ];
}>();
const farms = computed(
  () =>
    props.geography.find((item) => item.areaId === props.areaId)?.farms ?? [],
);
const pointLabel = computed(() =>
  props.geometry.routePoint
    ? `${props.geometry.routePoint.latitude.toFixed(5)}, ${props.geometry.routePoint.longitude.toFixed(5)}`
    : "Pendiente de capturar en el mapa",
);
const lineLabel = computed(() =>
  props.geometry.controlLine
    ? `${props.geometry.controlLine.coordinates[0]?.length ?? 0} puntos definidos`
    : "Requerida para finca",
);
const zoneLabel = computed(() =>
  props.geometry.controlZones.length
    ? props.type === "finca"
      ? `${props.geometry.controlZones.length} zona(s) independiente(s) definida(s)`
      : `${props.geometry.controlZones[0]?.coordinates[0]?.[0]?.length ?? 0} puntos definidos`
    : props.type === "zona"
      ? "Requerida para zona"
      : "Requerida para finca",
);
const editingLabel = computed(() => {
  if (props.mode === "point") return "Haz clic en el mapa para fijar el punto.";
  if (props.mode === "line")
    return "Haz clic para añadir puntos y termina al completar la línea.";
  if (props.mode === "zone")
    return "Haz clic para añadir vértices y termina al cerrar la zona.";
  return null;
});
</script>

<template>
  <section
    aria-labelledby="create-task-geometry"
    class="border-t border-slate-100 py-4"
  >
    <div class="flex items-center gap-2">
      <MapPinned class="size-4 text-main" aria-hidden="true" />
      <h3
        id="create-task-geometry"
        class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600"
      >
        Ubicación y geometría
      </h3>
    </div>
    <label
      v-if="type === 'finca'"
      class="mt-3 block text-xs font-bold text-slate-700"
    >
      Finca <span class="text-danger">*</span>
      <select
        class="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-main focus:ring-2 focus:ring-main/15"
        :value="geometry.locationId ?? ''"
        :aria-invalid="Boolean(locationError)"
        @focus="emit('skip:field', 'location')"
        @change="
          emit(
            'update:location',
            ($event.target as HTMLSelectElement).value || null,
          )
        "
      >
        <option disabled value="">Selecciona una finca activa</option>
        <option v-for="farm in farms" :key="farm.id" :value="farm.id">
          {{ farm.name }}
        </option>
      </select>
    </label>
    <p
      v-if="locationError"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ locationError }}
    </p>
    <p
      v-else-if="type === 'zona'"
      class="mt-3 rounded-lg bg-second/40 px-3 py-2 text-[11px] leading-5 text-main"
    >
      La zona se guarda sin finca seleccionada; el backend valida su relación
      operativa.
    </p>
    <div v-if="type" class="mt-3 grid gap-2">
      <div class="rounded-lg bg-slate-50 p-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold text-slate-700">Punto de enrutado</p>
            <p class="mt-0.5 text-[11px] text-slate-500">{{ pointLabel }}</p>
          </div>
          <button
            class="grid size-9 place-items-center rounded-md text-main hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
            type="button"
            aria-label="Capturar punto de enrutado"
            @click="
              emit('skip:field', 'routePoint');
              emit('edit', 'point');
            "
          >
            <Crosshair class="size-4" />
          </button>
        </div>
        <p
          v-if="routePointError"
          class="mt-2 text-[11px] font-medium text-danger"
          role="alert"
        >
          {{ routePointError }}
        </p>
      </div>
      <div v-if="type === 'finca'" class="rounded-lg bg-slate-50 p-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold text-slate-700">Línea de control</p>
            <p class="mt-0.5 text-[11px] text-slate-500">{{ lineLabel }}</p>
          </div>
          <button
            class="grid size-9 place-items-center rounded-md text-main hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
            type="button"
            aria-label="Editar línea de control"
            @click="
              emit('skip:field', 'controlLine');
              emit('edit', 'line');
            "
          >
            <PencilLine class="size-4" />
          </button>
        </div>
        <p
          v-if="controlLineError"
          class="mt-2 text-[11px] font-medium text-danger"
          role="alert"
        >
          {{ controlLineError }}
        </p>
      </div>
      <div v-if="type" class="rounded-lg bg-slate-50 p-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold text-slate-700">
              {{ type === "finca" ? "Zonas de control" : "Zona de control" }}
            </p>
            <p class="mt-0.5 text-[11px] text-slate-500">{{ zoneLabel }}</p>
          </div>
          <button
            class="grid size-9 place-items-center rounded-md text-main hover:bg-second focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
            type="button"
            :aria-label="
              type === 'finca'
                ? 'Agregar zona de control'
                : 'Editar zona de control'
            "
            @click="
              emit('skip:field', 'controlZone');
              emit('edit', 'zone');
            "
          >
            <PencilLine class="size-4" />
          </button>
        </div>
        <p
          v-if="controlZoneError"
          class="mt-2 text-[11px] font-medium text-danger"
          role="alert"
        >
          {{ controlZoneError }}
        </p>
      </div>
    </div>
    <div
      v-if="editingLabel"
      class="mt-3 rounded-lg border border-main/30 bg-second/30 p-3"
    >
      <div class="flex gap-2">
        <Route class="mt-0.5 size-4 shrink-0 text-main" />
        <p class="text-[11px] leading-5 text-slate-700">{{ editingLabel }}</p>
      </div>
      <button
        v-if="mode !== 'point'"
        class="mt-2 min-h-9 rounded-md bg-main px-3 text-[11px] font-bold text-white"
        type="button"
        @click="emit('finish')"
      >
        Finalizar geometría
      </button>
    </div>
  </section>
</template>
