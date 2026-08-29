import { supabaseRastreoTareas } from "@/lib/supabase";
import {
  mapSeguimientoTracker,
  mapTareaSeguimientoDetail,
  mapTareaSeguimientoListItem,
} from "./tareasSeguimiento.mappers";
import type {
  ListarTareasRastreoV2Params,
  TareaRastreoDetalleDto,
  TareaRastreoListadoDto,
  TareaSeguimientoDetail,
  TareasSeguimientoFilters,
  TareaSeguimientoWorkspaceData,
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
    const { data, error } = await supabaseRastreoTareas.rpc(
      "listar_tareas_rastreo_v2",
      toListParams(filters),
    );
    if (error) throw error;
    const rows = (data ?? []) as TareaRastreoListadoDto[];
    const trackersBySource = new Map<
      number,
      TareaSeguimientoWorkspaceData["trackers"][number]
    >();
    for (const row of rows) {
      const tracker = mapSeguimientoTracker(row);
      if (tracker) trackersBySource.set(tracker.sourceId, tracker);
    }
    return {
      tasks: rows.map(mapTareaSeguimientoListItem),
      trackers: [...trackersBySource.values()],
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
    return mapTareaSeguimientoDetail(data as TareaRastreoDetalleDto);
  },
};
