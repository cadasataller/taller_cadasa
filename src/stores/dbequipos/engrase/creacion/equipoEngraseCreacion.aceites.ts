import { crearTempId, crearClaveNombreCreacion, normalizarTextoCreacion } from "./equipoEngraseCreacion.draft";
import { crearClaveSistemaCreacion } from "./equipoEngraseCreacion.validation";
import type {
  AgregarAceiteCreacionInput,
  CatalogoDraftReference,
  CatalogoTemporalReference,
  CrearEquipoAceiteDraft,
  EditarAceiteCreacionInput,
  OpcionSistemaAceiteCreacion,
  ResumenAceiteCreacion,
  ResultadoMutacionAceiteCreacion,
} from "./equipoEngraseCreacion.types";

const copiarReferencia = (referencia: CatalogoDraftReference): CatalogoDraftReference => ({ ...referencia });

const esReferenciaValida = (referencia: CatalogoDraftReference): boolean =>
  referencia.estado === "existente"
    ? Number.isInteger(referencia.id) && referencia.id > 0 && Boolean(normalizarTextoCreacion(referencia.nombre))
    : Boolean(referencia.tempId.trim()) && Boolean(normalizarTextoCreacion(referencia.nombre));

export function estaSistemaOcupado(
  sistema: CatalogoDraftReference,
  asociaciones: readonly CrearEquipoAceiteDraft[],
  excludeDraftId?: string,
): boolean {
  const clave = crearClaveSistemaCreacion(sistema);
  return asociaciones.some((asociacion) =>
    asociacion.draftId !== excludeDraftId && crearClaveSistemaCreacion(asociacion.sistema) === clave,
  );
}

export function crearOpcionesSistemaAceiteCreacion(
  sistemas: readonly CatalogoDraftReference[],
  asociaciones: readonly CrearEquipoAceiteDraft[],
  excludeDraftId?: string,
): OpcionSistemaAceiteCreacion[] {
  return sistemas.map((referencia) => {
    const asignado = estaSistemaOcupado(referencia, asociaciones, excludeDraftId);
    return { referencia: copiarReferencia(referencia), asignado, disabled: asignado, badge: asignado ? "Asignado" : null };
  });
}

function obtenerTemporales(
  asociaciones: readonly CrearEquipoAceiteDraft[],
  selector: (asociacion: CrearEquipoAceiteDraft) => CatalogoDraftReference,
): CatalogoTemporalReference[] {
  const vistos = new Set<string>();
  return asociaciones.flatMap((asociacion) => {
    const referencia = selector(asociacion);
    if (referencia.estado !== "nuevo") return [];
    const clave = crearClaveNombreCreacion(referencia.nombre);
    if (vistos.has(clave)) return [];
    vistos.add(clave);
    return [{ ...referencia }];
  });
}

export const obtenerSistemasTemporales = (asociaciones: readonly CrearEquipoAceiteDraft[]): CatalogoTemporalReference[] =>
  obtenerTemporales(asociaciones, (asociacion) => asociacion.sistema);

export const obtenerAceitesTemporales = (asociaciones: readonly CrearEquipoAceiteDraft[]): CatalogoTemporalReference[] =>
  obtenerTemporales(asociaciones, (asociacion) => asociacion.aceite);

function crearReferenciaTemporal(
  nombre: string,
  catalogo: readonly CatalogoDraftReference[],
  temporales: readonly CatalogoTemporalReference[],
  tipo: "sistema_aceite" | "aceite",
): CatalogoDraftReference | null {
  const nombreNormalizado = normalizarTextoCreacion(nombre);
  const clave = crearClaveNombreCreacion(nombreNormalizado);
  if (!clave) return null;
  const existente = catalogo.find((referencia) => crearClaveNombreCreacion(referencia.nombre) === clave)
    ?? temporales.find((referencia) => crearClaveNombreCreacion(referencia.nombre) === clave);
  return existente ? copiarReferencia(existente) : { estado: "nuevo", id: null, tempId: crearTempId(tipo), nombre: nombreNormalizado };
}

export function crearSistemaTemporal(
  nombre: string,
  sistemasCatalogo: readonly CatalogoDraftReference[],
  asociaciones: readonly CrearEquipoAceiteDraft[],
): CatalogoDraftReference | null {
  return crearReferenciaTemporal(nombre, sistemasCatalogo, obtenerSistemasTemporales(asociaciones), "sistema_aceite");
}

export function crearAceiteTemporal(
  nombre: string,
  aceitesCatalogo: readonly CatalogoDraftReference[],
  asociaciones: readonly CrearEquipoAceiteDraft[],
): CatalogoDraftReference | null {
  return crearReferenciaTemporal(nombre, aceitesCatalogo, obtenerAceitesTemporales(asociaciones), "aceite");
}

function validarAsociacion(
  input: AgregarAceiteCreacionInput,
  asociaciones: readonly CrearEquipoAceiteDraft[],
): Exclude<ResultadoMutacionAceiteCreacion, { ok: true }> | null {
  if (!esReferenciaValida(input.sistema)) return { ok: false, codigo: "SISTEMA_ACEITE_INVALIDO", mensaje: "El sistema de aceite no es válido." };
  if (!esReferenciaValida(input.aceite)) return { ok: false, codigo: "ACEITE_INVALIDO", mensaje: "El aceite no es válido." };
  if (estaSistemaOcupado(input.sistema, asociaciones)) return { ok: false, codigo: "SISTEMA_ACEITE_DUPLICADO", mensaje: "Este equipo ya tiene un aceite asociado a ese sistema." };
  return null;
}

export function agregarAceiteLocal(
  input: AgregarAceiteCreacionInput,
  asociaciones: readonly CrearEquipoAceiteDraft[],
): { resultado: ResultadoMutacionAceiteCreacion; asociaciones: CrearEquipoAceiteDraft[] } {
  const error = validarAsociacion(input, asociaciones);
  if (error) return { resultado: error, asociaciones: [...asociaciones] };
  const draftId = crearTempId("equipo_aceite");
  return {
    resultado: { ok: true, draftId },
    asociaciones: [...asociaciones, { draftId, sistema: copiarReferencia(input.sistema), aceite: copiarReferencia(input.aceite) }],
  };
}

export function actualizarAceiteLocal(
  input: EditarAceiteCreacionInput,
  asociaciones: readonly CrearEquipoAceiteDraft[],
): { resultado: ResultadoMutacionAceiteCreacion; asociaciones: CrearEquipoAceiteDraft[] } {
  const actual = asociaciones.find((asociacion) => asociacion.draftId === input.draftId);
  if (!actual) return { resultado: { ok: false, codigo: "ASOCIACION_ACEITE_NO_ENCONTRADA", mensaje: "No se encontró la asociación de aceite." }, asociaciones: [...asociaciones] };
  const error = validarAsociacion(input, asociaciones.filter((asociacion) => asociacion.draftId !== input.draftId));
  if (error) return { resultado: error, asociaciones: [...asociaciones] };
  return {
    resultado: { ok: true, draftId: actual.draftId },
    asociaciones: asociaciones.map((asociacion) => asociacion.draftId === input.draftId
      ? { draftId: asociacion.draftId, sistema: copiarReferencia(input.sistema), aceite: copiarReferencia(input.aceite) }
      : { draftId: asociacion.draftId, sistema: copiarReferencia(asociacion.sistema), aceite: copiarReferencia(asociacion.aceite) }),
  };
}

export function crearResumenAceitesCreacion(
  asociaciones: readonly CrearEquipoAceiteDraft[],
): ResumenAceiteCreacion[] {
  return asociaciones.map((asociacion) => ({
    draftId: asociacion.draftId,
    sistema: normalizarTextoCreacion(asociacion.sistema.nombre),
    aceite: normalizarTextoCreacion(asociacion.aceite.nombre),
    sistemaNuevo: asociacion.sistema.estado === "nuevo",
    aceiteNuevo: asociacion.aceite.estado === "nuevo",
  }));
}
