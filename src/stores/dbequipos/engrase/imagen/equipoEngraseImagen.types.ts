export const IMAGEN_EQUIPO_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGEN_EQUIPO_MAX_SIDE = 1600;
export const IMAGEN_EQUIPO_WEBP_QUALITY = 0.86;
export const IMAGEN_EQUIPO_BUCKET = "imagenes-equipos";

export interface ImagenEquipoPreparada {
  file: File;
  previewUrl: string;
}

export const esRutaImagenEquipoValida = (path: string): boolean =>
  /^equipos\/[^/]+\/main_thumb\/[^/]+\.webp$/u.test(path);

export const crearRutaImagenEquipo = (codigo: string): `${string}.webp` => {
  const codigoSeguro = codigo.trim().replace(/[^a-zA-Z0-9_-]/gu, "_");
  const unico = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `equipos/${codigoSeguro}/main_thumb/${Date.now()}_${unico}.webp`;
};
