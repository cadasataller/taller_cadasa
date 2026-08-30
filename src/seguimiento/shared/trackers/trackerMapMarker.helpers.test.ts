import { describe, expect, it } from "vitest";
import { getTrackerMarkerVisualState } from "./trackerMapMarker.helpers";

describe("getTrackerMarkerVisualState", () => {
  it.each([
    ["offline", "moving", "red"],
    ["signal_lost", "parked", "red"],
    ["idle", "moving", "gray"],
    ["active", "moving", "green"],
    ["active", "stopped", "orange"],
    ["active", "parked", "blue"],
  ] as const)("prioriza %s / %s como %s", (connection, movement, color) => {
    expect(
      getTrackerMarkerVisualState({
        connectionStatus: connection,
        movementStatus: movement,
        ignition: null,
      }).color,
    ).toBe(color);
  });

  it("expone el estado de ignición de forma independiente al color", () => {
    expect(
      getTrackerMarkerVisualState({
        connectionStatus: "active",
        movementStatus: "moving",
        ignition: true,
      }),
    ).toMatchObject({ color: "green", ignition: "on" });
  });
});
