import { crearTempId, crearClaveNombreCreacion, normalizarCodigoCreacion, normalizarTextoCreacion } from "./equipoEngraseCreacion.draft";
import { crearClaveTipoFiltroCreacion } from "./equipoEngraseCreacion.validation";
import type {
  AgregarFiltroExistenteCreacionInput,
  AgregarFiltroTemporalCreacionInput,
  CrearEquipoFiltroDraft,
  EditarFiltroCreacionInput,
  EstadoCodigoFiltroEnBorrador,
  FiltroCreacionReference,
  FiltroExistenteCreacionReference,
  FiltroNuevoCreacionReference,
  OpcionTipoFiltroCreacion,
  ResultadoMutacionFiltroCreacion,
  SugerenciaCodigoFiltroCreacion,
  TipoFiltroBusquedaCreacion,
  TipoFiltroCreacionReference,
} from "./equipoEngraseCreacion.types";
import type { FiltroOriginal, TipoFiltroPosible } from "../edicion/equipoEngraseEdicion.types";

const copiarTipo = (tipo: TipoFiltroCreacionReference): TipoFiltroCreacionReference => ({ ...tipo });
const copiarFiltro = (filtro: FiltroCreacionReference): FiltroCreacionReference => ({ ...filtro });

const esTipoValido = (tipo: TipoFiltroCreacionReference): boolean =>
  tipo.estado === "existente"
    ? Number.isInteger(tipo.id) && tipo.id > 0 && Boolean(normalizarTextoCreacion(tipo.nombre))
    : Boolean(tipo.tempId.trim()) && Boolean(normalizarTextoCreacion(tipo.nombre));

const esFiltroValido = (filtro: FiltroCreacionReference): boolean =>
  filtro.estado === "existente"
    ? Number.isInteger(filtro.id) && filtro.id > 0 && Boolean(normalizarCodigoCreacion(filtro.codigo))
    : Boolean(filtro.tempId.trim()) && Boolean(normalizarCodigoCreacion(filtro.codigo));

export function normalizarCantidadFiltro(valor: number): number | null {
  return Number.isFinite(valor) && Number.isInteger(valor) && valor >= 1 ? valor : null;
}

export const incrementarCantidadFiltro = (valor: number): number =>
  normalizarCantidadFiltro(valor) === null ? 1 : valor + 1;

export const disminuirCantidadFiltro = (valor: number): number =>
  normalizarCantidadFiltro(valor) === null ? 1 : Math.max(1, valor - 1);

export function estaTipoFiltroOcupado(
  tipo: TipoFiltroCreacionReference,
  filtros: readonly CrearEquipoFiltroDraft[],
  excludeDraftId?: string,
): boolean {
  const clave = crearClaveTipoFiltroCreacion(tipo);
  return filtros.some((filtro) => filtro.draftId !== excludeDraftId && crearClaveTipoFiltroCreacion(filtro.tipoFiltro) === clave);
}

export function obtenerEstadoCodigoFiltro(
  codigo: string,
  filtros: readonly CrearEquipoFiltroDraft[],
  excludeDraftId?: string,
): EstadoCodigoFiltroEnBorrador {
  const codigoNormalizado = normalizarCodigoCreacion(codigo);
  const asignaciones = filtros.filter((filtro) =>
    filtro.draftId !== excludeDraftId && normalizarCodigoCreacion(filtro.filtro.codigo) === codigoNormalizado,
  );
  return {
    codigo: codigoNormalizado,
    asignado: asignaciones.length > 0,
    cantidadAsignaciones: asignaciones.length,
    tiposAsignados: asignaciones.map((filtro) => ({
      clave: crearClaveTipoFiltroCreacion(filtro.tipoFiltro),
      nombre: filtro.tipoFiltro.nombre,
    })),
  };
}

export function crearOpcionesTipoFiltroCreacion(
  tipos: readonly TipoFiltroCreacionReference[],
  filtros: readonly CrearEquipoFiltroDraft[],
  excludeDraftId?: string,
): OpcionTipoFiltroCreacion[] {
  return tipos.map((referencia) => {
    const asignado = estaTipoFiltroOcupado(referencia, filtros, excludeDraftId);
    return { referencia: copiarTipo(referencia), asignado, disabled: asignado, badge: asignado ? "Asignado" : null };
  });
}

export function buscarReferenciaFiltroTemporalPorCodigo(
  codigo: string,
  filtros: readonly CrearEquipoFiltroDraft[],
): FiltroNuevoCreacionReference | null {
  const codigoNormalizado = normalizarCodigoCreacion(codigo);
  const encontrado = filtros.find((item) =>
    item.filtro.estado === "nuevo" && normalizarCodigoCreacion(item.filtro.codigo) === codigoNormalizado,
  )?.filtro;
  return encontrado?.estado === "nuevo" ? { ...encontrado } : null;
}

export function crearFiltroTemporal(
  codigo: string,
  estaEnListaCompras: boolean,
  filtros: readonly CrearEquipoFiltroDraft[],
): FiltroNuevoCreacionReference | null {
  const codigoNormalizado = normalizarCodigoCreacion(codigo);
  if (!codigoNormalizado) return null;
  const existente = buscarReferenciaFiltroTemporalPorCodigo(codigoNormalizado, filtros);
  if (existente) return existente.estaEnListaCompras === estaEnListaCompras ? existente : null;
  return { estado: "nuevo", id: null, tempId: crearTempId("filtro"), codigo: codigoNormalizado, estaEnListaCompras };
}

export function crearTipoFiltroTemporal(
  nombre: string,
  tiposCatalogo: readonly TipoFiltroCreacionReference[],
  filtros: readonly CrearEquipoFiltroDraft[],
): TipoFiltroCreacionReference | null {
  const nombreNormalizado = normalizarTextoCreacion(nombre);
  const clave = crearClaveNombreCreacion(nombreNormalizado);
  if (!clave) return null;
  const existente = tiposCatalogo.find((tipo) => crearClaveNombreCreacion(tipo.nombre) === clave)
    ?? filtros.map((filtro) => filtro.tipoFiltro).find((tipo) => crearClaveNombreCreacion(tipo.nombre) === clave);
  return existente ? copiarTipo(existente) : { estado: "nuevo", id: null, tempId: crearTempId("tipo_filtro"), nombre: nombreNormalizado };
}

function validarAlta(
  filtro: FiltroCreacionReference,
  tipoFiltro: TipoFiltroCreacionReference,
  cantidad: number,
  filtros: readonly CrearEquipoFiltroDraft[],
): Exclude<ResultadoMutacionFiltroCreacion, { ok: true }> | null {
  if (!esFiltroValido(filtro) || !esTipoValido(tipoFiltro)) return { ok: false, codigo: "FILTRO_INVALIDO", mensaje: "El filtro o su tipo no son válidos." };
  if (normalizarCantidadFiltro(cantidad) === null) return { ok: false, codigo: "CANTIDAD_FILTRO_INVALIDA", mensaje: "La cantidad debe ser un entero mayor que cero." };
  if (estaTipoFiltroOcupado(tipoFiltro, filtros)) return { ok: false, codigo: "TIPO_FILTRO_DUPLICADO", mensaje: "Sólo puede existir un filtro por tipo dentro del equipo." };
  return null;
}

export function agregarFiltroExistenteLocal(
  input: AgregarFiltroExistenteCreacionInput,
  filtros: readonly CrearEquipoFiltroDraft[],
): { resultado: ResultadoMutacionFiltroCreacion; filtros: CrearEquipoFiltroDraft[] } {
  return agregarFiltroLocal(input, filtros);
}

export function agregarFiltroLocal(
  input: AgregarFiltroTemporalCreacionInput,
  filtros: readonly CrearEquipoFiltroDraft[],
): { resultado: ResultadoMutacionFiltroCreacion; filtros: CrearEquipoFiltroDraft[] } {
  const error = validarAlta(input.filtro, input.tipoFiltro, input.cantidad, filtros);
  if (error) return { resultado: error, filtros: [...filtros] };
  const draftId = crearTempId("equipo_filtro");
  return {
    resultado: { ok: true, draftId },
    filtros: [...filtros, { draftId, filtro: copiarFiltro(input.filtro), tipoFiltro: copiarTipo(input.tipoFiltro), cantidad: input.cantidad }],
  };
}

export function actualizarFiltroLocal(
  input: EditarFiltroCreacionInput,
  filtros: readonly CrearEquipoFiltroDraft[],
): { resultado: ResultadoMutacionFiltroCreacion; filtros: CrearEquipoFiltroDraft[] } {
  const actual = filtros.find((filtro) => filtro.draftId === input.draftId);
  if (!actual) return { resultado: { ok: false, codigo: "FILTRO_NO_ENCONTRADO", mensaje: "No se encontró el filtro a editar." }, filtros: [...filtros] };
  const error = validarAlta(actual.filtro, input.tipoFiltro, input.cantidad, filtros.filter((filtro) => filtro.draftId !== input.draftId));
  if (error) return { resultado: error, filtros: [...filtros] };
  return {
    resultado: { ok: true, draftId: actual.draftId },
    filtros: filtros.map((filtro) => filtro.draftId === input.draftId
      ? { ...filtro, tipoFiltro: copiarTipo(input.tipoFiltro), cantidad: input.cantidad }
      : { ...filtro, filtro: copiarFiltro(filtro.filtro), tipoFiltro: copiarTipo(filtro.tipoFiltro) }),
  };
}

export function combinarSugerenciasFiltroCreacion(
  remotas: readonly FiltroOriginal[],
  filtros: readonly CrearEquipoFiltroDraft[],
  query: string,
): SugerenciaCodigoFiltroCreacion[] {
  const claveQuery = normalizarCodigoCreacion(query);
  const resultado = new Map<string, SugerenciaCodigoFiltroCreacion>();
  const agregar = (codigo: string, id: number | null, estaEnListaCompras: boolean, origen: "rpc" | "borrador") => {
    const clave = normalizarCodigoCreacion(codigo);
    if (!clave.includes(claveQuery)) return;
    const estado = obtenerEstadoCodigoFiltro(codigo, filtros);
    const anterior = resultado.get(clave);
    if (!anterior || origen === "rpc") resultado.set(clave, { origen, id, codigo, estaEnListaCompras, asignado: estado.asignado, cantidadAsignaciones: estado.cantidadAsignaciones });
  };
  remotas.forEach((filtro) => agregar(filtro.codigo, filtro.id, filtro.estaEnListaCompras, "rpc"));
  filtros.forEach((filtro) => agregar(filtro.filtro.codigo, filtro.filtro.estado === "existente" ? filtro.filtro.id : null, filtro.filtro.estaEnListaCompras, "borrador"));
  return [...resultado.values()].sort((a, b) => a.codigo.localeCompare(b.codigo, "es"));
}

export function combinarTiposFiltroBusquedaCreacion(
  tiposCatalogo: readonly TipoFiltroCreacionReference[],
  tiposPosibles: readonly TipoFiltroPosible[],
  filtros: readonly CrearEquipoFiltroDraft[],
  excludeDraftId?: string,
): TipoFiltroBusquedaCreacion[] {
  const sugeridos = new Set(tiposPosibles.map((tipo) => tipo.tipoFiltro.id));
  return tiposCatalogo.filter((tipo) => tipo.estado === "existente").map<TipoFiltroBusquedaCreacion>((tipo) => {
    const posible = tiposPosibles.find((item) => item.tipoFiltro.id === tipo.id);
    const asignadoEnBorrador = estaTipoFiltroOcupado(tipo, filtros, excludeDraftId);
    return { tipoFiltro: { id: tipo.id, nombre: tipo.nombre }, tiposEquipoQueLoUsan: posible ? [...posible.tiposEquipoQueLoUsan] : [], sugeridoPorCodigo: sugeridos.has(tipo.id), asignadoEnBorrador, disabled: asignadoEnBorrador, badge: asignadoEnBorrador ? "Asignado" : null };
  }).sort((a, b) => Number(b.sugeridoPorCodigo) - Number(a.sugeridoPorCodigo) || Number(a.disabled) - Number(b.disabled) || a.tipoFiltro.nombre.localeCompare(b.tipoFiltro.nombre, "es"));
}
