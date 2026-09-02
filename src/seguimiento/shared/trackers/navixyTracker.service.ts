import { supabaseRastreoTareas } from "@/lib/supabase";
import { z } from "zod";
import type {
  SeguimientoTracker,
  SeguimientoTrackerHistoryPoint,
} from "./tracker.types";

const navixyTrackerListUrl = "https://api.us.navixy.com/v2/tracker/list";
const navixyTrackReadUrl = "https://api.us.navixy.com/v2/track/read";

interface NavixyKeyResponse {
  navixyHash: string;
}

interface NavixyTrackerSourceDto {
  id?: number | null;
}

interface NavixyTrackerDto {
  id?: number | null;
  label?: string | null;
  group_id?: number | null;
  source?: NavixyTrackerSourceDto | null;
}

interface NavixyTrackerListResponse {
  success: boolean;
  list?: NavixyTrackerDto[];
  status?: { description?: string };
}

export interface NavixyTrackerLoadResult {
  trackers: SeguimientoTracker[];
  observations: string[];
}

export interface NavixyTrackerLoadOptions {
  groupIds?: readonly number[];
}

let cachedResponse: NavixyTrackerListResponse | null = null;
let cachedHash: string | null = null;
let activeRequest: Promise<NavixyTrackerListResponse> | null = null;
const historicalTracksCache = new Map<
  string,
  SeguimientoTrackerHistoryPoint[]
>();
const activeHistoricalTrackRequests = new Map<
  string,
  Promise<SeguimientoTrackerHistoryPoint[]>
>();

const navixyTrackReadSchema = z.object({
  success: z.boolean(),
  limit_exceeded: z.boolean().optional(),
  list: z.array(
    z.object({
      lat: z.number().finite(),
      lng: z.number().finite(),
      get_time: z.string().min(1),
      parking: z.boolean().nullable().optional(),
      speed: z.number().finite().nullable().optional(),
      heading: z.number().finite().nullable().optional(),
      precision: z.number().finite().nullable().optional(),
    }),
  ),
  status: z.object({ description: z.string().optional() }).optional(),
});

function isValidIdentifier(value: number | null | undefined): value is number {
  return (
    value !== null &&
    value !== undefined &&
    Number.isInteger(value) &&
    value > 0
  );
}

function mapTrackerList(
  response: NavixyTrackerListResponse,
  options: NavixyTrackerLoadOptions,
): NavixyTrackerLoadResult {
  const allowedGroupIds = options.groupIds
    ? new Set(options.groupIds.filter(isValidIdentifier))
    : null;
  const observations: string[] = [];
  const trackers = (response.list ?? []).flatMap((tracker, index) => {
    if (allowedGroupIds && !allowedGroupIds.has(tracker.group_id ?? 0))
      return [];
    if (!isValidIdentifier(tracker.id)) {
      observations.push(
        `Tracker Navixy omitido en posición ${index}: id inválido.`,
      );
      return [];
    }
    if (!tracker.label?.trim()) {
      observations.push(
        `Tracker Navixy ${tracker.id} omitido: etiqueta no disponible.`,
      );
      return [];
    }
    if (!isValidIdentifier(tracker.source?.id)) {
      observations.push(
        `Tracker Navixy ${tracker.id} omitido: source.id inválido.`,
      );
      return [];
    }
    return [
      {
        id: tracker.id,
        sourceId: tracker.source.id,
        label: tracker.label.trim(),
        position: null,
        capturedAt: null,
        status: "without_data" as const,
        currentTaskId: null,
        movementStatus: null,
        movementStatusUpdatedAt: null,
        connectionStatus: null,
        ignition: null,
        ignitionUpdatedAt: null,
        speed: null,
      },
    ];
  });
  return { trackers, observations };
}

async function requestTrackerList(): Promise<NavixyTrackerListResponse> {
  const hash = await getCachedHash();

  const response = await fetch(navixyTrackerListUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash }),
  });
  if (!response.ok)
    throw new Error(
      `No se pudo cargar la lista de trackers de Navixy (${response.status}).`,
    );
  const payload = (await response.json()) as NavixyTrackerListResponse;
  if (!payload.success)
    throw new Error(
      payload.status?.description ??
        "Navixy no pudo devolver la lista de trackers.",
    );
  cachedResponse = payload;
  return payload;
}

async function getCachedHash(): Promise<string> {
  if (cachedHash) return cachedHash;
  const { data, error } =
    await supabaseRastreoTareas.functions.invoke<NavixyKeyResponse>(
      "navixy-key",
    );
  if (error) throw error;
  if (!data?.navixyHash)
    throw new Error("No se recibió la credencial temporal de Navixy.");
  cachedHash = data.navixyHash;
  return cachedHash;
}

function mapTrackPoint(
  point: z.infer<typeof navixyTrackReadSchema>["list"][number],
): SeguimientoTrackerHistoryPoint {
  return {
    latitude: point.lat,
    longitude: point.lng,
    capturedAt: point.get_time,
    // Navixy omite `parking` cuando el punto no pertenece a una detención.
    parking: point.parking ?? false,
    speed: point.speed ?? null,
    heading: point.heading ?? null,
    precisionMeters: point.precision ?? null,
  };
}

export const navixyTrackerService = {
  async load(
    options: NavixyTrackerLoadOptions = {},
  ): Promise<NavixyTrackerLoadResult> {
    if (cachedResponse) return mapTrackerList(cachedResponse, options);
    if (!activeRequest)
      activeRequest = requestTrackerList().finally(() => {
        activeRequest = null;
      });
    const response = await activeRequest;
    return mapTrackerList(response, options);
  },
  async loadTrackHistory(options: {
    cacheKey: string;
    trackerId: number;
    from: string;
    to: string;
  }): Promise<SeguimientoTrackerHistoryPoint[]> {
    const cachedTrack = historicalTracksCache.get(options.cacheKey);
    if (cachedTrack) return cachedTrack;
    const activeRequest = activeHistoricalTrackRequests.get(options.cacheKey);
    if (activeRequest) return activeRequest;

    const request = (async () => {
      const hash = await getCachedHash();
      const response = await fetch(navixyTrackReadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hash,
          tracker_id: options.trackerId,
          from: options.from,
          to: options.to,
          simplify: false,
          filter: false,
          include_gsm_lbs: false,
        }),
      });
      if (!response.ok)
        throw new Error(
          `No se pudo cargar el historial del tracker (${response.status}).`,
        );
      const parsed = navixyTrackReadSchema.safeParse(await response.json());
      if (!parsed.success)
        throw new Error("Navixy devolvió un historial de tracker inválido.");
      if (!parsed.data.success)
        throw new Error(
          parsed.data.status?.description ??
            "Navixy no pudo devolver el historial del tracker.",
        );
      const points = parsed.data.list.map(mapTrackPoint);
      historicalTracksCache.set(options.cacheKey, points);
      return points;
    })().finally(() => {
      activeHistoricalTrackRequests.delete(options.cacheKey);
    });
    activeHistoricalTrackRequests.set(options.cacheKey, request);
    return request;
  },
  appendTrackHistoryPoint(
    cacheKey: string,
    point: SeguimientoTrackerHistoryPoint,
  ): void {
    const cachedTrack = historicalTracksCache.get(cacheKey);
    if (!cachedTrack) return;
    const pointKey = `${point.capturedAt}:${point.latitude}:${point.longitude}`;
    if (
      cachedTrack.some(
        (cachedPoint) =>
          `${cachedPoint.capturedAt}:${cachedPoint.latitude}:${cachedPoint.longitude}` ===
          pointKey,
      )
    )
      return;
    historicalTracksCache.set(
      cacheKey,
      [...cachedTrack, point].sort((left, right) =>
        left.capturedAt.localeCompare(right.capturedAt),
      ),
    );
  },
};
