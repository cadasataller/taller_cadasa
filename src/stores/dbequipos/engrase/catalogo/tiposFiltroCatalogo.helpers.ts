import type {
  CatalogoEstadoFiltro,
  CatalogoSortDirection,
  CatalogoTipoFiltroItem,
  CatalogoTipoFiltroSortKey,
  CatalogoTiposFiltroResumen,
} from "./tiposFiltroCatalogo.types";

export function normalizarBusquedaTipoFiltro(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

export function filtrarTiposFiltro(
  items: readonly CatalogoTipoFiltroItem[],
  busqueda: string,
  estado: CatalogoEstadoFiltro,
): CatalogoTipoFiltroItem[] {
  const query = normalizarBusquedaTipoFiltro(busqueda);
  return items.filter((item) => {
    const matchesText = !query
      || normalizarBusquedaTipoFiltro(item.nombre).includes(query);
    const matchesState = estado === "todos"
      || (estado === "activos" ? item.activo : !item.activo);
    return matchesText && matchesState;
  });
}

export function ordenarTiposFiltro(
  items: readonly CatalogoTipoFiltroItem[],
  key: CatalogoTipoFiltroSortKey,
  direction: CatalogoSortDirection,
): CatalogoTipoFiltroItem[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...items].sort((left, right) => {
    let result = 0;
    if (key === "nombre") {
      result = left.nombre.localeCompare(right.nombre, "es", { sensitivity: "base" });
    } else if (key === "estado") {
      result = Number(right.activo) - Number(left.activo);
    } else {
      result = left.impacto.totalEquipos - right.impacto.totalEquipos;
    }
    return (result || left.nombre.localeCompare(right.nombre, "es", { sensitivity: "base" })) * factor;
  });
}

export function resumirTiposFiltro(
  items: readonly CatalogoTipoFiltroItem[],
): CatalogoTiposFiltroResumen {
  const activos = items.filter((item) => item.activo).length;
  return { total: items.length, activos, desactivados: items.length - activos };
}

export function formatoEquipos(cantidad: number): string {
  const formatted = new Intl.NumberFormat("es").format(cantidad);
  return `${formatted} ${cantidad === 1 ? "equipo" : "equipos"}`;
}
