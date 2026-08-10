export type FiltrosEngraseEstadoEquipo = "activo" | "descartado";
export interface EquipoEngraseRow {
  id: number;
  codigo: string;
  tipo_equipo_id: number;
  tipo_equipo: string;
  subtipo: string | null;
  estado: FiltrosEngraseEstadoEquipo;
  main_storage_path: string | null;
  tiene_imagen_main: boolean;
  imagen_actualizada_en: string | null;
}
export interface EquipoEngraseListItem extends EquipoEngraseRow {
  etapas: EtapaEngrase[];
  imageUrl?: string | null;
}
export interface TipoEquipoEngrase {
  id: number;
  nombre: string;
}
export interface EtapaEngrase {
  id: number;
  nombre: string;
}
export interface TipoFiltroEngrase {
  id: number;
  nombre: string;
}
export interface FiltroEngrase {
  id: number;
  codigo: string;
  esta_en_lista_compras: boolean;
}
export interface EquipoFiltroRow {
  id: number;
  equipo_id: number;
  tipo_filtro_id: number;
  filtro_id: number;
  cantidad: number;
}
export interface EquipoFiltroDetalle extends EquipoFiltroRow {
  tipoFiltro: TipoFiltroEngrase;
  filtro: FiltroEngrase;
}
export interface EquipoAceiteDetalle {
  sistema: string;
  aceite: string;
}
export interface FiltroEquivalenciaRow {
  id: number;
  filtro_original_id: number;
  filtro_equivalente_id: number;
  activo: boolean;
  codigo_equivalente?: string;
}
export interface FiltroCodigoSugerencia {
  codigo: string;
  esOriginal: boolean;
  esEquivalente: boolean;
}
export interface FiltrosEngraseQuery {
  estadoEquipo: FiltrosEngraseEstadoEquipo;
  tipoEquipoId: number | null;
  tipoFiltroId: number | null;
  modelo: string;
  etapaIds: number[];
  codigoExactoSeleccionado: string | null;
}
