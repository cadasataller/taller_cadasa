import { z } from "zod";
import type { JornadaEventoJsonValue } from "./reporteEquipos.types";

const nullableText = z.string().nullable();
const jsonValueSchema: z.ZodType<JornadaEventoJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);
export const jornadaEventoDetalleRawSchema = z.record(
  z.string(),
  jsonValueSchema,
);

export const jornadaEventosListaSchema = z.object({
  modo: z.union([
    z.literal("hoy"),
    z.literal("fallback_recientes"),
    z.literal("rango_explicito"),
  ]),
  snapshot_registrado_en: z.string(),
  page_size: z.number().int(),
  has_more: z.boolean(),
  next_cursor: z.object({ ocurrio_en: z.string(), id: z.string() }).nullable(),
  items: z.array(
    z.object({
      evento_id: z.string(),
      fecha_hora: z.string(),
      operador_id: z.string(),
      operador: z.string(),
      equipo: z.string(),
      tipo_evento: z.string(),
      evento: z.string(),
      detalle: nullableText,
      labor: z.string(),
    }),
  ),
});

export const jornadaEventoDetalleSchema = z.object({
  evento: z.object({
    id: z.string().optional(),
    client_event_id: nullableText.optional(),
    jornada_id: nullableText.optional(),
    asignacion_id: nullableText.optional(),
    periodo_id: nullableText.optional(),
    tipo_evento: z.string(),
    ocurrio_en: z.string().optional(),
    ocurrio_en_local: z.string().optional(),
    registrado_en: nullableText.optional(),
    sincronizado_en: nullableText.optional(),
    retroactivo_minutos: z.number().nullable().optional(),
    latitud: z.number().nullable().optional(),
    longitud: z.number().nullable().optional(),
    creado_por_auth_user_id: nullableText.optional(),
    datos: z.record(z.string(), jsonValueSchema).nullable().optional(),
    creado_en: nullableText.optional(),
    secuencia: z.number().int().nullable().optional(),
  }),
  contexto: z.object({
    operador: nullableText.optional(),
    equipo: nullableText.optional(),
    labor: nullableText.optional(),
    implemento: nullableText.optional(),
    implemento_numero: nullableText.optional(),
    implemento_nombre: nullableText.optional(),
  }),
  intervalos: z.array(
    z.object({
      id: nullableText.optional(),
      tipo: z.string(),
      etiqueta: z.string(),
      estado: nullableText.optional(),
      inicio: nullableText.optional(),
      fin: nullableText.optional(),
      inicio_local: nullableText.optional(),
      fin_local: nullableText.optional(),
      duracion_segundos: z.number().nullable().optional(),
      clasificacion: nullableText.optional(),
      motor_encendido: z.boolean().nullable().optional(),
      equipo: nullableText.optional(),
      implemento: z
        .union([
          nullableText,
          z.object({
            numero: nullableText.optional(),
            nombre: nullableText.optional(),
          }),
        ])
        .optional(),
      labor: nullableText.optional(),
    }),
  ),
});
