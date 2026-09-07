import { z } from "zod";

const optionalTextSchema = z.string().nullable();

const activityDaySchema = z.object({
  fecha: z.string(),
  dia_semana: z.string(),
  equipos: z.number(),
  jornadas: z.number(),
  tiempo_total: z.string(),
  tiempo_efectivo: z.string(),
  efectividad: z.number(),
  tiempo_parado: z.string(),
  porcentaje_parado: z.number(),
});

const highlightedDaySchema = z.object({
  fecha: z.string(),
  dia_semana: z.string(),
  equipos: z.number(),
  jornadas: z.number(),
  tiempo_efectivo: z.string(),
  efectividad: z.number(),
  tiempo_parado: z.string(),
  porcentaje_parado: z.number(),
});

const performanceSchema = z.object({
  equipo_numero: z.string(),
  tiempo_efectivo_segundos: z.number(),
  tiempo_parado_segundos: z.number(),
  tiempo_total_segundos: z.number(),
});

const jobSchema = z.object({
  labor: z.string(),
  tiempo: z.string(),
  porcentaje_tiempo_efectivo: z.number(),
  jornadas: z.number(),
});

const stopReasonSchema = z.object({
  motivo: z.string(),
  tiempo: z.string(),
  porcentaje_paradas: z.number(),
  ocurrencias: z.number(),
});

const equipmentRankingSchema = z.object({
  equipo_numero: z.string(),
  efectividad: z.number(),
  porcentaje_parado: z.number().optional(),
  tiempo_efectivo_segundos: z.number().optional(),
  tiempo_efectivo: z.string(),
  tiempo_parado_segundos: z.number().optional(),
  tiempo_parado: z.string(),
  tiempo_total_segundos: z.number().optional(),
  tiempo_total: z.string().optional(),
  jornadas: z.number().optional(),
  cumple_minimo_horas: z.boolean().optional(),
  indice_ranking: z.number().optional(),
});

const operatorSchema = z.object({
  operador: z.string(),
  efectividad: z.number(),
  tiempo_efectivo: z.string(),
  tiempo_parado: z.string(),
});

export const activityTeamsReportSchema = z.object({
  rango: z.object({
    desde: z.string(),
    hasta: z.string(),
    zona_horaria: z.string(),
  }),
  diapositiva_1: z.object({
    resumen: z.object({
      equipos: z.number(),
      jornadas: z.number(),
      tiempo_total_segundos: z.number(),
      tiempo_total: z.string(),
      tiempo_efectivo_segundos: z.number(),
      tiempo_efectivo: z.string(),
      efectividad: z.number(),
      tiempo_parado_segundos: z.number(),
      tiempo_parado: z.string(),
      porcentaje_parado: z.number(),
    }),
    mejor_dia: highlightedDaySchema.nullable(),
    peor_dia: highlightedDaySchema.nullable(),
    top_labores: z.array(jobSchema),
    top_causas_parada: z.array(stopReasonSchema),
    rendimiento_equipos: z.array(performanceSchema),
  }),
  diapositiva_2: z.object({
    actividad_diaria: z.array(activityDaySchema),
    mejores_equipos: z.array(equipmentRankingSchema),
    peores_equipos: z.array(equipmentRankingSchema),
    top_operadores: z.array(operatorSchema),
  }),
});

export const activityTeamsEquipmentTypesSchema = z.object({
  data: z.array(
    z.object({
      equipo_numero: z.string(),
      tipo: optionalTextSchema,
    }),
  ),
});

export type ActivityTeamsReportResponse = z.infer<
  typeof activityTeamsReportSchema
>;
