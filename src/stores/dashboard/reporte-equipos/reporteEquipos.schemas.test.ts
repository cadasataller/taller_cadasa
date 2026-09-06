import { describe, expect, it } from "vitest";
import {
  mapEquipmentOperators,
  mapOperatorDetail,
  mapStops,
} from "./reporteEquipos.mappers";
import {
  equipmentListSchema,
  equipmentOperatorsSchema,
  farmResolutionSchema,
  stopsSchema,
  operatorDetailSchema,
  summarySchema,
} from "./reporteEquipos.schemas";
import { jornadaEventoDetalleSchema } from "./jornadaEventos.schemas";

describe("reporteEquipos schemas", () => {
  it("acepta contexto sin implemento e intervalos con fechas locales", () => {
    const detail = jornadaEventoDetalleSchema.parse({
      evento: {
        tipo_evento: "reanudar",
        ocurrio_en_local: "05/09/2026 12:37:44",
        datos: { causa_cerrada_id: "causa-1" },
      },
      contexto: {
        operador: "AMILCAR MORALES",
        equipo: "484102",
        labor: "Arado",
      },
      intervalos: [
        {
          tipo: "periodo",
          etiqueta: "Período de parada",
          inicio_local: "05/09/2026 12:08:47",
          fin_local: "05/09/2026 12:37:44",
          duracion_segundos: 1737,
        },
      ],
    });

    expect(detail.contexto.implemento).toBeUndefined();
    expect(detail.intervalos[0]?.inicio_local).toBe("05/09/2026 12:08:47");
  });

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

  it("mapea operadores y mantiene los campos nulos de la tabla", () => {
    const operators = mapEquipmentOperators(
      equipmentOperatorsSchema.parse({
        equipo_numero: "484091",
        metricas: {
          operadores_unicos: 1,
          tiempo_total_segundos: 600,
          tiempo_total: "00:10",
          jornadas: 1,
          mayor_participacion: null,
        },
        operadores: [
          {
            operador_id: "op-1",
            operador: "operador@cadasa.com",
            jornadas: null,
            tiempo_total_segundos: 600,
            tiempo_total: "00:10",
            tiempo_trabajando_segundos: null,
            tiempo_trabajando: null,
            tiempo_parado_segundos: null,
            tiempo_parado: null,
            porcentaje_uso: 100,
            primera_actividad: null,
            ultima_actividad: null,
          },
        ],
      }),
    );
    expect(operators.metrics.topParticipation).toBeNull();
    expect(operators.operators[0]).toMatchObject({
      journeys: null,
      workingTime: null,
      stoppedTime: null,
    });
  });

  it("mapea el detalle reducido del operador", () => {
    const detail = mapOperatorDetail(
      operatorDetailSchema.parse({
        equipo_numero: "484091",
        operador: { id: "op-1", label: "operador@cadasa.com" },
        metricas: {
          jornadas: 1,
          tiempo_total_segundos: 600,
          tiempo_total: "00:10",
          tiempo_trabajando_segundos: 480,
          tiempo_trabajando: "00:08",
          tiempo_parado_segundos: 120,
          tiempo_parado: "00:02",
        },
        distribucion_clasificacion: [
          {
            clasificacion: "EFECTIVO",
            tiempo_segundos: 480,
            tiempo: "00:08",
            porcentaje: 80,
          },
        ],
        principales_paradas: [
          {
            motivo: "Combustible",
            ocurrencias: 1,
            tiempo_segundos: 120,
            tiempo: "00:02",
            porcentaje_paradas: 100,
          },
        ],
        historial: [
          {
            inicio: "2026-09-02T13:00:00-05:00",
            fin: "2026-09-02T13:10:00-05:00",
            inicio_local: "02/09/2026 13:00",
            fin_local: "02/09/2026 13:10",
            tipo: "trabajando",
            detalle: "Rastra pesada",
            tiempo_segundos: 600,
            tiempo: "00:10",
          },
        ],
      }),
    );
    expect(detail.classificationDistribution[0]).toMatchObject({
      classification: "EFECTIVO",
      time: "00:08",
    });
    expect(detail.mainStops[0]).toMatchObject({
      reason: "Combustible",
      percentage: 100,
    });
    expect(detail.history[0]).toMatchObject({
      detail: "Rastra pesada",
      time: "00:10",
    });
  });
});
