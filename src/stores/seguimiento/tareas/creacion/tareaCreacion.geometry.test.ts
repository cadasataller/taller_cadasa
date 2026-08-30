import { describe, expect, it } from "vitest";
import {
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
});
