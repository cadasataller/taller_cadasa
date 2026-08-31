import { kinks } from "@turf/turf";
import type {
  SeguimientoControlLine,
  SeguimientoControlZone,
  SeguimientoCoordinates,
} from "@/seguimiento/shared/seguimiento.types";

const isCoordinate = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((entry) => typeof entry === "number" && Number.isFinite(entry));

export const isValidRoutePoint = (
  point: SeguimientoCoordinates | null,
): point is SeguimientoCoordinates =>
  Boolean(
    point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180,
  );

export const isValidControlLine = (
  geometry: SeguimientoControlLine | null,
): geometry is SeguimientoControlLine =>
  Boolean(
    geometry?.type === "MultiLineString" &&
    geometry.coordinates.some(
      (line) => line.length >= 2 && line.every(isCoordinate),
    ),
  );

const hasValidControlZoneStructure = (
  geometry: SeguimientoControlZone | null,
): geometry is SeguimientoControlZone =>
  Boolean(
    geometry?.type === "MultiPolygon" &&
    geometry.coordinates.some((polygon) =>
      polygon.some(
        (ring) =>
          ring.length >= 4 &&
          ring.every(isCoordinate) &&
          ring[0][0] === ring.at(-1)?.[0] &&
          ring[0][1] === ring.at(-1)?.[1],
      ),
    ),
  );

/** Detecta segmentos que se cruzan dentro de una zona antes de enviarla al RPC. */
export const hasControlZoneSelfIntersections = (
  geometry: SeguimientoControlZone | null,
): boolean =>
  hasValidControlZoneStructure(geometry) && kinks(geometry).features.length > 0;

export const isValidControlZone = (
  geometry: SeguimientoControlZone | null,
): geometry is SeguimientoControlZone =>
  hasValidControlZoneStructure(geometry) &&
  !hasControlZoneSelfIntersections(geometry);
