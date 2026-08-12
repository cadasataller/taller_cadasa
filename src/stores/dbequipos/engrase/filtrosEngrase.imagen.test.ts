import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const crearUrlFirmadaImagen = vi.hoisted(() => vi.fn());
vi.mock("./filtrosEngrase.service", () => ({
  filtrosEngraseService: { crearUrlFirmadaImagen },
}));

import { useFiltrosEngraseStore } from "./filtrosEngrase.store";
import type { EquipoEngraseListItem } from "./filtrosEngrase.types";

const equipoConImagen = (): EquipoEngraseListItem => ({
  id: 123,
  codigo: "422017",
  tipo_equipo_id: 5,
  tipo_equipo: "Combinadas",
  subtipo: "Cosechadora",
  estado: "activo",
  main_storage_path: "equipos/422017/main_thumb/imagen.webp",
  tiene_imagen_main: true,
  imagen_actualizada_en: "2026-08-10T15:33:50.316Z",
  etapas: [],
});

describe("carga diferida de imágenes del listado", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("firma una sola vez aunque la tarjeta solicite la imagen en paralelo", async () => {
    let resolver!: (url: string) => void;
    crearUrlFirmadaImagen.mockReturnValue(
      new Promise<string>((resolve) => { resolver = resolve; }),
    );
    const store = useFiltrosEngraseStore();
    store.equipos = [equipoConImagen()];

    const primera = store.cargarImagenEquipo(123);
    const segunda = store.cargarImagenEquipo(123);
    expect(crearUrlFirmadaImagen).toHaveBeenCalledOnce();
    resolver("https://storage.test/imagen-firmada");
    await Promise.all([primera, segunda]);

    expect(store.equipos[0]?.imageUrl).toBe(
      "https://storage.test/imagen-firmada",
    );
  });

  it("no consulta Storage cuando el equipo no tiene imagen", async () => {
    const store = useFiltrosEngraseStore();
    store.equipos = [{
      ...equipoConImagen(),
      main_storage_path: null,
      tiene_imagen_main: false,
    }];

    await store.cargarImagenEquipo(123);
    expect(crearUrlFirmadaImagen).not.toHaveBeenCalled();
  });
});
