import { describe, expect, it } from 'vitest';
import { mapSeguimientoTracker, mapTareaSeguimientoListItem } from './tareasSeguimiento.mappers';

describe('tareasSeguimiento mappers', () => {
  it('maps joined catalogs and a PostGIS point to a readable task item', () => {
    const task = mapTareaSeguimientoListItem({
      id: 'task-1',
      area_id: 'area-1',
      fecha_programada: '2026-08-29',
      tipo_tarea: { codigo: 'zona' },
      estado_operativo: { codigo: 'activa' },
      punto_enrutado: 'POINT(-79.52 8.98)',
      orden_ruta: 3,
    });

    expect(task).toMatchObject({
      id: 'task-1', type: 'zona', status: 'activa', routeOrder: 3,
      routePoint: { latitude: 8.98, longitude: -79.52 },
    });
  });

  it('keeps a tracker failure-tolerant when no current geographic position exists', () => {
    expect(mapSeguimientoTracker({ source_id: 45, tracker_id: 12 })).toMatchObject({
      id: 12, sourceId: 45, status: 'without_data', position: null,
    });
  });
});
