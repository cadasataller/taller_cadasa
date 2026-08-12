import type { Component } from "vue";
import {
  Cog,
  Droplet,
  Filter,
  Fuel,
  Gauge,
  Wind,
} from "lucide-vue-next";

export interface IconoTipoFiltro {
  icono: Component;
  grupo:
    | "motor"
    | "aire"
    | "combustible"
    | "hidraulico"
    | "transmision"
    | "otros";
  nombreGrupo: string;
}

const normalizarNombreTipoFiltro = (nombre: string): string =>
  nombre
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export const obtenerIconoTipoFiltro = (nombre: string): IconoTipoFiltro => {
  const nombreNormalizado = normalizarNombreTipoFiltro(nombre);

  if (nombreNormalizado.includes("aceite"))
    return { icono: Droplet, grupo: "motor", nombreGrupo: "Motor" };
  if (
    nombreNormalizado.includes("aire") ||
    nombreNormalizado.includes("cabina")
  )
    return { icono: Wind, grupo: "aire", nombreGrupo: "Aire" };
  if (
    nombreNormalizado.includes("gasolina") ||
    nombreNormalizado.includes("diesel") ||
    nombreNormalizado.includes("combustible") ||
    nombreNormalizado.includes("elemento")
  )
    return { icono: Fuel, grupo: "combustible", nombreGrupo: "Combustible" };
  if (
    nombreNormalizado.includes("hidraulic") ||
    nombreNormalizado.includes("hidraul")
  )
    return {
      icono: Gauge,
      grupo: "hidraulico",
      nombreGrupo: "Hidráulico",
    };
  if (nombreNormalizado.includes("transmision"))
    return {
      icono: Cog,
      grupo: "transmision",
      nombreGrupo: "Transmisión",
    };

  return { icono: Filter, grupo: "otros", nombreGrupo: "Otros" };
};
