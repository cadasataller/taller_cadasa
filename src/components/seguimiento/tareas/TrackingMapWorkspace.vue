<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { mapsProviderLoader } from "@/seguimiento/shared/maps/mapsProvider.loader";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import {
  createTrackerMarkerIcon,
  getTrackerMarkerTitle,
} from "@/seguimiento/shared/trackers/trackerMapMarker.helpers";
import { resolveTrackerMarkerDisplayMode } from "@/seguimiento/shared/trackers/trackerMarkerDisplayMode.strategy";
import type {
  SeguimientoMapStatus,
  SeguimientoMapToolState,
  SeguimientoOperationalGeography,
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
  mapConfiguration: {
    latitude: number;
    longitude: number;
    zoom: number;
  } | null;
  geography: SeguimientoOperationalGeography[];
}>();
const emit = defineEmits<{ ready: []; error: [error: unknown] }>();
const mapCanvas = useTemplateRef<HTMLDivElement>("mapCanvas");
let map: any = null;
let taskMarkers: any[] = [];
let trackerMarkers: { marker: any; tracker: SeguimientoTracker }[] = [];
let routeLine: any = null;
let farmBoundaries: any[] = [];
let farmRoads: any[] = [];
let shelterMarkers: any[] = [];
let geographyLabels: any[] = [];
let zoomListener: any = null;

const isToolEnabled = (tool: SeguimientoMapToolState["tool"]): boolean =>
  props.mapTools.find((item) => item.tool === tool)?.enabled ?? false;

const centeredZoom = (zoom: number): number =>
  Math.max(1, Math.round(zoom * 0.9));
const toLatLng = (coordinates: SeguimientoCoordinates) => ({
  lat: coordinates.latitude,
  lng: coordinates.longitude,
});
const geometryCenter = (
  coordinates: number[][][][],
): SeguimientoCoordinates | null => {
  const points = coordinates.flatMap((polygon) => polygon[0] ?? []);
  if (!points.length) return null;
  const totals = points.reduce(
    (result, [longitude, latitude]) => ({
      latitude: result.latitude + latitude,
      longitude: result.longitude + longitude,
    }),
    { latitude: 0, longitude: 0 },
  );
  return {
    latitude: totals.latitude / points.length,
    longitude: totals.longitude / points.length,
  };
};

function clearLayers(): void {
  taskMarkers.forEach((marker) => marker.setMap(null));
  trackerMarkers.forEach(({ marker }) => marker.setMap(null));
  taskMarkers = [];
  trackerMarkers = [];
  routeLine?.setMap(null);
  routeLine = null;
  farmBoundaries.forEach((boundary) => boundary.setMap(null));
  farmBoundaries = [];
  farmRoads.forEach((road) => road.setMap(null));
  farmRoads = [];
  shelterMarkers.forEach((marker) => marker.setMap(null));
  shelterMarkers = [];
  geographyLabels.forEach((label) => label.setMap(null));
  geographyLabels = [];
}

function updateTrackerMarkerDisplay(): void {
  if (!map || !window.google?.maps) return;
  const displayMode = resolveTrackerMarkerDisplayMode(map.getZoom() ?? 0);
  const maps = window.google.maps;
  trackerMarkers.forEach(({ marker, tracker }) => {
    const visible = displayMode !== "hidden";
    marker.setVisible(visible);
    if (visible)
      marker.setIcon(createTrackerMarkerIcon(tracker, displayMode, maps));
  });
}

function renderLayers(): void {
  if (!map || !window.google?.maps) return;
  clearLayers();
  const maps = window.google.maps;
  if (isToolEnabled("zones")) {
    farmBoundaries = props.geography.flatMap((area) =>
      area.farms.flatMap((farm) => {
        if (!farm.boundary) return [];
        return [
          new maps.Polygon({
            map,
            paths: farm.boundary.coordinates.map((polygon) =>
              polygon[0].map(([longitude, latitude]) => ({
                lat: latitude,
                lng: longitude,
              })),
            ),
            strokeColor: "#1A6B9A",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#1A6B9A",
            fillOpacity: 0.2,
          }),
        ];
      }),
    );
    farmRoads = props.geography
      .flatMap((area) =>
        area.farms.flatMap((farm) =>
          (farm.roadNetwork?.coordinates ?? []).map((line) => {
            const path = line.map(([longitude, latitude]) => ({
              lat: latitude,
              lng: longitude,
            }));
            return [
              new maps.Polyline({
                map,
                path,
                strokeColor: "#111827",
                strokeOpacity: 0.86,
                strokeWeight: 6,
              }),
              new maps.Polyline({
                map,
                path,
                strokeColor: "#FACC15",
                strokeOpacity: 0.96,
                strokeWeight: 3,
              }),
            ];
          }),
        ),
      )
      .flat();
    farmBoundaries.push(
      ...props.geography.flatMap((area) =>
        area.shelters.flatMap((shelter) => {
          if (!shelter.boundary) return [];
          return [
            new maps.Polygon({
              map,
              paths: shelter.boundary.coordinates.map((polygon) =>
                polygon[0].map(([longitude, latitude]) => ({
                  lat: latitude,
                  lng: longitude,
                })),
              ),
              strokeColor: "#1A6B9A",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#1A6B9A",
              fillOpacity: 0.2,
            }),
          ];
        }),
      ),
    );
    geographyLabels = props.geography.flatMap((area) =>
      area.farms.flatMap((farm) => {
        const center = farm.boundary
          ? geometryCenter(farm.boundary.coordinates)
          : null;
        return center
          ? [
              new maps.Marker({
                map,
                position: toLatLng(center),
                title: farm.name,
                label: {
                  text: farm.name,
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: "700",
                },
                icon: {
                  path: maps.SymbolPath.CIRCLE,
                  scale: 9,
                  fillColor: "#1A6B9A",
                  fillOpacity: 0.9,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                },
              }),
            ]
          : [];
      }),
    );
    shelterMarkers = props.geography.flatMap((area) =>
      area.shelters.flatMap((shelter) =>
        shelter.routePoint
          ? [
              new maps.Marker({
                map,
                position: toLatLng(shelter.routePoint),
                title: `Resguardo: ${shelter.name}`,
                label: {
                  text: "R",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "700",
                },
                icon: {
                  path: maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#004643",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                },
              }),
            ]
          : [],
      ),
    );
  }
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
      .map((tracker) => ({
        tracker,
        marker: new maps.Marker({
          map,
          position: toLatLng(tracker.position!),
          title: getTrackerMarkerTitle(tracker),
          visible: false,
        }),
      }));
    updateTrackerMarkerDisplay();
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
      center: props.mapConfiguration
        ? toLatLng(props.mapConfiguration)
        : { lat: 8.538, lng: -80.782 },
      zoom: props.mapConfiguration
        ? centeredZoom(props.mapConfiguration.zoom)
        : centeredZoom(8),
      mapTypeControl: false,
      mapTypeId: "satellite",
      styles: [
        {
          featureType: "all",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });
    zoomListener = map.addListener("zoom_changed", updateTrackerMarkerDisplay);
    renderLayers();
    focusMap();
    emit("ready");
  } catch (error) {
    emit("error", error);
  }
}

watch(
  () => [
    props.tasks,
    props.trackers,
    props.geography,
    props.mapTools,
    props.selectedTaskId,
  ],
  renderLayers,
  { deep: true },
);
watch(() => props.focus, focusMap);
watch(
  () => props.mapConfiguration,
  (configuration) => {
    if (map && configuration) {
      map.setCenter(toLatLng(configuration));
      map.setZoom(centeredZoom(configuration.zoom));
    }
  },
);
onMounted(() => {
  void initializeMap();
});
onBeforeUnmount(() => {
  zoomListener?.remove();
  clearLayers();
});
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
