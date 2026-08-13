import { describe, expect, it } from "vitest";
import {
  crearOpcionesModelo,
  normalizarModeloEquipo,
} from "./equipoEngraseModelos";
import type { EquipoEngraseListItem } from "../filtrosEngrase.types";

const equipo = (
  id: number,
  subtipo: string | null,
  tipoEquipoId: number,
  tipoEquipo: string,
): EquipoEngraseListItem => ({
  id,
  codigo: String(id),
  tipo_equipo_id: tipoEquipoId,
  tipo_equipo: tipoEquipo,
  subtipo,
  estado: "activo",
  main_storage_path: null,
  tiene_imagen_main: false,
  imagen_actualizada_en: null,
  etapas: [],
});

describe("opciones de modelos de equipos", () => {
  it("normaliza el valor creado a mayúsculas", () => {
    expect(normalizarModeloEquipo("  Bus   urbano  ")).toBe("BUS URBANO");
  });

  it("deduplica modelos y conserva únicamente los tipos donde se usan", () => {
    const options = crearOpcionesModelo({
      equipos: [
        equipo(1, "Bus urbano", 1, "Buses"),
        equipo(2, "BUS URBANO", 1, "Buses"),
        equipo(3, "bus urbano", 2, "Camiones"),
      ],
      modeloActual: "Bus urbano",
      tipoEquipoId: 1,
      tipoEquipo: "Buses",
    });

    expect(options).toEqual([
      {
        key: "bus urbano",
        value: "BUS URBANO",
        tiposEquipo: ["Buses", "Camiones"],
        esActual: true,
        correspondeAlTipoActual: true,
      },
    ]);
  });

  it("prioriza el modelo actual y luego los modelos del tipo seleccionado", () => {
    const options = crearOpcionesModelo({
      equipos: [
        equipo(1, "Modelo externo", 2, "Camiones"),
        equipo(2, "Modelo compatible", 1, "Buses"),
      ],
      modeloActual: "Modelo actual",
      tipoEquipoId: 1,
      tipoEquipo: "Buses",
    });

    expect(options.map((option) => option.value)).toEqual([
      "MODELO ACTUAL",
      "MODELO COMPATIBLE",
      "MODELO EXTERNO",
    ]);
    expect(options[0]?.tiposEquipo).toEqual(["Buses"]);
  });
});
