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
    tipo_codigo: "zona",
    ubicacion_id: null,
    tiempo_estimado_minutos: 60,
    orden_ruta: 1,
    punto_enrutado: { lat: 8.4, lng: -82.5 },
    linea_control: null,
    zonas_control: [],
    actualizado_en: "2026-08-29T12:00:00Z",
  },
  asignacion: {
    usuario_id: "user-1",
    usuario_nombre: "Felix Arauz",
    source_id: 45,
    tracker_id: 12,
    tracker_label: "Tracker 12",
    acompanantes: [],
  },
  estado: {
    prioridad_id: 1,
    estado_tarea_codigo: "pendiente",
    estado_operativo_codigo: "sin_iniciar",
    estado_operativo_nombre: "Sin iniciar",
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
      elapsedSeconds: 300,
      currentVisitSeconds: 300,
      hasOpenVisit: true,
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

  it("descarta un punto incompleto del RPC para que el detalle no falle al renderizar", () => {
    expect(
      mapTareaSeguimientoListItem(
        taskRow({ punto_latitud: undefined as unknown as number }),
      ).routePoint,
    ).toBeNull();
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

  it("mapea la geometría y asignación del payload real del detalle", () => {
    const zone = {
      type: "MultiPolygon" as const,
      coordinates: [[[[-82.558293339, 8.399123039]]]],
    };

    expect(
      mapTareaSeguimientoDetail(
        taskDetail({
          tarea: {
            ...taskDetail().tarea,
            zonas_control: [{ id: "zone-1", geom: zone }],
          },
        }),
      ),
    ).toMatchObject({
      type: "zona",
      assignedUserId: "user-1",
      assignedUserName: "Felix Arauz",
      priorityId: 1,
      routePoint: { latitude: 8.4, longitude: -82.5 },
      controlZones: [zone],
      operationalStatusLabel: "Sin iniciar",
    });
  });
});
