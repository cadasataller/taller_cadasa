import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { useFiltrosEngraseStore } from "../filtrosEngrase.store";
import { extraerCodigoErrorEdicionEquipo } from "./equipoEngraseEdicion.errors";
import { equipoEngraseEdicionService } from "./equipoEngraseEdicion.service";
import { crearTempId } from "./equipoEngraseEdicion.tempIds";
import { crearMotivoCambioFiltro } from "./equipoEngraseFiltroMotivo";
import type { ImagenSyncState } from "./equipoEngraseImagen.types";
import type {
  AuxiliaresEdicionEquipo,
  EquipoEdicionDraft,
  EquipoEdicionError,
  EquipoEdicionOverlay,
  EquipoEdicionSnapshot,
  EquipoImagenPersistida,
  EquipoEstado,
  AgregarFiltroExistenteDraft,
  AgregarFiltroTemporalDraft,
  EditarAsignacionFiltroDraft,
  AgregarAceiteDraft,
  ActualizarAceiteDraft,
  CatalogoAceiteDraftReference,
  ResultadoBusquedaFiltroOriginal,
  } from "./equipoEngraseEdicion.types";

const crearError = (error: Error): EquipoEdicionError => ({
  codigo: extraerCodigoErrorEdicionEquipo(error.message),
  mensaje: error.message,
});
const normalizarTexto = (valor: string): string => valor.trim().replace(/\s+/g, " ");
const claveTexto = (valor: string): string => normalizarTexto(valor).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
const referenciaClave = (referencia: { estado: "existente"; id: number } | { estado: "nuevo"; tempId: string }): string => referencia.estado === "existente" ? `id:${referencia.id}` : `temp:${referencia.tempId}`;
const clonarSnapshot = (
  snapshot: EquipoEdicionSnapshot,
): EquipoEdicionSnapshot => ({
  equipo: { ...snapshot.equipo },
  etapas: snapshot.etapas.map((etapa) => ({ ...etapa })),
  filtros: snapshot.filtros.map((filtro) => ({
    ...filtro,
    tipoFiltro: { ...filtro.tipoFiltro },
    filtro: { ...filtro.filtro },
    draftId: `equipo_filtro_${filtro.id}`,
    estadoOperacion: "existente",
    estadoAntesDeEliminar: null,
    filtroReferencia: { estado: "existente", id: filtro.filtro.id, tempId: null, codigo: filtro.filtro.codigo, estaEnListaCompras: filtro.filtro.estaEnListaCompras },
    tipoFiltroReferencia: { estado: "existente", id: filtro.tipoFiltro.id, tempId: null, nombre: filtro.tipoFiltro.nombre },
  })),
  aceites: snapshot.aceites.map((aceite) => ({ ...aceite, sistema: { ...aceite.sistema }, aceite: { ...aceite.aceite } })),
  imagen: { ...snapshot.imagen },
});
const crearBorrador = (
  snapshot: EquipoEdicionSnapshot,
): EquipoEdicionDraft => ({
  ...clonarSnapshot(snapshot),
  filtros: snapshot.filtros.map((filtro) => ({
    ...filtro,
    tipoFiltro: { ...filtro.tipoFiltro },
    filtro: { ...filtro.filtro },
    draftId: `equipo_filtro_${filtro.id}`,
    estadoOperacion: "existente",
    estadoAntesDeEliminar: null,
    filtroReferencia: { estado: "existente", id: filtro.filtro.id, tempId: null, codigo: filtro.filtro.codigo, estaEnListaCompras: filtro.filtro.estaEnListaCompras },
    tipoFiltroReferencia: { estado: "existente", id: filtro.tipoFiltro.id, tempId: null, nombre: filtro.tipoFiltro.nombre },
  })),
  aceites: snapshot.aceites.map((aceite) => ({
    ...aceite,
    sistema: { ...aceite.sistema },
    aceite: { ...aceite.aceite },
    draftId: `equipo_aceite_${aceite.equipoAceiteId}`,
    estadoOperacion: "existente",
    estadoAntesDeEliminar: null,
    sistemaReferencia: { estado: "existente", id: aceite.sistema.id, tempId: null, nombre: aceite.sistema.nombre },
    aceiteReferencia: { estado: "existente", id: aceite.aceite.id, tempId: null, nombre: aceite.aceite.nombre },
  })),
  tipoEquipoReferencia: { estado: "existente", id: snapshot.equipo.tipoEquipoId, nombre: snapshot.equipo.tipoEquipo, tempId: null },
  operaciones: {
    datos: "existente",
    etapas: "existente",
    filtros: "existente",
    aceites: "existente",
  },
});
const imagenDelListado = (codigo: string): EquipoImagenPersistida => {
  const equipo = useFiltrosEngraseStore().equipos.find(
    (item) => item.codigo === codigo,
  );
  return {
    mainStoragePath: equipo?.main_storage_path ?? null,
    tieneImagenMain: equipo?.tiene_imagen_main ?? false,
    imagenActualizadaEn: equipo?.imagen_actualizada_en ?? null,
  };
};

export const useEquipoEngraseEdicionStore = defineStore(
  "dbequipos_engrase_edicion",
  () => {
    const codigoOriginal = shallowRef<string | null>(null);
    const original = ref<EquipoEdicionSnapshot | null>(null);
    const draft = ref<EquipoEdicionDraft | null>(null);
    const auxiliares = ref<AuxiliaresEdicionEquipo | null>(null);
    const activeOverlay = shallowRef<EquipoEdicionOverlay | null>(null);
    const loading = shallowRef(false);
    const saving = shallowRef(false);
    const loadError = ref<EquipoEdicionError | null>(null);
    const saveError = ref<EquipoEdicionError | null>(null);
    const imagenPersistidaActual = ref<EquipoImagenPersistida | null>(null);
    const imagenSyncState = shallowRef<ImagenSyncState>({ kind: "idle" });
    let solicitudActual = 0;

    const isReady = computed(
      () =>
        original.value !== null &&
        draft.value !== null &&
        auxiliares.value !== null &&
        !loading.value,
    );
    const isDirty = computed(() => {
      if (!original.value || !draft.value) return false;
      const filtrosOriginales = original.value.filtros.map((filtro) => `existente:${filtro.id}:id:${filtro.tipoFiltro.id}:id:${filtro.filtro.id}:${filtro.cantidad}`).sort();
      const filtrosBorrador = draft.value.filtros.flatMap((filtro) => {
        if (filtro.estadoOperacion === "pendiente_eliminacion") return filtro.id ? [`eliminado:${filtro.id}`] : [];
        const tipo = referenciaClave(filtro.tipoFiltroReferencia);
        const referenciaFiltro = filtro.filtroReferencia.estado === "existente" ? `id:${filtro.filtroReferencia.id}` : `temp:${filtro.filtroReferencia.tempId}`;
        return [`${filtro.id ? `existente:${filtro.id}` : `nuevo:${filtro.draftId}`}:${tipo}:${referenciaFiltro}:${filtro.cantidad}`];
      }).sort();
      const aceitesOriginales = original.value.aceites.map((aceite) => `existente:${aceite.equipoAceiteId}:id:${aceite.sistema.id}:id:${aceite.aceite.id}`).sort();
      const aceitesBorrador = draft.value.aceites.flatMap((aceite) => {
        if (aceite.estadoOperacion === "pendiente_eliminacion") return aceite.equipoAceiteId ? [`eliminado:${aceite.equipoAceiteId}`] : [];
        return [`${aceite.equipoAceiteId ? `existente:${aceite.equipoAceiteId}` : `nuevo:${aceite.draftId}`}:${referenciaClave(aceite.sistemaReferencia)}:${referenciaClave(aceite.aceiteReferencia)}`];
      }).sort();
      return (
        JSON.stringify({
          codigo: normalizarTexto(original.value.equipo.codigo), tipo: original.value.equipo.tipoEquipoId, subtipo: normalizarTexto(original.value.equipo.subtipo), estado: original.value.equipo.estado,
          etapas: original.value.etapas.map((etapa) => etapa.id).sort((a, b) => a - b),
          filtros: filtrosOriginales,
          aceites: aceitesOriginales,
        }) !==
        JSON.stringify({
          codigo: normalizarTexto(draft.value.equipo.codigo), tipo: draft.value.tipoEquipoReferencia.estado === "existente" ? draft.value.tipoEquipoReferencia.id : draft.value.tipoEquipoReferencia.tempId, subtipo: normalizarTexto(draft.value.equipo.subtipo), estado: draft.value.equipo.estado,
          etapas: draft.value.etapas.map((etapa) => etapa.id).sort((a, b) => a - b),
          filtros: filtrosBorrador,
          aceites: aceitesBorrador,
        })
      );
    });
    const hasActiveOverlay = computed(() => activeOverlay.value !== null);
    const canSave = computed(
      () =>
        isReady.value &&
        isDirty.value &&
        !saving.value &&
        activeOverlay.value === null,
    );
    const activeFiltersCount = computed(() => draft.value?.filtros.filter((filtro) => filtro.estadoOperacion !== "pendiente_eliminacion").length ?? 0);
    const activeStagesCount = computed(() => draft.value?.etapas.length ?? 0);
    const activeOilsCount = computed(() => draft.value?.aceites.filter((aceite) => aceite.estadoOperacion !== "pendiente_eliminacion").length ?? 0);

    async function cargar(codigo: string): Promise<void> {
      const codigoNormalizado = codigo.trim();
      const solicitud = ++solicitudActual;
      if (!codigoNormalizado) {
        codigoOriginal.value = null;
        original.value = null;
        draft.value = null;
        loadError.value = {
          codigo: "CODIGO_EQUIPO_REQUERIDO",
          mensaje: "Debe indicar el código del equipo.",
        };
        return;
      }
      loading.value = true;
      loadError.value = null;
      saveError.value = null;
      activeOverlay.value = null;
      try {
        const [equipo, catalogos] = await Promise.all([
          equipoEngraseEdicionService.obtenerEquipoParaEdicion(
            codigoNormalizado,
          ),
          equipoEngraseEdicionService.obtenerAuxiliaresEdicionEquipo(),
        ]);
        if (solicitud !== solicitudActual) return;
        const snapshot: EquipoEdicionSnapshot = {
          ...equipo,
          imagen: imagenDelListado(codigoNormalizado),
        };
        codigoOriginal.value = codigoNormalizado;
        original.value = clonarSnapshot(snapshot);
        draft.value = crearBorrador(snapshot);
        imagenPersistidaActual.value = { ...snapshot.imagen };
        auxiliares.value = structuredClone(catalogos);
      } catch (error) {
        if (solicitud !== solicitudActual) return;
        const fallo =
          error instanceof Error
            ? error
            : new Error("No se pudo cargar el editor.");
        loadError.value = crearError(fallo);
        original.value = null;
        draft.value = null;
        auxiliares.value = null;
      } finally {
        if (solicitud === solicitudActual) loading.value = false;
      }
    }
    function solicitarSalida(): boolean {
      if (!isDirty.value) return true;
      activeOverlay.value = "confirmar_salida";
      return false;
    }
    function continuarEditando(): void {
      activeOverlay.value = null;
    }
    function descartarCambios(): void {
      draft.value = original.value ? crearBorrador(original.value) : null;
      activeOverlay.value = null;
    }
    function actualizarCodigo(codigo: string): void { if (draft.value) draft.value.equipo.codigo = codigo.trim(); }
    function seleccionarTipoEquipo(tipo: EquipoEdicionDraft["tipoEquipoReferencia"]): void { if (!draft.value) return; draft.value.tipoEquipoReferencia = tipo; draft.value.equipo.tipoEquipoId = tipo.estado === "existente" ? tipo.id : 0; draft.value.equipo.tipoEquipo = tipo.nombre; }
    function actualizarSubtipo(subtipo: string): void { if (draft.value) draft.value.equipo.subtipo = subtipo.trim(); }
    function actualizarEstado(estado: EquipoEstado): void { if (draft.value) draft.value.equipo.estado = estado; }
    function agregarEtapa(etapaId: number): void { if (!draft.value || draft.value.etapas.some((etapa) => etapa.id === etapaId)) return; const etapa = auxiliares.value?.etapas.find((item) => item.id === etapaId); if (etapa) draft.value.etapas.push({ ...etapa }); }
    function quitarEtapa(etapaId: number): void { if (!draft.value || draft.value.etapas.length <= 1) return; draft.value.etapas = draft.value.etapas.filter((etapa) => etapa.id !== etapaId); }
    function esTipoEquipoDuplicado(nombre: string): boolean { const clave = claveTexto(nombre); return Boolean(clave && (auxiliares.value?.tiposEquipo.some((tipo) => claveTexto(tipo.nombre) === clave) || (draft.value?.tipoEquipoReferencia.estado === "nuevo" && claveTexto(draft.value.tipoEquipoReferencia.nombre) === clave))); }
    function crearYSeleccionarTipoEquipo(nombre: string): boolean { const normalizado = normalizarTexto(nombre); if (!draft.value || !normalizado || esTipoEquipoDuplicado(normalizado)) return false; seleccionarTipoEquipo({ estado: "nuevo", id: null, tempId: crearTempId("tipo_equipo"), nombre: normalizado, subtiposSugeridos: [] }); return true; }
    function abrirNuevoTipoEquipo(): void { activeOverlay.value = "nuevo_tipo_equipo"; }
    async function buscarFiltroOriginalParaAsignar(codigo: string): Promise<ResultadoBusquedaFiltroOriginal> {
      return equipoEngraseEdicionService.buscarFiltroOriginalParaAsignar(normalizarTexto(codigo).toUpperCase(), codigoOriginal.value ?? undefined);
    }
    function agregarFiltroExistente(entrada: AgregarFiltroExistenteDraft): boolean {
      if (!draft.value || entrada.cantidad < 1) return false;
      const asignacionPendiente = draft.value.filtros.find((item) => item.estadoOperacion === "pendiente_eliminacion" && item.filtro.id === entrada.filtro.id && item.tipoFiltro.id === entrada.tipoFiltro.id);
      if (asignacionPendiente) {
        asignacionPendiente.estadoOperacion = asignacionPendiente.estadoAntesDeEliminar ?? "existente";
        asignacionPendiente.estadoAntesDeEliminar = null;
        return true;
      }
      if (draft.value.filtros.some((item) => item.estadoOperacion !== "pendiente_eliminacion" && (item.filtro.id === entrada.filtro.id || item.tipoFiltro.id === entrada.tipoFiltro.id))) return false;
      draft.value.filtros.push({ id: 0, equipoId: draft.value.equipo.id, tipoFiltro: { ...entrada.tipoFiltro }, filtro: { ...entrada.filtro }, cantidad: entrada.cantidad, cantidadEquivalencias: entrada.cantidadEquivalencias ?? 0, draftId: crearTempId("equipo_filtro"), estadoOperacion: "nuevo", estadoAntesDeEliminar: null, filtroReferencia: { estado: "existente", id: entrada.filtro.id, tempId: null, codigo: entrada.filtro.codigo, estaEnListaCompras: entrada.filtro.estaEnListaCompras }, tipoFiltroReferencia: { estado: "existente", id: entrada.tipoFiltro.id, tempId: null, nombre: entrada.tipoFiltro.nombre } });
      return true;
    }
    function agregarFiltroTemporal(entrada: AgregarFiltroTemporalDraft): boolean {
      if (!draft.value || entrada.cantidad < 1) return false;
      const tipoRepetido = draft.value.filtros.some((item) => item.estadoOperacion !== "pendiente_eliminacion" && claveTexto(item.tipoFiltroReferencia.nombre) === claveTexto(entrada.tipoFiltro.nombre));
      if (tipoRepetido) return false;
      draft.value.filtros.push({ id: 0, equipoId: draft.value.equipo.id, tipoFiltro: { id: entrada.tipoFiltro.estado === "existente" ? entrada.tipoFiltro.id : 0, nombre: entrada.tipoFiltro.nombre }, filtro: { id: entrada.filtro.estado === "existente" ? entrada.filtro.id : 0, codigo: entrada.filtro.codigo, estaEnListaCompras: entrada.filtro.estaEnListaCompras }, cantidad: entrada.cantidad, cantidadEquivalencias: 0, draftId: crearTempId("equipo_filtro"), estadoOperacion: "nuevo", estadoAntesDeEliminar: null, filtroReferencia: entrada.filtro, tipoFiltroReferencia: entrada.tipoFiltro });
      return true;
    }
    function actualizarAsignacionFiltro(entrada: EditarAsignacionFiltroDraft): void {
      if (!draft.value || entrada.cantidad < 1) return;
      const item = draft.value.filtros.find((filtro) => filtro.draftId === entrada.draftId && filtro.estadoOperacion !== "pendiente_eliminacion");
      if (!item) return;
      if (entrada.tipoFiltroId === null) {
        if (item.tipoFiltroReferencia.estado !== "nuevo") return;
        item.cantidad = entrada.cantidad;
        return;
      }
      const tipo = auxiliares.value?.tiposFiltro.find((filtro) => filtro.id === entrada.tipoFiltroId);
      if (!tipo || draft.value.filtros.some((filtro) => filtro.draftId !== item.draftId && filtro.estadoOperacion !== "pendiente_eliminacion" && filtro.tipoFiltro.id === tipo.id)) return;
      item.tipoFiltro = { id: tipo.id, nombre: tipo.nombre };
      item.tipoFiltroReferencia = { estado: "existente", id: tipo.id, tempId: null, nombre: tipo.nombre };
      item.cantidad = entrada.cantidad;
      if (item.estadoOperacion !== "nuevo") {
        const originalFiltro = original.value?.filtros.find((filtro) => filtro.id === item.id);
        item.estadoOperacion = originalFiltro && crearMotivoCambioFiltro(originalFiltro, item) ? "actualizado" : "existente";
      }
    }
    function marcarFiltroParaEliminar(draftId: string): void {
      if (!draft.value || activeFiltersCount.value <= 1) return;
      const item = draft.value.filtros.find((filtro) => filtro.draftId === draftId);
      if (!item || item.estadoOperacion === "pendiente_eliminacion") return;
      item.estadoAntesDeEliminar = item.estadoOperacion;
      item.estadoOperacion = "pendiente_eliminacion";
    }
    function deshacerEliminacionFiltro(draftId: string): void {
      const item = draft.value?.filtros.find((filtro) => filtro.draftId === draftId);
      if (!item || item.estadoOperacion !== "pendiente_eliminacion") return;
      item.estadoOperacion = item.estadoAntesDeEliminar ?? "existente";
      item.estadoAntesDeEliminar = null;
    }
    function referenciaAceiteActiva(referencia: CatalogoAceiteDraftReference): string {
      return referencia.estado === "existente" ? `id:${referencia.id}` : `temp:${referencia.tempId}`;
    }
    function existeSistemaActivo(sistema: CatalogoAceiteDraftReference, excluirDraftId?: string): boolean {
      const clave = referenciaAceiteActiva(sistema);
      return draft.value?.aceites.some((aceite) => aceite.draftId !== excluirDraftId && aceite.estadoOperacion !== "pendiente_eliminacion" && referenciaAceiteActiva(aceite.sistemaReferencia) === clave) ?? false;
    }
    function agregarAceite(entrada: AgregarAceiteDraft): boolean {
      if (!draft.value || existeSistemaActivo(entrada.sistema)) return false;
      draft.value.aceites.push({
        equipoAceiteId: 0,
        sistema: { id: entrada.sistema.estado === "existente" ? entrada.sistema.id : 0, nombre: entrada.sistema.nombre },
        aceite: { id: entrada.aceite.estado === "existente" ? entrada.aceite.id : 0, nombre: entrada.aceite.nombre },
        draftId: crearTempId("equipo_aceite"), estadoOperacion: "nuevo", estadoAntesDeEliminar: null,
        sistemaReferencia: entrada.sistema, aceiteReferencia: entrada.aceite,
      });
      return true;
    }
    function actualizarAceite(entrada: ActualizarAceiteDraft): boolean {
      const item = draft.value?.aceites.find((aceite) => aceite.draftId === entrada.draftId && aceite.estadoOperacion !== "pendiente_eliminacion");
      if (!item || existeSistemaActivo(entrada.sistema, entrada.draftId)) return false;
      item.sistema = { id: entrada.sistema.estado === "existente" ? entrada.sistema.id : 0, nombre: entrada.sistema.nombre };
      item.aceite = { id: entrada.aceite.estado === "existente" ? entrada.aceite.id : 0, nombre: entrada.aceite.nombre };
      item.sistemaReferencia = entrada.sistema;
      item.aceiteReferencia = entrada.aceite;
      if (item.estadoOperacion !== "nuevo") {
        const originalAceite = original.value?.aceites.find((aceite) => aceite.equipoAceiteId === item.equipoAceiteId);
        item.estadoOperacion = originalAceite && originalAceite.sistema.id === item.sistema.id && originalAceite.aceite.id === item.aceite.id ? "existente" : "actualizado";
      }
      return true;
    }
    function marcarAceiteParaEliminar(draftId: string): void {
      const item = draft.value?.aceites.find((aceite) => aceite.draftId === draftId);
      if (!item || item.estadoOperacion === "pendiente_eliminacion") return;
      item.estadoAntesDeEliminar = item.estadoOperacion;
      item.estadoOperacion = "pendiente_eliminacion";
    }
    function deshacerEliminacionAceite(draftId: string): boolean {
      const item = draft.value?.aceites.find((aceite) => aceite.draftId === draftId);
      if (!item || item.estadoOperacion !== "pendiente_eliminacion" || existeSistemaActivo(item.sistemaReferencia, item.draftId)) return false;
      item.estadoOperacion = item.estadoAntesDeEliminar ?? "existente";
      item.estadoAntesDeEliminar = null;
      return true;
    }
    function actualizarImagenPersistida(imagen: EquipoImagenPersistida): void {
      imagenPersistidaActual.value = { ...imagen };
      if (original.value) original.value.imagen = { ...imagen };
      if (draft.value) draft.value.imagen = { ...imagen };
      if (draft.value) useFiltrosEngraseStore().actualizarImagenEquipo(draft.value.equipo.id, imagen);
    }
    function actualizarEstadoSyncImagen(estado: ImagenSyncState): void { imagenSyncState.value = estado; }
    function reset(): void {
      solicitudActual += 1;
      codigoOriginal.value = null;
      original.value = null;
      draft.value = null;
      auxiliares.value = null;
      activeOverlay.value = null;
      loading.value = false;
      saving.value = false;
      loadError.value = null;
      saveError.value = null;
      imagenPersistidaActual.value = null;
      imagenSyncState.value = { kind: "idle" };
    }
    return {
      codigoOriginal,
      original,
      draft,
      auxiliares,
      activeOverlay,
      loading,
      saving,
      loadError,
      saveError,
      imagenPersistidaActual,
      imagenSyncState,
      isReady,
      isDirty,
      hasActiveOverlay,
      canSave,
      activeFiltersCount,
      activeStagesCount,
      activeOilsCount,
      cargar,
      solicitarSalida,
      continuarEditando,
      descartarCambios,
      reset,
      actualizarCodigo, seleccionarTipoEquipo, actualizarSubtipo, actualizarEstado, agregarEtapa, quitarEtapa, crearYSeleccionarTipoEquipo, esTipoEquipoDuplicado, abrirNuevoTipoEquipo, buscarFiltroOriginalParaAsignar, agregarFiltroExistente, agregarFiltroTemporal, actualizarAsignacionFiltro, marcarFiltroParaEliminar, deshacerEliminacionFiltro, agregarAceite, actualizarAceite, marcarAceiteParaEliminar, deshacerEliminacionAceite,
      actualizarImagenPersistida, actualizarEstadoSyncImagen,
    };
  },
);
