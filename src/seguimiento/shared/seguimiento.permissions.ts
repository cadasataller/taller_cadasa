export const SEGUIMIENTO_FEATURES = {
  module: 'module_seguimiento',
  viewTasks: 'ver_tareas_seguimiento',
  viewTaskDetail: 'ver_detalle_tarea_seguimiento',
  viewQuestions: 'ver_dudas_seguimiento',
  viewTaskHistory: 'ver_historial_tarea_seguimiento',
  viewTaskTracker: 'ver_tracker_tarea_seguimiento',
  viewMap: 'ver_mapa_seguimiento',
  createTasks: 'crear_tareas_seguimiento',
  assignTaskTracker: 'asignar_tracker_tarea_seguimiento',
  defineTaskGeometry: 'definir_geometria_tarea_seguimiento',
  editTasks: 'editar_tareas_seguimiento',
  editTaskAssignment: 'editar_asignacion_tarea_seguimiento',
  editTaskGeometry: 'editar_geometria_tarea_seguimiento',
  rescheduleTask: 'reprogramar_tarea_seguimiento',
  cancelTasks: 'cancelar_tareas_seguimiento',
  deleteTasks: 'eliminar_tareas_seguimiento',
  restoreTasks: 'restaurar_tareas_seguimiento',
  registerTaskObservations: 'registrar_observaciones_tarea_seguimiento',
} as const;

export type SeguimientoFeature = (typeof SEGUIMIENTO_FEATURES)[keyof typeof SEGUIMIENTO_FEATURES];

export const ALL_SEGUIMIENTO_FEATURES = Object.values(SEGUIMIENTO_FEATURES);

export const SEGUIMIENTO_TASK_ROUTE_FEATURES = [
  SEGUIMIENTO_FEATURES.module,
  SEGUIMIENTO_FEATURES.viewTasks,
] as const;

export const isSeguimientoFeature = (feature: string): feature is SeguimientoFeature =>
  ALL_SEGUIMIENTO_FEATURES.includes(feature as SeguimientoFeature);
