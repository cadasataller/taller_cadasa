import { describe, expect, it } from "vitest";
import { buildTrackerParkingStops } from "./trackerParkingStops";

describe("buildTrackerParkingStops", () => {
  it("agrupa puntos consecutivos de parking y usa el siguiente punto móvil como final", () => {
    const stops = buildTrackerParkingStops([
      {
        latitude: 8.4,
        longitude: -82.5,
        capturedAt: "2026-09-02 10:00:00",
        parking: true,
        speed: 0,
        heading: null,
        precisionMeters: null,
      },
      {
        latitude: 8.4,
        longitude: -82.5,
        capturedAt: "2026-09-02 10:17:00",
        parking: true,
        speed: 0,
        heading: null,
        precisionMeters: null,
      },
      {
        latitude: 8.401,
        longitude: -82.501,
        capturedAt: "2026-09-02 10:18:00",
        parking: false,
        speed: 12,
        heading: null,
        precisionMeters: null,
      },
    ]);

    expect(stops).toEqual([
      expect.objectContaining({
        startedAt: "2026-09-02 10:00:00",
        endedAt: "2026-09-02 10:18:00",
        durationMinutes: 18,
      }),
    ]);
  });

  it("omite períodos menores de cinco minutos", () => {
    expect(
      buildTrackerParkingStops([
        {
          latitude: 8.4,
          longitude: -82.5,
          capturedAt: "2026-09-02 10:00:00",
          parking: true,
          speed: 0,
          heading: null,
          precisionMeters: null,
        },
        {
          latitude: 8.401,
          longitude: -82.501,
          capturedAt: "2026-09-02 10:04:00",
          parking: false,
          speed: 12,
          heading: null,
          precisionMeters: null,
        },
      ]),
    ).toEqual([]);
  });

  it("cierra la parada cuando Navixy entrega un punto sin parking", () => {
    const stops = buildTrackerParkingStops([
      {
        latitude: 8.4,
        longitude: -82.5,
        capturedAt: "2026-09-02 10:00:00",
        parking: true,
        speed: 0,
        heading: null,
        precisionMeters: null,
      },
      {
        latitude: 8.401,
        longitude: -82.501,
        capturedAt: "2026-09-02 10:06:00",
        parking: false,
        speed: 12,
        heading: null,
        precisionMeters: null,
      },
    ]);

    expect(stops).toEqual([
      expect.objectContaining({
        startedAt: "2026-09-02 10:00:00",
        endedAt: "2026-09-02 10:06:00",
        durationMinutes: 6,
      }),
    ]);
  });

  it("usa el inicio del estado del broadcast y actualiza una parada activa", () => {
    const stops = buildTrackerParkingStops(
      [
        {
          latitude: 8.4,
          longitude: -82.5,
          capturedAt: "2026-09-02 10:10:00",
          parking: true,
          parkingStartedAt: "2026-09-02 10:00:00",
          isLiveParking: true,
          speed: 0,
          heading: null,
          precisionMeters: null,
        },
      ],
      "2026-09-02 10:18:00",
    );

    expect(stops).toEqual([
      expect.objectContaining({
        startedAt: "2026-09-02 10:00:00",
        endedAt: "2026-09-02 10:18:00",
        durationMinutes: 18,
      }),
    ]);
  });
});
