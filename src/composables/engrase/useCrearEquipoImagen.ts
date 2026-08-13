import { computed, onBeforeUnmount, shallowRef } from "vue";
import { useFiltrosEngraseStore } from "@/stores/dbequipos/engrase/filtrosEngrase.store";
import { useEquipoEngraseCreacionStore } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.store";
import { equipoEngraseCreacionImagenService } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.imagen.service";
import { equipoEngraseImagenStorageService } from "@/stores/dbequipos/engrase/imagen/equipoEngraseImagen.storage.service";
import { prepararImagenEquipoWebp } from "@/stores/dbequipos/engrase/imagen/equipoEngraseImagen.processing";
import { crearRutaImagenEquipo } from "@/stores/dbequipos/engrase/imagen/equipoEngraseImagen.types";
import type { ImagenEquipoPreparada } from "@/stores/dbequipos/engrase/imagen/equipoEngraseImagen.types";
import type {
  CrearEquipoImagenState,
  AgregarImagenEquipoCreadoRespuesta,
  ResultadoFinalizarCreacion,
  ResultadoGuardarImagenCreacion,
} from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";

const normalizarCodigo = (codigo: string): string =>
  codigo.trim().toLocaleLowerCase();

export function useCrearEquipoImagen() {
  const store = useEquipoEngraseCreacionStore();
  const preparedImage = shallowRef<ImagenEquipoPreparada | null>(null);
  const imageState = shallowRef<CrearEquipoImagenState>({ kind: "idle" });
  const localWarning = shallowRef<string | null>(null);
  const isImageProcessing = computed(
    () =>
      imageState.value.kind === "preparing" ||
      imageState.value.kind === "uploading" ||
      imageState.value.kind === "registering",
  );
  const hasPreparedImage = computed(() => preparedImage.value !== null);
  const hasRegisteredImage = computed(
    () => store.draft.equipoCreado?.tiene_imagen_main === true,
  );
  const canSelectImage = computed(
    () =>
      store.isImagePhase &&
      !isImageProcessing.value &&
      !hasRegisteredImage.value,
  );
  const canSaveImage = computed(
    () =>
      store.isImagePhase &&
      hasPreparedImage.value &&
      !isImageProcessing.value &&
      !hasRegisteredImage.value,
  );
  const canSkipImage = computed(
    () => store.isImagePhase && !isImageProcessing.value,
  );
  const canFinishWizard = computed(
    () =>
      !isImageProcessing.value &&
      (store.finalizacionState.kind === "image_saved" ||
        store.finalizacionState.kind === "image_skipped"),
  );

  function limpiarPreview(): void {
    if (preparedImage.value)
      URL.revokeObjectURL(preparedImage.value.previewUrl);
    preparedImage.value = null;
  }

  async function seleccionarImagen(archivo: File): Promise<void> {
    if (!canSelectImage.value) return;
    limpiarPreview();
    imageState.value = { kind: "preparing" };
    try {
      preparedImage.value = await prepararImagenEquipoWebp(archivo);
      imageState.value = { kind: "ready" };
    } catch (error) {
      imageState.value = {
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo preparar la imagen.",
      };
    }
  }

  async function limpiarArchivoSubido(
    path: string,
    message: string,
  ): Promise<ResultadoGuardarImagenCreacion> {
    try {
      await equipoEngraseImagenStorageService.eliminar(path);
      imageState.value = { kind: "error", message };
      return { kind: "error", message };
    } catch {
      imageState.value = { kind: "cleanup_pending", path, message };
      return { kind: "cleanup_pending", path };
    }
  }

  async function guardarImagen(): Promise<ResultadoGuardarImagenCreacion> {
    if (isImageProcessing.value) return { kind: "busy" };
    const equipo = store.draft.equipoCreado;
    const preparada = preparedImage.value;
    if (
      !equipo ||
      !store.isImagePhase ||
      !preparada ||
      hasRegisteredImage.value
    )
      return { kind: "invalid" };
    const path = crearRutaImagenEquipo(equipo.codigo);
    imageState.value = { kind: "uploading", path };
    try {
      await equipoEngraseImagenStorageService.subir(path, preparada.file);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo subir la imagen.";
      imageState.value = { kind: "error", message };
      return { kind: "error", message };
    }

    imageState.value = { kind: "registering", path };
    let respuesta: AgregarImagenEquipoCreadoRespuesta;
    try {
      respuesta =
        await equipoEngraseCreacionImagenService.agregarImagenEquipoCreado({
          codigoEquipo: equipo.codigo,
          storagePath: path,
          descripcion: null,
        });
      if (
        normalizarCodigo(respuesta.codigo) !==
          normalizarCodigo(equipo.codigo) ||
        respuesta.equipoId !== equipo.id ||
        respuesta.imagen.mainStoragePath !== path
      ) {
        return await limpiarArchivoSubido(
          path,
          "La respuesta de imagen no corresponde al equipo creado.",
        );
      }
    } catch (error) {
      return limpiarArchivoSubido(
        path,
        error instanceof Error
          ? error.message
          : "No se pudo registrar la imagen.",
      );
    }

    store.actualizarImagenEquipoCreado(respuesta.imagen);
    try {
      useFiltrosEngraseStore().actualizarImagenEquipo(
        respuesta.equipoId,
        respuesta.imagen,
      );
    } catch {
      localWarning.value =
        "La imagen fue registrada, pero la lista local necesita sincronizarse.";
    }
    limpiarPreview();
    imageState.value = { kind: "success", path };
    return { kind: "success", imagen: respuesta.imagen };
  }

  async function reintentarLimpiezaImagen(): Promise<void> {
    if (imageState.value.kind !== "cleanup_pending") return;
    const { path, message } = imageState.value;
    try {
      await equipoEngraseImagenStorageService.eliminar(path);
      imageState.value = preparedImage.value
        ? { kind: "ready" }
        : { kind: "idle" };
    } catch (error) {
      imageState.value = {
        kind: "cleanup_pending",
        path,
        message: error instanceof Error ? error.message : message,
      };
    }
  }

  function omitirImagen(): ResultadoFinalizarCreacion {
    if (!canSkipImage.value)
      return {
        ok: false,
        codigo: "IMAGEN_EN_PROCESO",
        mensaje: "Espera a que termine la operación de imagen.",
      };
    limpiarPreview();
    return store.omitirImagen();
  }

  function finalizarCreacion(): ResultadoFinalizarCreacion {
    if (!canFinishWizard.value)
      return {
        ok: false,
        codigo: "FINALIZACION_NO_DISPONIBLE",
        mensaje: "Guarda u omite la imagen antes de finalizar.",
      };
    return store.finalizarCreacion();
  }

  function resetDespuesDeFinalizar(): void {
    if (store.finalizacionState.kind !== "finished") return;
    limpiarPreview();
    store.resetCompleto();
  }

  onBeforeUnmount(limpiarPreview);

  return {
    preparedImage,
    imageState,
    localWarning,
    isImageProcessing,
    hasPreparedImage,
    hasRegisteredImage,
    canSelectImage,
    canSaveImage,
    canSkipImage,
    canFinishWizard,
    seleccionarImagen,
    guardarImagen,
    reintentarLimpiezaImagen,
    limpiarPreview,
    omitirImagen,
    finalizarCreacion,
    resetDespuesDeFinalizar,
  };
}
