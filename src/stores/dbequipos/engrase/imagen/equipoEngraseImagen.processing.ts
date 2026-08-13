import {
  IMAGEN_EQUIPO_MAX_BYTES,
  IMAGEN_EQUIPO_MAX_SIDE,
  IMAGEN_EQUIPO_WEBP_QUALITY,
} from "./equipoEngraseImagen.types";
import type { ImagenEquipoPreparada } from "./equipoEngraseImagen.types";

export async function prepararImagenEquipoWebp(
  archivo: File,
): Promise<ImagenEquipoPreparada> {
  if (!archivo.type.startsWith("image/"))
    throw new Error("Selecciona un archivo de imagen válido.");
  if (archivo.size > IMAGEN_EQUIPO_MAX_BYTES)
    throw new Error("La imagen no puede superar 5 MB.");
  const origen = URL.createObjectURL(archivo);
  try {
    const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
      const elemento = new Image();
      elemento.onload = () => resolve(elemento);
      elemento.onerror = () =>
        reject(new Error("No se pudo leer la imagen seleccionada."));
      elemento.src = origen;
    });
    const escala = Math.min(
      1,
      IMAGEN_EQUIPO_MAX_SIDE /
        Math.max(imagen.naturalWidth, imagen.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("No se pudo preparar la imagen.");
    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (resultado) =>
          resultado
            ? resolve(resultado)
            : reject(new Error("No se pudo convertir la imagen a WebP.")),
        "image/webp",
        IMAGEN_EQUIPO_WEBP_QUALITY,
      ),
    );
    const file = new File([blob], "imagen-equipo.webp", {
      type: "image/webp",
      lastModified: Date.now(),
    });
    return { file, previewUrl: URL.createObjectURL(file) };
  } finally {
    URL.revokeObjectURL(origen);
  }
}
