import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import { crearTempId } from "../shared/equipoEngraseDraft.tempIds";
import type { EquipoEngraseListItem } from "../filtrosEngrase.types";
import {
  crearClaveNombreCreacion,
  crearEquipoDraftInicial,
  normalizarCodigoCreacion,
  normalizarTextoCreacion,
} from "./equipoEngraseCreacion.draft";
import { equipoEngraseCreacionService } from "./equipoEngraseCreacion.service";
import { ErrorCreacionEquipo } from "./equipoEngraseCreacion.remote-errors";
import {
  puedeSolicitarValidacionCodigo,
  validacionCorrespondeAlCodigoActual,
  crearClaveTipoFiltroCreacion,
  crearClaveSistemaCreacion,
  validarCreacionEquipoCompleta,
  validarPasoAceitesEquipo,
  validarPasoDatosEquipo,
  validarPasoFiltrosEquipo,
} from "./equipoEngraseCreacion.validation";
import {
  agregarFiltroExistenteLocal,
  agregarFiltroLocal,
  actualizarFiltroLocal,
  buscarReferenciaFiltroTemporalPorCodigo,
  combinarSugerenciasFiltroCreacion,
  combinarTiposFiltroBusquedaCreacion,
  crearFiltroTemporal as crearFiltroTemporalLocal,
  crearOpcionesTipoFiltroCreacion,
  crearTipoFiltroTemporal as crearTipoFiltroTemporalLocal,
  estaTipoFiltroOcupado,
  obtenerEstadoCodigoFiltro,
} from "./equipoEngraseCreacion.filtros";
import {
  actualizarAceiteLocal,
  agregarAceiteLocal,
  crearAceiteTemporal as crearAceiteTemporalLocal,
  crearOpcionesSistemaAceiteCreacion,
  crearResumenAceitesCreacion,
  crearSistemaTemporal as crearSistemaTemporalLocal,
  estaSistemaOcupado,
  obtenerAceitesTemporales,
  obtenerSistemasTemporales,
} from "./equipoEngraseCreacion.aceites";
import type {
  AgregarAceiteCreacionInput,
  AgregarFiltroExistenteCreacionInput,
  AgregarFiltroTemporalCreacionInput,
  AuxiliaresEquipoEngrase,
  CrearEquipoFiltroEditorState,
  CrearEquipoAceiteEditorState,
  CrearEquipoError,
  CrearEquipoOverlayState,
  CrearEquipoPaso,
  CrearEquipoValidationIssue,
  CrearEquipoValidationResult,
  EquipoEstado,
  EditarFiltroCreacionInput,
  EditarAceiteCreacionInput,
  FiltroNuevoCreacionReference,
  ResultadoMutacionFiltroCreacion,
  ResultadoMutacionAceiteCreacion,
  CatalogoDraftReference,
  TipoEquipoCreacionReference,
  TipoFiltroCreacionReference,
} from "./equipoEngraseCreacion.types";

const copiarAuxiliares = (
  auxiliares: AuxiliaresEquipoEngrase,
): AuxiliaresEquipoEngrase => ({
  tiposEquipo: auxiliares.tiposEquipo.map((tipo) => ({
    ...tipo,
    subtiposSugeridos: [...tipo.subtiposSugeridos],
  })),
  etapas: auxiliares.etapas.map((etapa) => ({ ...etapa })),
  tiposFiltro: auxiliares.tiposFiltro.map((tipo) => ({
    ...tipo,
    tiposEquipoQueLoUsan: [...tipo.tiposEquipoQueLoUsan],
  })),
  sistemasAceite: auxiliares.sistemasAceite.map((sistema) => ({ ...sistema })),
  aceites: auxiliares.aceites.map((aceite) => ({ ...aceite })),
});

const copiarEquipoLista = (equipo: EquipoEngraseListItem): EquipoEngraseListItem => ({
  ...equipo,
  etapas: equipo.etapas.map((etapa) => ({ ...etapa })),
});

const normalizarError = (error: Error): CrearEquipoError => ({
  codigo: error instanceof ErrorCreacionEquipo
    ? error.codigo
    : "ERROR_CARGA_AUXILIARES",
  mensaje: error.message || "No se pudieron cargar los auxiliares.",
});

export const useEquipoEngraseCreacionStore = defineStore(
  "dbequipos_engrase_creacion",
  () => {
    const draft = ref(crearEquipoDraftInicial());
    const auxiliares = ref<AuxiliaresEquipoEngrase | null>(null);
    const pasoActual = shallowRef<CrearEquipoPaso>(1);
    const mayorPasoCompletado = shallowRef<0 | 1 | 2 | 3 | 4>(0);
    const loadingInicial = shallowRef(false);
    const errorInicial = shallowRef<CrearEquipoError | null>(null);
    const validationErrors = ref<CrearEquipoValidationIssue[]>([]);
    const activeOverlay = shallowRef<CrearEquipoOverlayState | null>(null);
    const filtroEditor = shallowRef<CrearEquipoFiltroEditorState>({ kind: "closed" });
    const cierreEditorFiltroPendiente = shallowRef(false);
    const aceiteEditor = shallowRef<CrearEquipoAceiteEditorState>({ kind: "closed" });
    const cierreEditorAceitePendiente = shallowRef(false);
    const salidaSolicitada = shallowRef(false);
    let solicitudCarga = 0;
    let solicitudValidacion = 0;
    let solicitudBusquedaFiltro = 0;
    let cargaPendiente: Promise<void> | null = null;

    const isReady = computed(() => auxiliares.value !== null && !loadingInicial.value);
    const isCreated = computed(() => draft.value.equipoCreado !== null);
    const isDraftPhase = computed(() => !isCreated.value && pasoActual.value <= 4);
    const isImagePhase = computed(() => isCreated.value && pasoActual.value === 5);
    const hasActiveOverlay = computed(() => activeOverlay.value !== null);
    const hasDraftContent = computed(() => {
      const datos = draft.value.datos;
      return Boolean(datos.codigo.trim()) || datos.tipoEquipo !== null || Boolean(datos.subtipo.trim()) ||
        datos.etapas.length > 0 || datos.estado !== "activo" || draft.value.filtros.length > 0 || draft.value.aceites.length > 0;
    });
    const canValidateCode = computed(() =>
      isReady.value && !isCreated.value && !isValidatingCode.value &&
      puedeSolicitarValidacionCodigo(draft.value.datos.codigo),
    );
    const isValidatingCode = computed(() => draft.value.validacionCodigo.estado === "loading");
    const isCurrentCodeValidated = computed(() => validacionCorrespondeAlCodigoActual(draft.value));
    const canGoBack = computed(() =>
      isDraftPhase.value && pasoActual.value > 1 && !loadingInicial.value && !hasActiveOverlay.value,
    );
    const canGoNext = computed(() => {
      if (!isReady.value || hasActiveOverlay.value || !isDraftPhase.value || pasoActual.value === 4) return false;
      return validarPaso(pasoActual.value).valido;
    });
    const completedSteps = computed(() =>
      [1, 2, 3, 4].filter((paso) => paso <= mayorPasoCompletado.value) as Array<1 | 2 | 3 | 4>,
    );
    const stagesCount = computed(() => draft.value.datos.etapas.length);
    const filtersCount = computed(() => draft.value.filtros.length);
    const usedFilterCodes = computed(() => new Set(draft.value.filtros.map((filtro) => normalizarCodigoCreacion(filtro.filtro.codigo))));
    const usedFilterIds = computed(() => new Set(draft.value.filtros.flatMap((filtro) => filtro.filtro.estado === "existente" ? [filtro.filtro.id] : [])));
    const occupiedFilterTypeKeys = computed(() => new Set(draft.value.filtros.map((filtro) => crearClaveTipoFiltroCreacion(filtro.tipoFiltro))));
    const occupiedExistingFilterTypeIds = computed(() => new Set(draft.value.filtros.flatMap((filtro) => filtro.tipoFiltro.estado === "existente" ? [filtro.tipoFiltro.id] : [])));
    const occupiedNewFilterTypeNames = computed(() => new Set(draft.value.filtros.flatMap((filtro) => filtro.tipoFiltro.estado === "nuevo" ? [crearClaveNombreCreacion(filtro.tipoFiltro.nombre)] : [])));
    const oilsCount = computed(() => draft.value.aceites.length);
    const hasOils = computed(() => oilsCount.value > 0);
    const occupiedSystemKeys = computed(() => new Set(draft.value.aceites.map((aceite) => crearClaveSistemaCreacion(aceite.sistema))));
    const occupiedExistingSystemIds = computed(() => new Set(draft.value.aceites.flatMap((aceite) => aceite.sistema.estado === "existente" ? [aceite.sistema.id] : [])));
    const occupiedNewSystemNames = computed(() => new Set(draft.value.aceites.flatMap((aceite) => aceite.sistema.estado === "nuevo" ? [crearClaveNombreCreacion(aceite.sistema.nombre)] : [])));
    const canOpenStep = computed(() => (paso: CrearEquipoPaso): boolean =>
      puedeAbrirPaso(paso),
    );

    function puedeMutarBorrador(): boolean {
      return !isCreated.value;
    }

    function establecerErrores(errores: CrearEquipoValidationIssue[]): void {
      validationErrors.value = errores.map((error) => ({ ...error }));
    }

    function limpiarErrores(): void {
      validationErrors.value = [];
    }

    function limpiarErroresDeCampo(fieldId: string): void {
      validationErrors.value = validationErrors.value.filter(
        (error) => error.fieldId !== fieldId,
      );
    }

    function actualizarErroresPasoFiltros(): void {
      validationErrors.value = validationErrors.value.filter((error) => error.paso !== 2);
      const validacion = validarPasoFiltrosEquipo(draft.value);
      if (!validacion.valido) validationErrors.value.push(...validacion.errores);
    }

    function actualizarErroresPasoAceites(): void {
      validationErrors.value = validationErrors.value.filter((error) => error.paso !== 3);
      const validacion = validarPasoAceitesEquipo(draft.value);
      if (!validacion.valido) validationErrors.value.push(...validacion.errores);
    }

    async function cargarInicial(force = false): Promise<void> {
      if (cargaPendiente) return cargaPendiente;
      if (auxiliares.value !== null && !force) return;
      const solicitud = ++solicitudCarga;
      cargaPendiente = (async () => {
        loadingInicial.value = true;
        errorInicial.value = null;
        try {
          const respuesta = await equipoEngraseCreacionService.obtenerAuxiliaresEquipo();
          if (solicitud !== solicitudCarga) return;
          auxiliares.value = copiarAuxiliares(respuesta);
        } catch (error) {
          if (solicitud !== solicitudCarga) return;
          const fallo = error instanceof Error
            ? error
            : new Error("No se pudieron cargar los auxiliares.");
          errorInicial.value = normalizarError(fallo);
          if (auxiliares.value === null) auxiliares.value = null;
        } finally {
          if (solicitud === solicitudCarga) loadingInicial.value = false;
          if (solicitud === solicitudCarga) cargaPendiente = null;
        }
      })();
      return cargaPendiente;
    }

    const reintentarCargaInicial = (): Promise<void> => cargarInicial(true);

    function actualizarCodigo(codigo: string): void {
      if (!puedeMutarBorrador()) return;
      const anterior = normalizarCodigoCreacion(draft.value.datos.codigo);
      draft.value.datos.codigo = codigo;
      if (anterior !== normalizarCodigoCreacion(codigo)) {
        solicitudValidacion += 1;
        draft.value.validacionCodigo = { estado: "idle" };
      }
      limpiarErroresDeCampo("equipo-creacion-codigo");
    }

    function seleccionarTipoEquipo(tipo: TipoEquipoCreacionReference): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.tipoEquipo = {
        ...tipo,
        subtiposSugeridos: [...tipo.subtiposSugeridos],
      };
      limpiarErroresDeCampo("equipo-creacion-tipo");
    }

    function limpiarTipoEquipo(): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.tipoEquipo = null;
      limpiarErroresDeCampo("equipo-creacion-tipo");
    }

    function actualizarSubtipo(subtipo: string): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.subtipo = subtipo;
      limpiarErroresDeCampo("equipo-creacion-subtipo");
    }

    function actualizarEstado(estado: EquipoEstado): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.estado = estado;
      limpiarErroresDeCampo("equipo-creacion-estado");
    }

    function agregarEtapa(etapaId: number): void {
      if (!puedeMutarBorrador() || draft.value.datos.etapas.some((etapa) => etapa.id === etapaId)) return;
      const etapa = auxiliares.value?.etapas.find((item) => item.id === etapaId);
      if (etapa) draft.value.datos.etapas.push({ ...etapa });
      limpiarErroresDeCampo("equipo-creacion-etapas");
    }

    function quitarEtapa(etapaId: number): void {
      if (!puedeMutarBorrador()) return;
      draft.value.datos.etapas = draft.value.datos.etapas.filter((etapa) => etapa.id !== etapaId);
      limpiarErroresDeCampo("equipo-creacion-etapas");
    }

    function esTipoEquipoDuplicado(nombre: string): boolean {
      const clave = crearClaveNombreCreacion(nombre);
      return Boolean(clave) && (auxiliares.value?.tiposEquipo.some(
        (tipo) => crearClaveNombreCreacion(tipo.nombre) === clave,
      ) ?? false);
    }

    function crearYSeleccionarTipoEquipo(nombre: string): boolean {
      const nombreNormalizado = normalizarTextoCreacion(nombre);
      if (!puedeMutarBorrador() || !nombreNormalizado || esTipoEquipoDuplicado(nombreNormalizado)) return false;
      seleccionarTipoEquipo({
        estado: "nuevo",
        id: null,
        tempId: crearTempId("tipo_equipo"),
        nombre: nombreNormalizado,
        subtiposSugeridos: [],
      });
      return true;
    }

    async function validarCodigoActual(): Promise<void> {
      if (!canValidateCode.value) return;
      const codigo = normalizarCodigoCreacion(draft.value.datos.codigo);
      const solicitud = ++solicitudValidacion;
      draft.value.validacionCodigo = { estado: "loading", codigo };
      try {
        const respuesta = await equipoEngraseCreacionService.validarCodigoEquipoParaCreacion(codigo);
        if (solicitud !== solicitudValidacion || codigo !== normalizarCodigoCreacion(draft.value.datos.codigo)) return;
        draft.value.validacionCodigo = respuesta.puedeCrearse
          ? { estado: "valido", codigo }
          : {
              estado: "invalido",
              codigo,
              modeloExistente: respuesta.modeloExistente,
              activoExistente: respuesta.activoExistente,
            };
      } catch (error) {
        if (solicitud !== solicitudValidacion || codigo !== normalizarCodigoCreacion(draft.value.datos.codigo)) return;
        const mensaje = error instanceof Error
          ? error.message || "No se pudo validar el código."
          : "No se pudo validar el código.";
        draft.value.validacionCodigo = { estado: "error", codigo, mensaje };
      }
    }

    function validarPaso(paso: CrearEquipoPaso): CrearEquipoValidationResult {
      if (paso === 1) return validarPasoDatosEquipo(draft.value);
      if (paso === 2) return validarPasoFiltrosEquipo(draft.value);
      if (paso === 3) return validarPasoAceitesEquipo(draft.value);
      if (paso === 4) return validarCreacionEquipoCompleta(draft.value);
      return { valido: isCreated.value, errores: [] };
    }

    function avanzar(): boolean {
      if (!canGoNext.value || pasoActual.value === 4) return false;
      const validacion = validarPaso(pasoActual.value);
      establecerErrores(validacion.errores);
      if (!validacion.valido) return false;
      mayorPasoCompletado.value = Math.max(
        mayorPasoCompletado.value,
        pasoActual.value,
      ) as 1 | 2 | 3 | 4;
      pasoActual.value = (pasoActual.value + 1) as CrearEquipoPaso;
      limpiarErrores();
      return true;
    }

    function retroceder(): boolean {
      if (!canGoBack.value) return false;
      pasoActual.value = (pasoActual.value - 1) as CrearEquipoPaso;
      return true;
    }

    function puedeAbrirPaso(paso: CrearEquipoPaso): boolean {
      if (loadingInicial.value || hasActiveOverlay.value) return false;
      if (isCreated.value) return paso === 5;
      if (paso === 5) return false;
      return paso <= Math.min(mayorPasoCompletado.value + 1, 4);
    }

    function irAPaso(paso: CrearEquipoPaso): boolean {
      if (!puedeAbrirPaso(paso)) return false;
      pasoActual.value = paso;
      return true;
    }

    function abrirOverlay(overlay: CrearEquipoOverlayState): boolean {
      if (isCreated.value || activeOverlay.value !== null) return false;
      if (overlay.kind === "agregar_filtro") {
        filtroEditor.value = { kind: "search", query: "", result: null, loading: false, error: null, dirty: false };
        cierreEditorFiltroPendiente.value = false;
      }
      if (overlay.kind === "editar_filtro") {
        if (!draft.value.filtros.some((filtro) => filtro.draftId === overlay.draftId)) return false;
        filtroEditor.value = { kind: "edit", draftId: overlay.draftId, dirty: false };
        cierreEditorFiltroPendiente.value = false;
      }
      if (overlay.kind === "agregar_aceite") {
        aceiteEditor.value = { kind: "add", dirty: false, error: null };
        cierreEditorAceitePendiente.value = false;
      }
      if (overlay.kind === "editar_aceite") {
        if (!draft.value.aceites.some((aceite) => aceite.draftId === overlay.draftId)) return false;
        aceiteEditor.value = { kind: "edit", draftId: overlay.draftId, dirty: false, error: null };
        cierreEditorAceitePendiente.value = false;
      }
      activeOverlay.value = { ...overlay };
      return true;
    }

    function cerrarOverlay(): void {
      activeOverlay.value = null;
      if (filtroEditor.value.kind !== "closed") descartarEditorFiltro();
      if (aceiteEditor.value.kind !== "closed") descartarEditorAceite();
    }

    function abrirAgregarFiltro(): boolean {
      return pasoActual.value === 2 && abrirOverlay({ kind: "agregar_filtro" });
    }

    async function buscarFiltroOriginal(codigo: string): Promise<void> {
      if (filtroEditor.value.kind !== "search" || !puedeMutarBorrador()) return;
      const query = normalizarCodigoCreacion(codigo);
      if (!query || filtroEditor.value.loading && filtroEditor.value.query === query) return;
      const solicitud = ++solicitudBusquedaFiltro;
      filtroEditor.value = { kind: "search", query, result: null, loading: true, error: null, dirty: true };
      try {
        const result = await equipoEngraseCreacionService.buscarFiltroOriginalParaCreacion(query);
        if (solicitud !== solicitudBusquedaFiltro || filtroEditor.value.kind !== "search") return;
        filtroEditor.value = { ...filtroEditor.value, loading: false, result };
      } catch (error) {
        if (solicitud !== solicitudBusquedaFiltro || filtroEditor.value.kind !== "search") return;
        const mensaje = error instanceof Error ? error.message || "No se pudo buscar el filtro." : "No se pudo buscar el filtro.";
        filtroEditor.value = { ...filtroEditor.value, loading: false, error: mensaje };
      }
    }

    function abrirEditarFiltro(draftId: string): boolean {
      return abrirOverlay({ kind: "editar_filtro", draftId });
    }

    function cerrarEditorFiltroTrasExito(): void {
      solicitudBusquedaFiltro += 1;
      filtroEditor.value = { kind: "closed" };
      activeOverlay.value = null;
      cierreEditorFiltroPendiente.value = false;
    }

    function agregarFiltroExistente(input: AgregarFiltroExistenteCreacionInput): ResultadoMutacionFiltroCreacion {
      if (!puedeMutarBorrador()) return { ok: false, codigo: "EQUIPO_YA_CREADO", mensaje: "El equipo ya fue creado." };
      const cambio = agregarFiltroExistenteLocal(input, draft.value.filtros);
      if (cambio.resultado.ok) { draft.value.filtros = cambio.filtros; actualizarErroresPasoFiltros(); cerrarEditorFiltroTrasExito(); }
      return cambio.resultado;
    }

    function agregarFiltroTemporal(input: AgregarFiltroTemporalCreacionInput): ResultadoMutacionFiltroCreacion {
      if (!puedeMutarBorrador()) return { ok: false, codigo: "EQUIPO_YA_CREADO", mensaje: "El equipo ya fue creado." };
      const cambio = agregarFiltroLocal(input, draft.value.filtros);
      if (cambio.resultado.ok) { draft.value.filtros = cambio.filtros; actualizarErroresPasoFiltros(); cerrarEditorFiltroTrasExito(); }
      return cambio.resultado;
    }

    function actualizarFiltro(input: EditarFiltroCreacionInput): ResultadoMutacionFiltroCreacion {
      if (!puedeMutarBorrador()) return { ok: false, codigo: "EQUIPO_YA_CREADO", mensaje: "El equipo ya fue creado." };
      const cambio = actualizarFiltroLocal(input, draft.value.filtros);
      if (cambio.resultado.ok) { draft.value.filtros = cambio.filtros; actualizarErroresPasoFiltros(); cerrarEditorFiltroTrasExito(); }
      return cambio.resultado;
    }

    function quitarFiltro(draftId: string): ResultadoMutacionFiltroCreacion {
      if (!puedeMutarBorrador()) return { ok: false, codigo: "EQUIPO_YA_CREADO", mensaje: "El equipo ya fue creado." };
      if (draft.value.filtros.length <= 1) return { ok: false, codigo: "FILTRO_MINIMO_REQUERIDO", mensaje: "Debe existir al menos un filtro." };
      if (!draft.value.filtros.some((filtro) => filtro.draftId === draftId)) return { ok: false, codigo: "FILTRO_NO_ENCONTRADO", mensaje: "No se encontró el filtro a eliminar." };
      draft.value.filtros = draft.value.filtros.filter((filtro) => filtro.draftId !== draftId);
      actualizarErroresPasoFiltros();
      return { ok: true, draftId };
    }

    function crearTipoFiltroTemporal(nombre: string): TipoFiltroCreacionReference | null {
      const catalogo = auxiliares.value?.tiposFiltro.map((tipo) => ({ estado: "existente" as const, id: tipo.id, tempId: null, nombre: tipo.nombre })) ?? [];
      return crearTipoFiltroTemporalLocal(nombre, catalogo, draft.value.filtros);
    }

    function crearFiltroTemporal(codigo: string, estaEnListaCompras: boolean): FiltroNuevoCreacionReference | null {
      return crearFiltroTemporalLocal(codigo, estaEnListaCompras, draft.value.filtros);
    }

    function obtenerOpcionesTipoFiltro(excludeDraftId?: string) {
      const catalogo = auxiliares.value?.tiposFiltro.map((tipo) => ({ estado: "existente" as const, id: tipo.id, tempId: null, nombre: tipo.nombre })) ?? [];
      return crearOpcionesTipoFiltroCreacion(catalogo, draft.value.filtros, excludeDraftId);
    }

    function solicitarCerrarEditorFiltro(): boolean {
      if (filtroEditor.value.kind === "closed") return true;
      if (!filtroEditor.value.dirty) { descartarEditorFiltro(); return true; }
      cierreEditorFiltroPendiente.value = true;
      return false;
    }

    function continuarEditandoFiltro(): void { cierreEditorFiltroPendiente.value = false; }

    function descartarEditorFiltro(): void {
      solicitudBusquedaFiltro += 1;
      filtroEditor.value = { kind: "closed" };
      activeOverlay.value = null;
      cierreEditorFiltroPendiente.value = false;
    }

    function abrirAgregarAceite(): boolean {
      return pasoActual.value === 3 && abrirOverlay({ kind: "agregar_aceite" });
    }

    function abrirEditarAceite(draftId: string): boolean {
      return abrirOverlay({ kind: "editar_aceite", draftId });
    }

    function cerrarEditorAceiteTrasExito(): void {
      aceiteEditor.value = { kind: "closed" };
      activeOverlay.value = null;
      cierreEditorAceitePendiente.value = false;
    }

    function resultadoErrorAceite(codigo: "SISTEMA_ACEITE_INVALIDO" | "ACEITE_INVALIDO", mensaje: string): ResultadoMutacionAceiteCreacion {
      if (aceiteEditor.value.kind !== "closed") aceiteEditor.value = { ...aceiteEditor.value, error: mensaje };
      return { ok: false, codigo, mensaje };
    }

    function validarReferenciaCatalogoActual(referencia: CatalogoDraftReference, tipo: "sistema" | "aceite"): ResultadoMutacionAceiteCreacion | null {
      if (referencia.estado !== "existente") return null;
      const catalogo = tipo === "sistema" ? auxiliares.value?.sistemasAceite : auxiliares.value?.aceites;
      const disponible = catalogo?.some((item) => item.id === referencia.id) ?? false;
      return disponible ? null : resultadoErrorAceite(tipo === "sistema" ? "SISTEMA_ACEITE_INVALIDO" : "ACEITE_INVALIDO", `El ${tipo} de aceite seleccionado ya no está disponible.`);
    }

    function agregarAceite(input: AgregarAceiteCreacionInput): ResultadoMutacionAceiteCreacion {
      if (!puedeMutarBorrador()) return { ok: false, codigo: "EQUIPO_YA_CREADO", mensaje: "El equipo ya fue creado." };
      const errorSistema = validarReferenciaCatalogoActual(input.sistema, "sistema");
      const errorAceite = validarReferenciaCatalogoActual(input.aceite, "aceite");
      if (errorSistema) return errorSistema;
      if (errorAceite) return errorAceite;
      const cambio = agregarAceiteLocal(input, draft.value.aceites);
      if (cambio.resultado.ok) { draft.value.aceites = cambio.asociaciones; actualizarErroresPasoAceites(); cerrarEditorAceiteTrasExito(); }
      else if (aceiteEditor.value.kind !== "closed") aceiteEditor.value = { ...aceiteEditor.value, error: cambio.resultado.mensaje };
      return cambio.resultado;
    }

    function actualizarAceite(input: EditarAceiteCreacionInput): ResultadoMutacionAceiteCreacion {
      if (!puedeMutarBorrador()) return { ok: false, codigo: "EQUIPO_YA_CREADO", mensaje: "El equipo ya fue creado." };
      const errorSistema = validarReferenciaCatalogoActual(input.sistema, "sistema");
      const errorAceite = validarReferenciaCatalogoActual(input.aceite, "aceite");
      if (errorSistema) return errorSistema;
      if (errorAceite) return errorAceite;
      const cambio = actualizarAceiteLocal(input, draft.value.aceites);
      if (cambio.resultado.ok) { draft.value.aceites = cambio.asociaciones; actualizarErroresPasoAceites(); cerrarEditorAceiteTrasExito(); }
      else if (aceiteEditor.value.kind !== "closed") aceiteEditor.value = { ...aceiteEditor.value, error: cambio.resultado.mensaje };
      return cambio.resultado;
    }

    function quitarAceite(draftId: string): ResultadoMutacionAceiteCreacion {
      if (!puedeMutarBorrador()) return { ok: false, codigo: "EQUIPO_YA_CREADO", mensaje: "El equipo ya fue creado." };
      if (!draft.value.aceites.some((aceite) => aceite.draftId === draftId)) return { ok: false, codigo: "ASOCIACION_ACEITE_NO_ENCONTRADA", mensaje: "No se encontró la asociación de aceite." };
      draft.value.aceites = draft.value.aceites.filter((aceite) => aceite.draftId !== draftId);
      actualizarErroresPasoAceites();
      return { ok: true, draftId };
    }

    function referenciasSistemaCatalogo(): CatalogoDraftReference[] {
      return auxiliares.value?.sistemasAceite.map((sistema) => ({ estado: "existente" as const, id: sistema.id, tempId: null, nombre: sistema.nombre })) ?? [];
    }

    function referenciasAceiteCatalogo(): CatalogoDraftReference[] {
      return auxiliares.value?.aceites.map((aceite) => ({ estado: "existente" as const, id: aceite.id, tempId: null, nombre: aceite.nombre })) ?? [];
    }

    function crearSistemaTemporal(nombre: string): CatalogoDraftReference | null {
      return crearSistemaTemporalLocal(nombre, referenciasSistemaCatalogo(), draft.value.aceites);
    }

    function crearAceiteTemporal(nombre: string): CatalogoDraftReference | null {
      return crearAceiteTemporalLocal(nombre, referenciasAceiteCatalogo(), draft.value.aceites);
    }

    function obtenerOpcionesSistemaAceite(excludeDraftId?: string) {
      return crearOpcionesSistemaAceiteCreacion(referenciasSistemaCatalogo(), draft.value.aceites, excludeDraftId);
    }

    function solicitarCerrarEditorAceite(): boolean {
      if (aceiteEditor.value.kind === "closed") return true;
      if (!aceiteEditor.value.dirty) { descartarEditorAceite(); return true; }
      cierreEditorAceitePendiente.value = true;
      return false;
    }

    function continuarEditandoAceite(): void { cierreEditorAceitePendiente.value = false; }

    function descartarEditorAceite(): void {
      aceiteEditor.value = { kind: "closed" };
      activeOverlay.value = null;
      cierreEditorAceitePendiente.value = false;
    }

    function registrarEquipoCreado(equipo: EquipoEngraseListItem): void {
      if (isCreated.value) return;
      draft.value.equipoCreado = copiarEquipoLista(equipo);
      mayorPasoCompletado.value = 4;
      pasoActual.value = 5;
      validationErrors.value = [];
      activeOverlay.value = null;
      salidaSolicitada.value = false;
      solicitudValidacion += 1;
      solicitudBusquedaFiltro += 1;
      filtroEditor.value = { kind: "closed" };
      aceiteEditor.value = { kind: "closed" };
    }

    function reiniciarBorrador(): void {
      solicitudValidacion += 1;
      draft.value = crearEquipoDraftInicial();
      pasoActual.value = 1;
      mayorPasoCompletado.value = 0;
      validationErrors.value = [];
      activeOverlay.value = null;
      salidaSolicitada.value = false;
      solicitudBusquedaFiltro += 1;
      filtroEditor.value = { kind: "closed" };
      cierreEditorFiltroPendiente.value = false;
      aceiteEditor.value = { kind: "closed" };
      cierreEditorAceitePendiente.value = false;
    }

    function solicitarSalida(): boolean {
      if (isCreated.value || !hasDraftContent.value) return true;
      if (hasActiveOverlay.value) return false;
      activeOverlay.value = { kind: "confirmar_salida" };
      salidaSolicitada.value = true;
      return false;
    }

    function continuarCreando(): void {
      activeOverlay.value = null;
      salidaSolicitada.value = false;
    }

    function confirmarDescarte(): void {
      reiniciarBorrador();
    }

    function resetCompleto(): void {
      reiniciarBorrador();
      solicitudCarga += 1;
      cargaPendiente = null;
      auxiliares.value = null;
      loadingInicial.value = false;
      errorInicial.value = null;
    }

    return {
      draft,
      auxiliares,
      pasoActual,
      mayorPasoCompletado,
      loadingInicial,
      errorInicial,
      validationErrors,
      activeOverlay,
      filtroEditor,
      cierreEditorFiltroPendiente,
      aceiteEditor,
      cierreEditorAceitePendiente,
      salidaSolicitada,
      isReady,
      isCreated,
      isDraftPhase,
      isImagePhase,
      hasActiveOverlay,
      hasDraftContent,
      canValidateCode,
      isValidatingCode,
      isCurrentCodeValidated,
      canGoBack,
      canGoNext,
      canOpenStep,
      completedSteps,
      stagesCount,
      filtersCount,
      usedFilterCodes,
      usedFilterIds,
      occupiedFilterTypeKeys,
      occupiedExistingFilterTypeIds,
      occupiedNewFilterTypeNames,
      oilsCount,
      hasOils,
      occupiedSystemKeys,
      occupiedExistingSystemIds,
      occupiedNewSystemNames,
      cargarInicial,
      reintentarCargaInicial,
      actualizarCodigo,
      seleccionarTipoEquipo,
      limpiarTipoEquipo,
      actualizarSubtipo,
      actualizarEstado,
      agregarEtapa,
      quitarEtapa,
      crearYSeleccionarTipoEquipo,
      esTipoEquipoDuplicado,
      validarCodigoActual,
      validarPaso,
      avanzar,
      retroceder,
      puedeAbrirPaso,
      irAPaso,
      abrirOverlay,
      cerrarOverlay,
      abrirAgregarFiltro,
      buscarFiltroOriginal,
      abrirEditarFiltro,
      agregarFiltroExistente,
      agregarFiltroTemporal,
      actualizarFiltro,
      quitarFiltro,
      crearTipoFiltroTemporal,
      crearFiltroTemporal,
      buscarReferenciaFiltroTemporalPorCodigo: (codigo: string) => buscarReferenciaFiltroTemporalPorCodigo(codigo, draft.value.filtros),
      combinarSugerenciasFiltro: (remotas: Parameters<typeof combinarSugerenciasFiltroCreacion>[0], query: string) => combinarSugerenciasFiltroCreacion(remotas, draft.value.filtros, query),
      obtenerOpcionesTipoFiltro,
      estaTipoFiltroOcupado: (tipo: TipoFiltroCreacionReference, excludeDraftId?: string) => estaTipoFiltroOcupado(tipo, draft.value.filtros, excludeDraftId),
      obtenerEstadoCodigoFiltro: (codigo: string, excludeDraftId?: string) => obtenerEstadoCodigoFiltro(codigo, draft.value.filtros, excludeDraftId),
      combinarTiposFiltroBusqueda: (tiposPosibles: Parameters<typeof combinarTiposFiltroBusquedaCreacion>[1], excludeDraftId?: string) => combinarTiposFiltroBusquedaCreacion(auxiliares.value?.tiposFiltro.map((tipo) => ({ estado: "existente" as const, id: tipo.id, tempId: null, nombre: tipo.nombre })) ?? [], tiposPosibles, draft.value.filtros, excludeDraftId),
      solicitarCerrarEditorFiltro,
      continuarEditandoFiltro,
      descartarEditorFiltro,
      abrirAgregarAceite,
      abrirEditarAceite,
      agregarAceite,
      actualizarAceite,
      quitarAceite,
      crearSistemaTemporal,
      crearAceiteTemporal,
      obtenerOpcionesSistemaAceite,
      estaSistemaOcupado: (sistema: CatalogoDraftReference, excludeDraftId?: string) => estaSistemaOcupado(sistema, draft.value.aceites, excludeDraftId),
      obtenerSistemasTemporales: () => obtenerSistemasTemporales(draft.value.aceites),
      obtenerAceitesTemporales: () => obtenerAceitesTemporales(draft.value.aceites),
      resumenAceites: computed(() => crearResumenAceitesCreacion(draft.value.aceites)),
      solicitarCerrarEditorAceite,
      continuarEditandoAceite,
      descartarEditorAceite,
      registrarEquipoCreado,
      limpiarErrores,
      limpiarErroresDeCampo,
      establecerErrores,
      solicitarSalida,
      continuarCreando,
      confirmarDescarte,
      reiniciarBorrador,
      resetCompleto,
    };
  },
);

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEquipoEngraseCreacionStore, import.meta.hot));
}
