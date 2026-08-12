import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { useFiltrosCatalogoStore } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.store";
import { useCatalogoEngrasePermissions } from "./useCatalogoEngrasePermissions";
import {
  FILTRO_CODIGO_MAX, type CatalogoFiltroEditorMode, type CatalogoFiltroFieldErrors,
  type CatalogoFiltroGuardarInput, type CatalogoFiltroItem,
} from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";

const emptyDraft = (): CatalogoFiltroGuardarInput => ({
  id: null, codigo: "", esta_en_lista_compras: true, activo: true,
});

export function useCatalogoFiltros() {
  const store = useFiltrosCatalogoStore();
  const state = storeToRefs(store);
  const { canCreateCatalogItems, canEditCatalogItems } = useCatalogoEngrasePermissions();
  const modo = shallowRef<CatalogoFiltroEditorMode>("cerrado");
  const draft = ref<CatalogoFiltroGuardarInput | null>(null);
  const confirmacionAbierta = shallowRef(false);
  const confirmarDescarteAbierto = shallowRef(false);
  const filtrosMobileAbiertos = shallowRef(false);
  const fieldErrors = ref<CatalogoFiltroFieldErrors>({});
  const successMessage = shallowRef<string | null>(null);
  const triggerElement = shallowRef<HTMLElement | null>(null);
  let successTimer: ReturnType<typeof setTimeout> | null = null;

  const original = computed(() => draft.value?.id === null ? null
    : state.items.value.find(({ id }) => id === draft.value?.id) ?? null);
  const hasChanges = computed(() => {
    if (!draft.value) return false;
    if (modo.value === "crear") return Boolean(draft.value.codigo.trim())
      || !draft.value.esta_en_lista_compras || !draft.value.activo;
    return Boolean(original.value) && (draft.value.codigo.trim() !== original.value?.codigo
      || draft.value.esta_en_lista_compras !== original.value?.estaEnListaCompras
      || draft.value.activo !== original.value?.activo);
  });
  const drawerOpen = computed(() => modo.value !== "cerrado");
  const canSave = computed(() => modo.value === "crear"
    ? canCreateCatalogItems.value
    : modo.value === "editar" && canEditCatalogItems.value);
  const canSubmit = computed(() => canSave.value && Boolean(draft.value) && hasChanges.value
    && !state.guardando.value && !fieldErrors.value.codigo);

  function rememberTrigger(element?: HTMLElement | null): void {
    triggerElement.value = element ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  }
  function abrirCrear(): void {
    if (!canCreateCatalogItems.value) return;
    rememberTrigger(); store.limpiarErrorGuardado(); store.seleccionar(null);
    modo.value = "crear"; draft.value = emptyDraft(); fieldErrors.value = {};
  }
  function abrirEditar(item: CatalogoFiltroItem, trigger?: HTMLElement | null): void {
    rememberTrigger(trigger); store.limpiarErrorGuardado(); store.seleccionar(item.id); modo.value = "editar";
    draft.value = { id: item.id, codigo: item.codigo, esta_en_lista_compras: item.estaEnListaCompras, activo: item.activo };
    fieldErrors.value = {};
  }
  function updateDraft(value: CatalogoFiltroGuardarInput): void {
    if (!canSave.value) return;
    draft.value = value; store.limpiarErrorGuardado();
    if (fieldErrors.value.codigo && value.codigo.trim()) fieldErrors.value = {};
  }
  function validateCode(): boolean {
    const code = draft.value?.codigo.trim() ?? "";
    if (!code) { fieldErrors.value = { codigo: "Ingresa el código del filtro." }; return false; }
    if (code.length > FILTRO_CODIGO_MAX) {
      fieldErrors.value = { codigo: "El código no puede superar 100 caracteres." }; return false;
    }
    fieldErrors.value = {}; return true;
  }
  async function restoreFocus(): Promise<void> {
    await nextTick();
    if (triggerElement.value?.isConnected) triggerElement.value.focus();
    else document.querySelector<HTMLElement>("[data-catalogo-filtros-heading]")?.focus();
    triggerElement.value = null;
  }
  function cerrarAhora(): void {
    modo.value = "cerrado"; draft.value = null; confirmacionAbierta.value = false;
    confirmarDescarteAbierto.value = false; fieldErrors.value = {}; store.seleccionar(null); void restoreFocus();
  }
  function solicitarCierre(): void {
    if (state.guardando.value) return;
    if (hasChanges.value) { confirmarDescarteAbierto.value = true; return; }
    cerrarAhora();
  }
  function mostrarExito(message: string): void {
    successMessage.value = message;
    if (successTimer) clearTimeout(successTimer);
    successTimer = setTimeout(() => { successMessage.value = null; successTimer = null; }, 4000);
  }
  function aplicarErrorGuardado(): void {
    if (state.errorGuardado.value?.codigo === "CODIGO_FILTRO_REQUERIDO") fieldErrors.value = { codigo: "Ingresa el código del filtro." };
    if (state.errorGuardado.value?.codigo === "CODIGO_FILTRO_DUPLICADO") fieldErrors.value = { codigo: "Ya existe un filtro con ese código." };
  }
  async function guardarDirectamente(): Promise<void> {
    if (!canSave.value || !draft.value || !validateCode() || state.guardando.value) return;
    const wasCreate = draft.value.id === null;
    try {
      await store.guardar({ ...draft.value, codigo: draft.value.codigo.trim() });
      mostrarExito(wasCreate ? "El filtro se creó correctamente." : "El filtro se actualizó correctamente.");
      cerrarAhora();
    } catch { confirmacionAbierta.value = false; aplicarErrorGuardado(); }
  }
  async function submit(): Promise<void> {
    if (!canSave.value || !draft.value || !validateCode() || !hasChanges.value) return;
    if (modo.value === "crear") { await guardarDirectamente(); return; }
    confirmacionAbierta.value = true;
  }
  const confirmarActualizacion = (): Promise<void> => {
    if (!canEditCatalogItems.value) return Promise.resolve();
    return guardarDirectamente();
  };
  function cancelarConfirmacion(): void { if (!state.guardando.value) confirmacionAbierta.value = false; }
  function cancelarDescarte(): void { confirmarDescarteAbierto.value = false; }

  watch(state.seleccionadoId, (id) => {
    if (id === null && modo.value === "editar" && !state.guardando.value) cerrarAhora();
  });

  onBeforeUnmount(() => { if (successTimer) clearTimeout(successTimer); });

  return {
    ...state, modo, draft, original, drawerOpen, hasChanges, canSubmit, canSave,
    canCreateCatalogItems, canEditCatalogItems, fieldErrors,
    confirmacionAbierta, confirmarDescarteAbierto, filtrosMobileAbiertos, successMessage,
    inicializar: store.inicializar, reintentar: store.reintentar, actualizarBusqueda: store.actualizarBusqueda,
    actualizarTipoFiltro: store.actualizarTipoFiltro, actualizarCompras: store.actualizarCompras,
    actualizarEstado: store.actualizarEstado, actualizarOrden: store.actualizarOrden,
    limpiarFiltros: store.limpiarFiltros, abrirCrear, abrirEditar, updateDraft, validateCode,
    solicitarCierre, cerrarAhora, submit, confirmarActualizacion, cancelarConfirmacion, cancelarDescarte,
  };
}
