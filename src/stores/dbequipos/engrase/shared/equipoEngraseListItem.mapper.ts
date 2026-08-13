import type { EquipoEngraseListItem } from "../filtrosEngrase.types";
import type { EquipoEstado } from "./equipoEngraseDraft.types";

export interface EquipoEngraseListItemDto {
  id: number;
  codigo: string;
  tipo_equipo_id: number;
  tipo_equipo: string;
  subtipo: string | null;
  estado: EquipoEstado;
  main_storage_path: string | null;
  tiene_imagen_main: boolean;
  imagen_actualizada_en: string | null;
  etapas: Array<{ id: number; nombre: string }>;
}

export const mapEquipoEngraseListItem = (
  dto: EquipoEngraseListItemDto,
): EquipoEngraseListItem => ({
  id: dto.id,
  codigo: dto.codigo,
  tipo_equipo_id: dto.tipo_equipo_id,
  tipo_equipo: dto.tipo_equipo,
  subtipo: dto.subtipo,
  estado: dto.estado,
  main_storage_path: dto.main_storage_path,
  tiene_imagen_main: dto.tiene_imagen_main,
  imagen_actualizada_en: dto.imagen_actualizada_en,
  etapas: dto.etapas.map((etapa) => ({ id: etapa.id, nombre: etapa.nombre })),
});
