export const SISTEMA_NOMBRE_MAX = 100;

export type CatalogoSistemaEstado = "activos" | "desactivados" | "todos";
export type CatalogoSistemaUso = "en-uso" | "sin-uso" | "todos";
export type CatalogoSistemaSortKey = "nombre" | "estado" | "equipos" | "asignaciones";
export type CatalogoSortDirection = "asc" | "desc";
export type CatalogoSistemaEditorMode = "cerrado" | "crear" | "editar";

export interface CatalogoAceiteRelacionado { id: number; nombre: string; cantidadEquipos: number }
export interface CatalogoTipoEquipoImpacto { id: number; nombre: string; cantidadEquipos: number }
export interface CatalogoSistemaImpacto { totalEquipos: number; totalAsignaciones: number; tiposEquipo: CatalogoTipoEquipoImpacto[] }
export interface CatalogoSistemaItem {
  id: number; nombre: string; activo: boolean; creadoEn: string | null; actualizadoEn: string | null;
  aceites: CatalogoAceiteRelacionado[]; impacto: CatalogoSistemaImpacto;
}
export interface CatalogoSistemasResumen { total: number; activos: number; desactivados: number }
export interface CatalogoSistemaRpcItem {
  id: number; nombre: string; activo: boolean; creado_en: string | null; actualizado_en: string | null;
  aceites: Array<{ id: number; nombre: string; cantidad_equipos: number }>;
  impacto: { total_equipos: number; total_asignaciones: number; tipos_equipo: Array<{ id: number; nombre: string; cantidad_equipos: number }> };
}
export interface CatalogoSistemasListarRpcResponse { ok: boolean; items: CatalogoSistemaRpcItem[]; resumen: { total: number; activos: number; desactivados: number } }
export interface CatalogoSistemaGuardarInput { id: number | null; nombre: string; activo: boolean }
export interface CatalogoSistemaGuardarRpcResponse { ok: boolean; operacion: "creado" | "actualizado"; codigo: "SISTEMA_CREADO" | "SISTEMA_ACTUALIZADO"; mensaje: string; afecta_equipos: number; item: CatalogoSistemaRpcItem }
export interface CatalogoSistemaGuardarResultado { operacion: "creado" | "actualizado"; codigo: "SISTEMA_CREADO" | "SISTEMA_ACTUALIZADO"; mensaje: string; afectaEquipos: number; item: CatalogoSistemaItem }
export interface CatalogoSistemaFieldErrors { nombre?: string }
export interface CatalogoSistemasQuery { busqueda: string; estado: CatalogoSistemaEstado; uso: CatalogoSistemaUso }
