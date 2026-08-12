import { beforeEach, describe, expect, it, vi } from "vitest";

const createSignedUrl = vi.hoisted(() => vi.fn());
const from = vi.hoisted(() => vi.fn(() => ({ createSignedUrl })));
vi.mock("@/lib/supabase", () => ({
  supabaseEquipos: { storage: { from } },
}));

import { equipoEngraseImagenService } from "./equipoEngraseImagen.service";

describe("URL firmada de imagen de equipo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("firma una ruta válida del bucket privado", async () => {
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.test/signed-image" },
      error: null,
    });
    await expect(
      equipoEngraseImagenService.obtenerUrlFirmada(
        "equipos/422017/main_thumb/imagen.webp",
      ),
    ).resolves.toBe("https://storage.test/signed-image");
    expect(from).toHaveBeenCalledWith("imagenes-equipos");
    expect(createSignedUrl).toHaveBeenCalledWith(
      "equipos/422017/main_thumb/imagen.webp",
      600,
    );
  });

  it("no intenta firmar rutas fuera del contrato", async () => {
    await expect(
      equipoEngraseImagenService.obtenerUrlFirmada("422017/main.webp"),
    ).rejects.toThrow("La ruta de imagen no es válida.");
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("expone un error legible cuando Storage no firma", async () => {
    createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Object not found" },
    });
    await expect(
      equipoEngraseImagenService.obtenerUrlFirmada(
        "equipos/422017/main_thumb/imagen.webp",
      ),
    ).rejects.toThrow("Object not found");
  });
});
