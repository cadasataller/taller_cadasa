import type { EquipoEngraseListItem } from "../filtrosEngrase.types";

export interface EquipoModeloOption {
  key: string;
  value: string;
  tiposEquipo: string[];
  esActual: boolean;
  correspondeAlTipoActual: boolean;
}

interface CrearOpcionesModeloParams {
  equipos: EquipoEngraseListItem[];
  modeloActual: string;
  tipoEquipoId: number;
  tipoEquipo: string;
}

export const normalizarModeloEquipo = (valor: string): string =>
  valor.trim().replace(/\s+/gu, " ").toLocaleUpperCase("es");

const claveModelo = (valor: string): string =>
  normalizarModeloEquipo(valor)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es");

export function crearOpcionesModelo({
  equipos,
  modeloActual,
  tipoEquipoId,
  tipoEquipo,
}: CrearOpcionesModeloParams): EquipoModeloOption[] {
  const tiposPorModelo = new Map<string, Map<number, string>>();
  const valoresPorModelo = new Map<string, string>();

  for (const equipo of equipos) {
    if (!equipo.subtipo?.trim()) continue;
    const key = claveModelo(equipo.subtipo);
    valoresPorModelo.set(key, normalizarModeloEquipo(equipo.subtipo));
    const tipos = tiposPorModelo.get(key) ?? new Map<number, string>();
    tipos.set(equipo.tipo_equipo_id, equipo.tipo_equipo);
    tiposPorModelo.set(key, tipos);
  }

  const actual = normalizarModeloEquipo(modeloActual);
  const keyActual = claveModelo(actual);
  if (actual) {
    valoresPorModelo.set(keyActual, actual);
    const tipos = tiposPorModelo.get(keyActual) ?? new Map<number, string>();
    if (tipos.size === 0 && tipoEquipoId > 0 && tipoEquipo.trim())
      tipos.set(tipoEquipoId, tipoEquipo);
    tiposPorModelo.set(keyActual, tipos);
  }

  return [...valoresPorModelo.entries()]
    .map(([key, value]): EquipoModeloOption => {
      const tipos = tiposPorModelo.get(key) ?? new Map<number, string>();
      const correspondeAlTipoActual = tipoEquipoId > 0 && tipos.has(tipoEquipoId);
      const tiposEquipo = [...tipos.entries()]
        .sort(([idA, nombreA], [idB, nombreB]) => {
          if (idA === tipoEquipoId) return -1;
          if (idB === tipoEquipoId) return 1;
          return nombreA.localeCompare(nombreB, "es");
        })
        .map(([, nombre]) => nombre);
      return {
        key,
        value,
        tiposEquipo,
        esActual: Boolean(keyActual && key === keyActual),
        correspondeAlTipoActual,
      };
    })
    .sort((a, b) => {
      const prioridadA = a.esActual ? 0 : a.correspondeAlTipoActual ? 1 : 2;
      const prioridadB = b.esActual ? 0 : b.correspondeAlTipoActual ? 1 : 2;
      return prioridadA - prioridadB || a.value.localeCompare(b.value, "es");
    });
}
