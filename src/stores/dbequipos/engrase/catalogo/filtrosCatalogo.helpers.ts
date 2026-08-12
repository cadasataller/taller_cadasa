import type {
  CatalogoFiltroCompras, CatalogoFiltroEstado, CatalogoFiltroItem, CatalogoFiltrosQuery,
  CatalogoFiltrosResumen, CatalogoFiltroSortKey, CatalogoSortDirection,
  CatalogoTipoFiltroRelacionado,
} from "./filtrosCatalogo.types";

export function normalizarBusquedaCodigo(value: string): string {
  return value.trim().toLocaleLowerCase("es");
}

export function filtrarCatalogoFiltros(
  items: readonly CatalogoFiltroItem[],
  filtros: CatalogoFiltrosQuery,
): CatalogoFiltroItem[] {
  const query = normalizarBusquedaCodigo(filtros.busqueda);
  return items.filter((item) => {
    const matchesCode = !query || normalizarBusquedaCodigo(item.codigo).includes(query);
    const matchesType = filtros.tipoFiltroId === null
      || item.tiposFiltro.some(({ id }) => id === filtros.tipoFiltroId);
    const matchesPurchases = filtros.compras === "todos"
      || item.estaEnListaCompras === (filtros.compras === "en-compras");
    const matchesState = filtros.estado === "todos"
      || item.activo === (filtros.estado === "activos");
    return matchesCode && matchesType && matchesPurchases && matchesState;
  });
}

export function ordenarCatalogoFiltros(
  items: readonly CatalogoFiltroItem[], key: CatalogoFiltroSortKey, direction: CatalogoSortDirection,
): CatalogoFiltroItem[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...items].sort((left, right) => {
    let result: number;
    switch (key) {
      case "compras": result = Number(left.estaEnListaCompras) - Number(right.estaEnListaCompras); break;
      case "estado": result = Number(left.activo) - Number(right.activo); break;
      default: result = left.codigo.localeCompare(right.codigo, "es", { numeric: true, sensitivity: "base" });
    }
    const fallback = left.codigo.localeCompare(right.codigo, "es", { numeric: true, sensitivity: "base" });
    return (result || fallback) * factor;
  });
}

export function obtenerOpcionesTiposFiltro(
  items: readonly CatalogoFiltroItem[],
): CatalogoTipoFiltroRelacionado[] {
  const unique = new Map<number, CatalogoTipoFiltroRelacionado>();
  for (const item of items) {
    for (const type of item.tiposFiltro) {
      const current = unique.get(type.id);
      if (!current || type.nombre.localeCompare(current.nombre, "es", { sensitivity: "base" }) < 0) {
        unique.set(type.id, { ...type });
      }
    }
  }
  return [...unique.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
}

export function resumirCatalogoFiltros(items: readonly CatalogoFiltroItem[]): CatalogoFiltrosResumen {
  const activos = items.filter(({ activo }) => activo).length;
  const enCompras = items.filter(({ estaEnListaCompras }) => estaEnListaCompras).length;
  return {
    total: items.length,
    activos,
    desactivados: items.length - activos,
    enCompras,
    fueraCompras: items.length - enCompras,
  };
}

export function contarCriteriosFiltros(
  tipoFiltroId: number | null, compras: CatalogoFiltroCompras, estado: CatalogoFiltroEstado,
): number {
  return Number(tipoFiltroId !== null) + Number(compras !== "todos") + Number(estado !== "activos");
}

export const formatNumber = (value: number): string => new Intl.NumberFormat("es").format(value);
