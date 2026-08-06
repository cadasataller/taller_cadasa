import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AdministrarImagenEquipoEntrada,
  CambiosEquipoPayload,
  ObtenerEquipoParaEdicionDto,
} from "./equipoEngraseEdicion.types";

const rpcMock = vi.hoisted(() => vi.fn());
const schemaMock = vi.hoisted(() => vi.fn(() => ({ rpc: rpcMock })));
vi.mock("@/lib/supabase", () => ({ supabaseEquipos: { schema: schemaMock } }));

import { equipoEngraseEdicionService } from "./equipoEngraseEdicion.service";

const respuestaEquipo: ObtenerEquipoParaEdicionDto = {
  ok: true,
  equipo: {
    id: 6,
    codigo: "410002",
    tipo_equipo_id: 1,
    tipo_equipo: "Buses",
    subtipo: "Bus",
    estado: "activo",
  },
};

describe("servicio de edición de equipos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envía el código a la RPC de lectura", async () => {
    rpcMock.mockResolvedValue({ data: respuestaEquipo, error: null });
    await expect(
      equipoEngraseEdicionService.obtenerEquipoParaEdicion("410002"),
    ).resolves.toMatchObject({ equipo: { codigo: "410002" } });
    expect(rpcMock).toHaveBeenCalledWith("rpc_obtener_equipo_para_edicion", {
      p_codigo: "410002",
    });
  });
  it("envía código de equipo al buscar exclusivamente el filtro original", async () => {
    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        encontrado: false,
        codigo: "FILTRO_NO_ENCONTRADO",
        codigo_buscado: "XYZ",
        puede_crearse: true,
      },
      error: null,
    });
    await equipoEngraseEdicionService.buscarFiltroOriginalParaAsignar(
      "XYZ",
      "410002",
    );
    expect(rpcMock).toHaveBeenCalledWith(
      "rpc_buscar_filtro_original_para_asignar",
      { p_codigo: "XYZ", p_codigo_equipo: "410002" },
    );
  });
  it("preserva un payload parcial sin completar secciones", async () => {
    const cambios: CambiosEquipoPayload = {
      etapas: { agregadas: [{ estado_operacion: "nuevo", etapa_id: 2 }] },
    };
    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        codigo: "EQUIPO_ACTUALIZADO",
        mensaje: "ok",
        equipo_lista: {
          id: 6,
          codigo: "410002",
          tipo_equipo_id: 1,
          tipo_equipo: "Buses",
          subtipo: "Bus",
          estado: "activo",
          main_storage_path: null,
          tiene_imagen_main: false,
          imagen_actualizada_en: null,
          etapas: [],
        },
        cambios_detalle: {
          datos_equipo_cambiaron: false,
          etapas_cambiaron: true,
          filtros_cambiaron: false,
          aceites_cambiaron: false,
        },
        resumen_operaciones: {
          etapas_agregadas: 1,
          etapas_eliminadas: 0,
          filtros_agregados: 0,
          filtros_actualizados: 0,
          filtros_eliminados: 0,
          historiales_filtro_creados: 0,
          aceites_agregados: 0,
          aceites_actualizados: 0,
          aceites_eliminados: 0,
        },
      },
      error: null,
    });
    await equipoEngraseEdicionService.actualizarEquipoCompleto(
      "410002",
      cambios,
    );
    expect(rpcMock).toHaveBeenCalledWith("rpc_actualizar_equipo_completo", {
      p_codigo_equipo: "410002",
      p_cambios: cambios,
    });
  });
  it("envía una entrada de imagen válida de la unión discriminada", async () => {
    const entrada: AdministrarImagenEquipoEntrada = {
      codigoEquipo: "410002",
      operacion: "eliminar",
      storagePath: null,
      descripcion: null,
    };
    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        codigo: "410002",
        equipo_id: 6,
        operacion: "eliminar",
        imagen: {
          main_storage_path: null,
          tiene_imagen_main: false,
          imagen_actualizada_en: null,
        },
        storage_path_anterior: "equipos/410002/main.webp",
      },
      error: null,
    });
    await equipoEngraseEdicionService.administrarImagenEquipo(entrada);
    expect(rpcMock).toHaveBeenCalledWith("rpc_administrar_imagen_equipo", {
      p_codigo_equipo: "410002",
      p_operacion: "eliminar",
      p_storage_path: null,
      p_descripcion: null,
    });
  });
});
