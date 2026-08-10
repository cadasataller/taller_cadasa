import { describe, expect, it } from "vitest";
import { esRutaImagenEquipoValida } from "./equipoEngraseImagen.types";

describe("rutas de Storage para imágenes de equipo", () => {
  it("acepta únicamente la ruta WebP de miniatura principal", () => {
    expect(
      esRutaImagenEquipoValida("equipos/410002/main_thumb/imagen.webp"),
    ).toBe(true);
    expect(esRutaImagenEquipoValida("equipos/410002/imagen.png")).toBe(false);
    expect(esRutaImagenEquipoValida("../otra-ruta.webp")).toBe(false);
  });
});
