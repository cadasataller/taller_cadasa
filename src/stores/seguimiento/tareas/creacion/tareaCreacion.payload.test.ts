import { describe, expect, it } from "vitest";
import { toCrearTareaV2Params } from "./tareaCreacion.payload";
import type { TareaCreacionBorrador } from "./tareaCreacion.types";
import { validateTareaCreacionDraft } from "./tareaCreacion.validation";

const line = {
  type: "MultiLineString" as const,
  coordinates: [
    [
      [-82.5, 8.4],
      [-82.6, 8.5],
    ],
  ],
};
const zone = {
  type: "MultiPolygon" as const,
  coordinates: [
    [
      [
        [-82.5, 8.4],
        [-82.6, 8.5],
        [-82.7, 8.4],
        [-82.5, 8.4],
      ],
    ],
  ],
};

const draft = (type: "finca" | "zona"): TareaCreacionBorrador => ({
  areaId: "area-1",
  type,
  worker: { id: "worker-1", label: "Pedro Hurtado" },
  tracker: { id: 14, sourceId: 22, label: "TRACTOR 84-95" },
  companion: null,
  details: {
    instructions: "  Fertilización  ",
    scheduledDate: "2026-08-26",
    priorityId: 1,
    estimatedMinutes: 60,
  },
  geometry: {
    locationId: type === "finca" ? "farm-1" : null,
    routePoint: { latitude: 8.43008, longitude: -82.50821 },
    controlLine: type === "finca" ? line : null,
    controlZone: type === "zona" ? zone : null,
  },
  route: { order: 4 },
  validBlocks: {
    type: true,
    assignment: true,
    details: true,
    geometry: true,
    route: true,
  },
  submitStatus: "idle",
});

describe("contratos de creación de tarea", () => {
  it("solo serializa la geometría de finca requerida por crear_tarea_v2", () => {
    const payload = toCrearTareaV2Params(draft("finca"));

    expect(payload).toMatchObject({
      p_tipo_codigo: "finca",
      p_ubicacion_id: "farm-1",
      p_linea_control_geojson: line,
      p_zona_control_geojson: null,
      p_indicaciones: "Fertilización",
    });
  });

  it("fuerza ubicacion_id nula y envía la zona para una tarea zona", () => {
    const payload = toCrearTareaV2Params(draft("zona"));

    expect(payload).toMatchObject({
      p_tipo_codigo: "zona",
      p_ubicacion_id: null,
      p_linea_control_geojson: null,
      p_zona_control_geojson: zone,
    });
  });

  it("rechaza una duración que no cumple el intervalo del RPC", () => {
    const invalidDraft = draft("finca");
    invalidDraft.details.estimatedMinutes = 50;

    const validation = validateTareaCreacionDraft(invalidDraft);
    expect(validation.isValid).toBe(false);
    expect(validation.validBlocks.details).toBe(false);
    expect(() => toCrearTareaV2Params(invalidDraft)).toThrow("no es válido");
  });
});
