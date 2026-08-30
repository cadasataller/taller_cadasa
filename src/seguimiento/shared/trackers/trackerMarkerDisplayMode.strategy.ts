export const trackerMarkerZoomPolicy = {
  minimumVisibleZoom: 11,
  iconZoom: 14,
  detailZoom: 17,
} as const;

export type TrackerMarkerDisplayMode = "hidden" | "dot" | "icon" | "detailed";

export function resolveTrackerMarkerDisplayMode(
  zoom: number,
  policy = trackerMarkerZoomPolicy,
): TrackerMarkerDisplayMode {
  if (zoom < policy.minimumVisibleZoom) return "hidden";
  if (zoom < policy.iconZoom) return "dot";
  if (zoom < policy.detailZoom) return "icon";
  return "detailed";
}
