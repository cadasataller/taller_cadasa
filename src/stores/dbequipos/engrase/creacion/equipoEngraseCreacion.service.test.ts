import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrearEquipoCompletoArgumento } from "./equipoEngraseCreacion.types";
import { ErrorCreacionEquipo } from "./equipoEngraseCreacion.remote-errors";

const rpcMock = vi.hoisted(() => vi.fn());
const schemaMock = vi.hoisted(() => vi.fn(() => ({ rpc: rpcMock })));
vi.mock("@/lib/supabase", () => ({ supabaseEquipos: { schema: schemaMock } }));

import { equipoEngraseCreacionService } from "./equipoEngraseCreacion.service";

const argumento: CrearEquipoCompletoArgumento = {
  datos: {
    datos_equipo: {
      codigo: "410003",
      subtipo: "Bus urbano",
      estado: "activo",
      tipo_equipo: { estado: "existente", id: 1, nombre: "Buses" },
    },
    etapas: { agregadas: [{ estado_operacion: "nuevo", etapa_id: 1 }] },
    filtros: { nuevos: [] },
    aceites: { nuevos: [] },
  },
};

describe("servicio de creación de equipos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa el esquema de engrase y los parámetros exactos de las lecturas", async () => {
    rpcMock
      .mockResolvedValueOnce({ data: { ok: true }, error: null })
      .mockResolvedValueOnce({ data: { puede_crearse: true }, error: null })
      .mockResolvedValueOnce({
        data: { ok: true, encontrado: false, codigo: "NO_ENCONTRADO" },
        error: null,
      });
    await equipoEngraseCreacionService.obtenerAuxiliaresEquipo();
    await equipoEngraseCreacionService.validarCodigoEquipoParaCreacion(" 410003 ");
    await equipoEngraseCreacionService.buscarFiltroOriginalParaCreacion(" lf-123 ");
    expect(schemaMock).toHaveBeenCalledTimes(3);
    expect(schemaMock).toHaveBeenLastCalledWith("engrase");
    expect(rpcMock).toHaveBeenNthCalledWith(1, "rpc_obtener_auxiliares_edicion_equipo", {});
    expect(rpcMock).toHaveBeenNthCalledWith(2, "rpc_validar_codigo_equipo_para_creacion", { p_codigo: "410003" });
    expect(rpcMock).toHaveBeenNthCalledWith(3, "rpc_buscar_filtro_original_para_asignar", { p_codigo: "LF-123" });
  });

  it("envía p_datos sin mutar el argumento ni realizar consultas adicionales", async () => {
    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        codigo: "EQUIPO_CREADO",
        mensaje: "ok",
        equipo_lista: {
          id: 1, codigo: "410003", tipo_equipo_id: 1, tipo_equipo: "Buses",
          subtipo: "Bus urbano", estado: "activo", main_storage_path: null,
          tiene_imagen_main: false, imagen_actualizada_en: null, etapas: [],
        },
        resumen_operaciones: { etapas_agregadas: 1, filtros_agregados: 0, aceites_agregados: 0 },
      },
      error: null,
    });
    const datosAntes = JSON.stringify(argumento);
    await equipoEngraseCreacionService.crearEquipoCompleto(argumento);
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("rpc_crear_equipo_completo", { p_datos: argumento.datos });
    expect(JSON.stringify(argumento)).toBe(datosAntes);
  });

  it("convierte errores remotos y respuestas nulas al error funcional", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "AUTENTICACION_REQUERIDA: inicia sesión" } });
    await expect(equipoEngraseCreacionService.obtenerAuxiliaresEquipo()).rejects.toMatchObject({
      codigo: "AUTENTICACION_REQUERIDA",
    });
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(equipoEngraseCreacionService.validarCodigoEquipoParaCreacion("410003")).rejects.toThrow(
      "La RPC no devolvió la validación del código.",
    );
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(equipoEngraseCreacionService.buscarFiltroOriginalParaCreacion("X")).rejects.toBeInstanceOf(
      ErrorCreacionEquipo,
    );
  });
});
