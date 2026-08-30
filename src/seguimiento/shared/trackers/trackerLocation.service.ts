import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseRastreoTareas } from "@/lib/supabase";
import type { TrackerLocationBroadcast } from "./tracker.types";

type TrackerLocationHandler = (payload: TrackerLocationBroadcast) => void;

const trackerChannels = new Map<number, RealtimeChannel>();

function isValidSourceId(sourceId: number): boolean {
  return Number.isSafeInteger(sourceId) && sourceId > 0;
}

async function subscribeTrackerLocation(
  sourceId: number,
  onLocation: TrackerLocationHandler,
): Promise<void> {
  if (!isValidSourceId(sourceId)) throw new Error("sourceId inválido.");
  if (trackerChannels.has(sourceId)) return;

  await supabaseRastreoTareas.realtime.setAuth();
  const topic = `tracker:${sourceId}:ubicacion`;
  const channel = supabaseRastreoTareas
    .channel(topic, { config: { private: true } })
    .on("broadcast", { event: "ubicacion_tracker" }, ({ payload }) => {
      const location = payload as TrackerLocationBroadcast;
      if (location.source_id === sourceId) onLocation(location);
    });
  trackerChannels.set(sourceId, channel);

  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        resolve();
        return;
      }
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        trackerChannels.delete(sourceId);
        reject(
          error ?? new Error(`No se pudo suscribir al tracker ${sourceId}.`),
        );
      }
    });
  });
}

async function unsubscribeTrackerLocation(sourceId: number): Promise<void> {
  const channel = trackerChannels.get(sourceId);
  if (!channel) return;
  trackerChannels.delete(sourceId);
  await supabaseRastreoTareas.removeChannel(channel);
}

export const trackerLocationService = {
  async sync(
    sourceIds: readonly number[],
    onLocation: TrackerLocationHandler,
  ): Promise<void> {
    const desiredIds = new Set(sourceIds.filter(isValidSourceId));
    await Promise.all(
      [...trackerChannels.keys()]
        .filter((sourceId) => !desiredIds.has(sourceId))
        .map(unsubscribeTrackerLocation),
    );
    await Promise.all(
      [...desiredIds]
        .filter((sourceId) => !trackerChannels.has(sourceId))
        .map((sourceId) => subscribeTrackerLocation(sourceId, onLocation)),
    );
  },

  async clear(): Promise<void> {
    const channels = [...trackerChannels.values()];
    trackerChannels.clear();
    await Promise.all(
      channels.map((channel) => supabaseRastreoTareas.removeChannel(channel)),
    );
  },
};
