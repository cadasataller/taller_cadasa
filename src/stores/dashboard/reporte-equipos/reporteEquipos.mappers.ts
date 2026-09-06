import type {
  EquipmentContext,
  EquipmentListItem,
  EquipmentMasterDetail,
  EquipmentSummary,
  EquipmentStops,
} from "./reporteEquipos.types";
import type { z } from "zod";
import {
  contextSchema,
  equipmentListSchema,
  masterSchema,
  summarySchema,
  stopsSchema,
} from "./reporteEquipos.schemas";

export const mapEquipmentList = (
  dto: z.infer<typeof equipmentListSchema>,
): EquipmentListItem[] =>
  dto.data.map((item) => ({
    code: item.cod_equipo,
    type: item.tipo,
    journeys: item.jornadas,
    totalTime: item.tiempo_total,
    totalSeconds: item.tiempo_total_segundos,
  }));
export const mapContext = (
  dto: z.infer<typeof contextSchema>,
): EquipmentContext => ({
  code: dto.equipo_numero,
  journeys: dto.jornadas,
  firstActivity: dto.primera_actividad,
  lastActivity: dto.ultima_actividad,
  totalSeconds: dto.tiempo_total_segundos,
  totalTime: dto.tiempo_total,
  engine: dto.motor.map((row) => ({
    engineOn: row.motor_encendido,
    state: row.estado,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje,
    periods: row.periodos,
  })),
});
export const mapSummary = (
  dto: z.infer<typeof summarySchema>,
): EquipmentSummary => ({
  code: dto.equipo_numero,
  recentLocation: dto.equipo.ubicacion_mas_reciente
    ? {
        latitude: dto.equipo.ubicacion_mas_reciente.latitud,
        longitude: dto.equipo.ubicacion_mas_reciente.longitud,
        occurredAt: dto.equipo.ubicacion_mas_reciente.ocurrio_en,
        occurredAtLocal: dto.equipo.ubicacion_mas_reciente.ocurrio_en_local,
        registeredAt: dto.equipo.ubicacion_mas_reciente.registrado_en,
        eventType: dto.equipo.ubicacion_mas_reciente.tipo_evento,
        farmName: null,
      }
    : null,
  totalSeconds: dto.metricas.tiempo_total_segundos,
  totalTime: dto.metricas.tiempo_total,
  workingSeconds: dto.metricas.tiempo_trabajando_segundos,
  workingTime: dto.metricas.tiempo_trabajando,
  stoppedSeconds: dto.metricas.tiempo_parado_segundos,
  stoppedTime: dto.metricas.tiempo_parado,
  effectiveness: dto.metricas.efectividad,
  classifications: dto.clasificaciones.map((row) => ({
    classification: row.clasificacion,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje,
  })),
  mainStops: dto.principales_paradas.map((row) => ({
    reason: row.motivo,
    occurrences: row.ocurrencias,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje_paradas,
  })),
  operators: dto.operadores.map((row) => ({
    operatorId: row.operador_id,
    operator: row.operador,
    journeys: row.jornadas,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje,
  })),
  implements: dto.implementos.map((row) => ({
    implementId: String(row.implemento_id),
    number: String(row.numero),
    description: row.descripcion,
    journeys: row.jornadas,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje_uso,
  })),
  history: dto.historial.map((row) => ({
    startAt: row.inicio,
    endAt: row.fin,
    startLocal: row.inicio_local,
    endLocal: row.fin_local,
    kind: row.tipo,
    detail: row.detalle,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
  })),
});
export const mapStops = (dto: z.infer<typeof stopsSchema>): EquipmentStops => ({
  code: dto.equipo_numero,
  metrics: {
    stoppedSeconds: dto.metricas.tiempo_parado_segundos,
    stoppedTime: dto.metricas.tiempo_parado,
    stoppedPercentage: dto.metricas.porcentaje_parado,
    stopCount: dto.metricas.cantidad_paradas,
    averageDurationSeconds: dto.metricas.duracion_promedio_segundos,
    averageDuration: dto.metricas.duracion_promedio,
  },
  classifications: dto.por_clasificacion.map((row) => ({
    classification: row.clasificacion,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    count: row.ocurrencias,
    percentage: row.porcentaje_paradas,
  })),
  origins: dto.por_origen.map((row) => ({
    origin: row.origen,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    count: row.ocurrencias,
    percentage: row.porcentaje_paradas,
  })),
  mainReasons: dto.principales_motivos.map((row) => ({
    reason: row.motivo,
    occurrences: row.ocurrencias,
    seconds: row.tiempo_segundos,
    time: row.tiempo,
    percentage: row.porcentaje_paradas,
  })),
  details: dto.detalle.map((row) => ({
    startAt: row.inicio,
    endAt: row.fin,
    startLocal: row.inicio_local,
    endLocal: row.fin_local,
    duration: row.duracion,
    reason: row.motivo,
    origin: row.origen,
    classification: row.clasificacion,
    engineOn: row.motor_encendido,
    engine: row.motor,
    implement: row.implemento
      ? {
          id: String(row.implemento.id),
          number: String(row.implemento.numero),
          name: row.implemento.nombre,
        }
      : null,
  })),
});
export const mapMaster = (
  dto: z.infer<typeof masterSchema>,
): EquipmentMasterDetail | null =>
  dto.equipo
    ? {
        code: dto.equipo.cod_equipo,
        type: dto.equipo.tipo,
        model: dto.equipo.modelo,
        brand: dto.equipo.marca,
        active: dto.equipo.activo,
        imagePath: dto.equipo.imagen.tiene_imagen
          ? dto.equipo.imagen.storage_path
          : null,
        imageUrl: null,
      }
    : null;
