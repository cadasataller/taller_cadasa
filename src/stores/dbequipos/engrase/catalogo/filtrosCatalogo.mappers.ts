import { CatalogoFiltrosError } from "./filtrosCatalogo.errors";
import type {
  CatalogoFiltroGuardarResultado, CatalogoFiltroItem, CatalogoFiltrosResumen,
  CatalogoTipoEquipoImpacto, CatalogoTipoFiltroRelacionado,
} from "./filtrosCatalogo.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function invalid(message: string): never {
  throw new CatalogoFiltrosError("RESPUESTA_INVALIDA", message);
}

function positiveId(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return invalid(`El campo ${field} debe ser un ID positivo.`);
  }
  return value;
}

function count(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return invalid(`El campo ${field} debe ser un número no negativo.`);
  }
  return value;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) return invalid(`El campo ${field} es obligatorio.`);
  return value.trim();
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim() || Number.isNaN(Date.parse(value))) return null;
  return value;
}

function bool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") return invalid(`El campo ${field} debe ser booleano.`);
  return value;
}

function mapRelatedType(value: unknown): CatalogoTipoFiltroRelacionado {
  if (!isRecord(value)) return invalid("Un tipo de filtro relacionado es inválido.");
  return {
    id: positiveId(value.id, "tipos_filtro.id"),
    nombre: text(value.nombre, "tipos_filtro.nombre"),
    cantidadEquipos: count(value.cantidad_equipos, "tipos_filtro.cantidad_equipos"),
  };
}

function mapEquipmentType(value: unknown): CatalogoTipoEquipoImpacto {
  if (!isRecord(value)) return invalid("Un tipo de equipo del impacto es inválido.");
  return {
    id: positiveId(value.id, "impacto.tipos_equipo.id"),
    nombre: text(value.nombre, "impacto.tipos_equipo.nombre"),
    cantidadEquipos: count(value.cantidad_equipos, "impacto.tipos_equipo.cantidad_equipos"),
  };
}

export function mapCatalogoFiltroItem(value: unknown): CatalogoFiltroItem {
  if (!isRecord(value)) return invalid("El filtro retornado es inválido.");
  if (!Array.isArray(value.tipos_filtro)) return invalid("Los tipos relacionados deben ser un arreglo.");
  if (!isRecord(value.impacto) || !Array.isArray(value.impacto.tipos_equipo)) {
    return invalid("El impacto del filtro es inválido.");
  }
  return {
    id: positiveId(value.id, "id"),
    codigo: text(value.codigo, "codigo"),
    estaEnListaCompras: bool(value.esta_en_lista_compras, "esta_en_lista_compras"),
    activo: bool(value.activo, "activo"),
    creadoEn: timestamp(value.creado_en),
    actualizadoEn: timestamp(value.actualizado_en),
    tiposFiltro: value.tipos_filtro.map(mapRelatedType),
    impacto: {
      totalEquipos: count(value.impacto.total_equipos, "impacto.total_equipos"),
      totalAsignaciones: count(value.impacto.total_asignaciones, "impacto.total_asignaciones"),
      tiposEquipo: value.impacto.tipos_equipo.map(mapEquipmentType),
    },
  };
}

export function mapCatalogoFiltrosListarResponse(value: unknown): {
  items: CatalogoFiltroItem[]; resumen: CatalogoFiltrosResumen;
} {
  if (!isRecord(value) || value.ok !== true || !Array.isArray(value.items) || !isRecord(value.resumen)) {
    return invalid("La respuesta de listado del catálogo es inválida.");
  }
  return {
    items: value.items.map(mapCatalogoFiltroItem),
    resumen: {
      total: count(value.resumen.total, "resumen.total"),
      activos: count(value.resumen.activos, "resumen.activos"),
      desactivados: count(value.resumen.desactivados, "resumen.desactivados"),
      enCompras: count(value.resumen.en_compras, "resumen.en_compras"),
      fueraCompras: count(value.resumen.fuera_compras, "resumen.fuera_compras"),
    },
  };
}

export function mapCatalogoFiltroGuardarResponse(value: unknown): CatalogoFiltroGuardarResultado {
  if (!isRecord(value) || value.ok !== true) return invalid("La respuesta de guardado es inválida.");
  if (value.operacion !== "creado" && value.operacion !== "actualizado") return invalid("La operación es inválida.");
  if (value.codigo !== "FILTRO_CREADO" && value.codigo !== "FILTRO_ACTUALIZADO") {
    return invalid("El código funcional es inválido.");
  }
  return {
    operacion: value.operacion,
    codigo: value.codigo,
    mensaje: text(value.mensaje, "mensaje"),
    afectaEquipos: count(value.afecta_equipos, "afecta_equipos"),
    item: mapCatalogoFiltroItem(value.item),
  };
}
