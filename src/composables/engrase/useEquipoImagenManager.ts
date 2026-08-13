import { computed, onBeforeUnmount, shallowRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { useEquipoEngraseEdicionStore } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store";
import { equipoEngraseEdicionService } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.service";
import { equipoEngraseImagenService } from "@/stores/dbequipos/engrase/edicion/equipoEngraseImagen.service";
import {
  crearRutaImagenEquipo,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseImagen.types";
import type {
  ImagenEquipoPreparada,
  ImagenSyncState,
  OperacionImagenUi,
} from "@/stores/dbequipos/engrase/edicion/equipoEngraseImagen.types";
import type { EquipoImagenPersistida } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
import { prepararImagenEquipoWebp } from "@/stores/dbequipos/engrase/imagen/equipoEngraseImagen.processing";

export function useEquipoImagenManager() {
  const store = useEquipoEngraseEdicionStore();
  const { imagenPersistidaActual, imagenSyncState } = storeToRefs(store);
  const preparada = shallowRef<ImagenEquipoPreparada | null>(null);
  const urlActual = shallowRef<string | null>(null);
  const urlLoading = shallowRef(false);
  const urlError = shallowRef<string | null>(null);
  let urlRequest = 0;
  let urlRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  const bloqueado = computed(
    () =>
      imagenSyncState.value.kind === "processing" ||
      imagenSyncState.value.kind === "move_pending",
  );
  const tieneImagen = computed(
    () => imagenPersistidaActual.value?.tieneImagenMain === true,
  );
  const limpiarPreview = (): void => {
    if (preparada.value) URL.revokeObjectURL(preparada.value.previewUrl);
    preparada.value = null;
  };
  const cambiarEstado = (estado: ImagenSyncState): void =>
    store.actualizarEstadoSyncImagen(estado);
  const limpiarUrlRefresh = (): void => {
    if (urlRefreshTimer) clearTimeout(urlRefreshTimer);
    urlRefreshTimer = null;
  };
  async function cargarUrlFirmada(path: string | null): Promise<void> {
    const request = ++urlRequest;
    limpiarUrlRefresh();
    urlError.value = null;
    if (!path) {
      urlActual.value = null;
      urlLoading.value = false;
      return;
    }
    urlActual.value = null;
    urlLoading.value = true;
    try {
      const signedUrl = await equipoEngraseImagenService.obtenerUrlFirmada(path);
      if (request !== urlRequest) return;
      urlActual.value = signedUrl;
      urlRefreshTimer = setTimeout(() => {
        void cargarUrlFirmada(path);
      }, 9 * 60 * 1000);
    } catch (error) {
      if (request !== urlRequest) return;
      urlError.value = error instanceof Error
        ? error.message
        : "No se pudo cargar la imagen del equipo.";
    } finally {
      if (request === urlRequest) urlLoading.value = false;
    }
  }
  watch(
    () => imagenPersistidaActual.value?.mainStoragePath ?? null,
    (path) => { void cargarUrlFirmada(path); },
    { immediate: true },
  );
  async function seleccionarArchivo(archivo: File): Promise<void> {
    limpiarPreview();
    try {
      preparada.value = await prepararImagenEquipoWebp(archivo);
      cambiarEstado({ kind: "idle" });
    } catch (error) {
      cambiarEstado({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo preparar la imagen.",
      });
    }
  }
  function actualizarPersistida(imagen: EquipoImagenPersistida): void {
    store.actualizarImagenPersistida(imagen);
  }
  async function guardar(
    codigoEquipo: string,
    operation: Extract<OperacionImagenUi, "agregar" | "actualizar">,
  ): Promise<void> {
    if (!preparada.value || bloqueado.value) return;
    const ruta = crearRutaImagenEquipo(codigoEquipo);
    cambiarEstado({ kind: "processing", operation });
    try {
      await equipoEngraseImagenService.subir(ruta, preparada.value.file);
      try {
        const respuesta =
          await equipoEngraseEdicionService.administrarImagenEquipo({
            codigoEquipo,
            operacion: operation,
            storagePath: ruta,
            descripcion: null,
          });
        actualizarPersistida(respuesta.imagen);
        limpiarPreview();
        if (operation === "actualizar" && respuesta.storagePathAnterior) {
          try {
            await equipoEngraseImagenService.eliminar(
              respuesta.storagePathAnterior,
            );
            cambiarEstado({ kind: "idle" });
          } catch {
            cambiarEstado({
              kind: "cleanup_pending",
              path: respuesta.storagePathAnterior,
            });
          }
        } else cambiarEstado({ kind: "idle" });
      } catch (error) {
        try {
          await equipoEngraseImagenService.eliminar(ruta);
        } catch {
          cambiarEstado({ kind: "cleanup_pending", path: ruta });
          return;
        }
        throw error;
      }
    } catch (error) {
      cambiarEstado({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la imagen.",
      });
    }
  }
  async function eliminar(codigoEquipo: string): Promise<void> {
    if (!tieneImagen.value || bloqueado.value) return;
    cambiarEstado({ kind: "processing", operation: "eliminar" });
    try {
      const respuesta =
        await equipoEngraseEdicionService.administrarImagenEquipo({
          codigoEquipo,
          operacion: "eliminar",
          storagePath: null,
          descripcion: null,
        });
      actualizarPersistida(respuesta.imagen);
      if (respuesta.storagePathAnterior) {
        try {
          await equipoEngraseImagenService.eliminar(
            respuesta.storagePathAnterior,
          );
        } catch {
          cambiarEstado({
            kind: "cleanup_pending",
            path: respuesta.storagePathAnterior,
          });
          return;
        }
      }
      cambiarEstado({ kind: "idle" });
    } catch (error) {
      cambiarEstado({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar la imagen.",
      });
    }
  }
  async function reintentarLimpieza(): Promise<void> {
    if (imagenSyncState.value.kind !== "cleanup_pending") return;
    try {
      await equipoEngraseImagenService.eliminar(imagenSyncState.value.path);
      cambiarEstado({ kind: "idle" });
    } catch (error) {
      cambiarEstado({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo completar la limpieza.",
      });
    }
  }
  async function moverDespuesDeCambioCodigo(
    sourcePath: string,
    destinationPath: string,
  ): Promise<void> {
    if (sourcePath === destinationPath) return;
    try {
      await equipoEngraseImagenService.mover(sourcePath, destinationPath);
      actualizarPersistida({
        mainStoragePath: destinationPath,
        tieneImagenMain: true,
        imagenActualizadaEn:
          imagenPersistidaActual.value?.imagenActualizadaEn ?? null,
      });
      cambiarEstado({ kind: "idle" });
    } catch {
      cambiarEstado({ kind: "move_pending", sourcePath, destinationPath });
    }
  }
  async function reintentarMovimiento(): Promise<void> {
    if (imagenSyncState.value.kind !== "move_pending") return;
    await moverDespuesDeCambioCodigo(
      imagenSyncState.value.sourcePath,
      imagenSyncState.value.destinationPath,
    );
  }
  onBeforeUnmount(() => {
    urlRequest += 1;
    limpiarUrlRefresh();
    limpiarPreview();
  });
  return {
    preparada,
    urlActual,
    urlLoading,
    urlError,
    tieneImagen,
    imagenPersistidaActual,
    imagenSyncState,
    bloqueado,
    seleccionarArchivo,
    limpiarPreview,
    guardar,
    eliminar,
    reintentarLimpieza,
    moverDespuesDeCambioCodigo,
    reintentarMovimiento,
    reintentarUrl: () => cargarUrlFirmada(imagenPersistidaActual.value?.mainStoragePath ?? null),
  };
}
