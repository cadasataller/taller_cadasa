import { CatalogoTiposFiltroError } from "./tiposFiltroCatalogo.errors";
import type {
  CatalogoTipoEquipoImpacto,
  CatalogoTipoFiltroGuardarResultado,
  CatalogoTipoFiltroItem,
  CatalogoTiposFiltroResumen,
} from "./tiposFiltroCatalogo.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function invalid(message: string): never {
  throw new CatalogoTiposFiltroError("RESPUESTA_INVALIDA", message);
}

function finiteNonNegative(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return invalid(`El campo ${field} debe ser un número no negativo.`);
  }
  return value;
}

function trimmedText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    return invalid(`El campo ${field} es obligatorio.`);
  }
  return value.trim();
}

function nullableTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function mapTipoEquipo(value: unknown): CatalogoTipoEquipoImpacto {
  if (!isRecord(value)) return invalid("Un tipo de equipo del impacto es inválido.");
  return {
    id: finiteNonNegative(value.id, "impacto.tipos_equipo.id"),
    nombre: trimmedText(value.nombre, "impacto.tipos_equipo.nombre"),
    cantidadEquipos: finiteNonNegative(
      value.cantidad_equipos,
      "impacto.tipos_equipo.cantidad_equipos",
    ),
  };
}

export function mapCatalogoTipoFiltroItem(value: unknown): CatalogoTipoFiltroItem {
  if (!isRecord(value)) return invalid("El tipo de filtro retornado es inválido.");
  if (typeof value.activo !== "boolean") {
    return invalid("El campo activo debe ser booleano.");
  }
  if (!isRecord(value.impacto)) return invalid("El impacto del tipo de filtro es inválido.");
  const tiposEquipo = value.impacto.tipos_equipo;
  if (tiposEquipo !== undefined && !Array.isArray(tiposEquipo)) {
    return invalid("Los tipos de equipo del impacto deben ser un arreglo.");
  }
  return {
    id: finiteNonNegative(value.id, "id"),
    nombre: trimmedText(value.nombre, "nombre"),
    activo: value.activo,
    creadoEn: nullableTimestamp(value.creado_en),
    actualizadoEn: nullableTimestamp(value.actualizado_en),
    impacto: {
      totalEquipos: finiteNonNegative(value.impacto.total_equipos, "impacto.total_equipos"),
      totalAsignaciones: finiteNonNegative(
        value.impacto.total_asignaciones,
        "impacto.total_asignaciones",
      ),
      tiposEquipo: (tiposEquipo ?? []).map(mapTipoEquipo),
    },
  };
}

export function mapCatalogoTiposFiltroListarResponse(value: unknown): {
  items: CatalogoTipoFiltroItem[];
  resumen: CatalogoTiposFiltroResumen;
} {
  if (!isRecord(value) || value.ok !== true || !Array.isArray(value.items)) {
    return invalid("La respuesta de listado del catálogo es inválida.");
  }
  if (!isRecord(value.resumen)) return invalid("El resumen del catálogo es inválido.");
  return {
    items: value.items.map(mapCatalogoTipoFiltroItem),
    resumen: {
      total: finiteNonNegative(value.resumen.total, "resumen.total"),
      activos: finiteNonNegative(value.resumen.activos, "resumen.activos"),
      desactivados: finiteNonNegative(value.resumen.desactivados, "resumen.desactivados"),
    },
  };
}

export function mapCatalogoTipoFiltroGuardarResponse(
  value: unknown,
): CatalogoTipoFiltroGuardarResultado {
  if (!isRecord(value) || value.ok !== true) {
    return invalid("La respuesta de guardado del catálogo es inválida.");
  }
  if (value.operacion !== "creado" && value.operacion !== "actualizado") {
    return invalid("La operación de guardado es inválida.");
  }
  if (
    value.codigo !== "TIPO_FILTRO_CREADO"
    && value.codigo !== "TIPO_FILTRO_ACTUALIZADO"
  ) {
    return invalid("El código funcional de guardado es inválido.");
  }
  return {
    operacion: value.operacion,
    codigo: value.codigo,
    mensaje: trimmedText(value.mensaje, "mensaje"),
    afectaEquipos: finiteNonNegative(value.afecta_equipos, "afecta_equipos"),
    item: mapCatalogoTipoFiltroItem(value.item),
  };
}
