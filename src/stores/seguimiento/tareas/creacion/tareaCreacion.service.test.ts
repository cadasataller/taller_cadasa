import { describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({
  supabaseRastreoTareas: { rpc, functions: { invoke } },
}));

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

const response = {
  id: "0f071a8e-5bd4-4d94-8694-cc3b8fe4bea8",
  version: 2,
  area_id: "21e9fe15-5f33-4ecb-a100-c07f3cdee786",
  tipo: "finca" as const,
  usuario_asignado_id: "fa9a9f48-5394-4b2c-8041-ebb9e50f65eb",
  tracker_id: 14,
  source_id: 22,
  tracker_label: "TRACTOR 84-95",
  fecha_programada: "2026-08-26",
  ubicacion_id: "5606a95f-61a9-448d-ac6e-8a814b2c495d",
  zona_control_ids: ["c5bc4fad-0637-4cfd-ac6c-e6e784c0beaf"],
  orden_ruta: 4,
  estado_tarea_id: 2,
  estado_operativo_tarea_id: 1,
  requiere_procesar_ruta: true,
  solicitud_recalculo_ruta_id: "f4cb0000-5bd4-4d94-8694-cc3b8fe4bea8",
  creado_en: "2026-08-31T21:10:03Z",
  actualizado_en: "2026-08-31T21:10:03Z",
};

describe("tareaCreacionService", () => {
  it("crea únicamente mediante crear_tarea_v2 de supabaseRastreoTareas", async () => {
    rpc.mockResolvedValue({ data: response, error: null });

    await expect(tareaCreacionService.create(payload)).resolves.toEqual(
      response,
    );
    expect(rpc).toHaveBeenCalledWith("crear_tarea_v2", payload);
  });

  it("procesa una ruta con solamente su solicitud_id", async () => {
    invoke.mockResolvedValue({
      data: {
        solicitud_id: response.solicitud_recalculo_ruta_id,
        ruta_id: "a4cb0000-5bd4-4d94-8694-cc3b8fe4bea8",
        paradas: 1,
        motor: "v2_orden_supervisor",
      },
      error: null,
    });

    await tareaCreacionService.processPendingRoute({
      solicitud_id: response.solicitud_recalculo_ruta_id,
    });

    expect(invoke).toHaveBeenCalledWith("procesar-ruta-pendiente", {
      body: { solicitud_id: response.solicitud_recalculo_ruta_id },
    });
  });
});
