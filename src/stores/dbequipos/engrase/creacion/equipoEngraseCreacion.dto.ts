import type {
  BuscarFiltroOriginalDto as BuscarFiltroOriginalEdicionDto,
  ObtenerAuxiliaresEdicionDto,
} from "../edicion/equipoEngraseEdicion.types";
import type { EquipoEstado } from "../shared/equipoEngraseDraft.types";
import type { EquipoEngraseListItemDto } from "../shared/equipoEngraseListItem.mapper";

export type ObtenerAuxiliaresEquipoDto = ObtenerAuxiliaresEdicionDto;
export type BuscarFiltroOriginalDto = BuscarFiltroOriginalEdicionDto;

export type ValidarCodigoEquipoCreacionDto =
  | { puede_crearse: true }
  | { puede_crearse: false; modelo: string | null; activo: boolean | null };

export interface CrearEquipoCompletoDto {
  ok: boolean;
  codigo: string;
  mensaje: string;
  equipo_lista?: EquipoEngraseListItemDto;
  resumen_operaciones?: {
    etapas_agregadas: number;
    filtros_agregados: number;
    aceites_agregados: number;
  };
}

export type { EquipoEstado };
