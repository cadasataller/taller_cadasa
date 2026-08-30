import { describe, expect, it } from "vitest";
import { resolveTrackerMarkerDisplayMode } from "./trackerMarkerDisplayMode.strategy";

describe("resolveTrackerMarkerDisplayMode", () => {
  it.each([
    [10, "hidden"],
    [11, "dot"],
    [13.9, "dot"],
    [14, "icon"],
    [16.9, "icon"],
    [17, "detailed"],
  ] as const)("resuelve zoom %s como %s", (zoom, mode) => {
    expect(resolveTrackerMarkerDisplayMode(zoom)).toBe(mode);
  });
});
