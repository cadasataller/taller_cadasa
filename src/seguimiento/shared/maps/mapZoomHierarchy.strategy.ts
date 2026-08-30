export const seguimientoMapZoomPolicy = {
  mediumZoom: 12,
  shelterZoom: 14,
  nearZoom: 15,
} as const;

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
  farmHaloOpacity: number;
  farmHaloWeight: number;
  farmStrokeOpacity: number;
  farmStrokeWeight: number;
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

export function resolveSeguimientoMapZoomProfile(
  zoom: number,
  policy = seguimientoMapZoomPolicy,
): SeguimientoMapZoomProfile {
  if (zoom < policy.mediumZoom) {
    return {
      level: "far",
      farmLabelVisible: false,
      farmFillOpacity: 0.1,
      farmHaloOpacity: 0.72,
      farmHaloWeight: 6,
      farmStrokeOpacity: 0.72,
      farmStrokeWeight: 2,
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
      farmFillOpacity: 0.13,
      farmHaloOpacity: 0.78,
      farmHaloWeight: 6,
      farmStrokeOpacity: 0.86,
      farmStrokeWeight: 2,
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
    farmFillOpacity: 0.18,
    farmHaloOpacity: 0.84,
    farmHaloWeight: 7,
    farmStrokeOpacity: 1,
    farmStrokeWeight: 3,
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
