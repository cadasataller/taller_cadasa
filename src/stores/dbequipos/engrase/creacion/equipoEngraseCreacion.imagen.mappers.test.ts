import { describe, expect, it } from "vitest";
import { mapAgregarImagenEquipoCreado } from "./equipoEngraseCreacion.imagen.mappers";

const respuesta = {
  ok: true,
  codigo: "410003",
  equipo_id: 10,
  operacion: "agregar" as const,
  imagen: {
    main_storage_path: "equipos/410003/main_thumb/a.webp",
    tiene_imagen_main: true,
    imagen_actualizada_en: "2026-08-13T00:00:00Z",
  },
  storage_path_anterior: null,
};

describe("mapper de imagen para creación", () => {
  it("convierte la respuesta exitosa a contrato local", () => {
    expect(mapAgregarImagenEquipoCreado(respuesta)).toEqual({
      codigo: "410003", equipoId: 10, operacion: "agregar",
      imagen: { mainStoragePath: "equipos/410003/main_thumb/a.webp", tieneImagenMain: true, imagenActualizadaEn: "2026-08-13T00:00:00Z" },
      storagePathAnterior: null,
    });
  });

  it("rechaza respuestas incompletas o incompatibles", () => {
    expect(() => mapAgregarImagenEquipoCreado({ ...respuesta, operacion: undefined })).toThrow("Respuesta de imagen incompleta.");
    expect(() => mapAgregarImagenEquipoCreado({ ...respuesta, imagen: { ...respuesta.imagen, main_storage_path: null } })).toThrow("Respuesta de imagen incompleta.");
    expect(() => mapAgregarImagenEquipoCreado({ ...respuesta, imagen: { ...respuesta.imagen, tiene_imagen_main: false } })).toThrow("Respuesta de imagen incompleta.");
  });
});
