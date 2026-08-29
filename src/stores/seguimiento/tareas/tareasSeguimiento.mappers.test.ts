import { describe, expect, it } from "vitest";
import {
  mapSeguimientoTracker,
  mapTareaSeguimientoListItem,
} from "./tareasSeguimiento.mappers";
import type { TareaRastreoListadoDto } from "./tareasSeguimiento.types";

const taskRow = (
  overrides: Partial<TareaRastreoListadoDto> = {},
): TareaRastreoListadoDto => ({
  id: "task-1",
  version: 1,
  area_id: "area-1",
  fecha_programada: "2026-08-29",
  indicaciones: "Visitar ubicación",
  tipo_tarea: "zona",
  ubicacion_id: null,
  usuario_asignado_id: "user-1",
  source_id: 45,
  tracker_id: 12,
  tracker_label: "Tracker 12",
  prioridad_id: 2,
  estado_tarea_codigo: "pendiente",
  estado_operativo_codigo: "en_ubicacion",
  tiempo_estimado_minutos: 60,
  cantidad_visitas: 1,
  segundos_totales: 300,
  segundos_visita_actual: 300,
  visita_abierta: true,
  entrada_actual_en: "2026-08-29T12:00:00Z",
  primera_entrada_en: "2026-08-29T12:00:00Z",
  ultima_salida_en: null,
  orden_ruta: 3,
  punto_latitud: 8.98,
  punto_longitud: -79.52,
  cancelada_en: null,
  eliminado_en: null,
  actualizado_en: "2026-08-29T12:00:00Z",
  ...overrides,
});

describe("tareasSeguimiento mappers", () => {
  it("maps the documented listing DTO without reading PostGIS values directly", () => {
    expect(mapTareaSeguimientoListItem(taskRow())).toMatchObject({
      id: "task-1",
      type: "zona",
      status: "activa",
      routeOrder: 3,
      routePoint: { latitude: 8.98, longitude: -79.52 },
    });
  });

  it("maps duda_automatica to the read-only UI task type", () => {
    expect(
      mapTareaSeguimientoListItem(taskRow({ tipo_tarea: "duda_automatica" }))
        .type,
    ).toBe("duda");
  });

  it("derives one visible tracker from the listing DTO", () => {
    expect(mapSeguimientoTracker(taskRow())).toMatchObject({
      id: 12,
      sourceId: 45,
      status: "at_task",
      currentTaskId: "task-1",
      position: null,
    });
  });
});
