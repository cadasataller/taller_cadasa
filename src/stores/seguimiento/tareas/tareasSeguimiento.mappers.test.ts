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
  tipo_tarea_codigo: "zona",
  tipo_tarea_nombre: "Zona",
  ubicacion_id: null,
  usuario_asignado_id: "user-1",
  usuario_nombre: "Felix Arauz",
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
    ubicacion_visual: null,
    linea_control: null,
    zonas_control: [],
    zonas_permanencia: [],
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
    prioridad_nombre: "Normal",
    estado_tarea_codigo: "pendiente",
    estado_tarea_nombre: "Pendiente",
    estado_operativo_codigo: "sin_iniciar",
    estado_operativo_nombre: "Sin iniciar",
  },
  tiempo: {
    cantidad_visitas: 0,
    segundos_totales: 0,
    segundos_visita_abierta: 0,
    segundos_sin_datos: 0,
    visita_abierta: false,
    llegada_actual_en: null,
    primera_llegada_en: null,
    ultima_salida_en: null,
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
      typeName: "Zona",
      status: "activa",
      assignedUserName: "Felix Arauz",
      elapsedSeconds: 300,
      currentVisitSeconds: 300,
      hasOpenVisit: true,
      lastVisitedAt: "2026-08-29T12:00:00Z",
      routeOrder: 3,
      routePoint: { latitude: 8.98, longitude: -79.52 },
    });
  });

  it("maps duda_automatica to the read-only UI task type", () => {
    expect(
      mapTareaSeguimientoListItem(
        taskRow({
          tipo_tarea_codigo: "duda_automatica",
          tipo_tarea_nombre: "Duda automática",
        }),
      ).type,
    ).toBe("duda");
  });

  it("conserva el tipo recibido aunque el estado administrativo sea duda", () => {
    expect(
      mapTareaSeguimientoListItem(
        taskRow({ tipo_tarea_codigo: "finca", estado_tarea_codigo: "duda" }),
      ),
    ).toMatchObject({ type: "finca", status: "duda_detectada" });
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

  it("mapea ruta_planificada_id del RPC al identificador de ruta de la UI", () => {
    expect(
      mapTareaSeguimientoDetail(
        taskDetail({
          ruta: {
            ruta_planificada_id: "route-1",
            estado_calculo: "calculada",
          },
        }),
      ).route,
    ).toEqual({ id: "route-1", estado_calculo: "calculada" });
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

  it("preserva la ubicación y zona de permanencia de una duda automática", () => {
    const permanenceZone = {
      type: "MultiPolygon" as const,
      coordinates: [[[[-82.590026477, 8.383287997]]]],
    };

    expect(
      mapTareaSeguimientoDetail(
        taskDetail({
          tarea: {
            ...taskDetail().tarea,
            tipo_codigo: "duda_automatica",
            punto_enrutado: null,
            ubicacion_visual: {
              lat: 8.3833332061767,
              lng: -82.5899810791011,
              origen: "zona_permanencia",
              zona_id: "permanence-zone-1",
            },
            zonas_permanencia: [
              {
                id: "permanence-zone-1",
                geom: permanenceZone,
                origen: "automatica_tracker",
                tipo_zona: "duda_automatica",
                punto_representativo: {
                  lat: 8.3833332061767,
                  lng: -82.5899810791011,
                },
              },
            ],
          },
        }),
      ),
    ).toMatchObject({
      type: "duda",
      routePoint: null,
      visualLocation: {
        latitude: 8.3833332061767,
        longitude: -82.5899810791011,
      },
      permanenceZones: [permanenceZone],
    });
  });

  it("preserva observaciones y vincula las aclaraciones por su origen", () => {
    const observation = {
      id: "observation-1",
      tarea_id: "task-1",
      usuario_id: "user-1",
      usuario_nombre: "Pedro Hurtado",
      tipo_observacion_id: 1,
      tipo_observacion_codigo: "otro",
      tipo_observacion_nombre: "Otro",
      observacion_origen_id: null,
      descripcion: "Equipo detenido cerca de la entrada",
      estado_operativo_tarea_id: 2,
      estado_operativo_codigo: "en_ubicacion",
      estado_operativo_nombre: "En ubicación",
      latitud: 8.43334,
      longitud: -82.56367,
      precision_metros: 8,
      ubicacion_capturada_en: "2026-09-01T12:00:00Z",
      capturada_en: "2026-09-01T12:00:00Z",
      recibida_en: "2026-09-01T12:00:01Z",
      creado_en: "2026-09-01T12:00:01Z",
    };

    expect(
      mapTareaSeguimientoDetail(taskDetail({ observaciones: [observation] }))
        .observations,
    ).toEqual([observation]);
  });
});
