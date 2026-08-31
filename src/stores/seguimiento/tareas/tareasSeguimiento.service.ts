import { supabaseRastreoTareas } from "@/lib/supabase";
import { navixyTrackerService } from "@/seguimiento/shared/trackers/navixyTracker.service";
import {
  mapSeguimientoTracker,
  mapTareaSeguimientoDetail,
  mapTareaSeguimientoListItem,
} from "./tareasSeguimiento.mappers";
import { tareaRastreoDetalleSchema } from "./tareasSeguimiento.schemas";
import type {
  ListarTareasRastreoV2Params,
  TareaRastreoListadoDto,
  TareaSeguimientoDetail,
  TareasSeguimientoFilters,
  TareaSeguimientoWorkspaceData,
  SeguimientoTaskCatalog,
  SeguimientoOperationalGeography,
  SeguimientoMapConfiguration,
  SeguimientoLineGeometry,
  SeguimientoZoneGeometry,
  ConfiguracionInicialTrackersDto,
} from "./tareasSeguimiento.types";

const operationalStatusByUiStatus = {
  pendiente: "sin_iniciar",
  en_ruta: "en_ruta",
  activa: "en_ubicacion",
  visitada: "visitada",
} as const;

const toListParams = (
  filters: TareasSeguimientoFilters,
): ListarTareasRastreoV2Params => ({
  p_area_id: filters.areaId,
  p_fecha: filters.scheduledDate,
  p_usuario_asignado_id: filters.assignedUserId,
  p_source_id: filters.sourceId,
  p_estado_operativo_codigo:
    filters.statuses.length === 1
      ? (operationalStatusByUiStatus[
          filters.statuses[0] as keyof typeof operationalStatusByUiStatus
        ] ?? null)
      : null,
  p_incluir_canceladas: filters.statuses.includes("cancelada"),
});

export const tareasSeguimientoService = {
  async loadWorkspace(
    filters: TareasSeguimientoFilters,
  ): Promise<TareaSeguimientoWorkspaceData> {
    const [listResponse, catalogResponse, geographyResponse, trackerConfig] =
      await Promise.all([
        supabaseRastreoTareas.rpc(
          "listar_tareas_rastreo_v2",
          toListParams(filters),
        ),
        supabaseRastreoTareas.rpc("obtener_catalogo_personas_tarea_v2"),
        supabaseRastreoTareas.rpc("obtener_geografia_operativa_area_v2"),
        supabaseRastreoTareas.rpc("obtener_configuracion_inicial_trackers_v2"),
      ]);
    const { data, error } = listResponse;
    if (error) throw error;
    if (catalogResponse.error) throw catalogResponse.error;
    if (geographyResponse.error) throw geographyResponse.error;
    if (trackerConfig.error) throw trackerConfig.error;
    const navixyTrackers = await navixyTrackerService.load({
      groupIds: getAllowedTrackerGroupIds(
        trackerConfig.data as ConfiguracionInicialTrackersDto | null,
        filters.areaId,
      ),
    });
    const rows = (data ?? []) as TareaRastreoListadoDto[];
    const trackersBySource = new Map<
      number,
      TareaSeguimientoWorkspaceData["trackers"][number]
    >(navixyTrackers.trackers.map((tracker) => [tracker.sourceId, tracker]));
    for (const row of rows) {
      const tracker = mapSeguimientoTracker(row);
      if (tracker && trackersBySource.has(tracker.sourceId))
        trackersBySource.set(tracker.sourceId, tracker);
    }
    const catalog = mapCatalog(catalogResponse.data);
    const geography = mapGeography(geographyResponse.data);
    const areaId = filters.areaId ?? catalog.areas[0]?.id ?? null;
    const mapConfiguration = await loadMapConfiguration(areaId);
    return {
      tasks: rows.map(mapTareaSeguimientoListItem),
      trackers: [...trackersBySource.values()],
      trackerLoadObservations: navixyTrackers.observations,
      catalog,
      geography,
      mapConfiguration,
    };
  },

  async loadDetail(taskId: string): Promise<TareaSeguimientoDetail> {
    const { data, error } = await supabaseRastreoTareas.rpc(
      "obtener_tarea_detalle_v2",
      {
        p_tarea_id: taskId,
      },
    );
    if (error) throw error;
    return mapTareaSeguimientoDetail(tareaRastreoDetalleSchema.parse(data));
  },
};

function mapCatalog(data: unknown): SeguimientoTaskCatalog {
  const areas =
    (
      data as {
        areas?: Array<{
          area_id: string;
          area_nombre: string;
          trabajadores?: Array<{ usuario_id: string; nombre: string }>;
          acompanantes?: Array<{ nombre: string }>;
        }>;
      } | null
    )?.areas ?? [];
  return {
    areas: areas.map((area) => ({
      id: area.area_id,
      label: area.area_nombre,
      workers: (area.trabajadores ?? []).map((worker) => ({
        id: worker.usuario_id,
        label: worker.nombre,
      })),
      companions: (area.acompanantes ?? [])
        .map((companion) => companion.nombre.trim())
        .filter(Boolean),
    })),
  };
}

function getAllowedTrackerGroupIds(
  data: ConfiguracionInicialTrackersDto | null,
  areaId: string | null,
): number[] {
  return (data?.areas ?? [])
    .filter((area) => !areaId || area.area_id === areaId)
    .flatMap((area) => area.grupos_tracker)
    .map((group) => group.group_id)
    .filter((groupId) => Number.isSafeInteger(groupId) && groupId > 0);
}

function mapGeography(data: unknown): SeguimientoOperationalGeography[] {
  const areas =
    (
      data as {
        areas?: Array<{
          area_id: string;
          fincas?: Array<{
            ubicacion_id: string;
            nombre: string;
            limite: SeguimientoZoneGeometry | null;
            red_vial: SeguimientoLineGeometry | null;
          }>;
          resguardos?: Array<{
            resguardo_id: string;
            nombre: string;
            limite: SeguimientoZoneGeometry | null;
            punto_enrutado: { lat: number; lng: number } | null;
          }>;
        }>;
      } | null
    )?.areas ?? [];
  return areas.map((area) => ({
    areaId: area.area_id,
    farms: (area.fincas ?? []).map((farm) => ({
      id: farm.ubicacion_id,
      name: farm.nombre,
      boundary: farm.limite,
      roadNetwork: farm.red_vial,
    })),
    shelters: (area.resguardos ?? []).map((shelter) => ({
      id: shelter.resguardo_id,
      name: shelter.nombre,
      boundary: shelter.limite,
      routePoint: shelter.punto_enrutado
        ? {
            latitude: shelter.punto_enrutado.lat,
            longitude: shelter.punto_enrutado.lng,
          }
        : null,
    })),
  }));
}

async function loadMapConfiguration(
  areaId: string | null,
): Promise<SeguimientoMapConfiguration | null> {
  if (!areaId) return null;
  const { data: authData } = await supabaseRastreoTareas.auth.getUser();
  if (!authData.user) return null;
  const { data, error } = await supabaseRastreoTareas.rpc(
    "resolver_configuracion_mapa_v2",
    { p_area_id: areaId, p_usuario_id: authData.user.id },
  );
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row && Number.isFinite(row.latitud) && Number.isFinite(row.longitud)
    ? {
        latitude: row.latitud,
        longitude: row.longitud,
        zoom: Number(row.zoom) || 12,
      }
    : null;
}
