import { describe, expect, it } from "vitest";
import {
  resolveSeguimientoMapZoomProfile,
  seguimientoMapZoomPolicy,
} from "./mapZoomHierarchy.strategy";

describe("resolveSeguimientoMapZoomProfile", () => {
  it("reduce el mapa lejano al contexto esencial", () => {
    const profile = resolveSeguimientoMapZoomProfile(
      seguimientoMapZoomPolicy.mediumZoom - 1,
    );

    expect(profile.level).toBe("far");
    expect(profile.farmLabelVisible).toBe(false);
    expect(profile.roadsVisible).toBe(false);
    expect(profile.sheltersVisible).toBe(false);
    expect(profile.zonesVisible).toBe(false);
    expect(profile.tasksVisible).toBe(false);
  });

  it("muestra contexto tenue en zoom medio", () => {
    const profile = resolveSeguimientoMapZoomProfile(
      seguimientoMapZoomPolicy.mediumZoom,
    );

    expect(profile.level).toBe("medium");
    expect(profile.farmLabelVisible).toBe(true);
    expect(profile.roadsVisible).toBe(true);
    expect(profile.roadWeight).toBeLessThan(profile.roadHaloWeight);
    expect(profile.zoneFillOpacity).toBe(0);
  });

  it("reserva el detalle completo para zoom cercano", () => {
    const profile = resolveSeguimientoMapZoomProfile(
      seguimientoMapZoomPolicy.nearZoom,
    );

    expect(profile.level).toBe("near");
    expect(profile.sheltersVisible).toBe(true);
    expect(profile.zoneFillOpacity).toBeGreaterThan(0);
    expect(profile.farmFillOpacity).toBe(0.16);
  });

  it("retrasa los resguardos hasta el extremo superior del zoom medio", () => {
    expect(
      resolveSeguimientoMapZoomProfile(seguimientoMapZoomPolicy.shelterZoom - 1)
        .sheltersVisible,
    ).toBe(false);
    expect(
      resolveSeguimientoMapZoomProfile(seguimientoMapZoomPolicy.shelterZoom)
        .sheltersVisible,
    ).toBe(true);
  });

  it.each([
    [10, 0.32],
    [11, 0.32],
    [12, 0.28],
    [13, 0.24],
    [14, 0.2],
    [15, 0.16],
    [16, 0.12],
    [17, 0.08],
  ])("ajusta el relleno de finca al zoom %i", (zoom, fillOpacity) => {
    expect(resolveSeguimientoMapZoomProfile(zoom).farmFillOpacity).toBe(
      fillOpacity,
    );
  });
});
