import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
const getUser = vi.hoisted(() => vi.fn());
const loadNavixyTrackers = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({
  supabaseRastreoTareas: {
    rpc,
    auth: { getUser },
  },
}));
vi.mock("@/seguimiento/shared/trackers/navixyTracker.service", () => ({
  navixyTrackerService: { load: loadNavixyTrackers },
}));

import { tareasSeguimientoService } from "./tareasSeguimiento.service";
import type { TareaRastreoListadoDto } from "./tareasSeguimiento.types";

const filters = {
  scheduledDate: null,
  areaId: null,
  assignedUserId: null,
  sourceId: null,
  types: [],
  statuses: [],
  search: "",
};
const listedTask: TareaRastreoListadoDto = {
  id: "task-1",
  version: 1,
  area_id: "area-1",
  fecha_programada: "2026-08-29",
  indicaciones: "Revisar lote",
  tipo_tarea: "duda_automatica",
  ubicacion_id: null,
  usuario_asignado_id: null,
  source_id: 1,
  tracker_id: 9,
  tracker_label: "Tracker 9",
  prioridad_id: null,
  estado_tarea_codigo: "pendiente",
  estado_operativo_codigo: "sin_iniciar",
  tiempo_estimado_minutos: null,
  cantidad_visitas: 0,
  segundos_totales: 0,
  segundos_visita_actual: 0,
  visita_abierta: false,
  entrada_actual_en: null,
  primera_entrada_en: null,
  ultima_salida_en: null,
  orden_ruta: null,
  punto_latitud: null,
  punto_longitud: null,
  cancelada_en: null,
  eliminado_en: null,
  actualizado_en: "2026-08-29T00:00:00Z",
};

describe("tareasSeguimientoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: null } });
    loadNavixyTrackers.mockResolvedValue({ trackers: [], observations: [] });
  });

  it("lee el listado exclusivamente desde listar_tareas_rastreo_v2", async () => {
    rpc.mockImplementation((name: string) =>
      Promise.resolve(
        name === "listar_tareas_rastreo_v2"
          ? { data: [listedTask], error: null }
          : { data: { areas: [] }, error: null },
      ),
    );

    const workspace = await tareasSeguimientoService.loadWorkspace(filters);

    expect(rpc).toHaveBeenCalledWith("listar_tareas_rastreo_v2", {
      p_area_id: null,
      p_fecha: null,
      p_usuario_asignado_id: null,
      p_source_id: null,
      p_estado_operativo_codigo: null,
      p_incluir_canceladas: false,
    });
    expect(rpc).toHaveBeenCalledWith(
      "obtener_configuracion_inicial_trackers_v2",
    );
    expect(workspace.tasks[0]?.type).toBe("duda");
  });

  it("solicita el detalle únicamente por obtener_tarea_detalle_v2", async () => {
    rpc.mockImplementation((name: string) =>
      Promise.resolve(
        name === "obtener_tarea_detalle_v2"
          ? {
              data: {
                tarea: {
                  id: "task-1",
                  version: 1,
                  area_id: "area-1",
                  fecha_programada: "2026-08-29",
                  indicaciones: "Revisar lote",
                  tipo_codigo: "finca",
                  ubicacion_id: null,
                  tiempo_estimado_minutos: 30,
                  orden_ruta: null,
                  punto_enrutado: null,
                  linea_control: null,
                  zonas_control: [],
                  actualizado_en: "2026-08-29T00:00:00Z",
                },
                asignacion: {
                  usuario_id: null,
                  usuario_nombre: null,
                  source_id: null,
                  tracker_id: null,
                  tracker_label: null,
                  acompanantes: [],
                },
                estado: {
                  prioridad_id: null,
                  estado_tarea_codigo: "pendiente",
                  estado_operativo_codigo: "sin_iniciar",
                  estado_operativo_nombre: "Sin iniciar",
                },
                tiempo: {
                  cantidad_visitas: 0,
                  segundos_totales: 0,
                  visita_abierta: false,
                },
                visitas: [],
                ruta: { id: null, estado_calculo: null },
                permisos: {
                  puede_editar: false,
                  puede_editar_punto: false,
                  puede_editar_geometria_control: false,
                  puede_reordenar: false,
                  geometria_bloqueada: false,
                  puede_cancelar: false,
                  puede_eliminar: false,
                },
              },
              error: null,
            }
          : { data: { areas: [] }, error: null },
      ),
    );

    await expect(
      tareasSeguimientoService.loadDetail("task-1"),
    ).resolves.toMatchObject({ id: "task-1", type: "finca" });
    expect(rpc).toHaveBeenCalledWith("obtener_tarea_detalle_v2", {
      p_tarea_id: "task-1",
    });
  });

  it("resuelve el centro del mapa con la configuración del usuario y área", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    rpc.mockImplementation((name: string) =>
      Promise.resolve(
        name === "listar_tareas_rastreo_v2"
          ? { data: [], error: null }
          : name === "obtener_catalogo_personas_tarea_v2"
            ? {
                data: {
                  areas: [{ area_id: "area-1", area_nombre: "Área uno" }],
                },
                error: null,
              }
            : name === "resolver_configuracion_mapa_v2"
              ? {
                  data: [{ latitud: 8.43, longitud: -82.51, zoom: 13 }],
                  error: null,
                }
              : { data: { areas: [] }, error: null },
      ),
    );

    await expect(
      tareasSeguimientoService.loadWorkspace(filters),
    ).resolves.toMatchObject({
      mapConfiguration: { latitude: 8.43, longitude: -82.51, zoom: 13 },
    });
    expect(rpc).toHaveBeenCalledWith("resolver_configuracion_mapa_v2", {
      p_area_id: "area-1",
      p_usuario_id: "user-1",
    });
  });

  it("filtra los trackers Navixy con los grupos autorizados del área", async () => {
    rpc.mockImplementation((name: string) =>
      Promise.resolve(
        name === "listar_tareas_rastreo_v2"
          ? { data: [], error: null }
          : name === "obtener_configuracion_inicial_trackers_v2"
            ? {
                data: {
                  areas: [
                    {
                      area_id: "area-1",
                      area_nombre: "Área uno",
                      grupos_tracker: [{ group_id: 17831 }],
                    },
                  ],
                },
                error: null,
              }
            : { data: { areas: [] }, error: null },
      ),
    );

    await tareasSeguimientoService.loadWorkspace({
      ...filters,
      areaId: "area-1",
    });

    expect(loadNavixyTrackers).toHaveBeenCalledWith({ groupIds: [17831] });
  });
});
