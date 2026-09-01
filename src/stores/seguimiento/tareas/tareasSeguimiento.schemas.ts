import { z } from "zod";
import type { TareaRastreoDetalleDto } from "./tareasSeguimiento.types";
import type { RutaPlanificadaDto } from "./tareasSeguimiento.types";

const lineGeometrySchema = z.object({
  type: z.literal("MultiLineString"),
  coordinates: z.array(z.array(z.array(z.number().finite()))),
});

const zoneGeometrySchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(z.array(z.array(z.number().finite())))),
});

const taskCoordinateSchema = z.object({
  lat: z.number().finite(),
  lng: z.number().finite(),
});

export const tareasRastreoListadoSchema = z.array(
  z.object({
    id: z.string(),
    version: z.number().int(),
    area_id: z.string(),
    fecha_programada: z.string(),
    indicaciones: z.string().nullable(),
    tipo_tarea_codigo: z.enum(["finca", "zona", "duda_automatica"]),
    tipo_tarea_nombre: z.string(),
    ubicacion_id: z.string().nullable(),
    usuario_asignado_id: z.string().nullable(),
    usuario_nombre: z.string().nullable(),
    source_id: z.number().nullable(),
    tracker_id: z.number().nullable(),
    tracker_label: z.string().nullable(),
    prioridad_id: z.number().nullable(),
    estado_tarea_codigo: z.string(),
    estado_operativo_codigo: z
      .enum(["sin_iniciar", "en_ruta", "en_ubicacion", "visitada"])
      .nullable(),
    tiempo_estimado_minutos: z.number().nullable(),
    cantidad_visitas: z.number(),
    segundos_totales: z.number(),
    segundos_visita_actual: z.number(),
    visita_abierta: z.boolean(),
    entrada_actual_en: z.string().nullable(),
    primera_entrada_en: z.string().nullable(),
    ultima_salida_en: z.string().nullable(),
    orden_ruta: z.number().int().nullable(),
    punto_latitud: z.number().finite().nullable(),
    punto_longitud: z.number().finite().nullable(),
    cancelada_en: z.string().nullable(),
    eliminado_en: z.string().nullable(),
    actualizado_en: z.string(),
  }),
);

export const tareaRastreoDetalleSchema = z.object({
  tarea: z.object({
    id: z.string(),
    version: z.number().int(),
    area_id: z.string(),
    fecha_programada: z.string(),
    indicaciones: z.string().nullable(),
    tipo_codigo: z.enum(["finca", "zona", "duda_automatica"]),
    ubicacion_id: z.string().nullable(),
    tiempo_estimado_minutos: z.number().nullable(),
    orden_ruta: z.number().int().nullable(),
    punto_enrutado: taskCoordinateSchema.nullable(),
    ubicacion_visual: taskCoordinateSchema
      .extend({
        origen: z.string(),
        zona_id: z.string().nullable(),
      })
      .nullable()
      .default(null),
    linea_control: lineGeometrySchema.nullable(),
    zonas_control: z.array(
      z.object({
        id: z.string(),
        geom: zoneGeometrySchema,
      }),
    ),
    zonas_permanencia: z
      .array(
        z.object({
          id: z.string(),
          geom: zoneGeometrySchema,
          origen: z.string(),
          tipo_zona: z.string(),
          punto_representativo: taskCoordinateSchema.nullable(),
        }),
      )
      .default([]),
    actualizado_en: z.string(),
  }),
  asignacion: z.object({
    usuario_id: z.string().nullable(),
    usuario_nombre: z.string().nullable(),
    source_id: z.number().nullable(),
    tracker_id: z.number().nullable(),
    tracker_label: z.string().nullable(),
    acompanantes: z.array(z.object({ id: z.string(), nombre: z.string() })),
  }),
  estado: z.object({
    prioridad_id: z.number().nullable(),
    prioridad_nombre: z.string().nullable(),
    estado_tarea_codigo: z.string(),
    estado_tarea_nombre: z.string().nullable(),
    estado_operativo_codigo: z
      .enum(["sin_iniciar", "en_ruta", "en_ubicacion", "visitada"])
      .nullable(),
    estado_operativo_nombre: z.string().nullable(),
  }),
  tiempo: z.object({
    cantidad_visitas: z.number(),
    segundos_totales: z.number(),
    segundos_visita_abierta: z.number(),
    segundos_sin_datos: z.number(),
    visita_abierta: z.boolean(),
    llegada_actual_en: z.string().nullable(),
    primera_llegada_en: z.string().nullable(),
    ultima_salida_en: z.string().nullable(),
  }),
  visitas: z.array(
    z.object({
      id: z.string(),
      entrada_en: z.string(),
      salida_en: z.string().nullable(),
    }),
  ),
  observaciones: z
    .array(
      z.object({
        id: z.string(),
        tarea_id: z.string(),
        usuario_id: z.string(),
        usuario_nombre: z.string().nullable(),
        tipo_observacion_id: z.number().int(),
        tipo_observacion_codigo: z.string(),
        tipo_observacion_nombre: z.string(),
        observacion_origen_id: z.string().nullable(),
        descripcion: z.string(),
        estado_operativo_tarea_id: z.number().int(),
        estado_operativo_codigo: z.string().nullable(),
        estado_operativo_nombre: z.string().nullable(),
        latitud: z.number().finite().nullable(),
        longitud: z.number().finite().nullable(),
        precision_metros: z.number().finite().nullable(),
        ubicacion_capturada_en: z.string().nullable(),
        capturada_en: z.string(),
        recibida_en: z.string(),
        creado_en: z.string(),
      }),
    )
    .optional()
    .default([]),
  ruta: z
    .object({
      ruta_planificada_id: z.string().nullable(),
      estado_calculo: z.string().nullable(),
    })
    .nullable(),
  permisos: z.object({
    puede_editar: z.boolean(),
    puede_editar_punto: z.boolean(),
    puede_editar_geometria_control: z.boolean(),
    puede_reordenar: z.boolean(),
    geometria_bloqueada: z.boolean(),
    puede_cancelar: z.boolean(),
    puede_eliminar: z.boolean(),
  }),
}) satisfies z.ZodType<TareaRastreoDetalleDto>;

const routeCoordinatesSchema = z.tuple([
  z.number().finite(),
  z.number().finite(),
]);
const routeLineStringSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(routeCoordinatesSchema).min(2),
});
const rutaPlanificadaSchema = z
  .object({
    ruta_id: z.string().uuid(),
    version_actual: z.number().int().nonnegative(),
    estado_calculo: z.string(),
    area_id: z.string().uuid(),
    fecha_programada: z.string(),
    source_id: z.number().int().nullable(),
    polilinea_geojson: z
      .union([
        routeLineStringSchema,
        z.object({
          type: z.literal("Feature"),
          geometry: routeLineStringSchema,
        }),
      ])
      .nullable(),
    paradas: z.array(
      z
        .object({
          parada_id: z.string().uuid(),
          tarea_id: z.string().uuid(),
          numero_orden: z.number().int().positive(),
        })
        .passthrough(),
    ),
  })
  .transform((route) => ({
    ...route,
    polilinea_geojson:
      route.polilinea_geojson?.type === "Feature"
        ? route.polilinea_geojson.geometry
        : route.polilinea_geojson,
  })) satisfies z.ZodType<RutaPlanificadaDto>;

export const listarRutasPlanificadasSchema = z.object({
  rutas: z.array(rutaPlanificadaSchema),
});
