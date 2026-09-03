export interface RatingsEmpleado {
  id?: number;
  id_empleado: number;
  nombre_completo: string;
  correo: string;
  email: string;
  rol: string;
  area?: string;
  departamento?: string;
}

export interface RatingsInspeccion {
  id?: number;
  id_inspeccion: number;
  fecha: string;
  hora: string;
  foto_url: string;
  observacion: string;
  id_supervisor: number;
  supervisor_id: number;
  id_inspector: number;
  inspector_id: number;
}

export interface RatingsDetalle {
  id?: number;
  id_inspeccion: number;
  id_criterio: number;
  puntuacion: number;
}

export interface UpsertMeetingRatingPayload {
  inspectionId?: number | null;
  fecha: string;
  hora: string;
  id_supervisor: number;
  id_inspector: number;
  meetingCriterionId: number;
  puntuacion: number;
  observacion: string;
}

export interface DeleteMeetingRatingPayload {
  inspectionId: number;
  meetingCriterionId: number;
}

export interface RatingsFetchScopeAll {
  mode: "all";
}

export interface RatingsFetchScopeDateRange {
  mode: "date-range";
  from: string;
  to: string;
}

export interface RatingsFetchScopeSingleDate {
  mode: "single-date";
  date: string;
}

export type RatingsFetchScope =
  | RatingsFetchScopeAll
  | RatingsFetchScopeDateRange
  | RatingsFetchScopeSingleDate;

export interface RatingsAccessScopeAll {
  mode: "all";
}

export interface RatingsAccessScopeCurrentEmployee {
  mode: "current-employee";
  email: string;
}

export type RatingsAccessScope =
  RatingsAccessScopeAll | RatingsAccessScopeCurrentEmployee;

export interface RatingsInspeccionNormalizada extends RatingsInspeccion {
  final_supervisor_id: number;
  final_inspector_id: number;
  puntuacion_promedio: number;
  id_inspeccion: number;
}

export interface RatingsStoreState {
  empleados: RatingsEmpleado[];
  inspecciones: RatingsInspeccion[];
  detalles: RatingsDetalle[];
  puntuacionSupervisoresOt: PuntuacionSupervisoresOtResponse | null;
  fechaPuntuacionSupervisoresOt: string | null;
  isLoaded: boolean;
  isLoading: boolean;
  isPuntuacionSupervisoresOtLoading: boolean;
  errorPuntuacionSupervisoresOt: string | null;
}

export interface PuntuacionSupervisorOtPayload {
  fecha: string;
}

export type PuntuacionSupervisorOtCaso =
  | "CUMPLIO_MODIFICADO_DESPUES"
  | "CUMPLIO_A_TIEMPO"
  | "GESTIONADO_TARDE"
  | "SIN_HISTORIAL";

export type PuntuacionSupervisorOtEtiqueta =
  "SIN_OT" | "BUENO" | "REGULAR" | "MALO";

export type PuntuacionSupervisorOtModoUsuario =
  "TODAS_LAS_AREAS" | "SERVICIOS_GENERALES" | "AREA_PROPIA";

export type PuntuacionSupervisorOtTipoOrigen = "OM" | "SG";

export interface PuntuacionSupervisorOtPerfil {
  email: string | null;
  nombre: string | null;
}

export interface PuntuacionSupervisorOtUsuario extends PuntuacionSupervisorOtPerfil {
  area: string | null;
  role: string | null;
  modo: PuntuacionSupervisorOtModoUsuario;
}

export interface PuntuacionSupervisorOtResumen {
  total: number;
  a_tiempo: number;
  fuera_de_tiempo: number;
  sin_historial: number;
  porcentaje: number;
  puntuacion: number | null;
  etiqueta: PuntuacionSupervisorOtEtiqueta;
}

export interface PuntuacionSupervisorOtOrigen {
  id: string | null;
  tipo: PuntuacionSupervisorOtTipoOrigen;
  descripcion: string | null;
}

export interface PuntuacionSupervisorOtMecanico {
  id: number | null;
  nombre: string | null;
}

export interface PuntuacionSupervisorOtMovimiento {
  de: string | null;
  a: string | null;
  email: string | null;
  fecha_hora: string | null;
  hora: string | null;
}

export interface PuntuacionSupervisorOtActualizacion extends PuntuacionSupervisorOtMovimiento {
  id: string;
}

export interface PuntuacionSupervisorOtCumplimiento {
  a_tiempo: boolean;
  caso: PuntuacionSupervisorOtCaso;
  primer_movimiento: PuntuacionSupervisorOtMovimiento | null;
}

export interface PuntuacionSupervisorOtOrden {
  id: string;
  origen: PuntuacionSupervisorOtOrigen;
  mecanico: PuntuacionSupervisorOtMecanico;
  estado_actual: string | null;
  fecha_orden: string;
  hora_creacion: string | null;
  cumplimiento: PuntuacionSupervisorOtCumplimiento;
  actualizaciones: PuntuacionSupervisorOtActualizacion[];
}

export interface PuntuacionSupervisorOtArea {
  area: string;
  supervisor: PuntuacionSupervisorOtPerfil;
  resumen: PuntuacionSupervisorOtResumen;
  ots: PuntuacionSupervisorOtOrden[];
}

export interface PuntuacionSupervisoresOtSuccessResponse {
  ok: true;
  fecha: string;
  zona_horaria: "America/Panama";
  hora_corte: string;
  usuario: PuntuacionSupervisorOtUsuario;
  resumen: PuntuacionSupervisorOtResumen;
  areas: PuntuacionSupervisorOtArea[];
}

export interface PuntuacionSupervisoresOtErrorResponse {
  ok: false;
  error: string;
  email_auth?: string | null;
}

export type PuntuacionSupervisoresOtResponse =
  | PuntuacionSupervisoresOtSuccessResponse
  | PuntuacionSupervisoresOtErrorResponse;
