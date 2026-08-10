import { computed, defineComponent, ref, shallowRef } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuxiliaresEdicionEquipo, EquipoEdicionDraft, EquipoEdicionValidationIssue } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
import type { ImagenSyncState } from "@/stores/dbequipos/engrase/edicion/equipoEngraseImagen.types";

const draft: EquipoEdicionDraft = {
  equipo: { id: 6, codigo: "410002", tipoEquipoId: 1, tipoEquipo: "Buses", subtipo: "Bus", estado: "activo" },
  etapas: [{ id: 1, nombre: "Cultivo" }],
  filtros: [{ id: 9, equipoId: 6, tipoFiltro: { id: 2, nombre: "Aire" }, filtro: { id: 4, codigo: "AF-1", estaEnListaCompras: true }, cantidad: 1, cantidadEquivalencias: 0, draftId: "equipo_filtro_9", estadoOperacion: "existente", estadoAntesDeEliminar: null, tipoFiltroReferencia: { estado: "existente", id: 2, tempId: null, nombre: "Aire" }, filtroReferencia: { estado: "existente", id: 4, tempId: null, codigo: "AF-1", estaEnListaCompras: true } }],
  aceites: [],
  imagen: { mainStoragePath: null, tieneImagenMain: false, imagenActualizadaEn: null },
  tipoEquipoReferencia: { estado: "existente", id: 1, tempId: null, nombre: "Buses" },
  operaciones: { datos: "existente", etapas: "existente", filtros: "existente", aceites: "existente" },
};
const auxiliares: AuxiliaresEdicionEquipo = { tiposEquipo: [], etapas: draft.etapas, tiposFiltro: [], sistemasAceite: [], aceites: [] };
const guardarEditor = vi.fn(async (): Promise<void> => {});
const moverImagen = vi.fn(async (): Promise<void> => {});
const editor = {
  loading: shallowRef(false), loadError: ref(null), draft: ref<EquipoEdicionDraft | null>(draft), auxiliares: ref<AuxiliaresEdicionEquipo | null>(auxiliares),
  activeStagesCount: computed(() => draft.etapas.length), activeFiltersCount: computed(() => draft.filtros.length), activeOilsCount: computed(() => draft.aceites.length),
  canSave: shallowRef(true), saving: shallowRef(false), saveError: ref<{ codigo: string; mensaje: string } | null>(null), successMessage: shallowRef<string | null>(null), validationErrors: ref<EquipoEdicionValidationIssue[]>([]), imagenSyncState: shallowRef<ImagenSyncState>({ kind: "idle" }), activeOverlay: shallowRef(null),
  volver: vi.fn(), descartarYVolver: vi.fn(), continuarEditando: vi.fn(), reintentar: vi.fn(), guardar: guardarEditor,
  actualizarCodigo: vi.fn(), seleccionarTipoEquipo: vi.fn(), actualizarSubtipo: vi.fn(), actualizarEstado: vi.fn(), agregarEtapa: vi.fn(), quitarEtapa: vi.fn(), crearYSeleccionarTipoEquipo: vi.fn(), esTipoEquipoDuplicado: vi.fn(() => false), abrirNuevoTipoEquipo: vi.fn(), buscarFiltroOriginalParaAsignar: vi.fn(), agregarFiltroExistente: vi.fn(() => true), agregarFiltroTemporal: vi.fn(() => true), actualizarAsignacionFiltro: vi.fn(), marcarFiltroParaEliminar: vi.fn(), deshacerEliminacionFiltro: vi.fn(), agregarAceite: vi.fn(() => true), actualizarAceite: vi.fn(() => true), marcarAceiteParaEliminar: vi.fn(), deshacerEliminacionAceite: vi.fn(() => true),
};
const imagenManager = {
  urlActual: shallowRef<string | null>(null), urlLoading: shallowRef(false), urlError: shallowRef<string | null>(null), tieneImagen: shallowRef(false), bloqueado: shallowRef(false), preparada: shallowRef(null), imagenSyncState: editor.imagenSyncState,
  seleccionarArchivo: vi.fn(), guardar: vi.fn(), eliminar: vi.fn(), reintentarLimpieza: vi.fn(), reintentarMovimiento: vi.fn(), reintentarUrl: vi.fn(), limpiarPreview: vi.fn(), moverDespuesDeCambioCodigo: moverImagen,
};

vi.mock("@/composables/engrase/useEquipoEngraseEditor", () => ({ useEquipoEngraseEditor: () => editor }));
vi.mock("@/composables/engrase/useEquipoImagenManager", () => ({ useEquipoImagenManager: () => imagenManager }));

import EquipoEngraseEditarView from "./EquipoEngraseEditarView.vue";

const ShellStub = defineComponent({
  name: "EquipoEdicionShell",
  props: { canSave: Boolean, saving: Boolean, message: String, messageKind: String, validationCount: Number, movePending: Boolean, draft: Object, stagesCount: Number, filtersCount: Number, oilsCount: Number },
  emits: ["save", "cancel", "back", "retryImage"],
  template: `<section><button data-test="save" @click="$emit('save')">Guardar</button><button data-test="retry" @click="$emit('retryImage')">Reintentar</button><slot name="datos"/><slot name="filtros"/><slot name="aceites"/><slot name="overlay"/></section>`,
});
const stubs = {
  EquipoEdicionShell: ShellStub,
  EquipoDatosForm: true,
  EquipoFiltrosSection: true,
  EquipoFiltroOverlay: true,
  EquipoAceitesSection: true,
  EquipoAceiteOverlay: true,
  EquipoImagenTrigger: true,
  EquipoImagenOverlay: true,
};

describe("vista de edición de equipo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    editor.saveError.value = null;
    editor.successMessage.value = null;
    editor.imagenSyncState.value = { kind: "idle" };
  });

  it("conecta el CTA con un único guardado y el movimiento de imagen", async () => {
    const wrapper = mount(EquipoEngraseEditarView, { global: { stubs } });
    await wrapper.get('[data-test="save"]').trigger("click");
    expect(guardarEditor).toHaveBeenCalledOnce();
    expect(guardarEditor).toHaveBeenCalledWith(moverImagen);
  });

  it("presenta el éxito parcial y ofrece reintento sin repetir el guardado general", async () => {
    editor.successMessage.value = "Los cambios se guardaron, pero falta mover la imagen.";
    editor.imagenSyncState.value = { kind: "move_pending", sourcePath: "equipos/410002/main_thumb/a.webp", destinationPath: "equipos/410003/main_thumb/a.webp" };
    const wrapper = mount(EquipoEngraseEditarView, { global: { stubs } });
    const shell = wrapper.getComponent(ShellStub);
    expect(shell.props("messageKind")).toBe("partial");
    expect(shell.props("movePending")).toBe(true);
    await wrapper.get('[data-test="retry"]').trigger("click");
    expect(imagenManager.reintentarMovimiento).toHaveBeenCalledOnce();
    expect(guardarEditor).not.toHaveBeenCalled();
  });
});
