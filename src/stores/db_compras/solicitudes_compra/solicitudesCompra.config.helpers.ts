import type {
  SolicitudCompraListConfigAlcance,
  SolicitudCompraListConfigBadgeDelegacion,
  SolicitudCompraListConfigGrupo,
  SolicitudCompraListConfigRpc,
  SolicitudCompraListConfigSeguimiento,
} from './solicitudesCompra.config.types';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraGrupoOption,
  SolicitudCompraSeguimientoFilterOption,
} from './solicitudesCompra.types';

const GROUP_ORDER: SolicitudCompraGrupoListado[] = [
  'en_proceso',
  'completadas',
  'descartadas',
];

const isGrupoListado = (value: unknown): value is SolicitudCompraGrupoListado =>
  typeof value === 'string' && GROUP_ORDER.includes(value as SolicitudCompraGrupoListado);

const toText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const toTextArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
      .map((item) => toText(item))
      .filter((item): item is string => item !== null)
    : [];

const normalizeSeguimiento = (
  value: unknown
): SolicitudCompraListConfigSeguimiento | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const codigo = toText(raw.codigo);
  const label = toText(raw.label);

  if (!codigo || !label) {
    return null;
  }

  return {
    codigo,
    label,
    origen: toText(raw.origen),
    fecha_label: toText(raw.fecha_label),
    aplica_alcance_codigo: toText(raw.aplica_alcance_codigo),
    aplica_alcance_codigos: toTextArray(raw.aplica_alcance_codigos),
    visible_en_filtro: raw.visible_en_filtro !== false,
  };
};

const normalizeGrupo = (value: unknown): SolicitudCompraListConfigGrupo | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const codigo = raw.codigo;

  if (!isGrupoListado(codigo)) {
    return null;
  }

  const seguimientos = Array.isArray(raw.seguimientos)
    ? raw.seguimientos
      .map(normalizeSeguimiento)
      .filter((item): item is SolicitudCompraListConfigSeguimiento => item !== null)
    : [];

  return {
    codigo,
    label: toText(raw.label) ?? codigo,
    visible: raw.visible !== false,
    seguimientos,
  };
};

const normalizeBadgeDelegacion = (
  value: unknown
): SolicitudCompraListConfigBadgeDelegacion | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const codigo = toText(raw.codigo);
  const label = toText(raw.label);

  if (!codigo || !label) {
    return null;
  }

  return {
    codigo,
    label,
    tipo_delegacion: toText(raw.tipo_delegacion),
  };
};

const normalizeAlcance = (value: unknown): SolicitudCompraListConfigAlcance | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const codigo = toText(raw.codigo);

  if (!codigo) {
    return null;
  }

  return {
    codigo,
    descripcion: toText(raw.descripcion),
  };
};

export const normalizeSolicitudCompraListConfig = (
  value: unknown
): SolicitudCompraListConfigRpc | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const viewer = raw.viewer && typeof raw.viewer === 'object'
    ? raw.viewer as Record<string, unknown>
    : {};

  const grupos = Array.isArray(raw.grupos)
    ? raw.grupos
      .map(normalizeGrupo)
      .filter((item): item is SolicitudCompraListConfigGrupo => item !== null)
      .sort((a, b) => GROUP_ORDER.indexOf(a.codigo) - GROUP_ORDER.indexOf(b.codigo))
    : [];

  const badgesDelegacion = Array.isArray(raw.badges_delegacion)
    ? raw.badges_delegacion
      .map(normalizeBadgeDelegacion)
      .filter((item): item is SolicitudCompraListConfigBadgeDelegacion => item !== null)
    : [];
  const alcances = Array.isArray(raw.alcances)
    ? raw.alcances
      .map(normalizeAlcance)
      .filter((item): item is SolicitudCompraListConfigAlcance => item !== null)
    : [];

  return {
    viewer: {
      email: toText(viewer.email),
      role_codigo: toText(viewer.role_codigo),
      area_codigo: toText(viewer.area_codigo),
    },
    alcances,
    grupos,
    badges_delegacion: badgesDelegacion,
  };
};

export const getVisibleSolicitudCompraGroups = (
  config: SolicitudCompraListConfigRpc | null
): SolicitudCompraListConfigGrupo[] =>
  config?.grupos.filter((grupo) => grupo.visible) ?? [];

export const getSolicitudCompraGroupOptions = (
  groups: SolicitudCompraListConfigGrupo[]
): SolicitudCompraGrupoOption[] =>
  groups.map((grupo) => ({
    value: grupo.codigo,
    label: grupo.label,
  }));

export const getSeguimientoOptionsForGrupo = (
  groups: SolicitudCompraListConfigGrupo[],
  grupoCodigo: SolicitudCompraGrupoListado
): SolicitudCompraSeguimientoFilterOption[] => {
  const group = groups.find((item) => item.codigo === grupoCodigo);

  if (!group) {
    return [];
  }

  return [
    { value: null, label: 'Todos seguimientos' },
    ...group.seguimientos
      .filter((seguimiento) => seguimiento.visible_en_filtro)
      .map((seguimiento) => ({
        value: seguimiento.codigo,
        label: seguimiento.label,
      })),
  ];
};

export const isSeguimientoAllowedForGrupo = (
  groups: SolicitudCompraListConfigGrupo[],
  grupoCodigo: SolicitudCompraGrupoListado,
  seguimientoCodigo: string | null
): boolean => {
  if (!seguimientoCodigo) {
    return true;
  }

  return getSeguimientoOptionsForGrupo(groups, grupoCodigo)
    .some((option) => option.value === seguimientoCodigo);
};
