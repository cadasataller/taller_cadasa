import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.hoisted(() => vi.fn());
const schemaMock = vi.hoisted(() => vi.fn(() => ({ rpc: rpcMock })));

vi.mock("@/lib/supabase", () => ({
  supabaseEquipos: { schema: schemaMock },
}));

import { filtrosEngraseService } from "./filtrosEngrase.service";

describe("servicio de filtros de engrase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("obtiene los aceites asociados mediante la RPC del equipo", async () => {
    rpcMock.mockResolvedValue({
      data: [{ sistema: "Motor", aceite: "15W-40" }],
      error: null,
    });

    await expect(filtrosEngraseService.obtenerAceitesDeEquipo(123)).resolves.toEqual([
      { sistema: "Motor", aceite: "15W-40" },
    ]);
    expect(rpcMock).toHaveBeenCalledWith("rpc_obtener_aceites_equipo", {
      p_equipo_id: 123,
    });
  });

  it("envía código y estado a la RPC de cambio de estado", async () => {
    rpcMock.mockResolvedValue({
      data: { ok: true, codigo: "422017", estado: "descartado" },
      error: null,
    });

    await expect(
      filtrosEngraseService.cambiarEstadoEquipo("422017", "descartado"),
    ).resolves.toBe("descartado");
    expect(rpcMock).toHaveBeenCalledWith("rpc_cambiar_estado_equipo", {
      p_codigo_equipo: "422017",
      p_estado: "descartado",
    });
  });
});
