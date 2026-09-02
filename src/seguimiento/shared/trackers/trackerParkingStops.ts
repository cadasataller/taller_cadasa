import type { SeguimientoTrackerHistoryPoint } from "./tracker.types";

const minimumParkingDurationMinutes = 5;

export interface TrackerParkingStop {
  latitude: number;
  longitude: number;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
}

function toTimestamp(value: string): number | null {
  const timestamp = Date.parse(`${value.replace(" ", "T")}Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function resolveDurationMinutes(startedAt: string, endedAt: string): number {
  const start = toTimestamp(startedAt);
  const end = toTimestamp(endedAt);
  if (start === null || end === null || end < start) return 0;
  return Math.round((end - start) / 60_000);
}

export function buildTrackerParkingStops(
  points: readonly SeguimientoTrackerHistoryPoint[],
  currentTime?: string,
): TrackerParkingStop[] {
  const stops: TrackerParkingStop[] = [];
  let parkingStart: SeguimientoTrackerHistoryPoint | null = null;
  let lastParkingPoint: SeguimientoTrackerHistoryPoint | null = null;

  const closeParkingStop = (
    followingPoint: SeguimientoTrackerHistoryPoint | null,
  ): void => {
    if (!parkingStart || !lastParkingPoint) return;
    const endedAt =
      followingPoint?.capturedAt ??
      (lastParkingPoint.isLiveParking && currentTime
        ? currentTime
        : lastParkingPoint.capturedAt);
    const durationMinutes = resolveDurationMinutes(
      parkingStart.parkingStartedAt ?? parkingStart.capturedAt,
      endedAt,
    );
    if (durationMinutes >= minimumParkingDurationMinutes) {
      stops.push({
        latitude: parkingStart.latitude,
        longitude: parkingStart.longitude,
        startedAt: parkingStart.parkingStartedAt ?? parkingStart.capturedAt,
        endedAt,
        durationMinutes,
      });
    }
    parkingStart = null;
    lastParkingPoint = null;
  };

  points.forEach((point) => {
    if (point.parking === true) {
      parkingStart ??= point;
      lastParkingPoint = point;
      return;
    }
    if (point.parking === false) closeParkingStop(point);
  });
  closeParkingStop(null);
  return stops;
}
