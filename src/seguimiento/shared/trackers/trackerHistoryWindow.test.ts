import { describe, expect, it } from "vitest";
import {
  createTrackerHistoryWindow,
  formatPanamaDateTime,
  isInTrackerHistoryWindow,
} from "./trackerHistoryWindow";

describe("trackerHistoryWindow", () => {
  it("usa de 06:00 a 18:00 para un día ya terminado", () => {
    const window = createTrackerHistoryWindow(
      7,
      "2026-09-01",
      new Date("2026-09-02T16:00:00Z"),
    );

    expect(window).toEqual({
      cacheKey: "7:2026-09-01:06:00:00:18:00:00",
      date: "2026-09-01",
      from: "2026-09-01 06:00:00",
      to: "2026-09-01 18:00:00",
    });
  });

  it("limita el fin del día actual a la hora de Panamá", () => {
    const window = createTrackerHistoryWindow(
      7,
      "2026-09-02",
      new Date("2026-09-02T16:45:30Z"),
    );

    expect(formatPanamaDateTime(new Date("2026-09-02T16:45:30Z"))).toBe(
      "2026-09-02 11:45:30",
    );
    expect(window?.to).toBe("2026-09-02 11:45:30");
    expect(isInTrackerHistoryWindow("2026-09-02 11:45:30", window!)).toBe(true);
    expect(isInTrackerHistoryWindow("2026-09-02 18:00:01", window!)).toBe(
      false,
    );
  });

  it("no crea una consulta antes de las 06:00 ni para fechas futuras", () => {
    expect(
      createTrackerHistoryWindow(
        7,
        "2026-09-02",
        new Date("2026-09-02T10:30:00Z"),
      ),
    ).toBeNull();
    expect(
      createTrackerHistoryWindow(
        7,
        "2026-09-03",
        new Date("2026-09-02T16:00:00Z"),
      ),
    ).toBeNull();
  });
});
