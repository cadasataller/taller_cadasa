export const FILTRO_CODIGO_MAX = 100;

export type CatalogoFiltroEstado = "activos" | "desactivados" | "todos";
export type CatalogoFiltroCompras = "en-compras" | "fuera-compras" | "todos";
export type CatalogoFiltroSortKey = "codigo" | "compras" | "estado";
export type CatalogoSortDirection = "asc" | "desc";
export type CatalogoFiltroEditorMode = "cerrado" | "crear" | "editar";

export interface CatalogoTipoFiltroRelacionado {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoTipoEquipoImpacto {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoFiltroImpacto {
  totalEquipos: number;
  totalAsignaciones: number;
  tiposEquipo: CatalogoTipoEquipoImpacto[];
}

export interface CatalogoFiltroItem {
  id: number;
  codigo: string;
  estaEnListaCompras: boolean;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  tiposFiltro: CatalogoTipoFiltroRelacionado[];
  impacto: CatalogoFiltroImpacto;
}

export interface CatalogoFiltrosResumen {
  total: number;
  activos: number;
  desactivados: number;
  enCompras: number;
  fueraCompras: number;
}

export interface CatalogoFiltroRpcItem {
  id: number;
  codigo: string;
  esta_en_lista_compras: boolean;
  activo: boolean;
  creado_en: string | null;
  actualizado_en: string | null;
  tipos_filtro: Array<{ id: number; nombre: string; cantidad_equipos: number }>;
  impacto: {
    total_equipos: number;
    total_asignaciones: number;
    tipos_equipo: Array<{ id: number; nombre: string; cantidad_equipos: number }>;
  };
}

export interface CatalogoFiltrosListarRpcResponse {
  ok: boolean;
  items: CatalogoFiltroRpcItem[];
  resumen: {
    total: number;
    activos: number;
    desactivados: number;
    en_compras: number;
    fuera_compras: number;
  };
}

export interface CatalogoFiltroGuardarInput {
  id: number | null;
  codigo: string;
  esta_en_lista_compras: boolean;
  activo: boolean;
}

export interface CatalogoFiltroGuardarRpcResponse {
  ok: boolean;
  operacion: "creado" | "actualizado";
  codigo: "FILTRO_CREADO" | "FILTRO_ACTUALIZADO";
  mensaje: string;
  afecta_equipos: number;
  item: CatalogoFiltroRpcItem;
}

export interface CatalogoFiltroGuardarResultado {
  operacion: "creado" | "actualizado";
  codigo: "FILTRO_CREADO" | "FILTRO_ACTUALIZADO";
  mensaje: string;
  afectaEquipos: number;
  item: CatalogoFiltroItem;
}

export interface CatalogoFiltroFieldErrors {
  codigo?: string;
}

export interface CatalogoFiltrosQuery {
  busqueda: string;
  tipoFiltroId: number | null;
  compras: CatalogoFiltroCompras;
  estado: CatalogoFiltroEstado;
}
