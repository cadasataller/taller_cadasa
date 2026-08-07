import type {
  EquipoEdicionFiltro,
  EquipoFiltroDraft,
} from "./equipoEngraseEdicion.types";

export const crearMotivoCambioFiltro = (
  original: EquipoEdicionFiltro,
  actual: Pick<EquipoFiltroDraft, "tipoFiltro" | "cantidad">,
): string | undefined => {
  const cambios: string[] = [];
  if (original.tipoFiltro.id !== actual.tipoFiltro.id)
    cambios.push(
      `Tipo de filtro: ${original.tipoFiltro.nombre} → ${actual.tipoFiltro.nombre}`,
    );
  if (original.cantidad !== actual.cantidad)
    cambios.push(`Cantidad: ${original.cantidad} → ${actual.cantidad}`);
  return cambios.length ? cambios.join("; ") : undefined;
};
