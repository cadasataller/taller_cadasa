import { describe, expect, it } from "vitest";
import {
  hasControlZoneSelfIntersections,
  isValidControlLine,
  isValidControlZone,
  isValidRoutePoint,
} from "./tareaCreacion.geometry";

describe("geometría del borrador de creación", () => {
  it("acepta un punto de ruta dentro de los límites geográficos", () => {
    expect(isValidRoutePoint({ latitude: 8.43008, longitude: -82.50821 })).toBe(
      true,
    );
    expect(isValidRoutePoint({ latitude: 91, longitude: -82.5 })).toBe(false);
  });

  it("exige una línea y un polígono GeoJSON completos", () => {
    expect(
      isValidControlLine({
        type: "MultiLineString",
        coordinates: [
          [
            [-82.5, 8.4],
            [-82.6, 8.5],
          ],
        ],
      }),
    ).toBe(true);
    expect(
      isValidControlZone({
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-82.5, 8.4],
              [-82.6, 8.5],
              [-82.7, 8.4],
              [-82.5, 8.4],
            ],
          ],
        ],
      }),
    ).toBe(true);
  });

  it("rechaza una zona cuyos segmentos se cruzan entre sí", () => {
    const selfIntersectingZone = {
      type: "MultiPolygon" as const,
      coordinates: [
        [
          [
            [-82.55, 8.39],
            [-82.54, 8.4],
            [-82.55, 8.4],
            [-82.54, 8.39],
            [-82.55, 8.39],
          ],
        ],
      ],
    };

    expect(hasControlZoneSelfIntersections(selfIntersectingZone)).toBe(true);
    expect(isValidControlZone(selfIntersectingZone)).toBe(false);
  });
});
