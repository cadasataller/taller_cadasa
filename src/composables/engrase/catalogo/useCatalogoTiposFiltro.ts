import { computed, nextTick, onBeforeUnmount, ref, shallowRef } from "vue";
import { storeToRefs } from "pinia";
import { useTiposFiltroCatalogoStore } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.store";
import { useCatalogoEngrasePermissions } from "./useCatalogoEngrasePermissions";
import {
  TIPO_FILTRO_NOMBRE_MAX,
  type CatalogoTipoFiltroEditorMode,
  type CatalogoTipoFiltroFieldErrors,
  type CatalogoTipoFiltroGuardarInput,
  type CatalogoTipoFiltroItem,
} from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

const EMPTY_DRAFT = (): CatalogoTipoFiltroGuardarInput => ({
  id: null,
  nombre: "",
  activo: true,
});

export function useCatalogoTiposFiltro() {
  const store = useTiposFiltroCatalogoStore();
  const state = storeToRefs(store);
  const { canCreateCatalogItems, canEditCatalogItems } = useCatalogoEngrasePermissions();
  const modo = shallowRef<CatalogoTipoFiltroEditorMode>("cerrado");
  const draft = ref<CatalogoTipoFiltroGuardarInput | null>(null);
  const confirmacionAbierta = shallowRef(false);
  const confirmarDescarteAbierto = shallowRef(false);
  const fieldErrors = ref<CatalogoTipoFiltroFieldErrors>({});
  const successMessage = shallowRef<string | null>(null);
  const triggerElement = shallowRef<HTMLElement | null>(null);
  let successTimer: ReturnType<typeof setTimeout> | null = null;

  const original = computed(() =>
    draft.value?.id === null
      ? null
      : state.items.value.find((item) => item.id === draft.value?.id) ?? null,
  );
  const hasChanges = computed(() => {
    if (!draft.value) return false;
    if (modo.value === "crear") {
      return Boolean(draft.value.nombre.trim()) || !draft.value.activo;
    }
    return Boolean(original.value)
      && (
        draft.value.nombre.trim() !== original.value?.nombre
        || draft.value.activo !== original.value?.activo
      );
  });
  const drawerOpen = computed(() => modo.value !== "cerrado");
  const canSave = computed(() =>
    modo.value === "crear"
      ? canCreateCatalogItems.value
      : modo.value === "editar" && canEditCatalogItems.value,
  );
  const canSubmit = computed(() =>
    canSave.value
    && Boolean(draft.value)
    && hasChanges.value
    && !state.guardando.value
    && !fieldErrors.value.nombre,
  );

  function rememberTrigger(): void {
    triggerElement.value = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  }

  function abrirCrear(): void {
    if (!canCreateCatalogItems.value) return;
    rememberTrigger();
    store.limpiarErrorGuardado();
    store.seleccionar(null);
    modo.value = "crear";
    draft.value = EMPTY_DRAFT();
    fieldErrors.value = {};
  }

  function abrirEditar(item: CatalogoTipoFiltroItem): void {
    rememberTrigger();
    store.limpiarErrorGuardado();
    store.seleccionar(item.id);
    modo.value = "editar";
    draft.value = { id: item.id, nombre: item.nombre, activo: item.activo };
    fieldErrors.value = {};
  }

  function updateDraft(value: CatalogoTipoFiltroGuardarInput): void {
    if (!canSave.value) return;
    draft.value = value;
    store.limpiarErrorGuardado();
    if (fieldErrors.value.nombre && value.nombre.trim()) {
      fieldErrors.value = {};
    }
  }

  function validateName(): boolean {
    const nombre = draft.value?.nombre.trim() ?? "";
    if (!nombre) {
      fieldErrors.value = { nombre: "Ingresa un nombre para mostrar." };
      return false;
    }
    if (nombre.length > TIPO_FILTRO_NOMBRE_MAX) {
      fieldErrors.value = { nombre: "El nombre no puede superar 100 caracteres." };
      return false;
    }
    fieldErrors.value = {};
    return true;
  }

  async function restoreFocus(): Promise<void> {
    await nextTick();
    triggerElement.value?.focus();
    triggerElement.value = null;
  }

  function cerrarAhora(): void {
    modo.value = "cerrado";
    draft.value = null;
    confirmacionAbierta.value = false;
    confirmarDescarteAbierto.value = false;
    fieldErrors.value = {};
    store.seleccionar(null);
    void restoreFocus();
  }

  function solicitarCierre(): void {
    if (state.guardando.value) return;
    if (hasChanges.value) {
      confirmarDescarteAbierto.value = true;
      return;
    }
    cerrarAhora();
  }

  function mostrarExito(message: string): void {
    successMessage.value = message;
    if (successTimer) clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      successMessage.value = null;
      successTimer = null;
    }, 4000);
  }

  function aplicarErrorGuardado(): void {
    const code = state.errorGuardado.value?.codigo;
    if (code === "TIPO_FILTRO_NOMBRE_REQUERIDO") {
      fieldErrors.value = { nombre: "Ingresa un nombre para mostrar." };
    } else if (code === "TIPO_FILTRO_NOMBRE_DUPLICADO") {
      fieldErrors.value = { nombre: "Ya existe un tipo de filtro con ese nombre." };
    }
  }

  async function guardarDirectamente(): Promise<void> {
    if (!canSave.value || !draft.value || !validateName()) return;
    try {
      const item = await store.guardar({ ...draft.value, nombre: draft.value.nombre.trim() });
      mostrarExito(
        draft.value.id === null
          ? "El tipo de filtro se creó correctamente."
          : "El tipo de filtro se actualizó correctamente.",
      );
      if (draft.value.id !== null) store.seleccionar(item.id);
      cerrarAhora();
    } catch {
      confirmacionAbierta.value = false;
      aplicarErrorGuardado();
    }
  }

  async function submit(): Promise<void> {
    if (!canSave.value || !draft.value || !validateName() || !hasChanges.value) return;
    if (modo.value === "crear") {
      await guardarDirectamente();
      return;
    }
    confirmacionAbierta.value = true;
  }

  async function confirmarActualizacion(): Promise<void> {
    if (!canEditCatalogItems.value || state.guardando.value) return;
    await guardarDirectamente();
  }

  function cancelarConfirmacion(): void {
    if (!state.guardando.value) confirmacionAbierta.value = false;
  }

  function cancelarDescarte(): void {
    confirmarDescarteAbierto.value = false;
  }

  onBeforeUnmount(() => {
    if (successTimer) clearTimeout(successTimer);
  });

  return {
    ...state,
    modo,
    draft,
    original,
    drawerOpen,
    hasChanges,
    canSubmit,
    canSave,
    canCreateCatalogItems,
    canEditCatalogItems,
    fieldErrors,
    confirmacionAbierta,
    confirmarDescarteAbierto,
    successMessage,
    inicializar: store.inicializar,
    reintentar: store.reintentar,
    actualizarBusqueda: store.actualizarBusqueda,
    actualizarEstado: store.actualizarEstado,
    actualizarOrden: store.actualizarOrden,
    limpiarFiltros: store.limpiarFiltros,
    abrirCrear,
    abrirEditar,
    updateDraft,
    validateName,
    solicitarCierre,
    cerrarAhora,
    submit,
    confirmarActualizacion,
    cancelarConfirmacion,
    cancelarDescarte,
  };
}
