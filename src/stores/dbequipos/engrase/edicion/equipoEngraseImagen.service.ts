import { supabaseEquipos } from "@/lib/supabase";
import {
  IMAGEN_EQUIPO_BUCKET,
  esRutaImagenEquipoValida,
} from "./equipoEngraseImagen.types";

const asegurarRuta = (path: string): void => {
  if (!esRutaImagenEquipoValida(path))
    throw new Error("La ruta de imagen no es válida.");
};

export const equipoEngraseImagenService = {
  async subir(path: string, file: File): Promise<void> {
    asegurarRuta(path);
    const { error } = await supabaseEquipos.storage
      .from(IMAGEN_EQUIPO_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: "image/webp",
        upsert: false,
      });
    if (error) throw new Error(error.message || "No se pudo subir la imagen.");
  },
  async eliminar(path: string): Promise<void> {
    asegurarRuta(path);
    const { error } = await supabaseEquipos.storage
      .from(IMAGEN_EQUIPO_BUCKET)
      .remove([path]);
    if (error)
      throw new Error(error.message || "No se pudo eliminar la imagen.");
  },
  async mover(sourcePath: string, destinationPath: string): Promise<void> {
    asegurarRuta(sourcePath);
    asegurarRuta(destinationPath);
    const { error } = await supabaseEquipos.storage
      .from(IMAGEN_EQUIPO_BUCKET)
      .move(sourcePath, destinationPath);
    if (error) throw new Error(error.message || "No se pudo mover la imagen.");
  },
  obtenerUrlPublica(path: string | null): string | null {
    if (!path || !esRutaImagenEquipoValida(path)) return null;
    return supabaseEquipos.storage.from(IMAGEN_EQUIPO_BUCKET).getPublicUrl(path)
      .data.publicUrl;
  },
};
