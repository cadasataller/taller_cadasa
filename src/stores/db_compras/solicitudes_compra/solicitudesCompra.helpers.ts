import type {
  SolicitudCompraListFilters,
  SolicitudCompraListItem,
  SolicitudCompraPagination,
} from './solicitudesCompra.types';

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_VISIBLE_DESTINOS = 3;

export const normalizarTextoVacio = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

export const normalizarBusqueda = (value: string): string =>
  value.trim().replace(/\s+/g, ' ');

export const safeArrayText = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  return normalizedValue.length > 0 ? [normalizedValue] : [];
};

export const calcularDestinosVisibles = (
  items: string[],
  max = DEFAULT_VISIBLE_DESTINOS
): { visibles: string[]; ocultos: number } => {
  const normalizedItems = safeArrayText(items);
  const visibles = normalizedItems.slice(0, max);
  const ocultos = Math.max(normalizedItems.length - visibles.length, 0);

  return { visibles, ocultos };
};

export const isSearchMode = (value: string): boolean =>
  normalizarBusqueda(value).length > 0;

const formatDatePart = (value: number): string => value.toString().padStart(2, '0');

export const toDateInputValue = (date: Date): string => [
  date.getFullYear(),
  formatDatePart(date.getMonth() + 1),
  formatDatePart(date.getDate()),
].join('-');

export const getDefaultDateRange = (): Pick<
  SolicitudCompraListFilters,
  'fechaDesde' | 'fechaHasta'
> => {
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return {
    fechaDesde: toDateInputValue(sixMonthsAgo),
    fechaHasta: toDateInputValue(today),
  };
};

export const formatFolioSol = (folioSol: string | null): string | null => {
  const normalizedFolio = normalizarTextoVacio(folioSol);

  if (!normalizedFolio) {
    return null;
  }

  return normalizedFolio.startsWith('#') ? normalizedFolio : `#${normalizedFolio}`;
};

export const getInitialPagination = (
  totalCount = 0
): SolicitudCompraPagination => ({
  pageSize: DEFAULT_PAGE_SIZE,
  localVisibleCount: DEFAULT_PAGE_SIZE,
  totalCount,
  hasMore: totalCount > DEFAULT_PAGE_SIZE,
});

export const canShowMoreLocal = (
  totalItems: number,
  visibleCount: number
): boolean => totalItems > visibleCount;

const includesNeedle = (value: string | null | undefined, needle: string): boolean =>
  typeof value === 'string' && value.toLocaleLowerCase().includes(needle);

export const matchesSolicitudBusqueda = (
  item: SolicitudCompraListItem,
  searchTerm: string
): boolean => {
  const normalizedSearch = normalizarBusqueda(searchTerm).toLocaleLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    item.folio.folioSol,
    item.folio.folioSolLabel,
    item.folio.folioOcPrincipal,
    ...item.folio.foliosOc,
    item.observacion,
    item.seguimiento.codigo,
    item.seguimiento.label,
    item.seguimiento.fechaLabel,
    item.prioridad.codigo,
    item.prioridad.nombre,
    item.area.codigo,
    item.area.nombre,
    item.solicitante.nombre,
    ...item.destinos.items,
    item.ocResumen.ordenesCompraResumen,
    item.ocResumen.proveedorPrincipal,
    item.badgeDelegacion?.label,
    item.badgeDelegacion?.tipoDelegacion,
  ].some((value) => includesNeedle(value, normalizedSearch));
};
