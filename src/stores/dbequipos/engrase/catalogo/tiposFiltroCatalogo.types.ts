export const TIPO_FILTRO_NOMBRE_MAX = 100;

export type CatalogoEstadoFiltro = "activos" | "desactivados" | "todos";
export type CatalogoTipoFiltroSortKey = "nombre" | "estado" | "uso";
export type CatalogoSortDirection = "asc" | "desc";
export type CatalogoTipoFiltroEditorMode = "cerrado" | "crear" | "editar";

export interface CatalogoTipoEquipoImpacto {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoImpacto {
  totalEquipos: number;
  totalAsignaciones: number;
  tiposEquipo: CatalogoTipoEquipoImpacto[];
}

export interface CatalogoTipoFiltroItem {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  impacto: CatalogoImpacto;
}

export interface CatalogoTiposFiltroResumen {
  total: number;
  activos: number;
  desactivados: number;
}

export interface CatalogoTipoEquipoImpactoRpc {
  id: number;
  nombre: string;
  cantidad_equipos: number;
}

export interface CatalogoTipoFiltroRpcItem {
  id: number;
  nombre: string;
  activo: boolean;
  creado_en: string | null;
  actualizado_en: string | null;
  impacto: {
    total_equipos: number;
    total_asignaciones: number;
    tipos_equipo: CatalogoTipoEquipoImpactoRpc[];
  };
}

export interface CatalogoTiposFiltroListarRpcResponse {
  ok: boolean;
  items: CatalogoTipoFiltroRpcItem[];
  resumen: {
    total: number;
    activos: number;
    desactivados: number;
  };
}

export interface CatalogoTipoFiltroGuardarInput {
  id: number | null;
  nombre: string;
  activo: boolean;
}

export interface CatalogoTipoFiltroGuardarResultado {
  operacion: "creado" | "actualizado";
  codigo: "TIPO_FILTRO_CREADO" | "TIPO_FILTRO_ACTUALIZADO";
  mensaje: string;
  afectaEquipos: number;
  item: CatalogoTipoFiltroItem;
}

export interface CatalogoTipoFiltroGuardarRpcResponse {
  ok: boolean;
  operacion: "creado" | "actualizado";
  codigo: "TIPO_FILTRO_CREADO" | "TIPO_FILTRO_ACTUALIZADO";
  mensaje: string;
  afecta_equipos: number;
  item: CatalogoTipoFiltroRpcItem;
}

export interface CatalogoTipoFiltroFieldErrors {
  nombre?: string;
}
