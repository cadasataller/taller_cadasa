import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAceitesCatalogoStore } from "@/stores/dbequipos/engrase/catalogo/aceitesCatalogo.store";
import { useCatalogoEngrasePermissions } from "./useCatalogoEngrasePermissions";
import { ACEITE_NOMBRE_MAX, type CatalogoAceiteEditorMode, type CatalogoAceiteFieldErrors, type CatalogoAceiteGuardarInput, type CatalogoAceiteItem } from "@/stores/dbequipos/engrase/catalogo/aceitesCatalogo.types";
const emptyDraft = (): CatalogoAceiteGuardarInput => ({ id: null, nombre: "", activo: true });
export function useCatalogoAceites() {
  const store = useAceitesCatalogoStore(); const state = storeToRefs(store);
  const { canCreateCatalogItems, canEditCatalogItems } = useCatalogoEngrasePermissions();
  const modo = shallowRef<CatalogoAceiteEditorMode>("cerrado"); const draft = ref<CatalogoAceiteGuardarInput | null>(null);
  const confirmacionAbierta = shallowRef(false); const confirmarDescarteAbierto = shallowRef(false); const filtrosMobileAbiertos = shallowRef(false);
  const fieldErrors = ref<CatalogoAceiteFieldErrors>({}); const successMessage = shallowRef<string | null>(null); const triggerElement = shallowRef<HTMLElement | null>(null);
  let successTimer: ReturnType<typeof setTimeout> | null = null;
  const original = computed(() => draft.value?.id === null ? null : state.items.value.find(({ id }) => id === draft.value?.id) ?? null);
  const hasChanges = computed(() => { if (!draft.value) return false; if (modo.value === "crear") return Boolean(draft.value.nombre.trim()) || !draft.value.activo; return Boolean(original.value) && (draft.value.nombre.trim() !== original.value?.nombre || draft.value.activo !== original.value?.activo); });
  const drawerOpen = computed(() => modo.value !== "cerrado"); const canSave = computed(() => modo.value === "crear" ? canCreateCatalogItems.value : modo.value === "editar" && canEditCatalogItems.value); const canSubmit = computed(() => canSave.value && Boolean(draft.value) && hasChanges.value && !state.guardando.value && !fieldErrors.value.nombre);
  function rememberTrigger(element?: HTMLElement | null): void { triggerElement.value = element ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null); }
  function abrirCrear(): void { if (!canCreateCatalogItems.value) return; rememberTrigger(); store.limpiarErrorGuardado(); store.seleccionar(null); modo.value = "crear"; draft.value = emptyDraft(); fieldErrors.value = {}; }
  function abrirEditar(item: CatalogoAceiteItem, trigger?: HTMLElement | null): void { rememberTrigger(trigger); store.limpiarErrorGuardado(); store.seleccionar(item.id); modo.value = "editar"; draft.value = { id: item.id, nombre: item.nombre, activo: item.activo }; fieldErrors.value = {}; }
  function updateDraft(value: CatalogoAceiteGuardarInput): void { if (!canSave.value) return; draft.value = value; store.limpiarErrorGuardado(); if (fieldErrors.value.nombre && value.nombre.trim()) fieldErrors.value = {}; }
  function validateName(): boolean { const name = draft.value?.nombre.trim() ?? ""; if (!name) { fieldErrors.value = { nombre: "Ingresa un nombre para mostrar." }; return false; } if (name.length > ACEITE_NOMBRE_MAX) { fieldErrors.value = { nombre: "El nombre no puede superar 100 caracteres." }; return false; } fieldErrors.value = {}; return true; }
  async function restoreFocus(): Promise<void> { await nextTick(); if (triggerElement.value?.isConnected) triggerElement.value.focus(); else document.querySelector<HTMLElement>("[data-catalogo-aceites-heading]")?.focus(); triggerElement.value = null; }
  function cerrarAhora(): void { modo.value = "cerrado"; draft.value = null; confirmacionAbierta.value = false; confirmarDescarteAbierto.value = false; fieldErrors.value = {}; store.seleccionar(null); void restoreFocus(); }
  function solicitarCierre(): void { if (state.guardando.value) return; if (hasChanges.value) { confirmarDescarteAbierto.value = true; return; } cerrarAhora(); }
  function mostrarExito(message: string): void { successMessage.value = message; if (successTimer) clearTimeout(successTimer); successTimer = setTimeout(() => { successMessage.value = null; successTimer = null; }, 4000); }
  function aplicarError(): void { if (state.errorGuardado.value?.codigo === "ACEITE_NOMBRE_REQUERIDO") fieldErrors.value = { nombre: "Ingresa un nombre para mostrar." }; if (state.errorGuardado.value?.codigo === "ACEITE_NOMBRE_DUPLICADO") fieldErrors.value = { nombre: "Ya existe un aceite con ese nombre." }; }
  async function guardarDirectamente(): Promise<void> { if (!canSave.value || !draft.value || !validateName() || state.guardando.value) return; const creating = draft.value.id === null; try { await store.guardar({ ...draft.value, nombre: draft.value.nombre.trim() }); mostrarExito(creating ? "El aceite se creó correctamente." : "El aceite se actualizó correctamente."); cerrarAhora(); } catch { confirmacionAbierta.value = false; aplicarError(); } }
  async function submit(): Promise<void> { if (!canSave.value || !draft.value || !validateName() || !hasChanges.value) return; if (modo.value === "crear") { await guardarDirectamente(); return; } confirmacionAbierta.value = true; }
  function cancelarConfirmacion(): void { if (!state.guardando.value) confirmacionAbierta.value = false; }
  function cancelarDescarte(): void { confirmarDescarteAbierto.value = false; }
  watch(state.seleccionadoId, (id) => { if (id === null && modo.value === "editar" && !state.guardando.value) cerrarAhora(); });
  onBeforeUnmount(() => { if (successTimer) clearTimeout(successTimer); });
  async function confirmarActualizacion(): Promise<void> { if (!canEditCatalogItems.value) return; await guardarDirectamente(); }
  return { ...state, modo, draft, original, drawerOpen, hasChanges, canSubmit, canSave, canCreateCatalogItems, canEditCatalogItems, confirmacionAbierta, confirmarDescarteAbierto, filtrosMobileAbiertos, fieldErrors, successMessage, inicializar: store.inicializar, reintentar: store.reintentar, actualizarBusqueda: store.actualizarBusqueda, actualizarSistema: store.actualizarSistema, actualizarEstado: store.actualizarEstado, actualizarUso: store.actualizarUso, actualizarOrden: store.actualizarOrden, limpiarFiltros: store.limpiarFiltros, abrirCrear, abrirEditar, updateDraft, validateName, solicitarCierre, cerrarAhora, submit, confirmarActualizacion, cancelarConfirmacion, cancelarDescarte };
}
