import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedFeatureFlags = vi.hoisted(() => ({
  value: [] as string[],
}));

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => ({
    isLoaded: true,
    nombre: 'Juan Pérez',
    email: 'juan@cadasa.test',
    area: 'OPERATIVA',
    role: 'admin',
    profile: {
      area: 'Operativa',
    },
    fetchCurrentUserProfile: vi.fn(),
  }),
}));

vi.mock('@/stores/dbequipos/equipos/equipos.store', () => ({
  useEquiposStore: () => ({
    reset: vi.fn(),
    agregarEquipo: vi.fn(),
    removerEquipo: vi.fn(),
    buscarEquipos: vi.fn(),
  }),
}));

vi.mock('./solicitudesCompraCrear.service', () => ({
  solicitudesCompraCrearService: {
    buscarProductos: vi.fn(),
    prepararUploadSession: vi.fn(),
    subirAdjuntos: vi.fn(),
    crearSolicitud: vi.fn(),
  },
}));

vi.mock('../borradores/solicitudesCompraBorradores.service', () => ({
  solicitudesCompraBorradoresService: {
    obtenerMisBorradores: vi.fn(),
    crearBorrador: vi.fn(),
    actualizarBorrador: vi.fn(),
    desactivarBorrador: vi.fn(),
  },
}));

vi.mock('@/stores/db_compras/calendario_feriados/calendarioFeriados.service', () => ({
  calendarioFeriadosService: {
    obtenerPorAnio: vi.fn(async (year: number) => ({
      year,
      holidays: [],
    })),
  },
}));

vi.mock('@/stores/db_mantenimiento/app_feature_access/featureAccess.service', () => ({
  featureAccessService: {
    obtenerFuncionalidadesPermitidas: vi.fn(async () => mockedFeatureFlags.value),
  },
}));

import { useSolicitudesCompraCrearStore } from './solicitudesCompraCrear.store';
import { OBSERVACION_PREFILL_PREFIX } from './solicitudesCompraCrear.types';

const equipoOption = {
  id: 1,
  codEquipo: 'EQ-001',
  label: 'EQ-001 · Tractor John Deere 6155M',
  modelo: '6155M',
  marca: 'John Deere',
  tipo: 'Tractor',
};

describe('solicitudesCompraCrear.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T12:00:00Z'));
    mockedFeatureFlags.value = [];
  });

  it('inicializa datos de encabezado desde userStore', async () => {
    const store = useSolicitudesCompraCrearStore();

    await store.initialize();

    expect(store.solicitanteNombre).toBe('Juan Pérez');
    expect(store.solicitanteEmail).toBe('juan@cadasa.test');
    expect(store.areaNombre).toBe('Operativa');
  });

  it('autocompleta la fecha minima al crear una nueva solicitud en modo normal', async () => {
    const store = useSolicitudesCompraCrearStore();

    await store.prepareNewEntry();

    expect(store.entryMode).toBe('new');
    expect(store.isZafraActiva).toBe(false);
    expect(store.fechaEntregaMinima).toBe('2026-07-20');
    expect(store.fechaEntrega).toBe('2026-07-20');
  });

  it('no autocompleta la fecha al crear una nueva solicitud con zafra activa', async () => {
    mockedFeatureFlags.value = ['temporada_zafra_activa'];
    const store = useSolicitudesCompraCrearStore();

    await store.prepareNewEntry();

    expect(store.entryMode).toBe('new');
    expect(store.isZafraActiva).toBe(true);
    expect(store.fechaEntregaMinima).toBeNull();
    expect(store.fechaEntrega).toBeNull();
  });

  it('arma payload de productos con nombre principal y p_contextos_destino', async () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('zafra');
    await store.setFechaEntrega('2026-07-20');
    store.agregarEquipo(equipoOption);
    store.setObservacion('Solicitud para mantenimiento preventivo.');
    store.agregarProductoTemporal({
      nombre: 'Aceite hidraulico',
      descripcion: 'SAE 10W',
      unidadCodigo: 'gal',
      unidadLabel: 'Gal',
    });

    const payload = await store.buildPayload();

    expect(payload.p_contextos_destino).toEqual([
      { tipo_origen: 'equipo', codigo: 'EQ-001' },
    ]);
    expect(payload.p_productos).toEqual([
      {
        temporal: true,
        nombre: 'ACEITE HIDRAULICO',
        descripcion: 'SAE 10W',
        unidad_codigo: 'gal',
      },
    ]);
    expect(payload.p_servicios).toEqual([]);
  });

  it('arma payload de servicios con destinos de catalogo', async () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('servicio');
    await store.setFechaEntrega('2026-07-20');
    store.agregarDestinoContexto({
      id: 20,
      codigo: 'TALLER',
      nombre: 'Instalaciones de taller',
      tipoOrigen: 'instalacion_taller',
    });
    store.setObservacion('Servicio requerido para torno externo.');
    store.agregarServicio({
      cantidad: 3,
      descripcion: 'Servicio de torno',
      unidadCodigo: 'un',
      unidadLabel: 'Un',
    });

    const payload = await store.buildPayload();

    expect(payload.p_contextos_destino).toEqual([
      { tipo_origen: 'instalacion_taller', codigo: 'TALLER' },
    ]);
    expect(payload.p_productos).toEqual([]);
    expect(payload.p_servicios).toEqual([
      {
        descripcion: 'SERVICIO DE TORNO',
        cantidad: 3,
        unidad_codigo: 'un',
      },
    ]);
  });

  it('exige al menos un destino en el paso 1', async () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('cultivo');
    await store.setFechaEntrega('2026-07-20');

    expect(store.validateStep(1)).toBe(false);
    expect(store.validationErrors.destinos).toBe('Debe seleccionar al menos un destino.');
  });

  it('impide mezclar tipos de destino en una misma solicitud', async () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('servicio');
    await store.setFechaEntrega('2026-07-20');
    store.agregarEquipo(equipoOption);
    store.agregarDestinoContexto({
      id: 2,
      codigo: 'AREA-01',
      nombre: 'Area operativa 01',
      tipoOrigen: 'area_operativa',
    });

    expect(store.destinos).toHaveLength(1);
    expect(store.destinos[0]?.tipoOrigen).toBe('equipo');
    expect(store.validationErrors.destinos).toBe('No se puede combinar otro origen de destino en esta solicitud. Si deseas elegir otro origen, elimina primero el destino ya seleccionado.');
  });

  it('autocompleta observacion solo con codigos de equipos reales', async () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('servicio');
    await store.setFechaEntrega('2026-07-20');
    store.agregarDestinoContexto({
      id: 8,
      codigo: 'TALLER',
      nombre: 'Instalaciones de taller',
      tipoOrigen: 'instalacion_taller',
    });

    expect(store.observacion).toBe(OBSERVACION_PREFILL_PREFIX);

    store.removerDestino({ codigo: 'TALLER', tipoOrigen: 'instalacion_taller' });
    store.agregarEquipo(equipoOption);

    expect(store.observacion).toBe(`${OBSERVACION_PREFILL_PREFIX}EQ-001`);
  });

  it('filtra destinos de catalogo al salir del tipo servicio', async () => {
    const store = useSolicitudesCompraCrearStore();

    store.setTipoSolicitud('servicio');
    await store.setFechaEntrega('2026-07-20');
    store.agregarDestinoContexto({
      id: 8,
      codigo: 'TALLER',
      nombre: 'Instalaciones de taller',
      tipoOrigen: 'instalacion_taller',
    });

    store.setTipoSolicitud('otros');

    expect(store.destinos).toEqual([]);
    expect(store.observacion).toBe(OBSERVACION_PREFILL_PREFIX);
  });

  it('genera snapshot de borrador con destinos y producto temporal migrado', async () => {
    const store = useSolicitudesCompraCrearStore();

    store.currentStep = 2;
    store.setTipoSolicitud('otros');
    await store.setFechaEntrega('2026-07-20');
    store.agregarEquipo(equipoOption);
    store.agregarProductoTemporal({
      nombre: 'Manguera hidraulica',
      descripcion: 'Media pulgada',
      unidadCodigo: 'un',
      unidadLabel: 'Un',
    });
    store.setObservacion('Reposicion en campo.');

    const snapshot = await store.buildDraftSnapshot();

    expect(snapshot.destinos).toEqual(store.destinos);
    expect(snapshot.productos).toEqual([
      expect.objectContaining({
        tipo: 'temporal',
        nombre: 'MANGUERA HIDRAULICA',
        descripcion: 'MEDIA PULGADA',
      }),
    ]);
  });

  it('hidrata borradores con destinos y productos del nuevo contrato', async () => {
    const store = useSolicitudesCompraCrearStore();

    await store.hydrateFromDraft({
      id: 'draft-1',
      schemaVersion: 1,
      currentStep: 3,
      tipoSolicitud: 'otros',
      fechaEntrega: '2026-07-20',
      observacion: 'Reposicion programada.',
      solicitarUrgente: false,
      motivoUrgencia: '',
      destinos: [{
        id: 1,
        tipoOrigen: 'equipo',
        codigo: 'EQ-001',
        label: 'EQ-001 · Tractor John Deere 6155M',
        modelo: '6155M',
        marca: 'John Deere',
        tipo: 'Tractor',
      }],
      productos: [{
        localId: 'temp-1',
        tipo: 'temporal',
        temporal: true,
        nombre: 'MANGUERA HIDRAULICA',
        descripcion: 'MEDIA PULGADA',
        unidadCodigo: 'un',
        unidadLabel: 'Un',
      }],
      servicios: [],
      createdAt: '2026-07-02T10:00:00Z',
      updatedAt: '2026-07-02T11:00:00Z',
    });

    expect(store.destinos).toHaveLength(1);
    expect(store.productos).toEqual([
      expect.objectContaining({
        tipo: 'temporal',
        nombre: 'MANGUERA HIDRAULICA',
        descripcion: 'MEDIA PULGADA',
      }),
    ]);
    expect(store.currentStep).toBe(3);
  });
});
