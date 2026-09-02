export const seguimientoMapZoomPolicy = {
  mediumZoom: 12,
  shelterZoom: 14,
  nearZoom: 15,
} as const;

export type SeguimientoMapViewport = "mobile" | "tablet" | "desktop";

const viewportZoomOffset: Record<SeguimientoMapViewport, number> = {
  mobile: 2,
  tablet: 1,
  desktop: 0,
};

export const seguimientoMapZIndex = {
  farm: 10,
  farmLabel: 15,
  zone: 20,
  road: 30,
  route: 40,
  shelter: 50,
  task: 60,
  tracker: 70,
  selected: 80,
  alert: 90,
} as const;

export type SeguimientoMapZoomLevel = "far" | "medium" | "near";

export interface SeguimientoMapZoomProfile {
  level: SeguimientoMapZoomLevel;
  farmLabelVisible: boolean;
  farmFillOpacity: number;
  roadsVisible: boolean;
  roadHaloOpacity: number;
  roadHaloWeight: number;
  roadOpacity: number;
  roadWeight: number;
  sheltersVisible: boolean;
  zonesVisible: boolean;
  zoneFillOpacity: number;
  zoneHaloOpacity: number;
  tasksVisible: boolean;
}

export function resolveSeguimientoMapViewport(
  width: number,
): SeguimientoMapViewport {
  if (width < 768) return "mobile";
  if (width < 1280) return "tablet";
  return "desktop";
}

export function resolveSeguimientoMapDisplayZoom(
  configuredZoom: number,
  viewport: SeguimientoMapViewport,
): number {
  const centeredZoom = Math.max(1, Math.round(configuredZoom * 0.9));
  return Math.max(1, centeredZoom - viewportZoomOffset[viewport]);
}

function resolveFarmFillOpacity(zoom: number): number {
  if (zoom <= 11) return 0.32;
  if (zoom >= 17) return 0.08;

  return {
    12: 0.28,
    13: 0.24,
    14: 0.2,
    15: 0.16,
    16: 0.12,
  }[Math.floor(zoom)]!;
}

export function resolveSeguimientoMapZoomProfile(
  zoom: number,
  policy = seguimientoMapZoomPolicy,
): SeguimientoMapZoomProfile {
  if (zoom < policy.mediumZoom) {
    return {
      level: "far",
      farmLabelVisible: false,
      farmFillOpacity: resolveFarmFillOpacity(zoom),
      roadsVisible: false,
      roadHaloOpacity: 0,
      roadHaloWeight: 0,
      roadOpacity: 0,
      roadWeight: 0,
      sheltersVisible: false,
      zonesVisible: false,
      zoneFillOpacity: 0,
      zoneHaloOpacity: 0,
      tasksVisible: false,
    };
  }

  if (zoom < policy.nearZoom) {
    return {
      level: "medium",
      farmLabelVisible: true,
      farmFillOpacity: resolveFarmFillOpacity(zoom),
      roadsVisible: true,
      roadHaloOpacity: 0.48,
      roadHaloWeight: 4,
      roadOpacity: 0.58,
      roadWeight: 2,
      sheltersVisible: zoom >= policy.shelterZoom,
      zonesVisible: true,
      zoneFillOpacity: 0,
      zoneHaloOpacity: 0.72,
      tasksVisible: true,
    };
  }

  return {
    level: "near",
    farmLabelVisible: true,
    farmFillOpacity: resolveFarmFillOpacity(zoom),
    roadsVisible: true,
    roadHaloOpacity: 0.62,
    roadHaloWeight: 5,
    roadOpacity: 0.82,
    roadWeight: 2.5,
    sheltersVisible: true,
    zonesVisible: true,
    zoneFillOpacity: 0.22,
    zoneHaloOpacity: 0.82,
    tasksVisible: true,
  };
}
