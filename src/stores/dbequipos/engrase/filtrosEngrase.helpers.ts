import type {
  EquipoEngraseListItem,
  FiltrosEngraseQuery,
} from "./filtrosEngrase.types";
export const initialFiltrosEngraseQuery = (): FiltrosEngraseQuery => ({
  estadoEquipo: "activo",
  tipoEquipoId: null,
  tipoFiltroId: null,
  modelo: "",
  etapaIds: [],
  codigoExactoSeleccionado: null,
});
export const normalizar = (value: string | null | undefined) =>
  value?.trim().toLocaleLowerCase() ?? "";
export const filtrarEquipos = (
  equipos: EquipoEngraseListItem[],
  filters: FiltrosEngraseQuery,
  equipoIdsPorCodigo: Set<number> | null,
  equipoIdsPorTipoFiltro: Set<number> | null,
) =>
  equipos.filter(
    (e) =>
      e.estado === filters.estadoEquipo &&
      (!filters.tipoEquipoId || e.tipo_equipo_id === filters.tipoEquipoId) &&
      (!filters.modelo ||
        normalizar(e.subtipo).includes(normalizar(filters.modelo))) &&
      (filters.etapaIds.length === 0 ||
        filters.etapaIds.every((etapaId) =>
          e.etapas.some((etapa) => etapa.id === etapaId),
        )) &&
      (!equipoIdsPorCodigo || equipoIdsPorCodigo.has(e.id)) &&
      (!equipoIdsPorTipoFiltro || equipoIdsPorTipoFiltro.has(e.id)),
  );
