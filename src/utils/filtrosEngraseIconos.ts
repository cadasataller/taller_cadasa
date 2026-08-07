import type { Component } from "vue";
import {
  Cog,
  Droplet,
  Fan,
  Filter,
  Fuel,
  Gauge,
  Snowflake,
  Wind,
} from "lucide-vue-next";

export interface IconoTipoFiltro {
  icono: Component;
  grupo:
    | "climatizacion"
    | "refrigeracion"
    | "hidraulico"
    | "combustible"
    | "lubricacion"
    | "transmision"
    | "admision_aire"
    | "elemento";
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

  if (
    nombreNormalizado.includes("aire acondicionado") ||
    nombreNormalizado.includes("cabina")
  )
    return {
      icono: Fan,
      grupo: "climatizacion",
      nombreGrupo: "Cabina y climatización",
    };
  if (
    nombreNormalizado.includes("coolant") ||
    nombreNormalizado.includes("refrigerante") ||
    nombreNormalizado.includes("refrigeracion")
  )
    return {
      icono: Snowflake,
      grupo: "refrigeracion",
      nombreGrupo: "Refrigeración",
    };
  if (
    nombreNormalizado.includes("hidraulic") ||
    nombreNormalizado.includes("hidraul")
  )
    return {
      icono: Gauge,
      grupo: "hidraulico",
      nombreGrupo: "Sistema hidráulico",
    };
  if (
    nombreNormalizado.includes("diesel") ||
    nombreNormalizado.includes("gasolina") ||
    nombreNormalizado.includes("combustible")
  )
    return { icono: Fuel, grupo: "combustible", nombreGrupo: "Combustible" };
  if (nombreNormalizado.includes("aceite"))
    return {
      icono: Droplet,
      grupo: "lubricacion",
      nombreGrupo: "Lubricación del motor",
    };
  if (
    nombreNormalizado.includes("transmision") ||
    nombreNormalizado.includes("diferencial")
  )
    return {
      icono: Cog,
      grupo: "transmision",
      nombreGrupo: "Transmisión y tren motriz",
    };
  if (nombreNormalizado.includes("aire"))
    return {
      icono: Wind,
      grupo: "admision_aire",
      nombreGrupo: "Admisión de aire",
    };

  return { icono: Filter, grupo: "elemento", nombreGrupo: "Elemento / otros" };
};
