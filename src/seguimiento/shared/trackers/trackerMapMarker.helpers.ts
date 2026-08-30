import { resolveTrackerEquipment } from "./trackerEquipment.strategy";
import type { TrackerMarkerDisplayMode } from "./trackerMarkerDisplayMode.strategy";
import type { SeguimientoTracker } from "./tracker.types";

export type TrackerMarkerColor = "blue" | "gray" | "green" | "orange" | "red";

export interface TrackerMarkerVisualState {
  color: TrackerMarkerColor;
  colorHex: string;
  ignition: "on" | "off" | "unknown";
}

interface MapsMarkerPrimitives {
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
}

const markerColors: Record<TrackerMarkerColor, string> = {
  red: "#dc2626",
  gray: "#64748b",
  green: "#16a34a",
  orange: "#f97316",
  blue: "#2563eb",
};

const normalizeStatus = (status: string | null): string =>
  status?.trim().toLocaleLowerCase() ?? "";

const equipmentSvg: Record<
  ReturnType<typeof resolveTrackerEquipment>,
  string
> = {
  tractor:
    '<path d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20M16 18h-5M18 5a1 1 0 0 0-1 1v5.573M3 4h8.129a1 1 0 0 1 .99.863L13 11.246M4 11V4M7 15h.01M8 10.1V4"/><circle cx="18" cy="18" r="2"/><circle cx="7" cy="15" r="5"/>',
  vehicle:
    '<path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8M7 14h.01M17 14h.01M5 18v2M19 18v2"/><rect width="18" height="8" x="3" y="10" rx="2"/>',
  truck:
    '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  fuel_truck:
    '<g transform="translate(0 1) scale(.78)"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></g><g transform="translate(11 9) scale(.45)"><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16M2 21h13M3 9h11"/></g>',
  forklift:
    '<path d="M12 12H5a2 2 0 0 0-2 2v5M15 19h7M17 8h1a4 4 0 0 1 4 4v3M5 19v2M9 19v2M15 12h5v7"/><path d="M9 8h6v8H9z"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
  machinery:
    '<rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7M7 14v7M17 3v3M7 3v3M10 14 2.3 6.3m11.7-.3 7.7 7.7M8 6l8 8"/>',
  unknown:
    '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
};

export function getTrackerMarkerVisualState(
  tracker: Pick<
    SeguimientoTracker,
    "connectionStatus" | "movementStatus" | "ignition"
  >,
): TrackerMarkerVisualState {
  const connectionStatus = normalizeStatus(tracker.connectionStatus);
  const movementStatus = normalizeStatus(tracker.movementStatus);
  let color: TrackerMarkerColor = "gray";

  if (["offline", "signal_lost"].includes(connectionStatus)) color = "red";
  else if (connectionStatus === "active") {
    if (movementStatus === "moving") color = "green";
    else if (movementStatus === "stopped") color = "orange";
    else if (movementStatus === "parked") color = "blue";
  }

  return {
    color,
    colorHex: markerColors[color],
    ignition:
      tracker.ignition === true
        ? "on"
        : tracker.ignition === false
          ? "off"
          : "unknown",
  };
}

export function getTrackerMarkerTitle(tracker: SeguimientoTracker): string {
  const status = [tracker.connectionStatus, tracker.movementStatus]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" · ");
  const ignition =
    tracker.ignition === true
      ? "Encendido"
      : tracker.ignition === false
        ? "Apagado"
        : "Ignición sin información";
  const speed =
    tracker.speed === null ? null : `${Math.round(tracker.speed)} km/h`;
  return [tracker.label, status || "Sin estado", ignition, speed]
    .filter(Boolean)
    .join(" — ");
}

export function createTrackerMarkerIcon(
  tracker: SeguimientoTracker,
  displayMode: Exclude<TrackerMarkerDisplayMode, "hidden">,
  maps: MapsMarkerPrimitives,
): { url: string; scaledSize: unknown; anchor: unknown } {
  const visual = getTrackerMarkerVisualState(tracker);
  const isDot = displayMode === "dot";
  const isDetailed = displayMode === "detailed";
  const size = isDot ? 16 : isDetailed ? 56 : 44;
  const equipment = equipmentSvg[resolveTrackerEquipment(tracker)];
  const ignitionBadge = isDetailed
    ? visual.ignition === "unknown"
      ? '<text x="39" y="42" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="#475569">?</text>'
      : `<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" transform="translate(31 30) scale(.58)" fill="none" stroke="${visual.ignition === "on" ? "#15803d" : "#94a3b8"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";
  const detailText =
    isDetailed && tracker.speed !== null
      ? `<text x="24" y="54" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="700" fill="#0f172a">${Math.round(tracker.speed)} km/h</text>`
      : "";
  const svg = isDot
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${visual.colorHex}" stroke="#fff" stroke-width="2"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><circle cx="24" cy="24" r="18" fill="${visual.colorHex}" stroke="#fff" stroke-width="3"/><g transform="translate(12 12) scale(1)" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${equipment}</g>${isDetailed ? '<circle cx="39" cy="39" r="9" fill="#fff" stroke="#cbd5e1" stroke-width="1.5"/>' : ""}${ignitionBadge}${detailText}</svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(size, size),
    anchor: new maps.Point(size / 2, size / 2),
  };
}
