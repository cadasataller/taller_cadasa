import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  schema: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseEquipos: { schema: mocks.schema },
}));

import { tiposFiltroCatalogoService } from "./tiposFiltroCatalogo.service";

const row = {
  id: 4,
  nombre: "  Aire  ",
  activo: true,
  creado_en: "2026-08-12T10:00:00Z",
  actualizado_en: "2026-08-12T10:00:00Z",
  impacto: {
    total_equipos: 2,
    total_asignaciones: 3,
    tipos_equipo: [],
  },
};

describe("tiposFiltroCatalogoService", () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.schema.mockReset();
    mocks.schema.mockReturnValue({ rpc: mocks.rpc });
  });

  it("lista desde el schema engrase sin parámetros funcionales", async () => {
    mocks.rpc.mockResolvedValue({
      data: { ok: true, items: [row], resumen: { total: 1, activos: 1, desactivados: 0 } },
      error: null,
    });

    const result = await tiposFiltroCatalogoService.listar();

    expect(mocks.schema).toHaveBeenCalledWith("engrase");
    expect(mocks.rpc).toHaveBeenCalledWith("rpc_catalogo_tipos_filtro_listar");
    expect(result.items[0]?.nombre).toBe("Aire");
  });

  it("guarda únicamente el contrato editable y normaliza el nombre", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        ok: true,
        operacion: "actualizado",
        codigo: "TIPO_FILTRO_ACTUALIZADO",
        mensaje: "Tipo de filtro actualizado.",
        afecta_equipos: 2,
        item: row,
      },
      error: null,
    });

    await tiposFiltroCatalogoService.guardar({ id: 4, nombre: "  Aire  ", activo: true });

    expect(mocks.rpc).toHaveBeenCalledWith("rpc_catalogo_tipo_filtro_guardar", {
      p_data: { id: 4, nombre: "Aire", activo: true },
    });
  });

  it("rechaza respuestas que no cumplen el contrato", async () => {
    mocks.rpc.mockResolvedValue({ data: { ok: true, items: [{}] }, error: null });

    await expect(tiposFiltroCatalogoService.listar()).rejects.toMatchObject({
      codigo: "RESPUESTA_INVALIDA",
    });
  });
});
