import { afterEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({
  supabaseRastreoTareas: { rpc },
}));

import { trackerCurrentLocationService } from "./trackerCurrentLocation.service";

describe("trackerCurrentLocationService", () => {
  afterEach(() => vi.clearAllMocks());

  it("carga la foto actual solo para los source_id cargados y válidos", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          source_id: 10303521,
          tracker_id: null,
          tracker_label: null,
          latitud: 8.3734821,
          longitud: -82.3909766,
          capturada_en: "2026-08-29T17:38:02+00:00",
          tarea_actual_id: null,
        },
        {
          source_id: 0,
          tracker_id: 4,
          tracker_label: "Inválido",
          latitud: 8,
          longitud: -82,
          capturada_en: null,
          tarea_actual_id: null,
        },
      ],
      error: null,
    });

    await expect(
      trackerCurrentLocationService.load([10303521, 10303521, -1]),
    ).resolves.toEqual([
      {
        sourceId: 10303521,
        trackerId: null,
        trackerLabel: null,
        latitude: 8.3734821,
        longitude: -82.3909766,
        capturedAt: "2026-08-29T17:38:02+00:00",
        currentTaskId: null,
      },
    ]);
    expect(rpc).toHaveBeenCalledWith(
      "obtener_ubicaciones_actuales_trackers_v2",
      { p_source_ids: [10303521] },
    );
  });

  it("no invoca el RPC sin trackers visibles", async () => {
    await expect(trackerCurrentLocationService.load([])).resolves.toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });
});
