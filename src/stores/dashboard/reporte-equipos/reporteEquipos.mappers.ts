import type {
  EquipmentContext,
  EquipmentListItem,
  EquipmentMasterDetail,
  EquipmentSummary,
} from "./reporteEquipos.types";
import type { z } from "zod";
import {
  contextSchema,
  equipmentListSchema,
  masterSchema,
  summarySchema,
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
  totalSeconds: dto.metricas.tiempo_total_segundos,
  totalTime: dto.metricas.tiempo_total,
  workingSeconds: dto.metricas.tiempo_trabajando_segundos,
  workingTime: dto.metricas.tiempo_trabajando,
  stoppedSeconds: dto.metricas.tiempo_parado_segundos,
  stoppedTime: dto.metricas.tiempo_parado,
  effectiveness: dto.metricas.efectividad,
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
