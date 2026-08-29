<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { mapsProviderLoader } from "@/seguimiento/shared/maps/mapsProvider.loader";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import type {
  SeguimientoMapStatus,
  SeguimientoMapToolState,
  TareaSeguimientoListItem,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{
  tasks: TareaSeguimientoListItem[];
  trackers: SeguimientoTracker[];
  selectedTaskId: string | null;
  mapTools: SeguimientoMapToolState[];
  status: SeguimientoMapStatus;
  error: string | null;
  focus: SeguimientoCoordinates | null;
}>();
const emit = defineEmits<{ ready: []; error: [error: unknown] }>();
const mapCanvas = useTemplateRef<HTMLDivElement>("mapCanvas");
let map: any = null;
let taskMarkers: any[] = [];
let trackerMarkers: any[] = [];
let routeLine: any = null;

const isToolEnabled = (tool: SeguimientoMapToolState["tool"]): boolean =>
  props.mapTools.find((item) => item.tool === tool)?.enabled ?? false;
const toLatLng = (coordinates: SeguimientoCoordinates) => ({
  lat: coordinates.latitude,
  lng: coordinates.longitude,
});

function clearLayers(): void {
  [...taskMarkers, ...trackerMarkers].forEach((marker) => marker.setMap(null));
  taskMarkers = [];
  trackerMarkers = [];
  routeLine?.setMap(null);
  routeLine = null;
}

function renderLayers(): void {
  if (!map || !window.google?.maps) return;
  clearLayers();
  const maps = window.google.maps;
  if (isToolEnabled("tasks")) {
    taskMarkers = props.tasks
      .filter((task) => task.routePoint)
      .map(
        (task) =>
          new maps.Marker({
            map,
            position: toLatLng(task.routePoint!),
            title: task.instructions ?? "Tarea",
            label: task.routeOrder?.toString(),
            icon:
              task.id === props.selectedTaskId
                ? {
                    path: maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#004643",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3,
                  }
                : undefined,
          }),
      );
  }
  if (isToolEnabled("trackers")) {
    trackerMarkers = props.trackers
      .filter((tracker) => tracker.position)
      .map(
        (tracker) =>
          new maps.Marker({
            map,
            position: toLatLng(tracker.position!),
            title: tracker.label,
            icon: {
              path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: "#1A6B9A",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          }),
      );
  }
  if (isToolEnabled("route")) {
    const routePoints = props.tasks
      .filter((task) => task.routePoint)
      .sort(
        (left, right) =>
          (left.routeOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.routeOrder ?? Number.MAX_SAFE_INTEGER),
      )
      .map((task) => toLatLng(task.routePoint!));
    if (routePoints.length > 1)
      routeLine = new maps.Polyline({
        map,
        path: routePoints,
        geodesic: true,
        strokeColor: "#D4A853",
        strokeOpacity: 0.9,
        strokeWeight: 4,
      });
  }
}

function focusMap(): void {
  if (map && props.focus) map.panTo(toLatLng(props.focus));
}

async function initializeMap(): Promise<void> {
  try {
    await mapsProviderLoader.load();
    if (!mapCanvas.value || !window.google?.maps)
      throw new Error("Google Maps no quedó disponible.");
    map = new window.google.maps.Map(mapCanvas.value, {
      center: { lat: 8.538, lng: -80.782 },
      zoom: 8,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });
    renderLayers();
    focusMap();
    emit("ready");
  } catch (error) {
    emit("error", error);
  }
}

watch(
  () => [props.tasks, props.trackers, props.mapTools, props.selectedTaskId],
  renderLayers,
  { deep: true },
);
watch(() => props.focus, focusMap);
onMounted(() => {
  void initializeMap();
});
onBeforeUnmount(clearLayers);
</script>

<template>
  <div
    class="absolute inset-0"
    role="application"
    aria-label="Mapa de seguimiento"
  >
    <div ref="mapCanvas" class="absolute inset-0"></div>
    <div
      v-if="status === 'idle'"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white/95 px-3 py-2 text-xs font-medium text-main shadow-md"
    >
      Cargando Google Maps…
    </div>
    <div
      v-else-if="status === 'error'"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-danger-bg px-3 py-2 text-xs font-medium text-danger shadow-md"
    >
      {{ error }}
    </div>
  </div>
</template>
