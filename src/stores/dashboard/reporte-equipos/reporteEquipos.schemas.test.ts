import { describe, expect, it } from "vitest";
import { equipmentListSchema, summarySchema } from "./reporteEquipos.schemas";

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
});
