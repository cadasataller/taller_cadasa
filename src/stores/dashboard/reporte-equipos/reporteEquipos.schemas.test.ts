import { describe, expect, it } from "vitest";
import { mapStops } from "./reporteEquipos.mappers";
import {
  equipmentListSchema,
  farmResolutionSchema,
  stopsSchema,
  summarySchema,
} from "./reporteEquipos.schemas";

describe("reporteEquipos schemas", () => {
  it("acepta el enriquecimiento fallido sin ocultar el equipo", () => {
    const result = equipmentListSchema.safeParse({
      data: [
        {
          cod_equipo: "484091",
          tipo: "TRACTOR",
          jornadas: null,
          tiempo_total: null,
          tiempo_total_segundos: null,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza métricas de resumen incompletas", () => {
    const result = summarySchema.safeParse({
      equipo_numero: "484091",
      metricas: { tiempo_total: "14:39" },
    });
    expect(result.success).toBe(false);
  });

  it("acepta la última ubicación conocida del equipo", () => {
    const result = summarySchema.pick({ equipo: true }).safeParse({
      equipo: {
        numero: "484091",
        ubicacion_mas_reciente: {
          latitud: 8.123456,
          longitud: -82.456789,
          ocurrio_en: "2026-09-05T14:35:20-05:00",
          ocurrio_en_local: "2026-09-05 14:35:20",
          registrado_en: "2026-09-05T14:35:24-05:00",
          tipo_evento: "inicio_parada",
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("acepta la finca resuelta para la última ubicación", () => {
    const result = farmResolutionSchema.safeParse([
      {
        ubicacion_id: "595f8a6b-63c9-4752-9c9f-9e0ff37ea711",
        nombre: "Calle Larga",
        area_id: "21e9fe15-5f33-4ecb-a100-c07f3cdee786",
      },
    ]);

    expect(result.success).toBe(true);
  });

  it("preserva segundos, porcentajes e implemento al mapear paradas", () => {
    const dto = stopsSchema.parse({
      equipo_numero: "484091",
      metricas: {
        tiempo_parado_segundos: 10800,
        tiempo_parado: "03:00",
        porcentaje_parado: 20.5,
        cantidad_paradas: 12,
        duracion_promedio_segundos: 900,
        duracion_promedio: "00:15",
      },
      por_clasificacion: [
        {
          clasificacion: "OPERATIVO",
          tiempo_segundos: 9360,
          tiempo: "02:36",
          ocurrencias: 6,
          porcentaje_parado: 86.8,
          porcentaje_paradas: 86.8,
        },
      ],
      por_origen: [
        {
          origen: "implemento",
          tiempo_segundos: 0,
          tiempo: "00:00",
          ocurrencias: 2,
          porcentaje_paradas: 0.1,
        },
      ],
      principales_motivos: [
        {
          motivo: "Cambio/Calibre implemento",
          ocurrencias: 2,
          tiempo_segundos: 0,
          tiempo: "00:00",
          porcentaje_parado: 0.1,
          porcentaje_paradas: 0.1,
        },
      ],
      detalle: [
        {
          inicio: "2026-08-19T20:41:00+00:00",
          fin: "2026-08-19T20:41:00+00:00",
          inicio_local: "19/08/2026 15:41",
          fin_local: "19/08/2026 15:41",
          duracion: "00:00",
          motivo: "Cambio/Calibre implemento",
          origen: "implemento",
          clasificacion: "OPERATIVO",
          motor_encendido: true,
          motor: "Encendido",
          implemento: { id: "impl-1", numero: 439013, nombre: "Rastra" },
        },
      ],
    });
    const stops = mapStops(dto);
    expect(stops.metrics.stoppedSeconds).toBe(10800);
    expect(stops.origins[0]).toMatchObject({ count: 2, percentage: 0.1 });
    expect(stops.details[0]).toMatchObject({
      duration: "00:00",
      engineOn: true,
      implement: { id: "impl-1", number: "439013", name: "Rastra" },
    });
  });

  it("rechaza una parada sin el booleano de motor", () => {
    const result = stopsSchema.safeParse({
      equipo_numero: "484091",
      metricas: {},
      por_clasificacion: [],
      por_origen: [],
      principales_motivos: [],
      detalle: [],
    });
    expect(result.success).toBe(false);
  });
});
