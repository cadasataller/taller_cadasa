import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraListItem,
  SolicitudCompraListRpcRow,
} from './solicitudesCompra.types';

vi.mock('./solicitudesCompra.service', () => ({
  solicitudesCompraService: {
    obtenerConfigListado: vi.fn(),
    obtenerSolicitudesListaPagina: vi.fn(),
    buscarSolicitudesLista: vi.fn(),
  },
}));

vi.mock('./solicitudesCompra.mappers', () => ({
  mapSolicitudCompraListRowsToItems: vi.fn(),
}));

import { solicitudesCompraService } from './solicitudesCompra.service';
import { mapSolicitudCompraListRowsToItems } from './solicitudesCompra.mappers';
import { useSolicitudesCompraStore } from './solicitudesCompra.store';

const currentDir = dirname(fileURLToPath(import.meta.url));
const storeSource = readFileSync(
  resolve(currentDir, 'solicitudesCompra.store.ts'),
  'utf8'
);

const mockedService = vi.mocked(solicitudesCompraService);
const mockedMapper = vi.mocked(mapSolicitudCompraListRowsToItems);

const createConfig = () => ({
  viewer: {
    email: 'viewer@cadasa.test',
    role_codigo: 'operativo',
    area_codigo: 'cosecha_agricola',
  },
  alcances: [],
  grupos: [
    {
      codigo: 'en_proceso' as const,
      label: 'En Proceso',
      visible: true,
      seguimientos: [
        {
          codigo: 'borrador',
          label: 'Borrador',
          origen: 'estado_actual',
          fecha_label: 'Disponible desde',
          aplica_alcance_codigo: 'propia',
          aplica_alcance_codigos: ['propia'],
          visible_en_filtro: true,
        },
      ],
    },
    {
      codigo: 'completadas' as const,
      label: 'Completadas',
      visible: true,
      seguimientos: [
        {
          codigo: 'aprobado_gerencia',
          label: 'Aprobado gerencia',
          origen: 'estado_actual',
          fecha_label: 'Aprobado',
          aplica_alcance_codigo: 'todas',
          aplica_alcance_codigos: ['todas'],
          visible_en_filtro: true,
        },
      ],
    },
    {
      codigo: 'descartadas' as const,
      label: 'Descartadas',
      visible: true,
      seguimientos: [
        {
          codigo: 'rechazado',
          label: 'Rechazado',
          origen: 'estado_actual',
          fecha_label: 'Cerrado',
          aplica_alcance_codigo: 'todas',
          aplica_alcance_codigos: ['todas'],
          visible_en_filtro: true,
        },
      ],
    },
  ],
  badges_delegacion: [],
});

const createRows = (
  count: number,
  startId: number,
  totalCount: number,
  grupoListado: SolicitudCompraGrupoListado,
  overrides?: Partial<SolicitudCompraListRpcRow>
): SolicitudCompraListRpcRow[] =>
  Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    viewer_email: 'viewer@cadasa.test',
    viewer_role_codigo: 'operativo',
    viewer_area_codigo: 'cosecha_agricola',
    folio_sol: `SOL-${startId + index}`,
    folio_oc_principal: null,
    folios_oc: [],
    observacion: `Observacion ${startId + index}`,
    seguimiento: {
      tipo: 'estado_actual',
      codigo: grupoListado === 'completadas'
        ? 'aprobado_gerencia'
        : grupoListado === 'descartadas'
          ? 'rechazado'
          : 'borrador',
      label: grupoListado === 'completadas'
        ? 'Aprobado gerencia'
        : grupoListado === 'descartadas'
          ? 'Rechazado'
          : 'Borrador',
      fecha: null,
      fecha_label: null,
      origen: 'estado_actual',
      alcance_codigo: 'propia',
    },
    badge_codigo: grupoListado === 'completadas'
      ? 'aprobado_gerencia'
      : grupoListado === 'descartadas'
        ? 'rechazado'
        : 'borrador',
    badge_label: grupoListado === 'completadas'
      ? 'Aprobado gerencia'
      : grupoListado === 'descartadas'
        ? 'Rechazado'
        : 'Borrador',
    prioridad_codigo: 'alta',
    prioridad_nombre: 'Alta',
    area_solicitante_codigo: 'cosecha_agricola',
    area_solicitante_nombre: 'Cosecha Agricola',
    solicitante_nombre: 'Usuario Test',
    fecha_entrega_mostrada: '2026-06-15',
    fecha_entrega_origen: 'solicitud',
    grupo_listado: grupoListado,
    bloqueada: false,
    locked_by_email: null,
    locked_at: null,
    cantidad_adjuntos: 0,
    tiene_adjuntos: false,
    cantidad_oc: 0,
    ordenes_compra_resumen: null,
    estado_oc_principal: null,
    evaluacion_principal: null,
    recepcion_principal: null,
    proveedor_principal: null,
    cantidad_diferencias: 0,
    tiene_diferencia_oc: false,
    productos_total: 1,
    productos_activos: 1,
    servicios_total: 0,
    total_count: totalCount,
    destinos: [],
    destinos_total: 0,
    accion_rol: null,
    badge_delegacion: null,
    es_delegada: false,
    tipo_delegacion: null,
    es_mia: false,
    ...overrides,
  }));

const createItemsFromRows = (
  rows: SolicitudCompraListRpcRow[]
): SolicitudCompraListItem[] =>
  rows.map((row) => ({
    id: row.id,
    viewerRoleCodigo: 'operativo',
    viewerAreaCodigo: row.viewer_area_codigo,
    folio: {
      folioSol: row.folio_sol,
      folioSolLabel: row.folio_sol,
      folioOcPrincipal: row.folio_oc_principal,
      foliosOc: row.folios_oc ?? [],
    },
    observacion: row.observacion,
    seguimiento: {
      codigo: row.seguimiento?.codigo ?? 'borrador',
      label: row.seguimiento?.label ?? 'Borrador',
      tipo: row.seguimiento?.tipo ?? null,
      fecha: row.seguimiento?.fecha ?? null,
      fechaLabel: row.seguimiento?.fecha_label ?? null,
      origen: row.seguimiento?.origen ?? null,
      alcanceCodigo: row.seguimiento?.alcance_codigo ?? null,
    },
    prioridad: {
      codigo: row.prioridad_codigo ?? 'alta',
      nombre: row.prioridad_nombre ?? 'Alta',
    },
    destinos: {
      loading: false,
      items: [],
      visibles: [],
      ocultos: 0,
      error: null,
      source: 'destinos',
    },
    area: {
      codigo: row.area_solicitante_codigo,
      nombre: row.area_solicitante_nombre,
    },
    solicitante: {
      nombre: row.solicitante_nombre,
    },
    fechaEntrega: {
      fecha: row.fecha_entrega_mostrada,
      origen: row.fecha_entrega_origen,
    },
    indicadores: {
      bloqueado: {
        visible: row.bloqueada,
        lockedByEmail: row.locked_by_email,
        lockedAt: row.locked_at,
      },
      adjuntos: {
        visible: row.tiene_adjuntos,
        cantidad: row.cantidad_adjuntos,
      },
      diferenciaOc: {
        visible: row.tiene_diferencia_oc,
        cantidad: row.cantidad_diferencias,
      },
    },
    grupoListado: (row.grupo_listado ?? 'en_proceso') as SolicitudCompraGrupoListado,
    conteos: {
      productosTotal: row.productos_total,
      productosActivos: row.productos_activos,
      serviciosTotal: row.servicios_total,
      cantidadOc: row.cantidad_oc,
    },
    ocResumen: {
      estadoOcPrincipal: row.estado_oc_principal,
      evaluacionPrincipal: row.evaluacion_principal,
      recepcionPrincipal: row.recepcion_principal,
      proveedorPrincipal: row.proveedor_principal,
      ordenesCompraResumen: null,
    },
    accionRol: null,
    badgeDelegacion: null,
    esDelegada: row.es_delegada,
    tipoDelegacion: row.tipo_delegacion,
    esMia: row.es_mia,
  }));

describe('solicitudesCompra.store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-16T12:00:00Z'));
    setActivePinia(createPinia());
    vi.clearAllMocks();

    mockedMapper.mockImplementation((rows) => createItemsFromRows(rows));
    mockedService.obtenerConfigListado.mockResolvedValue(createConfig());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cargarInicial trae todo el rango de 6 meses enviando solo fechas y pagina remota acumulada', async () => {
    const firstPage = createRows(200, 1, 210, 'en_proceso');
    const secondPage = createRows(10, 201, 210, 'completadas');
    mockedService.obtenerSolicitudesListaPagina
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const store = useSolicitudesCompraStore();

    await store.cargarInicial();

    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenCalledTimes(2);
    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        p_busqueda: null,
        p_grupo_listado: null,
        p_prioridad_codigo: null,
        p_solo_bloqueadas: false,
        p_solo_diferencia_oc: false,
        p_fecha_desde: '2025-12-16',
        p_fecha_hasta: '2026-06-16',
        p_limit: 200,
        p_offset: 0,
      })
    );
    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        p_offset: 200,
        p_limit: 200,
      })
    );
    expect(mockedMapper).toHaveBeenCalledTimes(1);
    expect(mockedMapper).toHaveBeenCalledWith([...firstPage, ...secondPage]);
    expect(store.baseItems).toHaveLength(210);
    expect(store.items).toHaveLength(25);
    expect(store.pagination.totalCount).toBe(200);
    expect(store.pagination.hasMore).toBe(true);
    expect(store.baseEmpty).toBe(false);
    expect(store.loading).toBe(false);
    expect(store.initialized).toBe(true);
  });

  it('aplica filtros locales de busqueda y grupo sin refetch remoto', async () => {
    const rows = [
      ...createRows(2, 1, 4, 'en_proceso', { observacion: 'Motor principal' }),
      ...createRows(2, 3, 4, 'completadas', { observacion: 'Motor principal' }),
    ];
    mockedService.obtenerSolicitudesListaPagina.mockResolvedValue(rows);

    const store = useSolicitudesCompraStore();
    await store.cargarInicial();

    await store.actualizarFiltro({ busqueda: 'motor' });

    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenCalledTimes(1);
    expect(store.items).toHaveLength(2);
    expect(store.items.every((item) => item.grupoListado === 'en_proceso')).toBe(true);

    await store.cambiarGrupoListado('completadas');

    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenCalledTimes(1);
    expect(store.items).toHaveLength(2);
    expect(store.items.every((item) => item.grupoListado === 'completadas')).toBe(true);
  });

  it('cargarMas expande solo resultados locales visibles', async () => {
    const rows = createRows(40, 1, 40, 'en_proceso');
    mockedService.obtenerSolicitudesListaPagina.mockResolvedValue(rows);

    const store = useSolicitudesCompraStore();
    await store.cargarInicial();

    expect(store.items).toHaveLength(25);

    await store.cargarMas();

    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenCalledTimes(1);
    expect(store.items).toHaveLength(40);
    expect(store.pagination.localVisibleCount).toBe(50);
    expect(store.pagination.hasMore).toBe(false);
  });

  it('recarga la base solo cuando cambian las fechas', async () => {
    const initialRows = createRows(3, 1, 3, 'en_proceso');
    const nextRows = createRows(2, 50, 2, 'completadas');
    mockedService.obtenerSolicitudesListaPagina
      .mockResolvedValueOnce(initialRows)
      .mockResolvedValueOnce(nextRows);

    const store = useSolicitudesCompraStore();
    await store.cargarInicial();
    await store.actualizarFiltro({ fechaDesde: '2026-01-01' });

    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenCalledTimes(2);
    expect(mockedService.obtenerSolicitudesListaPagina).toHaveBeenLastCalledWith(
      expect.objectContaining({
        p_fecha_desde: '2026-01-01',
        p_fecha_hasta: '2026-06-16',
        p_grupo_listado: null,
      })
    );
    expect(store.baseItems).toHaveLength(2);
    expect(store.items.every((item) => item.grupoListado === 'completadas')).toBe(true);
  });

  it('limpia seguimiento invalido al cambiar de grupo', async () => {
    const rows = [
      ...createRows(1, 1, 2, 'en_proceso'),
      ...createRows(1, 2, 2, 'completadas'),
    ];
    mockedService.obtenerSolicitudesListaPagina.mockResolvedValue(rows);

    const store = useSolicitudesCompraStore();
    await store.cargarInicial();
    await store.actualizarFiltro({ seguimientoCodigo: 'borrador' });

    expect(store.filters.seguimientoCodigo).toBe('borrador');

    await store.cambiarGrupoListado('completadas');

    expect(store.filters.seguimientoCodigo).toBeNull();
  });

  it('marca baseEmpty cuando no llegan solicitudes en el rango', async () => {
    mockedService.obtenerSolicitudesListaPagina.mockResolvedValue([]);

    const store = useSolicitudesCompraStore();
    await store.cargarInicial();

    expect(store.baseEmpty).toBe(true);
    expect(store.baseItems).toEqual([]);
    expect(store.items).toEqual([]);
    expect(store.pagination.totalCount).toBe(0);
    expect(store.pagination.hasMore).toBe(false);
  });

  it('mantiene el listado en vista reducida cuando falla la config remota', async () => {
    const rows = [
      ...createRows(1, 1, 2, 'en_proceso'),
      ...createRows(1, 2, 2, 'completadas'),
    ];
    mockedService.obtenerConfigListado.mockRejectedValue(new Error('config error'));
    mockedService.obtenerSolicitudesListaPagina.mockResolvedValue(rows);

    const store = useSolicitudesCompraStore();
    store.filters = {
      ...store.filters,
      seguimientoCodigo: 'borrador',
      soloCreadasPorMi: true,
      badgeDelegacionCodigo: 'correccion',
    };

    await store.cargarInicial();

    expect(store.configAvailable).toBe(false);
    expect(store.configLoadFailed).toBe(true);
    expect(store.configWarningToken).toBe(1);
    expect(store.filters.seguimientoCodigo).toBeNull();
    expect(store.filters.soloCreadasPorMi).toBe(false);
    expect(store.filters.badgeDelegacionCodigo).toBeNull();
    expect(store.items).toHaveLength(2);
  });

  it('mantiene el store libre de RPC directos, templates y clases Tailwind', () => {
    expect(storeSource).toContain("from './solicitudesCompra.service'");
    expect(storeSource).toContain("from './solicitudesCompra.mappers'");
    expect(storeSource).not.toContain('.rpc(');
    expect(storeSource).not.toContain('<template');
    expect(storeSource).not.toContain('class=');
    expect(storeSource).not.toContain('bg-');
    expect(storeSource).not.toContain('text-');
  });
});
