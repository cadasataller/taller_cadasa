import { afterEach, describe, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({
  supabaseRastreoTareas: { functions: { invoke } },
}));

import { navixyTrackerService } from "./navixyTracker.service";

describe("navixyTrackerService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("carga una vez, conserva el resultado y omite registros inválidos", async () => {
    invoke.mockResolvedValue({
      data: { navixyHash: "hash-temporal" },
      error: null,
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        list: [
          { id: 7, label: " Tractor 7 ", group_id: 91, source: { id: 12 } },
          { id: 8, label: "", group_id: 91, source: { id: 13 } },
          { id: 9, label: "No autorizado", group_id: 90, source: { id: 14 } },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      navixyTrackerService.load({ groupIds: [91] }),
      navixyTrackerService.load({ groupIds: [91] }),
    ]);
    const cached = await navixyTrackerService.load({ groupIds: [91] });

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith("navixy-key");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.us.navixy.com/v2/tracker/list",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ hash: "hash-temporal" }),
      }),
    );
    expect(first.trackers).toEqual([
      expect.objectContaining({ id: 7, sourceId: 12, label: "Tractor 7" }),
    ]);
    expect(second.observations).toHaveLength(1);
    expect(cached.trackers).toEqual(first.trackers);
  });
});
