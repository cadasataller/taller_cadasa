import { afterEach, describe, expect, it, vi } from "vitest";

const setAuth = vi.hoisted(() => vi.fn());
const channel = vi.hoisted(() => vi.fn());
const removeChannel = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({
  supabaseRastreoTareas: {
    realtime: { setAuth },
    channel,
    removeChannel,
  },
}));

import { trackerLocationService } from "./trackerLocation.service";

describe("trackerLocationService", () => {
  afterEach(async () => {
    await trackerLocationService.clear();
    vi.clearAllMocks();
  });

  it("abre un canal privado por source_id y sincroniza las suscripciones", async () => {
    let broadcastHandler: ((event: { payload: unknown }) => void) | null = null;
    const realtimeChannel = {
      on: vi.fn(
        (
          _type: string,
          _filter: { event: string },
          handler: typeof broadcastHandler,
        ) => {
          broadcastHandler = handler;
          return realtimeChannel;
        },
      ),
      subscribe: vi.fn((callback: (status: string) => void) => {
        callback("SUBSCRIBED");
        return realtimeChannel;
      }),
    };
    setAuth.mockResolvedValue(undefined);
    channel.mockReturnValue(realtimeChannel);
    removeChannel.mockResolvedValue("ok");
    const onLocation = vi.fn();

    await trackerLocationService.sync([12, 12, -1], onLocation);
    broadcastHandler?.({
      payload: {
        tipo: "ubicacion_tracker_actualizada",
        source_id: 12,
        latitud: 8.981,
        longitud: -79.521,
        capturada_en: "2026-07-31T19:30:00Z",
        recibida_en: "2026-07-31T19:30:02Z",
        estado_geocerca_tarea: "fuera",
        estado_geocerca_taller: "fuera",
        ultimo_evento_clave: "tracker_actualizado",
        actualizado_en: "2026-07-31T19:30:02Z",
      },
    });
    await trackerLocationService.sync([], onLocation);

    expect(setAuth).toHaveBeenCalledTimes(1);
    expect(channel).toHaveBeenCalledWith("tracker:12:ubicacion", {
      config: { private: true },
    });
    expect(realtimeChannel.on).toHaveBeenCalledWith(
      "broadcast",
      { event: "ubicacion_tracker" },
      expect.any(Function),
    );
    expect(onLocation).toHaveBeenCalledWith(
      expect.objectContaining({ source_id: 12, latitud: 8.981 }),
    );
    expect(removeChannel).toHaveBeenCalledWith(realtimeChannel);
  });
});
