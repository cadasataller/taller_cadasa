import type { SeguimientoCoordinates, SeguimientoTaskType } from '@/seguimiento/shared/seguimiento.types';
import type { SeguimientoTracker, TrackerOperationalStatus } from '@/seguimiento/shared/trackers/tracker.types';
import { isSeguimientoTaskType, toSeguimientoTaskStatus } from './tareasSeguimiento.helpers';
import type { TareaSeguimientoDetail, TareaSeguimientoListItem } from './tareasSeguimiento.types';

type RemoteRecord = Record<string, unknown>;

const asRecord = (value: unknown): RemoteRecord | null =>
  typeof value === 'object' && value !== null ? value as RemoteRecord : null;

const asString = (value: unknown): string | null => typeof value === 'string' ? value : null;
const asNumber = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;

function mapCoordinates(value: unknown): SeguimientoCoordinates | null {
  if (typeof value === 'string') {
    const match = /^POINT\\s*\\(\\s*([-+\\d.]+)\\s+([-+\\d.]+)\\s*\\)$/i.exec(value);
    if (match) return { longitude: Number(match[1]), latitude: Number(match[2]) };
  }
  const point = asRecord(value);
  if (!point) return null;
  const coordinates = Array.isArray(point.coordinates) ? point.coordinates : null;
  if (coordinates?.length !== 2) return null;
  const [longitude, latitude] = coordinates;
  return typeof latitude === 'number' && typeof longitude === 'number'
    ? { latitude, longitude }
    : null;
}

function mapTaskType(row: RemoteRecord): SeguimientoTaskType {
  const type = row.tipo_tarea;
  if (isSeguimientoTaskType(type)) return type;
  const typeRecord = asRecord(type);
  const code = typeRecord?.codigo ?? typeRecord?.nombre;
  return isSeguimientoTaskType(code) ? code : 'finca';
}

export function mapTareaSeguimientoListItem(row: RemoteRecord): TareaSeguimientoListItem {
  const operationalStatus = asRecord(row.estado_operativo);
  const administrativeStatus = asRecord(row.estado_tarea);
  return {
    id: String(row.id),
    type: mapTaskType(row),
    status: toSeguimientoTaskStatus(
      operationalStatus?.codigo ?? administrativeStatus?.codigo ?? row.estado_operativo_codigo ?? row.estado_tarea_codigo,
    ),
    areaId: String(row.area_id ?? ''),
    assignedUserId: asString(row.usuario_asignado_id),
    locationId: asString(row.ubicacion_id),
    scheduledDate: asString(row.fecha_programada) ?? '',
    instructions: asString(row.indicaciones),
    priorityId: asNumber(row.prioridad_id),
    estimatedMinutes: asNumber(row.tiempo_estimado_minutos),
    trackerId: asNumber(row.tracker_id),
    trackerLabel: asString(row.tracker_label_snapshot),
    routePoint: mapCoordinates(row.punto_enrutado),
    routeOrder: asNumber(row.orden_ruta),
  };
}

export function mapTareaSeguimientoDetail(row: RemoteRecord): TareaSeguimientoDetail {
  const task = mapTareaSeguimientoListItem(row);
  const operationalStatus = asRecord(row.estado_operativo);
  const administrativeStatus = asRecord(row.estado_tarea);
  const line = asRecord(row.linea_control);
  const zone = asRecord(row.zona_control ?? row.limite);
  return {
    ...task,
    controlLine: line?.type === 'MultiLineString' && Array.isArray(line.coordinates)
      ? line as unknown as TareaSeguimientoDetail['controlLine'] : null,
    controlZone: zone?.type === 'MultiPolygon' && Array.isArray(zone.coordinates)
      ? zone as unknown as TareaSeguimientoDetail['controlZone'] : null,
    operationalStatusLabel: asString(
      operationalStatus?.nombre ?? administrativeStatus?.nombre ?? row.estado_operativo_nombre ?? row.estado_tarea_nombre,
    ),
    updatedAt: asString(row.actualizado_en),
  };
}

export function mapSeguimientoTracker(row: RemoteRecord): SeguimientoTracker {
  const movement = asString(row.movement_status);
  const status: TrackerOperationalStatus = row.tarea_actual_id
    ? 'at_task'
    : movement === 'stopped' ? 'stopped'
    : row.posicion ? 'available' : 'without_data';
  return {
    id: Number(row.tracker_id),
    sourceId: Number(row.source_id),
    label: asString(row.tracker_label_snapshot) ?? `Tracker ${String(row.tracker_id)}`,
    position: mapCoordinates(row.posicion),
    capturedAt: asString(row.capturada_en),
    status,
    currentTaskId: asString(row.tarea_actual_id),
  };
}
