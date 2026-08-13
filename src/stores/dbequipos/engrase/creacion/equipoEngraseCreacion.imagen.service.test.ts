import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.hoisted(() => vi.fn());
const schemaMock = vi.hoisted(() => vi.fn(() => ({ rpc: rpcMock })));
vi.mock("@/lib/supabase", () => ({ supabaseEquipos: { schema: schemaMock } }));

import { equipoEngraseCreacionImagenService } from "./equipoEngraseCreacion.imagen.service";

describe("servicio de imagen de creación", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registra únicamente la operación agregar con los parámetros exactos", async () => {
    rpcMock.mockResolvedValue({
      data: {
        ok: true, codigo: "410003", equipo_id: 10, operacion: "agregar",
        imagen: { main_storage_path: "equipos/410003/main_thumb/a.webp", tiene_imagen_main: true, imagen_actualizada_en: null },
      },
      error: null,
    });
    await expect(equipoEngraseCreacionImagenService.agregarImagenEquipoCreado({
      codigoEquipo: "410003", storagePath: "equipos/410003/main_thumb/a.webp", descripcion: null,
    })).resolves.toMatchObject({ equipoId: 10, operacion: "agregar" });
    expect(schemaMock).toHaveBeenCalledWith("engrase");
    expect(rpcMock).toHaveBeenCalledWith("rpc_administrar_imagen_equipo", {
      p_codigo_equipo: "410003", p_operacion: "agregar",
      p_storage_path: "equipos/410003/main_thumb/a.webp", p_descripcion: null,
    });
  });
});
