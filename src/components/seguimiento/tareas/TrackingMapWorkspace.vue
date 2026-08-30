<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { mapsProviderLoader } from "@/seguimiento/shared/maps/mapsProvider.loader";
import {
  resolveSeguimientoMapZoomProfile,
  seguimientoMapZIndex,
} from "@/seguimiento/shared/maps/mapZoomHierarchy.strategy";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type { TareaCreacionModoGeometria } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.types";
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
  creationGeometryMode?: TareaCreacionModoGeometria;
}>();
const emit = defineEmits<{
  ready: [];
  error: [error: unknown];
  "capture:route-point": [coordinates: SeguimientoCoordinates];
  "capture:control-line": [coordinates: number[][][]];
  "capture:control-zone": [coordinates: number[][][][]];
}>();
const mapCanvas = useTemplateRef<HTMLDivElement>("mapCanvas");
let map: any = null;
let taskMarkers: { marker: any; selected: boolean }[] = [];
let trackerMarkers: { marker: any; tracker: SeguimientoTracker }[] = [];
let routeLine: any = null;
let farmBoundaries: any[] = [];
let farmRoads: { halo: any; surface: any }[] = [];
let shelterBoundaries: { halo: any; surface: any }[] = [];
let shelterMarkers: any[] = [];
let geographyLabels: any[] = [];
let shelterInfoWindow: any = null;
let zoomListener: any = null;
let creationClickListener: any = null;
let creationVertices: number[][] = [];

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
  taskMarkers.forEach(({ marker }) => marker.setMap(null));
  trackerMarkers.forEach(({ marker }) => marker.setMap(null));
  taskMarkers = [];
  trackerMarkers = [];
  routeLine?.setMap(null);
  routeLine = null;
  farmBoundaries.forEach((boundary) => boundary.setMap(null));
  farmBoundaries = [];
  farmRoads.forEach(({ halo, surface }) => {
    halo.setMap(null);
    surface.setMap(null);
  });
  farmRoads = [];
  shelterBoundaries.forEach(({ halo, surface }) => {
    halo.setMap(null);
    surface.setMap(null);
  });
  shelterBoundaries = [];
  shelterMarkers.forEach((marker) => marker.setMap(null));
  shelterMarkers = [];
  geographyLabels.forEach((label) => label.setMap(null));
  geographyLabels = [];
  shelterInfoWindow?.close();
  shelterInfoWindow = null;
}

const escapeXml = (value: string): string =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[character] ?? character,
  );

function createFarmLabelIcon(name: string, maps: any): object {
  const width = Math.min(200, Math.max(92, name.length * 6.2 + 16));
  const safeName = escapeXml(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="26" viewBox="0 0 ${width} 26"><rect x=".5" y=".5" width="${width - 1}" height="25" rx="6" fill="#fffaf0" fill-opacity=".82" stroke="#31544d" stroke-opacity=".5"/><text x="${width / 2}" y="17" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#173d35">${safeName}</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(width, 26),
    anchor: new maps.Point(width / 2, 13),
  };
}

function createShelterIcon(maps: any): object {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#fffaf0" fill-opacity=".94" stroke="#004643" stroke-width="2"/><path d="M8.5 14.2 15 9l6.5 5.2v7.3h-4.2v-4.7h-4.6v4.7H8.5z" fill="none" stroke="#004643" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(30, 30),
    anchor: new maps.Point(15, 15),
  };
}

function updateTrackerMarkerDisplay(): void {
  if (!map || !window.google?.maps) return;
  const displayMode = resolveTrackerMarkerDisplayMode(map.getZoom() ?? 0);
  const maps = window.google.maps;
  trackerMarkers.forEach(({ marker, tracker }) => {
    const visible = displayMode !== "hidden";
    marker.setVisible(visible);
    marker.setZIndex(seguimientoMapZIndex.tracker);
    if (visible)
      marker.setIcon(createTrackerMarkerIcon(tracker, displayMode, maps));
  });
}

function updateZoomDrivenLayers(): void {
  if (!map) return;
  const profile = resolveSeguimientoMapZoomProfile(map.getZoom() ?? 0);

  farmBoundaries.forEach((boundary) => {
    boundary.setOptions({
      visible: true,
      strokeOpacity: 1,
      strokeWeight: 1,
      fillOpacity: profile.farmFillOpacity,
      zIndex: seguimientoMapZIndex.farm,
    });
  });
  geographyLabels.forEach((label) =>
    label.setVisible(profile.farmLabelVisible),
  );
  farmRoads.forEach(({ halo, surface }) => {
    halo.setOptions({
      visible: profile.roadsVisible,
      strokeOpacity: profile.roadHaloOpacity,
      strokeWeight: profile.roadHaloWeight,
      zIndex: seguimientoMapZIndex.road,
    });
    surface.setOptions({
      visible: profile.roadsVisible,
      strokeOpacity: profile.roadOpacity,
      strokeWeight: profile.roadWeight,
      zIndex: seguimientoMapZIndex.road + 1,
    });
  });
  shelterBoundaries.forEach(({ halo, surface }) => {
    halo.setOptions({
      visible: profile.zonesVisible,
      strokeOpacity: profile.zoneHaloOpacity,
      zIndex: seguimientoMapZIndex.zone,
    });
    surface.setOptions({
      visible: profile.zonesVisible,
      fillOpacity: profile.zoneFillOpacity,
      zIndex: seguimientoMapZIndex.zone + 1,
    });
  });
  shelterMarkers.forEach((marker) =>
    marker.setVisible(profile.sheltersVisible),
  );
  taskMarkers.forEach(({ marker, selected }) =>
    marker.setVisible(selected || profile.tasksVisible),
  );
  updateTrackerMarkerDisplay();
}

function renderLayers(): void {
  if (!map || !window.google?.maps) return;
  clearLayers();
  const maps = window.google.maps;
  if (isToolEnabled("zones")) {
    farmBoundaries = props.geography.flatMap((area) =>
      area.farms.flatMap((farm) => {
        if (!farm.boundary) return [];
        const paths = farm.boundary.coordinates.map((polygon) =>
          polygon[0].map(([longitude, latitude]) => ({
            lat: latitude,
            lng: longitude,
          })),
        );
        return [
          new maps.Polygon({
            map,
            paths,
            strokeColor: "#1A6B9A",
            strokeOpacity: 1,
            strokeWeight: 1,
            fillColor: "#1A6B9A",
            fillOpacity: 0.32,
            zIndex: seguimientoMapZIndex.farm,
          }),
        ];
      }),
    );
    farmRoads = props.geography.flatMap((area) =>
      area.farms.flatMap((farm) =>
        (farm.roadNetwork?.coordinates ?? []).map((line) => {
          const path = line.map(([longitude, latitude]) => ({
            lat: latitude,
            lng: longitude,
          }));
          return {
            halo: new maps.Polyline({
              map,
              path,
              strokeColor: "#0F172A",
              strokeOpacity: 0,
              strokeWeight: 4,
              zIndex: seguimientoMapZIndex.road,
            }),
            surface: new maps.Polyline({
              map,
              path,
              strokeColor: "#FACC15",
              strokeOpacity: 0,
              strokeWeight: 2,
              zIndex: seguimientoMapZIndex.road + 1,
            }),
          };
        }),
      ),
    );
    shelterBoundaries = props.geography.flatMap((area) =>
      area.shelters.flatMap((shelter) => {
        if (!shelter.boundary) return [];
        const paths = shelter.boundary.coordinates.map((polygon) =>
          polygon[0].map(([longitude, latitude]) => ({
            lat: latitude,
            lng: longitude,
          })),
        );
        return [
          {
            halo: new maps.Polygon({
              map,
              paths,
              strokeColor: "#FFFDF5",
              strokeOpacity: 0,
              strokeWeight: 6,
              fillOpacity: 0,
              zIndex: seguimientoMapZIndex.zone,
            }),
            surface: new maps.Polygon({
              map,
              paths,
              strokeColor: "#1A6B9A",
              strokeOpacity: 1,
              strokeWeight: 2.5,
              fillColor: "#1A6B9A",
              fillOpacity: 0,
              zIndex: seguimientoMapZIndex.zone + 1,
            }),
          },
        ];
      }),
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
                icon: createFarmLabelIcon(farm.name, maps),
                zIndex: seguimientoMapZIndex.farmLabel,
                optimized: false,
              }),
            ]
          : [];
      }),
    );
    shelterInfoWindow = new maps.InfoWindow();
    shelterMarkers = props.geography.flatMap((area) =>
      area.shelters.flatMap((shelter) => {
        if (!shelter.routePoint) return [];
        const marker = new maps.Marker({
          map,
          position: toLatLng(shelter.routePoint),
          title: `Resguardo: ${shelter.name}`,
          icon: createShelterIcon(maps),
          zIndex: seguimientoMapZIndex.shelter,
          visible: false,
        });
        marker.addListener("click", () => {
          const content = document.createElement("div");
          content.textContent = shelter.name;
          content.style.color = "#173d35";
          content.style.fontSize = "12px";
          content.style.fontWeight = "700";
          content.style.padding = "2px 4px";
          shelterInfoWindow?.setContent(content);
          shelterInfoWindow?.open({ map, anchor: marker });
        });
        return [marker];
      }),
    );
  }
  if (isToolEnabled("tasks") || props.selectedTaskId) {
    const showTaskLayer = isToolEnabled("tasks");
    taskMarkers = props.tasks
      .filter(
        (task) =>
          task.routePoint &&
          (showTaskLayer || task.id === props.selectedTaskId),
      )
      .map((task) => {
        const selected = task.id === props.selectedTaskId;
        return {
          selected,
          marker: new maps.Marker({
            map,
            position: toLatLng(task.routePoint!),
            title: task.instructions ?? "Tarea",
            label: task.routeOrder?.toString(),
            zIndex: selected
              ? seguimientoMapZIndex.selected
              : seguimientoMapZIndex.task,
            icon: selected
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
        };
      });
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
          zIndex: seguimientoMapZIndex.tracker,
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
        strokeOpacity: 0.96,
        strokeWeight: 4.5,
        zIndex: seguimientoMapZIndex.route,
      });
  }
  updateZoomDrivenLayers();
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
    zoomListener = map.addListener("zoom_changed", updateZoomDrivenLayers);
    creationClickListener = map.addListener("click", (event: any) => {
      const point = event.latLng;
      if (!point || !props.creationGeometryMode) return;
      const coordinate = [point.lng(), point.lat()];
      if (props.creationGeometryMode === "point") {
        emit("capture:route-point", {
          latitude: coordinate[1],
          longitude: coordinate[0],
        });
        return;
      }
      creationVertices = [...creationVertices, coordinate];
      if (props.creationGeometryMode === "line")
        emit("capture:control-line", [creationVertices]);
      if (props.creationGeometryMode === "zone") {
        const ring =
          creationVertices.length >= 3
            ? [...creationVertices, creationVertices[0]]
            : creationVertices;
        emit("capture:control-zone", [[ring]]);
      }
    });
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
  () => props.creationGeometryMode,
  () => {
    creationVertices = [];
  },
);
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
  creationClickListener?.remove();
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
