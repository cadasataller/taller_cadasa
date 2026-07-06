import { defineStore } from 'pinia';

import { useFeatureAccessStore } from '@/stores/db_mantenimiento/app_feature_access/featureAccess.store';
import { useUserStore } from '@/stores/userStore';
import { useEquiposStore } from '@/stores/dbequipos/equipos/equipos.store';
import type { EquipoOption } from '@/stores/dbequipos/equipos/equipos.types';
import {
  buildAdjuntoFingerprint,
  getAdjuntoKind,
  validateAdjuntosSelection,
} from '@/components/compras/crear/crearSolicitudAdjuntos.utils';
import { solicitudCompraBorradorSchema } from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.schemas';
import { solicitudesCompraBorradoresService } from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.service';
import {
  SOLICITUD_COMPRA_BORRADOR_SCHEMA_VERSION,
  type SolicitudCompraBorradorListadoItem,
  type SolicitudCompraBorradorCreatePayload,
  type SolicitudCompraBorradorStep,
  type SolicitudCompraBorradorUpdatePayload,
} from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.types';
import { useCalendarioFeriadosStore } from '@/stores/db_compras/calendario_feriados/calendarioFeriados.store';

import { solicitudesCompraCrearService } from './solicitudesCompraCrear.service';
import {
  calculateMinimumFechaEntrega,
  formatDateForDb,
  parseIsoDate,
  requiresFechaEntregaDraftReview,
  TEMPORADA_ZAFRA_ACTIVA_FEATURE_KEY,
  validateFechaEntregaSync,
} from './fechaEntregaRules';
import {
  createSolicitudSendSchema,
  sanitizeCollectionsForTipoSolicitud,
  stepDatosBaseSchema,
  stepObservacionesSchema,
  stepProductosSchema,
} from './solicitudesCompraCrear.schemas';
import {
  OBSERVACION_PREFILL_PREFIX,
} from './solicitudesCompraCrear.types';
import type {
  CrearSolicitudAdjuntoDraftInput,
  CrearSolicitudFieldErrors,
  DestinoSeleccionado,
  ContextoDestinoTipoOrigen,
  ProductoCatalogoOption,
  ProductoSolicitudItem,
  ProductoTemporalDraft,
  ProductoSolicitudTemporalItem,
  ServicioSolicitudDraft,
  ServicioSolicitudItem,
  SolicitudCompraCreateStep,
  SolicitudCompraCrearPayload,
  SolicitudCompraCrearResponse,
  SolicitudCompraGuardarBorradorResponse,
  SolicitudCompraCrearState,
  SolicitudCompraSubmitMode,
  SolicitudCompraTipoSolicitud,
} from './solicitudesCompraCrear.types';

const createInitialState = (): SolicitudCompraCrearState => ({
  entryMode: null,
  continuedFromDraft: false,
  fechaEntregaRequiresReview: false,
  currentStep: 1,
  submitMode: null,
  draftId: null,
  lastSavedDraftSnapshotHash: null,
  fechaEntregaAutoAdjustedMessage: null,
  fechaEntregaMinima: null,
  fechaEntregaRulesLoading: false,
  fechaEntregaRulesReady: false,
  isZafraActiva: false,
  solicitanteNombre: '',
  solicitanteEmail: '',
  areaNombre: '',
  fechaCreacionLocal: new Date(),
  tipoSolicitud: null,
  fechaEntrega: null,
  destinos: [],
  productos: [],
  servicios: [],
  observacion: OBSERVACION_PREFILL_PREFIX,
  ultimoPrefillObservacion: OBSERVACION_PREFILL_PREFIX,
  observacionEditadaManual: false,
  solicitarUrgente: false,
  motivoUrgencia: '',
  adjuntosLocales: [],
  adjuntosErroresRecientes: [],
  adjuntosSubidos: [],
  uploadSession: null,
  productSearchQuery: '',
  productSearchResults: [],
  productSearchLoading: false,
  productSearchError: null,
  loading: false,
  draftSaving: false,
  uploading: false,
  error: null,
  validationErrors: {},
  initialized: false,
  lastCreatedResponse: null,
});

const formatZodErrors = (issues: Array<{ path: PropertyKey[]; message: string }>): CrearSolicitudFieldErrors => {
  const nextErrors: CrearSolicitudFieldErrors = {};

  issues.forEach((issue) => {
    const fieldKey = issue.path[0];

    if (typeof fieldKey !== 'string' || nextErrors[fieldKey as keyof CrearSolicitudFieldErrors]) {
      return;
    }

    nextErrors[fieldKey as keyof CrearSolicitudFieldErrors] = issue.message;
  });

  return nextErrors;
};

const normalizeObservacion = (value: string): string => value.toUpperCase();
const normalizeDescripcion = (value: string): string => value.trim().toUpperCase();
const DESTINO_MIXED_ORIGIN_ERROR_MESSAGE = 'No se puede combinar otro origen de destino en esta solicitud. Si deseas elegir otro origen, elimina primero el destino ya seleccionado.';

const buildObservacionPrefill = (destinos: DestinoSeleccionado[]): string => {
  const equipmentCodes = destinos
    .filter((item) => item.tipoOrigen === 'equipo')
    .map((item) => item.codigo.trim())
    .filter(Boolean);

  const generated = equipmentCodes.length > 0
    ? `${OBSERVACION_PREFILL_PREFIX}${equipmentCodes.join(', ')}`
    : OBSERVACION_PREFILL_PREFIX;

  return generated;
};

const toDestinoEquipoSeleccionado = (
  item: EquipoOption,
  tipoOrigen: ContextoDestinoTipoOrigen = 'equipo'
): DestinoSeleccionado => ({
  id: item.id,
  tipoOrigen,
  codigo: item.codEquipo,
  label: item.label,
  modelo: item.modelo,
  marca: item.marca,
  tipo: item.tipo,
});

const createLocalId = (): string => crypto.randomUUID();
const createDraftSnapshotHash = (snapshot: SolicitudCompraBorradorUpdatePayload): string =>
  JSON.stringify(snapshot);
const resolveMaxUnlockedStep = (steps: {
  step1Valid: boolean;
  step2Valid: boolean;
  step3Valid: boolean;
}): SolicitudCompraCreateStep => {
  if (!steps.step1Valid) {
    return 1;
  }

  if (!steps.step2Valid) {
    return 2;
  }

  if (!steps.step3Valid) {
    return 3;
  }

  return 4;
};

const getFechaEntregaValidation = (state: SolicitudCompraCrearState) => {
  const calendarioFeriadosStore = useCalendarioFeriadosStore();

  return validateFechaEntregaSync({
    fechaEntrega: state.fechaEntrega,
    today: new Date(),
    isZafraActiva: state.isZafraActiva,
    minimumAllowedDate: state.fechaEntregaMinima,
    holidaysByYear: calendarioFeriadosStore.holidaysByYear,
    rulesReady: state.fechaEntregaRulesReady,
  });
};

export const useSolicitudesCompraCrearStore = defineStore('solicitudesCompraCrear', {
  state: (): SolicitudCompraCrearState => createInitialState(),

  getters: {
    stepValidation(state): {
      step1Valid: boolean;
      step2Valid: boolean;
      step3Valid: boolean;
    } {
      const fechaEntregaValidation = getFechaEntregaValidation(state);
      const step1Valid = stepDatosBaseSchema.safeParse({
        tipoSolicitud: state.tipoSolicitud,
        fechaEntrega: state.fechaEntrega,
        destinos: state.destinos,
      }).success && fechaEntregaValidation.isValid;
      const step2Valid = step1Valid && stepProductosSchema.safeParse({
        tipoSolicitud: state.tipoSolicitud,
        productos: state.productos,
        servicios: state.servicios,
      }).success;
      const step3Valid = step2Valid && stepObservacionesSchema.safeParse({
        observacion: state.observacion,
        solicitarUrgente: state.solicitarUrgente,
        motivoUrgencia: state.motivoUrgencia,
      }).success;

      return {
        step1Valid,
        step2Valid,
        step3Valid,
      };
    },

    maxUnlockedStep(): SolicitudCompraCreateStep {
      return resolveMaxUnlockedStep(this.stepValidation);
    },

    isCurrentStepValid(state): boolean {
      if (state.currentStep === 1) {
        return this.stepValidation.step1Valid;
      }

      if (state.currentStep === 2) {
        return this.stepValidation.step2Valid;
      }

      if (state.currentStep === 3) {
        return this.stepValidation.step3Valid;
      }

      return this.maxUnlockedStep === 4;
    },

    canSaveDraft(state): boolean {
      return stepDatosBaseSchema.safeParse({
        tipoSolicitud: state.tipoSolicitud,
        fechaEntrega: state.fechaEntrega,
        destinos: state.destinos,
      }).success && getFechaEntregaValidation(state).isValid;
    },

    observacionAutogenerada(state): boolean {
      return !state.observacionEditadaManual
        || state.observacion === state.ultimoPrefillObservacion;
    },
  },

  actions: {
    syncObservacionPrefill(): void {
      const generated = buildObservacionPrefill(this.destinos);
      const shouldOverwrite = !this.observacionEditadaManual
        || this.observacion === this.ultimoPrefillObservacion
        || this.observacion.trim().length === 0;

      this.ultimoPrefillObservacion = generated;

      if (shouldOverwrite) {
        this.observacion = generated;
        this.observacionEditadaManual = false;
        delete this.validationErrors.observacion;
      }
    },

    async initialize(): Promise<void> {
      const userStore = useUserStore();

      if (!userStore.isLoaded) {
        await userStore.fetchCurrentUserProfile().catch(() => null);
      }

      this.solicitanteNombre = userStore.nombre || 'Usuario actual';
      this.solicitanteEmail = userStore.email || '';
      this.areaNombre = userStore.profile?.area || userStore.area || 'Sin área';
      this.fechaCreacionLocal = new Date();
      this.initialized = true;
      this.error = null;
      await this.refreshFechaEntregaRules();
    },

    reset(): void {
      const userSnapshot = {
        solicitanteNombre: this.solicitanteNombre,
        solicitanteEmail: this.solicitanteEmail,
        areaNombre: this.areaNombre,
      };

      Object.assign(this, createInitialState());
      this.solicitanteNombre = userSnapshot.solicitanteNombre;
      this.solicitanteEmail = userSnapshot.solicitanteEmail;
      this.areaNombre = userSnapshot.areaNombre;
      this.fechaCreacionLocal = new Date();
      this.initialized = Boolean(
        userSnapshot.solicitanteNombre
        || userSnapshot.solicitanteEmail
        || userSnapshot.areaNombre
      );
      useEquiposStore().reset();
    },

    async prepareNewEntry(): Promise<void> {
      this.reset();
      await this.initialize();
      this.entryMode = 'new';
      this.continuedFromDraft = false;
    },

    async refreshFechaEntregaRules(selectedFechaEntrega?: string | null): Promise<void> {
      const featureAccessStore = useFeatureAccessStore();
      const calendarioFeriadosStore = useCalendarioFeriadosStore();

      this.fechaEntregaRulesLoading = true;
      this.fechaEntregaRulesReady = false;

      try {
        if (!featureAccessStore.isLoaded) {
          await featureAccessStore.cargarFuncionalidadesPermitidas().catch(() => []);
        }

        this.isZafraActiva = featureAccessStore.tieneFuncionalidad(TEMPORADA_ZAFRA_ACTIVA_FEATURE_KEY);

        if (this.isZafraActiva) {
          this.fechaEntregaMinima = null;
          this.fechaEntregaRulesReady = true;
          return;
        }

        this.fechaEntregaMinima = await calculateMinimumFechaEntrega({
          today: new Date(),
          ensureYear: (year) => calendarioFeriadosStore.ensureYear(year).then(() => undefined),
          getHolidaysForYear: (year) => calendarioFeriadosStore.getHolidaysForYear(year),
        });

        const selectedDate = parseIsoDate(selectedFechaEntrega ?? this.fechaEntrega);
        if (selectedDate) {
          await calendarioFeriadosStore.ensureYear(selectedDate.getFullYear());
        }

        this.fechaEntregaRulesReady = true;
      } catch (error) {
        this.fechaEntregaMinima = null;
        this.fechaEntregaRulesReady = false;
        this.error = error instanceof Error
          ? error.message
          : 'No se pudieron cargar las reglas de fecha de entrega';
      } finally {
        this.fechaEntregaRulesLoading = false;
      }
    },

    async hydrateFromDraft(draft: SolicitudCompraBorradorListadoItem): Promise<void> {
      await this.refreshFechaEntregaRules(draft.fechaEntrega);

      const fechaEntregaValidation = validateFechaEntregaSync({
        fechaEntrega: draft.fechaEntrega,
        today: new Date(),
        isZafraActiva: this.isZafraActiva,
        minimumAllowedDate: this.fechaEntregaMinima,
        holidaysByYear: useCalendarioFeriadosStore().holidaysByYear,
        rulesReady: this.fechaEntregaRulesReady,
      });
      const draftDateIsParseable = Boolean(parseIsoDate(draft.fechaEntrega));
      const shouldAutoAdjustFechaEntrega = !this.isZafraActiva && !fechaEntregaValidation.isValid && Boolean(this.fechaEntregaMinima);
      const normalizedFechaEntrega = shouldAutoAdjustFechaEntrega
        ? this.fechaEntregaMinima
        : draftDateIsParseable
          ? draft.fechaEntrega
          : null;
      const sanitizedCollections = sanitizeCollectionsForTipoSolicitud({
        tipoSolicitud: draft.tipoSolicitud,
        productos: draft.productos,
        servicios: draft.servicios,
      });
      const result = solicitudCompraBorradorSchema.safeParse({
        currentStep: draft.currentStep,
        tipoSolicitud: draft.tipoSolicitud,
        fechaEntrega: normalizedFechaEntrega ?? this.fechaEntregaMinima ?? formatDateForDb(new Date()),
        destinos: draft.destinos,
        productos: sanitizedCollections.productos,
        servicios: sanitizedCollections.servicios,
        observacion: normalizeObservacion(draft.observacion),
        solicitarUrgente: draft.solicitarUrgente,
        motivoUrgencia: draft.motivoUrgencia,
      });

      if (!result.success) {
        throw new Error('El borrador no es válido');
      }

      const parsed = result.data;
      const sanitizedProductos = sanitizedCollections.productos;
      const sanitizedServicios = sanitizedCollections.servicios;
      const observacionPrefill = buildObservacionPrefill(parsed.destinos);
      const effectiveFechaEntrega = normalizedFechaEntrega ?? (draftDateIsParseable ? parsed.fechaEntrega : null);
      const step1Valid = stepDatosBaseSchema.safeParse({
        tipoSolicitud: parsed.tipoSolicitud,
        fechaEntrega: effectiveFechaEntrega ?? '',
        destinos: parsed.destinos,
      }).success && validateFechaEntregaSync({
        fechaEntrega: effectiveFechaEntrega,
        today: new Date(),
        isZafraActiva: this.isZafraActiva,
        minimumAllowedDate: this.fechaEntregaMinima,
        holidaysByYear: useCalendarioFeriadosStore().holidaysByYear,
        rulesReady: this.fechaEntregaRulesReady,
      }).isValid;
      const step2Valid = step1Valid && stepProductosSchema.safeParse({
        tipoSolicitud: parsed.tipoSolicitud,
        productos: sanitizedProductos,
        servicios: sanitizedServicios,
      }).success;
      const step3Valid = step2Valid && stepObservacionesSchema.safeParse({
        observacion: parsed.observacion,
        solicitarUrgente: parsed.solicitarUrgente,
        motivoUrgencia: parsed.motivoUrgencia,
      }).success;
      const maxUnlockedStep = resolveMaxUnlockedStep({
        step1Valid,
        step2Valid,
        step3Valid,
      });
      const draftSnapshot = {
        activo: true,
        schema_version: draft.schemaVersion,
        current_step: Math.min(parsed.currentStep, maxUnlockedStep) as SolicitudCompraBorradorStep,
        tipo_solicitud: parsed.tipoSolicitud,
        fecha_entrega: draft.fechaEntrega,
        observacion: parsed.observacion.trim(),
        solicitar_urgente: parsed.solicitarUrgente,
        motivo_urgencia: parsed.solicitarUrgente
          ? parsed.motivoUrgencia.trim()
          : null,
        destinos: parsed.destinos,
        productos: sanitizedProductos,
        servicios: sanitizedServicios,
      } satisfies SolicitudCompraBorradorUpdatePayload;

      this.entryMode = 'draft';
      this.continuedFromDraft = true;
      this.fechaEntregaRequiresReview = requiresFechaEntregaDraftReview({
        fechaEntrega: draft.fechaEntrega,
        today: new Date(),
        isZafraActiva: this.isZafraActiva,
        minimumAllowedDate: this.fechaEntregaMinima,
        holidaysByYear: useCalendarioFeriadosStore().holidaysByYear,
        rulesReady: this.fechaEntregaRulesReady,
      });
      this.fechaEntregaAutoAdjustedMessage = shouldAutoAdjustFechaEntrega
        ? `Fecha de entrega cambiada; fecha anterior establecida ${draft.fechaEntrega}`
        : null;
      this.currentStep = this.fechaEntregaRequiresReview
        ? 1
        : Math.min(parsed.currentStep, maxUnlockedStep) as SolicitudCompraCreateStep;
      this.submitMode = null;
      this.draftId = draft.id;
      this.lastSavedDraftSnapshotHash = createDraftSnapshotHash(draftSnapshot);
      this.fechaCreacionLocal = new Date(draft.createdAt);
      this.tipoSolicitud = parsed.tipoSolicitud;
      this.fechaEntrega = effectiveFechaEntrega;
      this.destinos = parsed.destinos;
      this.productos = sanitizedProductos;
      this.servicios = sanitizedServicios;
      this.observacion = normalizeObservacion(parsed.observacion);
      this.ultimoPrefillObservacion = observacionPrefill;
      this.observacionEditadaManual = this.observacion !== observacionPrefill;
      this.solicitarUrgente = parsed.solicitarUrgente;
      this.motivoUrgencia = parsed.motivoUrgencia;
      this.adjuntosLocales = [];
      this.adjuntosErroresRecientes = [];
      this.adjuntosSubidos = [];
      this.uploadSession = null;
      this.productSearchQuery = '';
      this.productSearchResults = [];
      this.productSearchLoading = false;
      this.productSearchError = null;
      this.loading = false;
      this.draftSaving = false;
      this.uploading = false;
      this.error = null;
      this.validationErrors = {};
      this.lastCreatedResponse = null;
      this.initialized = true;
    },

    async prepareDraftEntry(draft: SolicitudCompraBorradorListadoItem): Promise<void> {
      this.reset();
      await this.initialize();
      await this.hydrateFromDraft(draft);
    },

    setTipoSolicitud(value: SolicitudCompraTipoSolicitud | null): void {
      const previousValue = this.tipoSolicitud;
      this.tipoSolicitud = value;
      if (value === 'servicio' && previousValue !== 'servicio') {
        this.productos = [];
        this.productSearchResults = [];
        this.productSearchQuery = '';
        delete this.validationErrors.productos;
      }

      if (value !== 'servicio' && previousValue === 'servicio') {
        this.servicios = [];
        delete this.validationErrors.servicios;
      }

      this.destinos = this.destinos.filter((item) => {
        if (item.tipoOrigen === 'equipo') {
          return true;
        }

        if (value !== 'servicio') {
          return false;
        }

        return item.tipoOrigen === 'area_operativa'
          || item.tipoOrigen === 'instalacion_taller'
          || item.tipoOrigen === 'grupo_equipo'
          || item.tipoOrigen === 'otros';
      });

      delete this.validationErrors.destinos;
      useEquiposStore().reset();

      this.syncObservacionPrefill();

      delete this.validationErrors.tipoSolicitud;
    },

    async setFechaEntrega(value: string | null): Promise<void> {
      this.fechaEntrega = value;
      this.fechaEntregaRequiresReview = false;
      this.fechaEntregaAutoAdjustedMessage = null;
      delete this.validationErrors.fechaEntrega;

      if (!value) {
        return;
      }

      const parsedDate = parseIsoDate(value);
      if (!parsedDate) {
        return;
      }

      const calendarioFeriadosStore = useCalendarioFeriadosStore();
      await calendarioFeriadosStore.ensureYear(parsedDate.getFullYear());
    },

    setObservacion(value: string): void {
      this.observacion = normalizeObservacion(value);
      this.observacionEditadaManual = this.observacion !== this.ultimoPrefillObservacion;
      delete this.validationErrors.observacion;
    },

    setSolicitarUrgente(value: boolean): void {
      this.solicitarUrgente = value;
      if (!value) {
        this.motivoUrgencia = '';
        delete this.validationErrors.motivoUrgencia;
      }
    },

    setMotivoUrgencia(value: string): void {
      this.motivoUrgencia = value;
      delete this.validationErrors.motivoUrgencia;
    },

    agregarAdjuntos(items: CrearSolicitudAdjuntoDraftInput[]): void {
      const { acceptedItems, invalidIssues } = validateAdjuntosSelection(items, this.adjuntosLocales);

      if (acceptedItems.length > 0) {
        this.adjuntosLocales = [
          ...this.adjuntosLocales,
          ...acceptedItems.flatMap((item) => {
            const kind = getAdjuntoKind(item.file);

            if (!kind) {
              return [];
            }

            return [{
              localId: createLocalId(),
              file: item.file,
              displayName: item.displayName,
              kind,
              fingerprint: buildAdjuntoFingerprint(item.file),
            }];
          }),
        ];
        delete this.validationErrors.adjuntos;
      }

      this.adjuntosErroresRecientes = invalidIssues;

      if (invalidIssues.length > 0) {
        this.validationErrors = {
          ...this.validationErrors,
          adjuntos: invalidIssues[0]?.message,
        };
      } else {
        delete this.validationErrors.adjuntos;
      }
    },

    removerAdjunto(localId: string): void {
      this.adjuntosLocales = this.adjuntosLocales.filter((item) => item.localId !== localId);
    },

    limpiarErroresAdjuntos(): void {
      this.adjuntosErroresRecientes = [];
      delete this.validationErrors.adjuntos;
    },

    setProductSearchQuery(value: string): void {
      this.productSearchQuery = value;
      this.productSearchError = null;

      if (!value.trim()) {
        this.productSearchResults = [];
      }
    },

    async buscarEquipos(query: string): Promise<void> {
      const equiposStore = useEquiposStore();

      try {
        await equiposStore.buscarEquipos(query);
      } catch (error) {
        this.error = error instanceof Error
          ? error.message
          : 'No se pudieron obtener los equipos';
      }
    },

    agregarEquipo(item: EquipoOption): void {
      const equiposStore = useEquiposStore();
      equiposStore.agregarEquipo(item);

      if (this.destinos.some((destino) => destino.tipoOrigen !== 'equipo')) {
        this.validationErrors = {
          ...this.validationErrors,
          destinos: DESTINO_MIXED_ORIGIN_ERROR_MESSAGE,
        };
        return;
      }

      if (this.destinos.some((destino) => destino.codigo === item.codEquipo && destino.tipoOrigen === 'equipo')) {
        return;
      }

      this.destinos = [...this.destinos, toDestinoEquipoSeleccionado(item)];
      this.syncObservacionPrefill();
      delete this.validationErrors.destinos;
    },

    agregarDestinoContexto(item: {
      id: number;
      codigo: string;
      nombre: string;
      tipoOrigen: ContextoDestinoTipoOrigen;
    }): void {
      if (this.destinos.length > 0 && this.destinos[0]?.tipoOrigen !== item.tipoOrigen) {
        this.validationErrors = {
          ...this.validationErrors,
          destinos: DESTINO_MIXED_ORIGIN_ERROR_MESSAGE,
        };
        return;
      }

      if (this.destinos.some((destino) => destino.codigo === item.codigo && destino.tipoOrigen === item.tipoOrigen)) {
        return;
      }

      this.destinos = [
        ...this.destinos,
        {
          id: item.id,
          tipoOrigen: item.tipoOrigen,
          codigo: item.codigo,
          label: item.nombre,
          modelo: null,
          marca: null,
          tipo: null,
        },
      ];
      this.syncObservacionPrefill();
      delete this.validationErrors.destinos;
    },

    removerDestino(
      payload: string | { codigo: string; tipoOrigen?: string }
    ): void {
      const codigo = typeof payload === 'string' ? payload : payload.codigo;
      const tipoOrigen = (
        typeof payload === 'string'
          ? undefined
          : payload.tipoOrigen
      ) as ContextoDestinoTipoOrigen | undefined;
      const equiposStore = useEquiposStore();
      if (!tipoOrigen || tipoOrigen === 'equipo') {
        equiposStore.removerEquipo(codigo);
      }

      this.destinos = this.destinos.filter((item) => !(item.codigo === codigo && (!tipoOrigen || item.tipoOrigen === tipoOrigen)));
      this.syncObservacionPrefill();
    },

    async buscarProductos(query: string): Promise<void> {
      const normalizedQuery = query.trim();
      this.productSearchError = null;

      if (normalizedQuery.length < 2) {
        this.productSearchResults = [];
        this.productSearchLoading = false;
        return;
      }

      this.productSearchLoading = true;

      try {
        const rows = await solicitudesCompraCrearService.buscarProductos(normalizedQuery);
        this.productSearchResults = rows
          .map<ProductoCatalogoOption>((row) => ({
            productoId: row.producto_id,
            codProducto: row.cod_producto,
            nombre: row.nombre,
            unidadCodigo: row.unidad_codigo,
            unidadLabel: row.unidad_mostrar || row.unidad_abreviatura || row.unidad_codigo,
          }));
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'No se pudieron obtener los productos';

        this.productSearchResults = [];
        this.productSearchError = message;
      } finally {
        this.productSearchLoading = false;
      }
    },

    agregarProductoExistente(item: ProductoCatalogoOption): void {
      if (this.productos.some((product) => product.tipo === 'existente' && product.codProducto === item.codProducto)) {
        return;
      }

      this.productos = [
        ...this.productos,
        {
          localId: createLocalId(),
          tipo: 'existente',
          productoId: item.productoId,
          codProducto: item.codProducto,
          nombre: item.nombre,
          unidadCodigo: item.unidadCodigo,
          unidadLabel: item.unidadLabel,
        },
      ];
      delete this.validationErrors.productos;
    },

    agregarProductoTemporal(
      item: ProductoTemporalDraft
    ): void {
      this.productos = [
        ...this.productos,
        {
          localId: createLocalId(),
          tipo: 'temporal',
          temporal: true,
          nombre: normalizeDescripcion(item.nombre),
          descripcion: item.descripcion ? normalizeDescripcion(item.descripcion) : null,
          unidadCodigo: item.unidadCodigo,
          unidadLabel: item.unidadLabel,
        },
      ];
      delete this.validationErrors.productos;
    },

    actualizarProductoTemporal(localId: string, item: ProductoTemporalDraft): void {
      this.productos = this.productos.map((product) => {
        if (product.localId !== localId || product.tipo !== 'temporal') {
          return product;
        }

        return {
          ...product,
          nombre: normalizeDescripcion(item.nombre),
          descripcion: item.descripcion ? normalizeDescripcion(item.descripcion) : null,
          unidadCodigo: item.unidadCodigo,
          unidadLabel: item.unidadLabel,
        };
      });

      delete this.validationErrors.productos;
    },

    removerProducto(localId: string): void {
      this.productos = this.productos.filter((item) => item.localId !== localId);
    },

    agregarServicio(
      item: ServicioSolicitudDraft
    ): void {
      this.servicios = [
        ...this.servicios,
        {
          localId: createLocalId(),
          ...item,
          descripcion: normalizeDescripcion(item.descripcion),
        },
      ];
      delete this.validationErrors.servicios;
    },

    actualizarServicio(localId: string, item: ServicioSolicitudDraft): void {
      this.servicios = this.servicios.map((service) => {
        if (service.localId !== localId) {
          return service;
        }

        return {
          ...service,
          cantidad: item.cantidad,
          descripcion: normalizeDescripcion(item.descripcion),
          unidadCodigo: item.unidadCodigo,
          unidadLabel: item.unidadLabel,
        };
      });

      delete this.validationErrors.servicios;
    },

    removerServicio(localId: string): void {
      this.servicios = this.servicios.filter((item) => item.localId !== localId);
    },

    validateStep(step?: SolicitudCompraCreateStep): boolean {
      const targetStep = step ?? this.currentStep;

      if (targetStep === 1) {
        const fechaEntregaValidation = getFechaEntregaValidation(this);
        const result = stepDatosBaseSchema.safeParse({
          tipoSolicitud: this.tipoSolicitud,
          fechaEntrega: this.fechaEntrega,
          destinos: this.destinos,
        });

        if (!result.success || !fechaEntregaValidation.isValid) {
          this.validationErrors = {
            ...this.validationErrors,
            ...(!result.success ? formatZodErrors(result.error.issues) : {}),
            fechaEntrega: fechaEntregaValidation.isValid
              ? this.validationErrors.fechaEntrega
              : (fechaEntregaValidation.message ?? 'La fecha de entrega no es valida.'),
          };
          return false;
        }

        this.validationErrors = {
          ...this.validationErrors,
          tipoSolicitud: undefined,
          fechaEntrega: undefined,
          destinos: undefined,
        };
        return true;
      }

      if (targetStep === 2) {
        const result = stepProductosSchema.safeParse({
          tipoSolicitud: this.tipoSolicitud,
          productos: this.productos,
          servicios: this.servicios,
        });

        if (!result.success) {
          this.validationErrors = {
            ...this.validationErrors,
            ...formatZodErrors(result.error.issues),
          };
          return false;
        }

        return true;
      }

      if (targetStep === 3) {
        const result = stepObservacionesSchema.safeParse({
          observacion: this.observacion,
          solicitarUrgente: this.solicitarUrgente,
          motivoUrgencia: this.motivoUrgencia,
        });

        if (!result.success) {
          this.validationErrors = {
            ...this.validationErrors,
            ...formatZodErrors(result.error.issues),
          };
          return false;
        }

        this.validationErrors = {
          ...this.validationErrors,
          observacion: undefined,
          motivoUrgencia: undefined,
        };
        return true;
      }

      return true;
    },

    canNavigateToStep(step: SolicitudCompraCreateStep): boolean {
      return step <= this.maxUnlockedStep;
    },

    goToStep(step: SolicitudCompraCreateStep): boolean {
      if (!this.canNavigateToStep(step)) {
        return false;
      }

      this.currentStep = step;
      return true;
    },

    goToNextStep(): boolean {
      if (!this.validateStep()) {
        return false;
      }

      if (this.currentStep < 4) {
        this.currentStep = (this.currentStep + 1) as SolicitudCompraCreateStep;
      }

      return true;
    },

    goToPreviousStep(): void {
      if (this.currentStep > 1) {
        this.currentStep = (this.currentStep - 1) as SolicitudCompraCreateStep;
      }
    },

    async buildPayload(): Promise<SolicitudCompraCrearPayload> {
      await this.refreshFechaEntregaRules(this.fechaEntrega);
      const sanitizedCollections = sanitizeCollectionsForTipoSolicitud({
        tipoSolicitud: this.tipoSolicitud ?? 'zafra',
        productos: this.productos,
        servicios: this.servicios,
      });
      const result = createSolicitudSendSchema.safeParse({
        tipoSolicitud: this.tipoSolicitud,
        fechaEntrega: this.fechaEntrega,
        destinos: this.destinos,
        productos: sanitizedCollections.productos,
        servicios: sanitizedCollections.servicios,
        observacion: this.observacion,
        solicitarUrgente: this.solicitarUrgente,
        motivoUrgencia: this.motivoUrgencia,
      });

      if (!result.success) {
        this.validationErrors = formatZodErrors(result.error.issues);
        throw new Error('La solicitud no es válida');
      }

      const fechaEntregaValidation = getFechaEntregaValidation(this);
      if (!fechaEntregaValidation.isValid) {
        this.validationErrors = {
          ...this.validationErrors,
          fechaEntrega: fechaEntregaValidation.message ?? 'La fecha de entrega no es valida.',
        };
        throw new Error('La solicitud no es válida');
      }

      const parsed = result.data;

      return {
        p_tipo_codigo: parsed.tipoSolicitud,
        p_fecha_entrega: parsed.fechaEntrega,
        p_observacion: parsed.observacion.trim(),
        p_contextos_destino: parsed.destinos.map((item) => ({
          tipo_origen: item.tipoOrigen,
          codigo: item.codigo,
        })),
        p_productos: parsed.tipoSolicitud === 'servicio'
          ? []
          : parsed.productos.map((item) => item.tipo === 'existente'
            ? { cod_producto: item.codProducto }
            : {
              temporal: true,
              nombre: item.nombre.trim(),
              descripcion: item.descripcion?.trim() || null,
              unidad_codigo: item.unidadCodigo.trim(),
            }),
        p_servicios: parsed.tipoSolicitud === 'servicio'
          ? parsed.servicios.map((item) => ({
            descripcion: item.descripcion.trim(),
            cantidad: item.cantidad,
            unidad_codigo: item.unidadCodigo.trim(),
          }))
          : [],
        p_enviar: true,
        p_solicitar_urgente: parsed.solicitarUrgente,
        p_motivo_urgencia: parsed.solicitarUrgente
          ? parsed.motivoUrgencia.trim()
          : null,
        p_adjuntos: this.adjuntosSubidos,
        p_requerir_adjuntos_storage: this.adjuntosLocales.length > 0,
      };
    },

    async buildDraftUpdateSnapshot(options?: {
      syncValidationErrors?: boolean;
    }): Promise<SolicitudCompraBorradorUpdatePayload> {
      await this.refreshFechaEntregaRules(this.fechaEntrega);
      const syncValidationErrors = options?.syncValidationErrors ?? true;
      const draftStep = (this.currentStep === 1 ? 2 : this.currentStep) as SolicitudCompraBorradorStep;
      const sanitizedCollections = this.tipoSolicitud
        ? sanitizeCollectionsForTipoSolicitud({
          tipoSolicitud: this.tipoSolicitud,
          productos: this.productos,
          servicios: this.servicios,
        })
        : {
          productos: this.productos,
          servicios: this.servicios,
        };
      const result = solicitudCompraBorradorSchema.safeParse({
        currentStep: draftStep,
        tipoSolicitud: this.tipoSolicitud,
        fechaEntrega: this.fechaEntrega,
        destinos: this.destinos,
        productos: sanitizedCollections.productos,
        servicios: sanitizedCollections.servicios,
        observacion: this.observacion,
        solicitarUrgente: this.solicitarUrgente,
        motivoUrgencia: this.motivoUrgencia,
      });

      if (!result.success) {
        if (syncValidationErrors) {
          this.validationErrors = formatZodErrors(result.error.issues);
        }
        throw new Error('El borrador no es válido');
      }

      const fechaEntregaValidation = getFechaEntregaValidation(this);
      if (!fechaEntregaValidation.isValid) {
        if (syncValidationErrors) {
          this.validationErrors = {
            ...this.validationErrors,
            fechaEntrega: fechaEntregaValidation.message ?? 'La fecha de entrega no es valida.',
          };
        }
        throw new Error('El borrador no es válido');
      }

      const parsed = result.data;
      return {
        activo: true,
        schema_version: SOLICITUD_COMPRA_BORRADOR_SCHEMA_VERSION,
        current_step: parsed.currentStep as SolicitudCompraBorradorStep,
        tipo_solicitud: parsed.tipoSolicitud,
        fecha_entrega: parsed.fechaEntrega,
        observacion: parsed.observacion.trim(),
        solicitar_urgente: parsed.solicitarUrgente,
        motivo_urgencia: parsed.solicitarUrgente
          ? parsed.motivoUrgencia.trim()
          : null,
        destinos: parsed.destinos,
        productos: parsed.productos,
        servicios: parsed.servicios,
      } satisfies SolicitudCompraBorradorUpdatePayload;
    },

    async buildDraftSnapshot():
      Promise<SolicitudCompraBorradorCreatePayload | SolicitudCompraBorradorUpdatePayload> {
      const snapshot = await this.buildDraftUpdateSnapshot();

      if (this.draftId) {
        return snapshot;
      }

      return {
        ...snapshot,
        creado_por_email: this.solicitanteEmail.trim(),
        creado_por_nombre: this.solicitanteNombre.trim(),
        creado_por_area: this.areaNombre.trim() || null,
      } satisfies SolicitudCompraBorradorCreatePayload;
    },

    async persistDraft(options?: {
      silent?: boolean;
      skipIfUnchanged?: boolean;
    }): Promise<SolicitudCompraGuardarBorradorResponse | null> {
      const silent = options?.silent ?? false;
      const skipIfUnchanged = options?.skipIfUnchanged ?? false;

      if (this.draftSaving || this.submitMode === 'send') {
        return null;
      }

      if (silent && (!this.canSaveDraft || this.loading || this.uploading)) {
        return null;
      }

      if (!silent) {
        this.loading = true;
        this.error = null;
        this.validationErrors = {};
      }

      this.draftSaving = true;

      try {
        const updateSnapshot = await this.buildDraftUpdateSnapshot({
          syncValidationErrors: !silent,
        });
        const snapshotHash = createDraftSnapshotHash(updateSnapshot);

        if (skipIfUnchanged && snapshotHash === this.lastSavedDraftSnapshotHash) {
          return null;
        }

        const payload = this.draftId
          ? updateSnapshot
          : {
            ...updateSnapshot,
            creado_por_email: this.solicitanteEmail.trim(),
            creado_por_nombre: this.solicitanteNombre.trim(),
            creado_por_area: this.areaNombre.trim() || null,
          } satisfies SolicitudCompraBorradorCreatePayload;

        const response = this.draftId
          ? await solicitudesCompraBorradoresService.actualizarBorrador(
            this.draftId,
            payload as SolicitudCompraBorradorUpdatePayload
          )
          : await solicitudesCompraBorradoresService.crearBorrador(
            payload as SolicitudCompraBorradorCreatePayload
          );

        this.draftId = response.id;
        this.lastSavedDraftSnapshotHash = snapshotHash;

        return { id: response.id };
      } catch (error) {
        if (!silent) {
          this.error = error instanceof Error
            ? error.message
            : 'No se pudo guardar el borrador';
        }

        if (!silent) {
          throw error;
        }

        return null;
      } finally {
        if (!silent) {
          this.loading = false;
        }

        this.draftSaving = false;
      }
    },

    async saveDraft(): Promise<SolicitudCompraGuardarBorradorResponse> {
      const response = await this.persistDraft();

      if (!response) {
        throw new Error('No se pudo guardar el borrador');
      }

      return response;
    },

    async autoSaveDraft(): Promise<boolean> {
      const response = await this.persistDraft({
        silent: true,
        skipIfUnchanged: true,
      });

      return Boolean(response);
    },

    async deactivateDraftAfterSubmit(): Promise<void> {
      if (!this.draftId) {
        return;
      }

      try {
        await solicitudesCompraBorradoresService.desactivarBorrador(this.draftId);
        this.draftId = null;
        this.lastSavedDraftSnapshotHash = null;
      } catch (error) {
        console.error('No se pudo desactivar el borrador despues del envio:', error);
      }
    },

    async submit(mode: Exclude<SolicitudCompraSubmitMode, null>): Promise<SolicitudCompraCrearResponse> {
      this.submitMode = mode;
      this.loading = true;
      this.error = null;
      this.validationErrors = {};

      try {
        if (this.adjuntosLocales.length > 0 && !this.uploadSession) {
          this.uploading = true;
          this.uploadSession = await solicitudesCompraCrearService.prepararUploadSession();
          this.adjuntosSubidos = await solicitudesCompraCrearService.subirAdjuntos(
            this.uploadSession,
            this.adjuntosLocales
          );
        }

        const payload = await this.buildPayload();
        const response = await solicitudesCompraCrearService.crearSolicitud(payload);

        if (mode === 'send') {
          await this.deactivateDraftAfterSubmit();
        }

        this.lastCreatedResponse = response;
        return response;
      } catch (error) {
        this.error = error instanceof Error
          ? error.message
          : 'No se pudo crear la solicitud';
        throw error;
      } finally {
        this.loading = false;
        this.uploading = false;
      }
    },
  },
});
