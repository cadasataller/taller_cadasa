import { supabaseRastreoTareas } from "@/lib/supabase";
import { navixyTrackerService } from "@/seguimiento/shared/trackers/navixyTracker.service";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import {
  mapSeguimientoTracker,
  mapRutaPlanificada,
  mapTareaSeguimientoDetail,
  mapTareaSeguimientoListItem,
} from "./tareasSeguimiento.mappers";
import {
  listarRutasPlanificadasSchema,
  tareaRastreoDetalleSchema,
} from "./tareasSeguimiento.schemas";
import type {
  ListarTareasRastreoV2Params,
  ListarRutasPlanificadasV2Params,
  TareaRastreoListadoDto,
  TareaSeguimientoDetail,
  TareasSeguimientoFilters,
  TareaSeguimientoWorkspaceData,
  SeguimientoTaskCatalog,
  SeguimientoOperationalGeography,
  SeguimientoMapConfiguration,
  SeguimientoLineGeometry,
  SeguimientoZoneGeometry,
  SeguimientoRutaPlanificada,
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

const canLoadPlannedRoutes = (filters: TareasSeguimientoFilters): boolean =>
  Boolean(filters.areaId) &&
  Boolean(filters.scheduledDate) &&
  Boolean(filters.assignedUserId || filters.sourceId !== null);

export const tareasSeguimientoService = {
  async loadWorkspaceContext(areaId: string | null): Promise<
    Omit<TareaSeguimientoWorkspaceData, "tasks" | "trackerLoadObservations"> & {
      trackerLoadObservations: string[];
    }
  > {
    const [catalogResponse, geographyResponse, trackerConfig] =
      await Promise.all([
        supabaseRastreoTareas.rpc("obtener_catalogo_personas_tarea_v2"),
        supabaseRastreoTareas.rpc("obtener_geografia_operativa_area_v2"),
        supabaseRastreoTareas.rpc("obtener_configuracion_inicial_trackers_v2"),
      ]);
    if (catalogResponse.error) throw catalogResponse.error;
    if (geographyResponse.error) throw geographyResponse.error;
    if (trackerConfig.error) throw trackerConfig.error;
    const navixyTrackers = await navixyTrackerService.load({
      groupIds: getAllowedTrackerGroupIds(
        trackerConfig.data as ConfiguracionInicialTrackersDto | null,
        areaId,
      ),
    });
    const catalog = mapCatalog(catalogResponse.data);
    const mapConfiguration = await loadMapConfiguration(
      areaId ?? catalog.areas[0]?.id ?? null,
    );
    return {
      trackers: navixyTrackers.trackers,
      trackerLoadObservations: navixyTrackers.observations,
      catalog,
      geography: mapGeography(geographyResponse.data),
      mapConfiguration,
    };
  },

  async loadTasks(
    filters: TareasSeguimientoFilters,
    trackers: SeguimientoTracker[],
  ): Promise<Pick<TareaSeguimientoWorkspaceData, "tasks" | "trackers">> {
    const { data, error } = await supabaseRastreoTareas.rpc(
      "listar_tareas_rastreo_v2",
      toListParams(filters),
    );
    if (error) throw error;
    const rows = (data ?? []) as TareaRastreoListadoDto[];
    const trackersBySource = new Map<number, SeguimientoTracker>(
      trackers.map((tracker) => [tracker.sourceId, tracker]),
    );
    for (const row of rows) {
      const tracker = mapSeguimientoTracker(row);
      if (tracker && trackersBySource.has(tracker.sourceId))
        trackersBySource.set(tracker.sourceId, tracker);
    }
    return {
      tasks: rows.map(mapTareaSeguimientoListItem),
      trackers: [...trackersBySource.values()],
    };
  },

  async loadPlannedRoutes(
    params: ListarRutasPlanificadasV2Params,
  ): Promise<SeguimientoRutaPlanificada[]> {
    const { data, error } = await supabaseRastreoTareas.rpc(
      "listar_rutas_planificadas_v2",
      params,
    );
    if (error) throw error;
    return listarRutasPlanificadasSchema
      .parse(data)
      .rutas.map(mapRutaPlanificada);
  },

  async loadWorkspace(
    filters: TareasSeguimientoFilters,
  ): Promise<TareaSeguimientoWorkspaceData> {
    const context = await this.loadWorkspaceContext(filters.areaId);
    const taskData = await this.loadTasks(filters, context.trackers);
    return {
      ...context,
      ...taskData,
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
