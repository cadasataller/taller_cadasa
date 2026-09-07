import { supabaseCapturaOperador, supabaseEquipos } from "@/lib/supabase";
import {
  activityTeamsEquipmentTypesSchema,
  activityTeamsReportSchema,
} from "./resumenActividadEquipos.schemas";
import type {
  ActivityTeamsEquipmentType,
  ActivityTeamsFilters,
  ActivityTeamsReport,
} from "./resumenActividadEquipos.types";

function throwRemoteError(
  message: string | undefined,
  fallback: string,
): never {
  throw new Error(message || fallback);
}

function dayFromResponse(day: {
  fecha: string;
  dia_semana: string;
  equipos: number;
  jornadas: number;
  tiempo_efectivo: string;
  tiempo_parado: string;
  efectividad: number;
  porcentaje_parado: number;
}) {
  return {
    date: day.fecha,
    weekday: day.dia_semana,
    equipment: day.equipos,
    journeys: day.jornadas,
    effectiveTime: day.tiempo_efectivo,
    stoppedTime: day.tiempo_parado,
    effectiveness: day.efectividad,
    stoppedPercentage: day.porcentaje_parado,
  };
}

function rankingSecondary(item: {
  tiempo_efectivo: string;
  tiempo_parado: string;
  tiempo_total?: string;
}): string {
  const totalTime = item.tiempo_total ? ` · ${item.tiempo_total} total` : "";

  return `${item.tiempo_efectivo} efectivo · ${item.tiempo_parado} parado${totalTime}`;
}

export const activityTeamsSummaryService = {
  async loadReport(
    filters: ActivityTeamsFilters,
  ): Promise<ActivityTeamsReport> {
    const { data, error } = await supabaseCapturaOperador.rpc(
      "rpc_reporte_actividad_equipos_general",
      { p_desde: filters.startDate, p_hasta: filters.endDate },
    );
    if (error) {
      return throwRemoteError(
        error.message,
        "No se pudo cargar el resumen de actividad.",
      );
    }

    const response = activityTeamsReportSchema.parse(data);
    const {
      resumen,
      mejor_dia,
      peor_dia,
      top_labores,
      top_causas_parada,
      rendimiento_equipos,
    } = response.diapositiva_1;
    const {
      actividad_diaria,
      mejores_equipos,
      peores_equipos,
      top_operadores,
    } = response.diapositiva_2;

    return {
      range: {
        startDate: response.rango.desde,
        endDate: response.rango.hasta,
        timezone: response.rango.zona_horaria,
      },
      totals: {
        equipment: resumen.equipos,
        journeys: resumen.jornadas,
        totalSeconds: resumen.tiempo_total_segundos,
        totalTime: resumen.tiempo_total,
        effectiveSeconds: resumen.tiempo_efectivo_segundos,
        effectiveTime: resumen.tiempo_efectivo,
        effectiveness: resumen.efectividad,
        stoppedSeconds: resumen.tiempo_parado_segundos,
        stoppedTime: resumen.tiempo_parado,
        stoppedPercentage: resumen.porcentaje_parado,
      },
      bestDay: mejor_dia ? dayFromResponse(mejor_dia) : null,
      worstDay: peor_dia ? dayFromResponse(peor_dia) : null,
      topJobs: top_labores.map((item) => ({
        label: item.labor,
        value: `${item.porcentaje_tiempo_efectivo.toFixed(1)}%`,
        percentage: item.porcentaje_tiempo_efectivo,
        secondary: `${item.tiempo} · ${item.jornadas} jornadas`,
        supportingMetric: null,
      })),
      topStopReasons: top_causas_parada.map((item) => ({
        label: item.motivo,
        value: `${item.porcentaje_paradas.toFixed(1)}%`,
        percentage: item.porcentaje_paradas,
        secondary: item.tiempo,
        supportingMetric: null,
      })),
      equipmentPerformance: rendimiento_equipos.map((item) => ({
        code: item.equipo_numero,
        type: null,
        effectiveSeconds: item.tiempo_efectivo_segundos,
        stoppedSeconds: item.tiempo_parado_segundos,
        totalSeconds: item.tiempo_total_segundos,
      })),
      dailyActivity: actividad_diaria.map(dayFromResponse),
      bestEquipment: mejores_equipos.map((item) => ({
        label: item.equipo_numero,
        value: `${item.efectividad.toFixed(1)}%`,
        percentage: item.efectividad,
        secondary: rankingSecondary(item),
        supportingMetric: null,
      })),
      worstEquipment: peores_equipos.map((item) => ({
        label: item.equipo_numero,
        value: `${item.efectividad.toFixed(1)}%`,
        percentage: item.efectividad,
        secondary: rankingSecondary(item),
        supportingMetric:
          item.porcentaje_parado === undefined
            ? null
            : `${item.porcentaje_parado.toFixed(1)}% tiempo perdido`,
      })),
      topOperators: top_operadores.map((item) => ({
        label: item.operador,
        value: item.tiempo_efectivo,
        percentage: item.efectividad,
        secondary: `${item.efectividad.toFixed(1)}% efectividad · ${item.tiempo_parado} parado`,
        supportingMetric: null,
      })),
    };
  },

  async loadEquipmentTypes(
    codes: string[],
  ): Promise<ActivityTeamsEquipmentType[]> {
    if (!codes.length) return [];
    const { data, error } = await supabaseEquipos.rpc(
      "rpc_equipos_tipos_por_codigos",
      { p_equipos: codes },
    );
    if (error) {
      return throwRemoteError(
        error.message,
        "No se pudieron cargar los tipos de equipo.",
      );
    }
    return activityTeamsEquipmentTypesSchema
      .parse(data)
      .data.map((item) => ({ code: item.equipo_numero, type: item.tipo }));
  },
};
