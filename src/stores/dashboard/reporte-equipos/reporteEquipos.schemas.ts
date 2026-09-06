import { z } from "zod";

const identifierSchema = z.union([z.string(), z.number().int()]);

export const equipmentListSchema = z.object({
  data: z.array(
    z.object({
      cod_equipo: z.string(),
      tipo: z.string(),
      jornadas: z.number().int().nullable(),
      tiempo_total: z.string().nullable(),
      tiempo_total_segundos: z.number().finite().nullable(),
    }),
  ),
});
export const contextSchema = z.object({
  equipo_numero: z.string(),
  jornadas: z.number().int(),
  primera_actividad: z.string().nullable(),
  ultima_actividad: z.string().nullable(),
  tiempo_total_segundos: z.number().finite(),
  tiempo_total: z.string(),
  motor: z.array(
    z.object({
      motor_encendido: z.boolean(),
      estado: z.string(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
      porcentaje: z.number().finite(),
      periodos: z.number().int(),
    }),
  ),
});
export const summarySchema = z.object({
  equipo_numero: z.string(),
  equipo: z.object({
    numero: z.string(),
    ubicacion_mas_reciente: z
      .object({
        latitud: z.number().finite(),
        longitud: z.number().finite(),
        ocurrio_en: z.string(),
        ocurrio_en_local: z.string(),
        registrado_en: z.string(),
        tipo_evento: z.string(),
      })
      .nullable(),
  }),
  metricas: z.object({
    tiempo_total_segundos: z.number().finite(),
    tiempo_total: z.string(),
    tiempo_trabajando_segundos: z.number().finite(),
    tiempo_trabajando: z.string(),
    tiempo_parado_segundos: z.number().finite(),
    tiempo_parado: z.string(),
    efectividad: z.number().finite(),
  }),
  clasificaciones: z.array(
    z.object({
      clasificacion: z.string(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
      porcentaje: z.number().finite(),
    }),
  ),
  principales_paradas: z.array(
    z.object({
      motivo: z.string(),
      ocurrencias: z.number().int(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
      porcentaje_paradas: z.number().finite(),
    }),
  ),
  operadores: z.array(
    z.object({
      operador_id: z.string(),
      operador: z.string(),
      jornadas: z.number().int(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
      porcentaje: z.number().finite(),
    }),
  ),
  implementos: z.array(
    z.object({
      implemento_id: identifierSchema,
      numero: identifierSchema,
      descripcion: z.string(),
      jornadas: z.number().int(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
      porcentaje_uso: z.number().finite(),
    }),
  ),
  historial: z.array(
    z.object({
      inicio: z.string(),
      fin: z.string(),
      inicio_local: z.string(),
      fin_local: z.string(),
      tipo: z.union([z.literal("trabajando"), z.literal("parado")]),
      detalle: z.string(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
    }),
  ),
});
export const farmResolutionSchema = z.array(
  z.object({
    ubicacion_id: z.string(),
    nombre: z.string(),
    area_id: z.string(),
  }),
);
const stopBreakdownSchema = z.object({
  tiempo_segundos: z.number().finite(),
  tiempo: z.string(),
  ocurrencias: z.number().int(),
  porcentaje_paradas: z.number().finite(),
});
export const stopsSchema = z.object({
  equipo_numero: z.string(),
  metricas: z.object({
    tiempo_parado_segundos: z.number().finite(),
    tiempo_parado: z.string(),
    porcentaje_parado: z.number().finite(),
    cantidad_paradas: z.number().int(),
    duracion_promedio_segundos: z.number().finite(),
    duracion_promedio: z.string(),
  }),
  por_clasificacion: z.array(
    stopBreakdownSchema.extend({ clasificacion: z.string() }),
  ),
  por_origen: z.array(
    stopBreakdownSchema.extend({
      origen: z.union([
        z.literal("equipo"),
        z.literal("implemento"),
        z.literal("otro"),
      ]),
    }),
  ),
  principales_motivos: z.array(
    z.object({
      motivo: z.string(),
      ocurrencias: z.number().int(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
      porcentaje_paradas: z.number().finite(),
    }),
  ),
  detalle: z.array(
    z.object({
      inicio: z.string(),
      fin: z.string(),
      inicio_local: z.string(),
      fin_local: z.string(),
      duracion: z.string(),
      motivo: z.string(),
      origen: z.union([
        z.literal("equipo"),
        z.literal("implemento"),
        z.literal("otro"),
      ]),
      clasificacion: z.string(),
      motor_encendido: z.boolean(),
      motor: z.string(),
      implemento: z
        .object({
          id: identifierSchema,
          numero: identifierSchema,
          nombre: z.string(),
        })
        .nullable(),
    }),
  ),
});
export const masterSchema = z.object({
  encontrado: z.boolean(),
  equipo: z
    .object({
      cod_equipo: z.string(),
      tipo: z.string().nullable(),
      modelo: z.string().nullable(),
      marca: z.string().nullable(),
      activo: z.boolean(),
      imagen: z.object({
        tiene_imagen: z.boolean(),
        storage_path: z.string().nullable(),
      }),
    })
    .nullable(),
});
const operatorTimeSchema = z.object({
  tiempo_segundos: z.number().finite(),
  tiempo: z.string(),
  porcentaje: z.number().finite(),
});
export const equipmentOperatorsSchema = z.object({
  equipo_numero: z.string(),
  metricas: z.object({
    operadores_unicos: z.number().int(),
    tiempo_total_segundos: z.number().finite(),
    tiempo_total: z.string(),
    jornadas: z.number().int(),
    mayor_participacion: z
      .object({
        operador_id: z.string(),
        operador: z.string(),
        porcentaje: z.number().finite(),
      })
      .nullable(),
  }),
  operadores: z.array(
    z.object({
      operador_id: z.string(),
      operador: z.string(),
      jornadas: z.number().int().nullable(),
      tiempo_total_segundos: z.number().finite(),
      tiempo_total: z.string(),
      tiempo_trabajando_segundos: z.number().finite().nullable(),
      tiempo_trabajando: z.string().nullable(),
      tiempo_parado_segundos: z.number().finite().nullable(),
      tiempo_parado: z.string().nullable(),
      porcentaje_uso: z.number().finite(),
      primera_actividad: z.string().nullable(),
      ultima_actividad: z.string().nullable(),
    }),
  ),
});
export const operatorDetailSchema = z.object({
  equipo_numero: z.string(),
  operador: z.object({ id: z.string(), label: z.string() }),
  metricas: z.object({
    jornadas: z.number().int(),
    tiempo_total_segundos: z.number().finite(),
    tiempo_total: z.string(),
    tiempo_trabajando_segundos: z.number().finite(),
    tiempo_trabajando: z.string(),
    tiempo_parado_segundos: z.number().finite(),
    tiempo_parado: z.string(),
  }),
  distribucion_estado: z.array(
    operatorTimeSchema.extend({
      estado: z.union([z.literal("trabajando"), z.literal("parado")]),
    }),
  ),
  distribucion_clasificacion: z.array(
    operatorTimeSchema.extend({ clasificacion: z.string() }),
  ),
  principales_paradas: z.array(
    z.object({
      motivo: z.string(),
      ocurrencias: z.number().int(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
      porcentaje_paradas: z.number().finite(),
    }),
  ),
  motor: z.array(
    operatorTimeSchema.extend({
      motor_encendido: z.boolean(),
      estado: z.string(),
      periodos: z.number().int(),
    }),
  ),
  implementos: z.array(
    z.object({
      implemento_id: identifierSchema,
      numero: identifierSchema,
      descripcion: z.string(),
      jornadas: z.number().int(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
    }),
  ),
  historial: z.array(
    z.object({
      inicio: z.string(),
      fin: z.string(),
      inicio_local: z.string(),
      fin_local: z.string(),
      tipo: z.union([z.literal("trabajando"), z.literal("parado")]),
      detalle: z.string(),
      tiempo_segundos: z.number().finite(),
      tiempo: z.string(),
    }),
  ),
});
