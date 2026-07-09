import type {
  SolicitudCompraColumnKey,
  SolicitudCompraRoleCodigo,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

export interface SolicitudListRoleVisibility {
  canSeeFolio: boolean;
  canSeeFolioOc: boolean;
  canSeeArea: boolean;
  canSeeSolicitante: boolean;
  canSeeDestinos: boolean;
  canSeeFechaEntrega: boolean;
  canSeeAdjuntos: boolean;
  canSeeDiferenciaOc: boolean;
  canSeeBloqueado: boolean;
  canSeeConteos: boolean;
}

export interface SolicitudListRoleConfig extends SolicitudListRoleVisibility {
  desktopColumns: SolicitudCompraColumnKey[];
  mobileFields: SolicitudCompraColumnKey[];
}

const OPERATIVO_CONFIG: SolicitudListRoleConfig = {
  desktopColumns: [
    'folio',
    'observacion',
    'seguimiento',
    'prioridad',
    'destinos',
    'fechaEntrega',
    'indicadores',
  ],
  mobileFields: [
    'folio',
    'seguimiento',
    'observacion',
    'prioridad',
    'destinos',
    'fechaEntrega',
    'indicadores',
  ],
  canSeeFolio: true,
  canSeeFolioOc: true,
  canSeeArea: false,
  canSeeSolicitante: false,
  canSeeDestinos: true,
  canSeeFechaEntrega: true,
  canSeeAdjuntos: true,
  canSeeDiferenciaOc: true,
  canSeeBloqueado: true,
  canSeeConteos: false,
};

export const SOLICITUD_LIST_ROLE_CONFIG: Record<
  SolicitudCompraRoleCodigo,
  SolicitudListRoleConfig
> = {
  operativo: OPERATIVO_CONFIG,
  admin: {
    desktopColumns: [
      'folio',
      'observacion',
      'seguimiento',
      'prioridad',
      'destinos',
      'area',
      'solicitante',
      'fechaEntrega',
      'indicadores',
    ],
    mobileFields: [
      'folio',
      'seguimiento',
      'observacion',
      'prioridad',
      'destinos',
      'area',
      'solicitante',
      'fechaEntrega',
      'indicadores',
    ],
    canSeeFolio: true,
    canSeeFolioOc: true,
    canSeeArea: true,
    canSeeSolicitante: true,
    canSeeDestinos: true,
    canSeeFechaEntrega: true,
    canSeeAdjuntos: true,
    canSeeDiferenciaOc: true,
    canSeeBloqueado: true,
    canSeeConteos: true,
  },
  gerencia: {
    desktopColumns: [
      'folio',
      'observacion',
      'seguimiento',
      'prioridad',
      'destinos',
      'area',
      'fechaEntrega',
      'indicadores',
    ],
    mobileFields: [
      'folio',
      'seguimiento',
      'observacion',
      'prioridad',
      'destinos',
      'area',
      'fechaEntrega',
      'indicadores',
    ],
    canSeeFolio: true,
    canSeeFolioOc: true,
    canSeeArea: true,
    canSeeSolicitante: false,
    canSeeDestinos: true,
    canSeeFechaEntrega: true,
    canSeeAdjuntos: true,
    canSeeDiferenciaOc: true,
    canSeeBloqueado: true,
    canSeeConteos: true,
  },
  almacen: {
    desktopColumns: ['observacion', 'area', 'prioridad', 'seguimiento', 'bloqueado'],
    mobileFields: ['observacion', 'area', 'prioridad', 'seguimiento', 'bloqueado'],
    canSeeFolio: false,
    canSeeFolioOc: false,
    canSeeArea: true,
    canSeeSolicitante: false,
    canSeeDestinos: false,
    canSeeFechaEntrega: false,
    canSeeAdjuntos: false,
    canSeeDiferenciaOc: false,
    canSeeBloqueado: true,
    canSeeConteos: false,
  },
  secretaria: {
    desktopColumns: [
      'folio',
      'observacion',
      'area',
      'solicitante',
      'prioridad',
      'seguimiento',
      'fechaEntrega',
      'bloqueado',
    ],
    mobileFields: [
      'folio',
      'observacion',
      'area',
      'solicitante',
      'prioridad',
      'seguimiento',
      'fechaEntrega',
      'bloqueado',
    ],
    canSeeFolio: true,
    canSeeFolioOc: false,
    canSeeArea: true,
    canSeeSolicitante: true,
    canSeeDestinos: false,
    canSeeFechaEntrega: true,
    canSeeAdjuntos: false,
    canSeeDiferenciaOc: false,
    canSeeBloqueado: true,
    canSeeConteos: false,
  },
};

export const getSolicitudListRoleConfig = (
  roleCodigo: SolicitudCompraRoleCodigo
): SolicitudListRoleConfig =>
  SOLICITUD_LIST_ROLE_CONFIG[roleCodigo] ?? OPERATIVO_CONFIG;

export const getSolicitudDesktopColumnsByRole = (
  roleCodigo: SolicitudCompraRoleCodigo
): SolicitudCompraColumnKey[] =>
  getSolicitudListRoleConfig(roleCodigo).desktopColumns;

export const getSolicitudMobileFieldsByRole = (
  roleCodigo: SolicitudCompraRoleCodigo
): SolicitudCompraColumnKey[] =>
  getSolicitudListRoleConfig(roleCodigo).mobileFields;

export const canShowSolicitudListField = (
  roleCodigo: SolicitudCompraRoleCodigo,
  field: keyof SolicitudListRoleVisibility
): boolean => getSolicitudListRoleConfig(roleCodigo)[field];
