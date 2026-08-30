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
    expect(profile.farmStrokeWeight).toBeGreaterThan(2);
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
});
