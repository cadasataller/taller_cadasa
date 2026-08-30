import { supabaseRastreoTareas } from "@/lib/supabase";
import type { SeguimientoTracker } from "./tracker.types";

const navixyTrackerListUrl = "https://api.us.navixy.com/v2/tracker/list";

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

function isValidIdentifier(value: number | null | undefined): value is number {
  return Number.isInteger(value) && value > 0;
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
        status: "without_data",
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
  if (!cachedHash) {
    const { data, error } =
      await supabaseRastreoTareas.functions.invoke<NavixyKeyResponse>(
        "navixy-key",
      );
    if (error) throw error;
    if (!data?.navixyHash)
      throw new Error("No se recibió la credencial temporal de Navixy.");
    cachedHash = data.navixyHash;
  }

  const response = await fetch(navixyTrackerListUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash: cachedHash }),
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
};
