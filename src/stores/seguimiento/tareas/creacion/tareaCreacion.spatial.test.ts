import { describe, expect, it } from "vitest";
import { resolveDominantFarm, snapToFarmRoads } from "./tareaCreacion.spatial";
import type { SeguimientoOperationalGeography } from "../tareasSeguimiento.types";

const zone = (west: number, east: number) => ({
  type: "MultiPolygon" as const,
  coordinates: [
    [
      [
        [west, 8],
        [east, 8],
        [east, 8.01],
        [west, 8.01],
        [west, 8],
      ],
    ],
  ],
});

const farms: SeguimientoOperationalGeography["farms"] = [
  {
    id: "farm-a",
    name: "Finca A",
    boundary: zone(-82.51, -82.5),
    roadNetwork: {
      type: "MultiLineString",
      coordinates: [
        [
          [-82.51, 8.005],
          [-82.5, 8.005],
        ],
      ],
    },
  },
  {
    id: "farm-b",
    name: "Finca B",
    boundary: zone(-82.5, -82.49),
    roadNetwork: {
      type: "MultiLineString",
      coordinates: [
        [
          [-82.5, 8.005],
          [-82.49, 8.005],
        ],
      ],
    },
  },
];

describe("decisión espacial de creación", () => {
  it("elige la finca con mayor porcentaje de área total y bloquea al contener 100%", () => {
    const dominant = resolveDominantFarm([zone(-82.509, -82.501)], farms);

    expect(dominant?.farm.id).toBe("farm-a");
    expect(dominant?.coverage).toBeCloseTo(1, 5);
    expect(dominant?.isFullyContained).toBe(true);
  });

  it("descarta un acceso vial de finca que esté a más de 100 metros", () => {
    expect(
      snapToFarmRoads({ latitude: 8.02, longitude: -82.505 }, farms[0]),
    ).toBeNull();
    expect(
      snapToFarmRoads({ latitude: 8.0051, longitude: -82.505 }, farms[0]),
    ).not.toBeNull();
  });
});
