import type { SeguimientoCoordinates } from '../seguimiento.types';

export type SeguimientoMapLayerId =
  | 'base'
  | 'route'
  | 'tasks'
  | 'trackers'
  | 'zones'
  | 'questions'
  | 'dwellings'
  | 'controls';

export interface SeguimientoMapMarker {
  id: string;
  position: SeguimientoCoordinates;
  label?: string;
  kind: 'task' | 'tracker' | 'question';
}

export interface SeguimientoMapLayer {
  id: SeguimientoMapLayerId;
  visible: boolean;
}

export const DEFAULT_SEGUIMIENTO_MAP_LAYERS: SeguimientoMapLayer[] = [
  { id: 'base', visible: true },
  { id: 'route', visible: true },
  { id: 'tasks', visible: true },
  { id: 'trackers', visible: true },
  { id: 'zones', visible: true },
  { id: 'questions', visible: true },
  { id: 'dwellings', visible: true },
  { id: 'controls', visible: true },
];
