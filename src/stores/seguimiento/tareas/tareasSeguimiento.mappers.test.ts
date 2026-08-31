import { describe, expect, it } from "vitest";
import {
  mapSeguimientoTracker,
  mapTareaSeguimientoDetail,
  mapTareaSeguimientoListItem,
} from "./tareasSeguimiento.mappers";
import type {
  TareaRastreoDetalleDto,
  TareaRastreoListadoDto,
} from "./tareasSeguimiento.types";

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

const taskDetail = (
  overrides: Partial<TareaRastreoDetalleDto> = {},
): TareaRastreoDetalleDto => ({
  tarea: {
    id: "task-1",
    version: 1,
    area_id: "area-1",
    fecha_programada: "2026-08-29",
    indicaciones: "Visitar ubicación",
    tipo_tarea: "zona",
    ubicacion_id: null,
    prioridad_id: 1,
    tiempo_estimado_minutos: 60,
    orden_ruta: 1,
    punto_latitud: 8.4,
    punto_longitud: -82.5,
    linea_control_geojson: null,
    zonas_control_geojson: [],
    actualizado_en: "2026-08-29T12:00:00Z",
  },
  asignacion: {
    usuario_asignado_id: "user-1",
    source_id: 45,
    tracker_id: 12,
    tracker_label: "Tracker 12",
    acompanantes: [],
  },
  estado: {
    tarea_codigo: "pendiente",
    operativo_codigo: "sin_iniciar",
    operativo_nombre: "Sin iniciar",
  },
  tiempo: {
    cantidad_visitas: 0,
    segundos_totales: 0,
    visita_abierta: false,
  },
  visitas: [],
  ruta: null,
  permisos: {
    puede_editar: false,
    puede_editar_punto: false,
    puede_editar_geometria_control: false,
    puede_reordenar: false,
    geometria_bloqueada: false,
    puede_cancelar: false,
    puede_eliminar: false,
  },
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

  it("normaliza una ruta nula del RPC para que el detalle pueda renderizarse", () => {
    expect(mapTareaSeguimientoDetail(taskDetail()).route).toEqual({
      id: null,
      estado_calculo: null,
    });
  });
});
