import { z } from "zod";

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
  metricas: z.object({
    tiempo_total_segundos: z.number().finite(),
    tiempo_total: z.string(),
    tiempo_trabajando_segundos: z.number().finite(),
    tiempo_trabajando: z.string(),
    tiempo_parado_segundos: z.number().finite(),
    tiempo_parado: z.string(),
    efectividad: z.number().finite(),
  }),
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
