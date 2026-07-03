export type SolicitudCompraCreateStep = 1 | 2 | 3 | 4;

export type SolicitudCompraSubmitMode = 'send' | null;

export type SolicitudCompraTipoSolicitud = 'zafra' | 'cultivo' | 'otros' | 'servicio';

export type ContextoDestinoTipoOrigen =
  | 'equipo'
  | 'area_operativa'
  | 'instalacion_taller'
  | 'grupo_equipo'
  | 'otros';

export const OBSERVACION_PREFILL_PREFIX = 'PARA USO EN: ';
export const ADJUNTO_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const ADJUNTO_MAX_FILES = 5;
export const ADJUNTO_MAX_NAME_LENGTH = 50;
export const ADJUNTO_ERROR_MESSAGE = 'Archivo no valido';
export const ADJUNTO_DUPLICATE_ERROR_MESSAGE = 'Archivo repetido';
export const ADJUNTO_MAX_FILES_ERROR_MESSAGE = 'Maximo 5 archivos';

export type CrearSolicitudAdjuntoKind = 'image' | 'pdf' | 'docx';

export interface CrearSolicitudHeaderContext {
  solicitanteNombre: string;
  solicitanteEmail: string;
  areaNombre: string;
  fechaCreacionLocal: Date;
}

export interface DestinoSeleccionado {
  id: number;
  tipoOrigen: ContextoDestinoTipoOrigen;
  codigo: string;
  label: string;
  modelo: string | null;
  marca: string | null;
  tipo: string | null;
}

export interface ProductoCatalogoRow {
  producto_id: string;
  cod_producto: string;
  nombre: string;
  unidad_mostrar: string;
  unidad_medida_id: number;
  unidad_codigo: string;
  unidad_abreviatura: string | null;
}

export interface ProductoCatalogoOption {
  productoId: string;
  codProducto: string;
  nombre: string;
  unidadCodigo: string;
  unidadLabel: string;
}

export interface ProductoSolicitudExistenteItem {
  localId: string;
  tipo: 'existente';
  productoId: string;
  codProducto: string;
  nombre: string;
  unidadCodigo: string;
  unidadLabel: string;
}

export interface ProductoSolicitudTemporalItem {
  localId: string;
  tipo: 'temporal';
  temporal: true;
  nombre: string;
  descripcion?: string | null;
  unidadCodigo: string;
  unidadLabel: string;
}

export interface ProductoTemporalDraft {
  nombre: string;
  descripcion?: string | null;
  unidadCodigo: string;
  unidadLabel: string;
}

export type ProductoSolicitudItem =
  | ProductoSolicitudExistenteItem
  | ProductoSolicitudTemporalItem;

export interface ServicioSolicitudDraft {
  cantidad: number;
  descripcion: string;
  unidadCodigo: string;
  unidadLabel: string;
}

export interface ServicioSolicitudItem {
  localId: string;
  cantidad: number;
  descripcion: string;
  unidadCodigo: string;
  unidadLabel: string;
}

export interface CrearSolicitudAdjuntoLocalItem {
  localId: string;
  file: File;
  displayName: string;
  kind: CrearSolicitudAdjuntoKind;
  fingerprint: string;
}

export interface CrearSolicitudAdjuntoDraftInput {
  file: File;
  displayName: string;
}

export interface CrearSolicitudAdjuntoValidationIssue {
  localId: string;
  fileName: string;
  message: string;
}

export interface CrearSolicitudAdjuntoUploadMetadata {
  bucketId: string;
  storagePath: string;
  nombreOriginal: string;
  mimeType: string;
  extension: string | null;
  sizeBytes: number;
  tipoAdjuntoCodigo: string;
  descripcion: string | null;
}

export interface CrearSolicitudUploadSession {
  bucket_id: string;
  upload_group_id: string;
  base_path: string;
  fecha_path: string;
  area_codigo: string | null;
  area_slug: string;
  usuario_slug: string;
  email: string | null;
}

export interface SolicitudCompraCrearPayload {
  p_tipo_codigo: SolicitudCompraTipoSolicitud;
  p_fecha_entrega: string;
  p_observacion: string;
  p_contextos_destino: Array<{
    tipo_origen: ContextoDestinoTipoOrigen;
    codigo: string;
  }>;
  p_productos: Array<
    | { cod_producto: string }
    | {
      temporal: true;
      nombre: string;
      descripcion?: string | null;
      unidad_codigo: string;
    }
  >;
  p_servicios: Array<{
    descripcion: string;
    cantidad: number;
    unidad_codigo: string;
  }>;
  p_enviar: boolean;
  p_solicitar_urgente: boolean;
  p_motivo_urgencia: string | null;
  p_adjuntos: CrearSolicitudAdjuntoUploadMetadata[];
  p_requerir_adjuntos_storage: boolean;
}

export interface SolicitudCompraCrearResponse {
  solicitud_id: string;
  folio_sol: string | null;
  tipo_codigo: SolicitudCompraTipoSolicitud;
  estado_codigo: string;
  prioridad_codigo: string;
  ciclo_estado: number;
  productos_total: number;
  servicios_total: number;
  destinos_total: number;
  adjuntos_total: number;
  peticion_urgente_creada: boolean;
  urgente_ignorado_por_borrador: boolean;
}

export interface SolicitudCompraGuardarBorradorResponse {
  id: string;
}

export interface CrearSolicitudFieldErrors {
  tipoSolicitud?: string;
  fechaEntrega?: string;
  destinos?: string;
  productos?: string;
  servicios?: string;
  observacion?: string;
  adjuntos?: string;
  motivoUrgencia?: string;
}

export interface SolicitudCompraCrearState extends CrearSolicitudHeaderContext {
  entryMode: 'new' | 'draft' | null;
  continuedFromDraft: boolean;
  fechaEntregaRequiresReview: boolean;
  currentStep: SolicitudCompraCreateStep;
  submitMode: SolicitudCompraSubmitMode;
  draftId: string | null;
  lastSavedDraftSnapshotHash: string | null;
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
  fechaEntrega: string | null;
  destinos: DestinoSeleccionado[];
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
  observacion: string;
  ultimoPrefillObservacion: string;
  observacionEditadaManual: boolean;
  solicitarUrgente: boolean;
  motivoUrgencia: string;
  adjuntosLocales: CrearSolicitudAdjuntoLocalItem[];
  adjuntosErroresRecientes: CrearSolicitudAdjuntoValidationIssue[];
  adjuntosSubidos: CrearSolicitudAdjuntoUploadMetadata[];
  uploadSession: CrearSolicitudUploadSession | null;
  productSearchQuery: string;
  productSearchResults: ProductoCatalogoOption[];
  productSearchLoading: boolean;
  productSearchError: string | null;
  loading: boolean;
  draftSaving: boolean;
  uploading: boolean;
  error: string | null;
  validationErrors: CrearSolicitudFieldErrors;
  initialized: boolean;
  lastCreatedResponse: SolicitudCompraCrearResponse | null;
}
