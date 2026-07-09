import { describe, expect, it } from 'vitest';

import type { SolicitudCompraRoleCodigo } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

import {
  SOLICITUD_LIST_ROLE_CONFIG,
  canShowSolicitudListField,
  getSolicitudDesktopColumnsByRole,
  getSolicitudListRoleConfig,
  getSolicitudMobileFieldsByRole,
} from './solicitudListRoleConfig';

describe('solicitudListRoleConfig', () => {
  it('usa una sola config compartida por rol', () => {
    const adminConfig = getSolicitudListRoleConfig('admin');

    expect(adminConfig).toBe(SOLICITUD_LIST_ROLE_CONFIG.admin);
    expect(getSolicitudDesktopColumnsByRole('admin')).toBe(adminConfig.desktopColumns);
    expect(getSolicitudMobileFieldsByRole('admin')).toBe(adminConfig.mobileFields);
  });

  it('aplica fallback seguro a operativo para roles desconocidos', () => {
    const unknownRole = 'desconocido' as SolicitudCompraRoleCodigo;
    const fallbackConfig = getSolicitudListRoleConfig(unknownRole);

    expect(fallbackConfig).toBe(SOLICITUD_LIST_ROLE_CONFIG.operativo);
    expect(canShowSolicitudListField(unknownRole, 'canSeeArea')).toBe(false);
    expect(canShowSolicitudListField(unknownRole, 'canSeeSolicitante')).toBe(false);
    expect(canShowSolicitudListField(unknownRole, 'canSeeFolioOc')).toBe(true);
  });

  it('configura operativo con folio, OC, observacion, seguimiento, prioridad, destinos, fecha, adjuntos y diferencia OC', () => {
    expect(getSolicitudDesktopColumnsByRole('operativo')).toEqual([
      'folio',
      'observacion',
      'seguimiento',
      'prioridad',
      'destinos',
      'fechaEntrega',
      'indicadores',
    ]);
    expect(getSolicitudMobileFieldsByRole('operativo')).toEqual([
      'folio',
      'seguimiento',
      'observacion',
      'prioridad',
      'destinos',
      'fechaEntrega',
      'indicadores',
    ]);
    expect(canShowSolicitudListField('operativo', 'canSeeFolio')).toBe(true);
    expect(canShowSolicitudListField('operativo', 'canSeeFolioOc')).toBe(true);
    expect(canShowSolicitudListField('operativo', 'canSeeAdjuntos')).toBe(true);
    expect(canShowSolicitudListField('operativo', 'canSeeDiferenciaOc')).toBe(true);
    expect(canShowSolicitudListField('operativo', 'canSeeArea')).toBe(false);
    expect(canShowSolicitudListField('operativo', 'canSeeSolicitante')).toBe(false);
  });

  it('configura admin para ver todo', () => {
    expect(getSolicitudDesktopColumnsByRole('admin')).toEqual([
      'folio',
      'observacion',
      'seguimiento',
      'prioridad',
      'destinos',
      'area',
      'solicitante',
      'fechaEntrega',
      'indicadores',
    ]);
    expect(getSolicitudMobileFieldsByRole('admin')).toEqual([
      'folio',
      'seguimiento',
      'observacion',
      'prioridad',
      'destinos',
      'area',
      'solicitante',
      'fechaEntrega',
      'indicadores',
    ]);

    const visibilityFields = [
      'canSeeFolio',
      'canSeeFolioOc',
      'canSeeArea',
      'canSeeSolicitante',
      'canSeeDestinos',
      'canSeeFechaEntrega',
      'canSeeAdjuntos',
      'canSeeDiferenciaOc',
      'canSeeBloqueado',
      'canSeeConteos',
    ] as const;

    for (const field of visibilityFields) {
      expect(canShowSolicitudListField('admin', field)).toBe(true);
    }
  });

  it('configura gerencia con area pero sin solicitante', () => {
    expect(getSolicitudDesktopColumnsByRole('gerencia')).toEqual([
      'folio',
      'observacion',
      'seguimiento',
      'prioridad',
      'destinos',
      'area',
      'fechaEntrega',
      'indicadores',
    ]);
    expect(getSolicitudMobileFieldsByRole('gerencia')).toEqual([
      'folio',
      'seguimiento',
      'observacion',
      'prioridad',
      'destinos',
      'area',
      'fechaEntrega',
      'indicadores',
    ]);
    expect(canShowSolicitudListField('gerencia', 'canSeeArea')).toBe(true);
    expect(canShowSolicitudListField('gerencia', 'canSeeSolicitante')).toBe(false);
    expect(canShowSolicitudListField('gerencia', 'canSeeDiferenciaOc')).toBe(true);
  });

  it('configura almacen solo con observacion, area, prioridad, seguimiento y bloqueado', () => {
    const expectedFields = ['observacion', 'area', 'prioridad', 'seguimiento', 'bloqueado'];

    expect(getSolicitudDesktopColumnsByRole('almacen')).toEqual(expectedFields);
    expect(getSolicitudMobileFieldsByRole('almacen')).toEqual(expectedFields);
    expect(canShowSolicitudListField('almacen', 'canSeeFolio')).toBe(false);
    expect(canShowSolicitudListField('almacen', 'canSeeFolioOc')).toBe(false);
    expect(canShowSolicitudListField('almacen', 'canSeeDestinos')).toBe(false);
    expect(canShowSolicitudListField('almacen', 'canSeeAdjuntos')).toBe(false);
    expect(canShowSolicitudListField('almacen', 'canSeeDiferenciaOc')).toBe(false);
    expect(canShowSolicitudListField('almacen', 'canSeeBloqueado')).toBe(true);
  });

  it('configura secretaria sin OC, destinos, adjuntos ni diferencia OC', () => {
    const expectedFields = [
      'folio',
      'observacion',
      'area',
      'solicitante',
      'prioridad',
      'seguimiento',
      'fechaEntrega',
      'bloqueado',
    ];

    expect(getSolicitudDesktopColumnsByRole('secretaria')).toEqual(expectedFields);
    expect(getSolicitudMobileFieldsByRole('secretaria')).toEqual(expectedFields);
    expect(canShowSolicitudListField('secretaria', 'canSeeFolio')).toBe(true);
    expect(canShowSolicitudListField('secretaria', 'canSeeSolicitante')).toBe(true);
    expect(canShowSolicitudListField('secretaria', 'canSeeFolioOc')).toBe(false);
    expect(canShowSolicitudListField('secretaria', 'canSeeDestinos')).toBe(false);
    expect(canShowSolicitudListField('secretaria', 'canSeeAdjuntos')).toBe(false);
    expect(canShowSolicitudListField('secretaria', 'canSeeDiferenciaOc')).toBe(false);
  });
});
