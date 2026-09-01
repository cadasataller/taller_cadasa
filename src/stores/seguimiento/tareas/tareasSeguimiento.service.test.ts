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
  tipo_tarea_codigo: "duda_automatica",
  tipo_tarea_nombre: "Duda automática",
  ubicacion_id: null,
  usuario_asignado_id: null,
  usuario_nombre: null,
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

    const workspace = await tareasSeguimientoService.loadWorkspace({
      ...filters,
      areaId: "area-1",
      scheduledDate: "2026-09-01",
      sourceId: 1,
    });

    expect(rpc).toHaveBeenCalledWith("listar_tareas_rastreo_v2", {
      p_area_id: "area-1",
      p_fecha: "2026-09-01",
      p_usuario_asignado_id: null,
      p_source_id: 1,
      p_estado_operativo_codigo: null,
      p_incluir_canceladas: false,
    });
    expect(rpc).toHaveBeenCalledWith(
      "obtener_configuracion_inicial_trackers_v2",
    );
    expect(workspace.tasks[0]?.type).toBe("duda");
  });

  it("carga y mapea las rutas planificadas mediante su RPC", async () => {
    rpc.mockResolvedValue({
      data: {
        rutas: [
          {
            ruta_id: "a4cb0000-5bd4-4d94-8694-cc3b8fe4bea8",
            version_actual: 2,
            estado_calculo: "calculada",
            area_id: "21e9fe15-5f33-4ecb-a100-c07f3cdee786",
            usuario_id: null,
            fecha_programada: "2026-09-01",
            tracker_id: 10488914,
            source_id: 10319800,
            tracker_label: "Tracker 1",
            proveedor: "openrouteservice",
            origen_tipo: "ubicacion_tracker",
            origen: { lat: 8.39, lng: -82.59 },
            origen_capturada_en: null,
            recorrido_tracker_id: null,
            polilinea_geojson: {
              type: "LineString",
              coordinates: [
                [-82.59, 8.39],
                [-82.58, 8.4],
              ],
            },
            cache_calculada_en: null,
            cache_expira_en: null,
            motivo_ultima_actualizacion_id: null,
            creada_en: "2026-09-01T00:00:00Z",
            actualizado_en: "2026-09-01T00:00:00Z",
            paradas: [],
          },
        ],
      },
      error: null,
    });

    await expect(
      tareasSeguimientoService.loadPlannedRoutes({
        p_area_id: "21e9fe15-5f33-4ecb-a100-c07f3cdee786",
        p_fecha: "2026-09-01",
        p_usuario_id: null,
        p_source_id: 10319800,
      }),
    ).resolves.toMatchObject([
      {
        id: "a4cb0000-5bd4-4d94-8694-cc3b8fe4bea8",
        version: 2,
        sourceId: 10319800,
      },
    ]);
    expect(rpc).toHaveBeenCalledWith("listar_rutas_planificadas_v2", {
      p_area_id: "21e9fe15-5f33-4ecb-a100-c07f3cdee786",
      p_fecha: "2026-09-01",
      p_usuario_id: null,
      p_source_id: 10319800,
    });
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
                  tipo_codigo: "duda_automatica",
                  ubicacion_id: null,
                  tiempo_estimado_minutos: 30,
                  orden_ruta: null,
                  punto_enrutado: null,
                  ubicacion_visual: {
                    lat: 8.3833332061767,
                    lng: -82.5899810791011,
                    origen: "zona_permanencia",
                    zona_id: "permanence-zone-1",
                  },
                  linea_control: null,
                  zonas_control: [],
                  zonas_permanencia: [
                    {
                      id: "permanence-zone-1",
                      geom: {
                        type: "MultiPolygon",
                        coordinates: [
                          [
                            [
                              [-82.590026477, 8.383287997],
                              [-82.590026477, 8.383378416],
                              [-82.589935681, 8.383378416],
                              [-82.590026477, 8.383287997],
                            ],
                          ],
                        ],
                      },
                      origen: "automatica_tracker",
                      tipo_zona: "duda_automatica",
                      punto_representativo: {
                        lat: 8.3833332061767,
                        lng: -82.5899810791011,
                      },
                    },
                  ],
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
                  prioridad_nombre: null,
                  estado_tarea_codigo: "pendiente",
                  estado_tarea_nombre: "Pendiente",
                  estado_operativo_codigo: "sin_iniciar",
                  estado_operativo_nombre: "Sin iniciar",
                },
                tiempo: {
                  cantidad_visitas: 0,
                  segundos_totales: 0,
                  segundos_visita_abierta: 0,
                  segundos_sin_datos: 0,
                  visita_abierta: false,
                  llegada_actual_en: null,
                  primera_llegada_en: null,
                  ultima_salida_en: null,
                },
                visitas: [],
                ruta: {
                  ruta_planificada_id: null,
                  estado_calculo: null,
                },
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
    ).resolves.toMatchObject({
      id: "task-1",
      type: "duda",
      visualLocation: {
        latitude: 8.3833332061767,
        longitude: -82.5899810791011,
      },
      permanenceZones: [
        {
          type: "MultiPolygon",
        },
      ],
    });
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
