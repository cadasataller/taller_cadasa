import type { OperacionImagenEquipo } from "./equipoEngraseEdicion.types";
export {
  IMAGEN_EQUIPO_MAX_BYTES,
  IMAGEN_EQUIPO_MAX_SIDE,
  IMAGEN_EQUIPO_WEBP_QUALITY,
  IMAGEN_EQUIPO_BUCKET,
  crearRutaImagenEquipo,
  esRutaImagenEquipoValida,
} from "../imagen/equipoEngraseImagen.types";
export type { ImagenEquipoPreparada } from "../imagen/equipoEngraseImagen.types";

export type OperacionImagenUi = OperacionImagenEquipo;
export type ImagenSyncState =
  | { kind: "idle" }
  | { kind: "processing"; operation: OperacionImagenUi }
  | { kind: "cleanup_pending"; path: string }
  | { kind: "move_pending"; sourcePath: string; destinationPath: string }
  | { kind: "error"; message: string };
