import {
  area,
  featureCollection,
  intersect,
  lineString,
  multiPolygon,
  nearestPointOnLine,
  point,
} from "@turf/turf";
import type {
  SeguimientoControlLine,
  SeguimientoControlZone,
  SeguimientoCoordinates,
} from "@/seguimiento/shared/seguimiento.types";
import type { SeguimientoOperationalGeography } from "../tareasSeguimiento.types";

const MAX_FARM_ROAD_DISTANCE_KM = 0.1;
const CONTROL_LINE_HALF_LENGTH_METERS = 14;

type Farm = SeguimientoOperationalGeography["farms"][number];

export interface TareaCreacionFincaDominante {
  farm: Farm;
  coverage: number;
  isFullyContained: boolean;
}

export interface TareaCreacionSnapResult {
  routePoint: SeguimientoCoordinates;
  controlLine: SeguimientoControlLine;
  distanceKm: number;
}

const asFeature = (geometry: SeguimientoControlZone) =>
  multiPolygon(geometry.coordinates);

/** Devuelve la finca que concentra la mayor superficie de las zonas capturadas. */
export function resolveDominantFarm(
  zones: SeguimientoControlZone[],
  farms: Farm[],
): TareaCreacionFincaDominante | null {
  const totalArea = zones.reduce(
    (total, zone) => total + area(asFeature(zone)),
    0,
  );
  if (!totalArea) return null;
  const candidates = farms
    .filter((farm) => farm.boundary)
    .map((farm) => {
      const coveredArea = zones.reduce((total, zone) => {
        const overlap = intersect(
          featureCollection([asFeature(zone), asFeature(farm.boundary!)]),
        );
        return total + (overlap ? area(overlap) : 0);
      }, 0);
      return {
        farm,
        coverage: coveredArea / totalArea,
        isFullyContained: Math.abs(coveredArea - totalArea) < 0.01,
      };
    })
    .filter((candidate) => candidate.coverage >= 0.11)
    .sort((left, right) => right.coverage - left.coverage);
  return candidates[0] ?? null;
}

/** Ajusta un clic a la red vial indicada y crea una línea perpendicular al tramo. */
export function snapToRoadNetwork(
  clicked: SeguimientoCoordinates,
  roadNetwork: SeguimientoControlLine,
): TareaCreacionSnapResult | null {
  const clickedPoint = point([clicked.longitude, clicked.latitude]);
  const matches = roadNetwork.coordinates
    .filter((coordinates) => coordinates.length >= 2)
    .map((coordinates) => {
      const snapped = nearestPointOnLine(
        lineString(coordinates),
        clickedPoint,
        {
          units: "kilometers",
        },
      );
      return { coordinates, snapped };
    })
    .sort(
      (left, right) =>
        Number(left.snapped.properties.dist) -
        Number(right.snapped.properties.dist),
    );
  const selected = matches[0];
  if (!selected) return null;
  const [longitude, latitude] = selected.snapped.geometry.coordinates;
  const index = Math.min(
    Math.max(Number(selected.snapped.properties.index ?? 0), 0),
    selected.coordinates.length - 2,
  );
  const [fromLongitude, fromLatitude] = selected.coordinates[index];
  const [toLongitude, toLatitude] = selected.coordinates[index + 1];
  const deltaLongitude =
    (toLongitude - fromLongitude) * Math.cos((latitude * Math.PI) / 180);
  const deltaLatitude = toLatitude - fromLatitude;
  const magnitude = Math.hypot(deltaLongitude, deltaLatitude);
  if (!magnitude) return null;
  const perpendicularLongitude = -deltaLatitude / magnitude;
  const perpendicularLatitude = deltaLongitude / magnitude;
  const latitudeOffset = CONTROL_LINE_HALF_LENGTH_METERS / 111_320;
  const longitudeOffset =
    latitudeOffset / Math.max(Math.cos((latitude * Math.PI) / 180), 0.01);
  return {
    routePoint: { latitude, longitude },
    controlLine: {
      type: "MultiLineString",
      coordinates: [
        [
          [
            longitude + perpendicularLongitude * longitudeOffset,
            latitude + perpendicularLatitude * latitudeOffset,
          ],
          [
            longitude - perpendicularLongitude * longitudeOffset,
            latitude - perpendicularLatitude * latitudeOffset,
          ],
        ],
      ],
    },
    distanceKm: Number(selected.snapped.properties.dist),
  };
}

export function snapToAreaRoads(
  clicked: SeguimientoCoordinates,
  geography: SeguimientoOperationalGeography[],
): TareaCreacionSnapResult | null {
  return (
    geography
      .flatMap((area) => area.farms)
      .flatMap((farm) =>
        farm.roadNetwork ? [snapToRoadNetwork(clicked, farm.roadNetwork)] : [],
      )
      .filter((candidate): candidate is TareaCreacionSnapResult =>
        Boolean(candidate),
      )
      .sort((left, right) => left.distanceKm - right.distanceKm)[0] ?? null
  );
}

export function snapToFarmRoads(
  clicked: SeguimientoCoordinates,
  farm: Farm,
): TareaCreacionSnapResult | null {
  if (!farm.roadNetwork) return null;
  const snap = snapToRoadNetwork(clicked, farm.roadNetwork);
  return snap && snap.distanceKm <= MAX_FARM_ROAD_DISTANCE_KM ? snap : null;
}
