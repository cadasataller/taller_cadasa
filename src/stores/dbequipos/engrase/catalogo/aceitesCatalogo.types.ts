export const ACEITE_NOMBRE_MAX = 100;

export type CatalogoAceiteEstado = "activos" | "desactivados" | "todos";
export type CatalogoAceiteUso = "en-uso" | "sin-uso" | "todos";
export type CatalogoAceiteSortKey = "nombre" | "sistemas" | "estado";
export type CatalogoSortDirection = "asc" | "desc";
export type CatalogoAceiteEditorMode = "cerrado" | "crear" | "editar";

export interface CatalogoSistemaRelacionado { id: number; nombre: string; cantidadEquipos: number }
export interface CatalogoTipoEquipoImpacto { id: number; nombre: string; cantidadEquipos: number }
export interface CatalogoAceiteImpacto {
  totalEquipos: number;
  totalAsignaciones: number;
  tiposEquipo: CatalogoTipoEquipoImpacto[];
}
export interface CatalogoAceiteItem {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  sistemas: CatalogoSistemaRelacionado[];
  impacto: CatalogoAceiteImpacto;
}
export interface CatalogoAceitesResumen { total: number; activos: number; desactivados: number }
export interface CatalogoAceiteRpcItem {
  id: number; nombre: string; activo: boolean; creado_en: string | null; actualizado_en: string | null;
  sistemas: Array<{ id: number; nombre: string; cantidad_equipos: number }>;
  impacto: { total_equipos: number; total_asignaciones: number; tipos_equipo: Array<{ id: number; nombre: string; cantidad_equipos: number }> };
}
export interface CatalogoAceitesListarRpcResponse { ok: boolean; items: CatalogoAceiteRpcItem[]; resumen: { total: number; activos: number; desactivados: number } }
export interface CatalogoAceiteGuardarInput { id: number | null; nombre: string; activo: boolean }
export interface CatalogoAceiteGuardarRpcResponse { ok: boolean; operacion: "creado" | "actualizado"; codigo: "ACEITE_CREADO" | "ACEITE_ACTUALIZADO"; mensaje: string; afecta_equipos: number; item: CatalogoAceiteRpcItem }
export interface CatalogoAceiteGuardarResultado { operacion: "creado" | "actualizado"; codigo: "ACEITE_CREADO" | "ACEITE_ACTUALIZADO"; mensaje: string; afectaEquipos: number; item: CatalogoAceiteItem }
export interface CatalogoAceiteFieldErrors { nombre?: string }
export interface CatalogoAceitesQuery { busqueda: string; sistemaId: number | null; estado: CatalogoAceiteEstado; uso: CatalogoAceiteUso }
