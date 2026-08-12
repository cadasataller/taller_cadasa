import type { OperacionImagenEquipo } from "./equipoEngraseEdicion.types";

export const IMAGEN_EQUIPO_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGEN_EQUIPO_MAX_SIDE = 1600;
export const IMAGEN_EQUIPO_WEBP_QUALITY = 0.86;
export const IMAGEN_EQUIPO_BUCKET = "imagenes-equipos";

export type OperacionImagenUi = OperacionImagenEquipo;
export type ImagenSyncState =
  | { kind: "idle" }
  | { kind: "processing"; operation: OperacionImagenUi }
  | { kind: "cleanup_pending"; path: string }
  | { kind: "move_pending"; sourcePath: string; destinationPath: string }
  | { kind: "error"; message: string };

export interface ImagenEquipoPreparada {
  file: File;
  previewUrl: string;
}

export const esRutaImagenEquipoValida = (path: string): boolean =>
  /^equipos\/[^/]+\/main_thumb\/[^/]+\.webp$/u.test(path);

export const crearRutaImagenEquipo = (codigo: string): `${string}.webp` => {
  const codigoSeguro = codigo.trim().replace(/[^a-zA-Z0-9_-]/gu, "_");
  const unico = `${Date.now()}_${crypto.randomUUID()}`;
  return `equipos/${codigoSeguro}/main_thumb/${unico}.webp`;
};
