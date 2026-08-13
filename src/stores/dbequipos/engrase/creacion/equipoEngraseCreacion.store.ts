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
  validarCreacionEquipoCompleta,
  validarPasoAceitesEquipo,
  validarPasoDatosEquipo,
  validarPasoFiltrosEquipo,
} from "./equipoEngraseCreacion.validation";
import type {
  AuxiliaresEquipoEngrase,
  CrearEquipoError,
  CrearEquipoOverlayState,
  CrearEquipoPaso,
  CrearEquipoValidationIssue,
  CrearEquipoValidationResult,
  EquipoEstado,
  TipoEquipoCreacionReference,
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
    const salidaSolicitada = shallowRef(false);
    let solicitudCarga = 0;
    let solicitudValidacion = 0;
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
    const oilsCount = computed(() => draft.value.aceites.length);
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
      activeOverlay.value = { ...overlay };
      return true;
    }

    function cerrarOverlay(): void {
      activeOverlay.value = null;
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
    }

    function reiniciarBorrador(): void {
      solicitudValidacion += 1;
      draft.value = crearEquipoDraftInicial();
      pasoActual.value = 1;
      mayorPasoCompletado.value = 0;
      validationErrors.value = [];
      activeOverlay.value = null;
      salidaSolicitada.value = false;
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
      oilsCount,
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
