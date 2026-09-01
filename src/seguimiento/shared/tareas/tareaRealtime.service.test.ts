import { describe, expect, it } from "vitest";
import {
  parseTareaObservacionRealtimeEvent,
  parseTareaPermanenciaRealtimeEvent,
} from "./tareaRealtime.service";

describe("eventos Realtime de tareas", () => {
  it("acepta el evento de permanencia de tarea documentado", () => {
    expect(
      parseTareaPermanenciaRealtimeEvent({
        tipo: "permanencia_iniciada",
        alcance: "tarea",
        tarea_id: "task-1",
        area_id: "area-1",
        tipo_tarea: "finca",
        segundos_totales: 120,
        segundos_permanencia_actual: 120,
        visita_abierta: true,
      }),
    ).toMatchObject({ alcance: "tarea", tarea_id: "task-1" });
  });

  it("rechaza una zona sin tarea para no actualizar el detalle equivocado", () => {
    expect(
      parseTareaPermanenciaRealtimeEvent({
        tipo: "zona_visita_iniciada",
        alcance: "zona",
        zona_id: "zone-1",
        tipo_tarea: "finca",
      }),
    ).toBeNull();
  });

  it("acepta observaciones únicamente cuando tienen área y tarea", () => {
    expect(
      parseTareaObservacionRealtimeEvent({
        tipo: "observacion_creada",
        observacion_id: "observation-1",
        tarea_id: "task-1",
        area_id: "area-1",
      }),
    ).toMatchObject({ tarea_id: "task-1" });
  });
});
