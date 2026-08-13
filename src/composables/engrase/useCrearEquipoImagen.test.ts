import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const subirMock = vi.hoisted(() => vi.fn());
const eliminarMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const prepararMock = vi.hoisted(() => vi.fn());

vi.mock("@/stores/dbequipos/engrase/imagen/equipoEngraseImagen.storage.service", () => ({
  equipoEngraseImagenStorageService: { subir: subirMock, eliminar: eliminarMock },
}));
vi.mock("@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.imagen.service", () => ({
  equipoEngraseCreacionImagenService: { agregarImagenEquipoCreado: rpcMock },
}));
vi.mock("@/stores/dbequipos/engrase/imagen/equipoEngraseImagen.processing", () => ({
  prepararImagenEquipoWebp: prepararMock,
}));

import { useCrearEquipoImagen } from "./useCrearEquipoImagen";
import { useEquipoEngraseCreacionStore } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.store";
import { useFiltrosEngraseStore } from "@/stores/dbequipos/engrase/filtrosEngrase.store";

const equipo = {
  id: 10, codigo: "410003", tipo_equipo_id: 1, tipo_equipo: "Buses", subtipo: "Urbano", estado: "activo" as const,
  main_storage_path: null, tiene_imagen_main: false, imagen_actualizada_en: null, etapas: [],
};

describe("flujo de imagen posterior a la creación", () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks(); });

  it("sube, registra y actualiza wizard y listado sin recargar", async () => {
    const store = useEquipoEngraseCreacionStore();
    store.registrarEquipoCreado(equipo);
    useFiltrosEngraseStore().equipos = [{ ...equipo }];
    prepararMock.mockResolvedValue({ file: new File(["webp"], "a.webp", { type: "image/webp" }), previewUrl: "blob:preview" });
    subirMock.mockResolvedValue(undefined);
    rpcMock.mockImplementation(({ storagePath }: { storagePath: string }) => Promise.resolve({
      codigo: "410003", equipoId: 10, operacion: "agregar",
      imagen: { mainStoragePath: storagePath, tieneImagenMain: true, imagenActualizadaEn: null },
      storagePathAnterior: null,
    }));
    const imagen = useCrearEquipoImagen();

    await imagen.seleccionarImagen(new File(["raw"], "a.jpg", { type: "image/jpeg" }));
    await expect(imagen.guardarImagen()).resolves.toMatchObject({ kind: "success" });
    expect(subirMock).toHaveBeenCalledOnce();
    expect(rpcMock).toHaveBeenCalledOnce();
    expect(store.draft.equipoCreado?.tiene_imagen_main).toBe(true);
    expect(useFiltrosEngraseStore().equipos[0].tiene_imagen_main).toBe(true);
    expect(imagen.finalizarCreacion()).toMatchObject({ ok: true, equipo: { id: 10 } });
  });

  it("bloquea segundo submit y permite omitir tras un fallo de registro", async () => {
    const store = useEquipoEngraseCreacionStore();
    store.registrarEquipoCreado(equipo);
    prepararMock.mockResolvedValue({ file: new File(["webp"], "a.webp", { type: "image/webp" }), previewUrl: "blob:preview" });
    let resolver: () => void = () => undefined;
    subirMock.mockImplementation(() => new Promise<void>((resolve) => { resolver = resolve; }));
    const imagen = useCrearEquipoImagen();
    await imagen.seleccionarImagen(new File(["raw"], "a.jpg", { type: "image/jpeg" }));
    const primero = imagen.guardarImagen();
    expect(await imagen.guardarImagen()).toEqual({ kind: "busy" });
    resolver();
    rpcMock.mockRejectedValue(new Error("RPC falló"));
    eliminarMock.mockResolvedValue(undefined);
    await expect(primero).resolves.toMatchObject({ kind: "error" });
    expect(store.draft.equipoCreado?.tiene_imagen_main).toBe(false);
    expect(imagen.omitirImagen()).toMatchObject({ ok: true });
  });
});
