import { supabaseEquipos } from "@/lib/supabase";
import { mapAgregarImagenEquipoCreado } from "./equipoEngraseCreacion.imagen.mappers";
import { crearErrorCreacionEquipo } from "./equipoEngraseCreacion.remote-errors";
import type { AgregarImagenEquipoCreadoDto } from "./equipoEngraseCreacion.imagen.dto";
import type {
  AgregarImagenEquipoCreadoInput,
  AgregarImagenEquipoCreadoRespuesta,
} from "./equipoEngraseCreacion.types";

export const equipoEngraseCreacionImagenService = {
  async agregarImagenEquipoCreado(
    entrada: AgregarImagenEquipoCreadoInput,
  ): Promise<AgregarImagenEquipoCreadoRespuesta> {
    const { data, error } = await supabaseEquipos
      .schema("engrase")
      .rpc("rpc_administrar_imagen_equipo", {
        p_codigo_equipo: entrada.codigoEquipo,
        p_operacion: "agregar",
        p_storage_path: entrada.storagePath,
        p_descripcion: entrada.descripcion,
      });
    if (error)
      throw crearErrorCreacionEquipo(
        error.message || "No se pudo registrar la imagen.",
      );
    if (data === null)
      throw crearErrorCreacionEquipo("La RPC no devolvió la imagen.");
    return mapAgregarImagenEquipoCreado(data as AgregarImagenEquipoCreadoDto);
  },
};
