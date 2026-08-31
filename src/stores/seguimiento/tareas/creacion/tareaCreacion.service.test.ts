import { describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({ supabaseRastreoTareas: { rpc } }));

import { tareaCreacionService } from "./tareaCreacion.service";
import type { CrearTareaV2Params } from "./tareaCreacion.types";

const payload: CrearTareaV2Params = {
  p_area_id: "area-1",
  p_tipo_codigo: "finca",
  p_usuario_asignado_id: "worker-1",
  p_tracker_id: 14,
  p_source_id: 22,
  p_tracker_label: "TRACTOR 84-95",
  p_acompanantes: [],
  p_indicaciones: "Fertilización",
  p_fecha_programada: "2026-08-26",
  p_prioridad_id: 1,
  p_tiempo_estimado_minutos: 60,
  p_ubicacion_id: "farm-1",
  p_punto_latitud: 8.43008,
  p_punto_longitud: -82.50821,
  p_linea_control_geojson: { type: "MultiLineString", coordinates: [] },
  p_zona_control_geojson: [{ type: "MultiPolygon", coordinates: [] }],
  p_orden_ruta: 4,
};

describe("tareaCreacionService", () => {
  it("crea únicamente mediante crear_tarea_v2 de supabaseRastreoTareas", async () => {
    rpc.mockResolvedValue({ data: { tarea_id: "task-1" }, error: null });

    await expect(tareaCreacionService.create(payload)).resolves.toEqual({
      tarea_id: "task-1",
    });
    expect(rpc).toHaveBeenCalledWith("crear_tarea_v2", payload);
  });
});
