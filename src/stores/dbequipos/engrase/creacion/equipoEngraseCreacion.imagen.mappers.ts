import { crearErrorCreacionEquipo } from "./equipoEngraseCreacion.remote-errors";
import type { AgregarImagenEquipoCreadoDto } from "./equipoEngraseCreacion.imagen.dto";
import type { AgregarImagenEquipoCreadoRespuesta } from "./equipoEngraseCreacion.types";

export function mapAgregarImagenEquipoCreado(
  dto: AgregarImagenEquipoCreadoDto,
): AgregarImagenEquipoCreadoRespuesta {
  if (!dto.ok)
    throw crearErrorCreacionEquipo(
      dto.mensaje || "No se pudo registrar la imagen.",
      dto.codigo,
    );
  if (
    dto.equipo_id === undefined ||
    dto.operacion !== "agregar" ||
    !dto.imagen ||
    dto.imagen.main_storage_path === null ||
    dto.imagen.tiene_imagen_main !== true
  ) {
    throw crearErrorCreacionEquipo(
      "Respuesta de imagen incompleta.",
      "RESPUESTA_IMAGEN_INCOMPLETA",
    );
  }
  return {
    codigo: dto.codigo,
    equipoId: dto.equipo_id,
    operacion: "agregar",
    imagen: {
      mainStoragePath: dto.imagen.main_storage_path,
      tieneImagenMain: true,
      imagenActualizadaEn: dto.imagen.imagen_actualizada_en,
    },
    storagePathAnterior: dto.storage_path_anterior ?? null,
  };
}
