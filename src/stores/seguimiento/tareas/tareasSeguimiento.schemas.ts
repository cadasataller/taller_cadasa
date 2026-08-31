import { z } from "zod";
import type { TareaRastreoDetalleDto } from "./tareasSeguimiento.types";

const lineGeometrySchema = z.object({
  type: z.literal("MultiLineString"),
  coordinates: z.array(z.array(z.array(z.number().finite()))),
});

const zoneGeometrySchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(z.array(z.array(z.number().finite())))),
});

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
    punto_enrutado: z
      .object({
        lat: z.number().finite(),
        lng: z.number().finite(),
      })
      .nullable(),
    linea_control: lineGeometrySchema.nullable(),
    zonas_control: z.array(
      z.object({
        id: z.string(),
        geom: zoneGeometrySchema,
      }),
    ),
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
    estado_tarea_codigo: z.string(),
    estado_operativo_codigo: z
      .enum(["sin_iniciar", "en_ruta", "en_ubicacion", "visitada"])
      .nullable(),
    estado_operativo_nombre: z.string().nullable(),
  }),
  tiempo: z.object({
    cantidad_visitas: z.number(),
    segundos_totales: z.number(),
    visita_abierta: z.boolean(),
  }),
  visitas: z.array(
    z.object({
      id: z.string(),
      entrada_en: z.string(),
      salida_en: z.string().nullable(),
    }),
  ),
  ruta: z
    .object({
      id: z.string().nullable(),
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
