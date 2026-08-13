export type EquipoEstado = "activo" | "descartado";

export interface CatalogoIdNombre {
  id: number;
  nombre: string;
}

export interface CatalogoExistenteReference extends CatalogoIdNombre {
  estado: "existente";
  tempId: null;
}

export interface CatalogoTemporalReference {
  estado: "nuevo";
  id: null;
  tempId: string;
  nombre: string;
}

export type CatalogoDraftReference =
  | CatalogoExistenteReference
  | CatalogoTemporalReference;
