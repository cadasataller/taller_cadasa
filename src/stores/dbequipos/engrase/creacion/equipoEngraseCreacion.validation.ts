import {
  crearClaveNombreCreacion,
  normalizarCodigoCreacion,
  normalizarTextoCreacion,
} from "./equipoEngraseCreacion.draft";
import type {
  CatalogoDraftReference,
  CrearEquipoDraft,
  CrearEquipoPasoValidable,
  CrearEquipoSeccionError,
  CrearEquipoValidationIssue,
  CrearEquipoValidationResult,
  FiltroCreacionReference,
  TipoFiltroCreacionReference,
} from "./equipoEngraseCreacion.types";

const resultado = (errores: CrearEquipoValidationIssue[]): CrearEquipoValidationResult => ({
  valido: errores.length === 0,
  errores,
});

const agregarError = (
  errores: CrearEquipoValidationIssue[],
  codigo: string,
  mensaje: string,
  paso: CrearEquipoPasoValidable,
  seccion: CrearEquipoSeccionError,
  fieldId?: string,
): void => {
  errores.push({ codigo, mensaje, paso, seccion, ...(fieldId ? { fieldId } : {}) });
};

const esIdPositivo = (valor: number): boolean => Number.isInteger(valor) && valor > 0;

export function crearClaveCatalogoCreacion(
  referencia: CatalogoDraftReference,
): string {
  return referencia.estado === "existente"
    ? `id:${referencia.id}`
    : `nombre:${crearClaveNombreCreacion(referencia.nombre)}`;
}

export function crearClaveTipoFiltroCreacion(
  referencia: TipoFiltroCreacionReference,
): string {
  return crearClaveCatalogoCreacion(referencia);
}

export function crearClaveSistemaCreacion(
  referencia: CatalogoDraftReference,
): string {
  return crearClaveCatalogoCreacion(referencia);
}

export function puedeSolicitarValidacionCodigo(codigo: string): boolean {
  return normalizarCodigoCreacion(codigo).length > 4;
}

export function validacionCorrespondeAlCodigoActual(
  draft: CrearEquipoDraft,
): boolean {
  return draft.validacionCodigo.estado === "valido"
    && draft.validacionCodigo.codigo === normalizarCodigoCreacion(draft.datos.codigo);
}

const referenciaCatalogoValida = (referencia: CatalogoDraftReference): boolean =>
  referencia.estado === "existente"
    ? esIdPositivo(referencia.id) && normalizarTextoCreacion(referencia.nombre).length > 0
    : referencia.tempId.trim().length > 0 && normalizarTextoCreacion(referencia.nombre).length > 0;

const filtroValido = (referencia: FiltroCreacionReference): boolean =>
  referencia.estado === "existente"
    ? esIdPositivo(referencia.id) && normalizarCodigoCreacion(referencia.codigo).length > 0
    : referencia.tempId.trim().length > 0 && normalizarCodigoCreacion(referencia.codigo).length > 0;

export function validarPasoDatosEquipo(
  draft: CrearEquipoDraft,
): CrearEquipoValidationResult {
  const errores: CrearEquipoValidationIssue[] = [];
  const codigo = normalizarCodigoCreacion(draft.datos.codigo);

  if (!codigo) {
    agregarError(errores, "CODIGO_EQUIPO_REQUERIDO", "El código del equipo es obligatorio.", 1, "datos", "equipo-creacion-codigo");
  } else if (!puedeSolicitarValidacionCodigo(codigo)) {
    agregarError(errores, "CODIGO_EQUIPO_LONGITUD_INSUFICIENTE", "El código debe tener más de cuatro caracteres para validarse.", 1, "datos", "equipo-creacion-codigo");
  } else if (draft.validacionCodigo.estado === "idle") {
    agregarError(errores, "CODIGO_EQUIPO_PENDIENTE_VALIDACION", "Valida el código antes de continuar.", 1, "datos", "equipo-creacion-codigo");
  } else if (draft.validacionCodigo.estado === "loading") {
    agregarError(errores, "CODIGO_EQUIPO_VALIDANDO", "La validación del código está en curso.", 1, "datos", "equipo-creacion-codigo");
  } else if (draft.validacionCodigo.estado === "invalido") {
    agregarError(errores, "EQUIPO_YA_EXISTE_EN_ENGRASE", "Este código ya existe en Engrase.", 1, "datos", "equipo-creacion-codigo");
  } else if (draft.validacionCodigo.estado === "error") {
    agregarError(errores, "VALIDACION_CODIGO_FALLIDA", "No se pudo validar el código. Intenta nuevamente.", 1, "datos", "equipo-creacion-codigo");
  } else if (!validacionCorrespondeAlCodigoActual(draft)) {
    agregarError(errores, "VALIDACION_CODIGO_OBSOLETA", "El código cambió desde la última validación.", 1, "datos", "equipo-creacion-codigo");
  }

  const tipoEquipo = draft.datos.tipoEquipo;
  if (tipoEquipo === null) {
    agregarError(errores, "TIPO_EQUIPO_REQUERIDO", "Selecciona o crea un tipo de equipo.", 1, "datos", "equipo-creacion-tipo");
  } else if (!referenciaCatalogoValida(tipoEquipo)) {
    agregarError(errores, "TIPO_EQUIPO_NOMBRE_REQUERIDO", "El tipo de equipo debe tener un nombre válido.", 1, "datos", "equipo-creacion-tipo");
  }
  if (!normalizarTextoCreacion(draft.datos.subtipo)) {
    agregarError(errores, "SUBTIPO_EQUIPO_REQUERIDO", "El modelo o subtipo es obligatorio.", 1, "datos", "equipo-creacion-subtipo");
  }
  if (draft.datos.etapas.length === 0) {
    agregarError(errores, "ETAPA_MINIMA_REQUERIDA", "Selecciona al menos una etapa.", 1, "etapas", "equipo-creacion-etapas");
  }
  const etapas = new Set<number>();
  draft.datos.etapas.forEach((etapa) => {
    if (!esIdPositivo(etapa.id)) {
      agregarError(errores, "ETAPA_INVALIDA", "Hay una etapa seleccionada que no es válida.", 1, "etapas", "equipo-creacion-etapas");
    } else if (etapas.has(etapa.id)) {
      agregarError(errores, "ETAPA_DUPLICADA", "Una etapa no puede seleccionarse más de una vez.", 1, "etapas", "equipo-creacion-etapas");
    }
    etapas.add(etapa.id);
  });
  if (draft.datos.estado !== "activo" && draft.datos.estado !== "descartado") {
    agregarError(errores, "ESTADO_EQUIPO_INVALIDO", "El estado del equipo no es válido.", 1, "datos", "equipo-creacion-estado");
  }
  return resultado(errores);
}

export function validarPasoFiltrosEquipo(
  draft: CrearEquipoDraft,
): CrearEquipoValidationResult {
  const errores: CrearEquipoValidationIssue[] = [];
  if (draft.filtros.length === 0) {
    agregarError(errores, "FILTRO_MINIMO_REQUERIDO", "Agrega al menos un filtro.", 2, "filtros");
  }
  const draftIds = new Set<string>();
  const tipos = new Set<string>();
  draft.filtros.forEach((asignacion) => {
    if (!asignacion.draftId.trim()) agregarError(errores, "FILTRO_DRAFT_ID_INVALIDO", "La asignación de filtro no tiene una identidad temporal válida.", 2, "filtros");
    else if (draftIds.has(asignacion.draftId)) agregarError(errores, "FILTRO_DRAFT_ID_DUPLICADO", "Hay dos asignaciones de filtro con la misma identidad temporal.", 2, "filtros");
    draftIds.add(asignacion.draftId);
    if (!referenciaCatalogoValida(asignacion.tipoFiltro)) agregarError(errores, "TIPO_FILTRO_INVALIDO", "El tipo de filtro no es válido.", 2, "filtros");
    if (!filtroValido(asignacion.filtro)) agregarError(errores, "FILTRO_INVALIDO", "El filtro no es válido.", 2, "filtros");
    if (!Number.isInteger(asignacion.cantidad) || !Number.isFinite(asignacion.cantidad) || asignacion.cantidad <= 0) agregarError(errores, "CANTIDAD_FILTRO_INVALIDA", "La cantidad del filtro debe ser un entero mayor que cero.", 2, "filtros");
    const clave = crearClaveTipoFiltroCreacion(asignacion.tipoFiltro);
    if (tipos.has(clave)) agregarError(errores, "TIPO_FILTRO_DUPLICADO", "Sólo puede existir un filtro por tipo dentro del equipo.", 2, "filtros");
    tipos.add(clave);
  });
  return resultado(errores);
}

export function validarPasoAceitesEquipo(
  draft: CrearEquipoDraft,
): CrearEquipoValidationResult {
  const errores: CrearEquipoValidationIssue[] = [];
  const draftIds = new Set<string>();
  const sistemas = new Set<string>();
  draft.aceites.forEach((asignacion) => {
    if (!asignacion.draftId.trim()) agregarError(errores, "ACEITE_DRAFT_ID_INVALIDO", "La asignación de aceite no tiene una identidad temporal válida.", 3, "aceites");
    else if (draftIds.has(asignacion.draftId)) agregarError(errores, "ACEITE_DRAFT_ID_DUPLICADO", "Hay dos asignaciones de aceite con la misma identidad temporal.", 3, "aceites");
    draftIds.add(asignacion.draftId);
    if (!referenciaCatalogoValida(asignacion.sistema)) agregarError(errores, "SISTEMA_ACEITE_INVALIDO", "El sistema de aceite no es válido.", 3, "aceites");
    if (!referenciaCatalogoValida(asignacion.aceite)) agregarError(errores, "ACEITE_INVALIDO", "El aceite no es válido.", 3, "aceites");
    const clave = crearClaveSistemaCreacion(asignacion.sistema);
    if (sistemas.has(clave)) agregarError(errores, "SISTEMA_ACEITE_DUPLICADO", "Sólo puede existir un aceite por sistema dentro del equipo.", 3, "aceites");
    sistemas.add(clave);
  });
  return resultado(errores);
}

export function validarCreacionEquipoCompleta(
  draft: CrearEquipoDraft,
): CrearEquipoValidationResult {
  const errores: CrearEquipoValidationIssue[] = [];
  errores.push(
    ...validarPasoDatosEquipo(draft).errores,
    ...validarPasoFiltrosEquipo(draft).errores,
    ...validarPasoAceitesEquipo(draft).errores,
  );
  if (draft.equipoCreado !== null) agregarError(errores, "EQUIPO_YA_CREADO", "El equipo ya fue creado.", 4, "general");
  const mensajes = new Set<string>();
  return resultado(errores.filter((error) => {
    if (mensajes.has(error.mensaje)) return false;
    mensajes.add(error.mensaje);
    return true;
  }));
}
