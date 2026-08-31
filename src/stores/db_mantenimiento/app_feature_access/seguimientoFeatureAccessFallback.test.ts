import { describe, expect, it } from "vitest";
import { SEGUIMIENTO_FEATURES } from "@/seguimiento/shared/seguimiento.permissions";
import { applySeguimientoDevelopmentFallback } from "./seguimientoFeatureAccessFallback";

describe("applySeguimientoDevelopmentFallback", () => {
  it("grants only Seguimiento features to the documented development user when the matrix is absent", () => {
    const result = applySeguimientoDevelopmentFallback(
      ["module_dashboard"],
      "testjl@cadasa.com",
    );

    expect(result).toContain("module_dashboard");
    expect(result).toContain(SEGUIMIENTO_FEATURES.module);
    expect(result).toContain(SEGUIMIENTO_FEATURES.editTasks);
  });

  it("does not grant the fallback to a different user and completes a partial matrix for development", () => {
    expect(applySeguimientoDevelopmentFallback([], "other@cadasa.com")).toEqual(
      [],
    );
    expect(
      applySeguimientoDevelopmentFallback(
        [SEGUIMIENTO_FEATURES.viewTasks],
        "testjl@cadasa.com",
      ),
    ).toContain(SEGUIMIENTO_FEATURES.viewMap);
  });

  it("adds map access to any partial Seguimiento matrix", () => {
    const result = applySeguimientoDevelopmentFallback(
      [SEGUIMIENTO_FEATURES.module, SEGUIMIENTO_FEATURES.viewTasks],
      "supervisor@cadasa.com",
    );

    expect(result).toContain(SEGUIMIENTO_FEATURES.viewMap);
    expect(result).not.toContain(SEGUIMIENTO_FEATURES.editTasks);
  });
});
