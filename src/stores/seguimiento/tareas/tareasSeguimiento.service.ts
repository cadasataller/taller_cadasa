import { supabase } from '@/lib/supabase';
import { mapSeguimientoTracker, mapTareaSeguimientoDetail, mapTareaSeguimientoListItem } from './tareasSeguimiento.mappers';
import type { TareaSeguimientoDetail, TareaSeguimientoListItem, TareasSeguimientoFilters, TareaSeguimientoWorkspaceData } from './tareasSeguimiento.types';

type RemoteRecord = Record<string, unknown>;

const TASK_COLUMNS = 'id, area_id, usuario_asignado_id, ubicacion_id, fecha_programada, indicaciones, prioridad_id, tiempo_estimado_minutos, tracker_id, tracker_label_snapshot, punto_enrutado, orden_ruta, actualizado_en, tipo_tarea:tipos_tarea(codigo), estado_operativo:estados_operativos_tarea(codigo,nombre), estado_tarea:estados_tarea(codigo,nombre)';
const TRACKER_COLUMNS = 'source_id, tracker_id, tracker_label_snapshot, posicion, capturada_en, tarea_actual_id, movement_status';

function applyTaskFilters(query: any, filters: TareasSeguimientoFilters): any {
  if (filters.scheduledDate) query = query.eq('fecha_programada', filters.scheduledDate);
  if (filters.areaId) query = query.eq('area_id', filters.areaId);
  if (filters.assignedUserId) query = query.eq('usuario_asignado_id', filters.assignedUserId);
  if (filters.trackerId !== null) query = query.eq('tracker_id', filters.trackerId);
  return query.is('eliminado_en', null).order('fecha_programada').order('orden_ruta');
}

export const tareasSeguimientoService = {
  async loadWorkspace(filters: TareasSeguimientoFilters): Promise<TareaSeguimientoWorkspaceData> {
    const tasksQuery = applyTaskFilters(supabase.from('tareas').select(TASK_COLUMNS), filters);
    const trackersQuery = supabase.from('ubicaciones_actuales_tracker').select(TRACKER_COLUMNS);
    const [{ data: taskRows, error: tasksError }, { data: trackerRows, error: trackersError }] = await Promise.all([
      tasksQuery, trackersQuery,
    ]);
    if (tasksError) throw tasksError;
    return {
      tasks: (taskRows as RemoteRecord[] ?? []).map(mapTareaSeguimientoListItem),
      trackers: trackersError ? [] : (trackerRows as RemoteRecord[] ?? []).map(mapSeguimientoTracker),
      trackerError: trackersError?.message ?? null,
    };
  },

  async loadDetail(taskId: string): Promise<TareaSeguimientoDetail> {
    const { data, error } = await supabase.from('tareas')
      .select(`${TASK_COLUMNS}, linea_control`)
      .eq('id', taskId)
      .is('eliminado_en', null)
      .single();
    if (error) throw error;
    return mapTareaSeguimientoDetail(data as RemoteRecord);
  },
};
