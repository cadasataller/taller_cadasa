import { describe, expect, it } from "vitest";
import { resolveTrackerEquipment } from "./trackerEquipment.strategy";

describe("resolveTrackerEquipment", () => {
  it("clasifica los equipos configurados por source_id", () => {
    expect(
      resolveTrackerEquipment({ sourceId: 10303553, label: "TRACTOR 84-95" }),
    ).toBe("tractor");
    expect(
      resolveTrackerEquipment({
        sourceId: 10319800,
        label: "TopFlyTech SolarGuardX 100",
      }),
    ).toBe("fuel_truck");
  });

  it("conserva maquinaria como alternativa genérica", () => {
    expect(
      resolveTrackerEquipment({ sourceId: 99, label: "Sin clasificar" }),
    ).toBe("machinery");
  });
});
