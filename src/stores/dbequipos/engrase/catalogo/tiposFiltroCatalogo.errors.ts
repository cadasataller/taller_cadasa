export type CatalogoTiposFiltroErrorCode =
  | "AUTENTICACION_REQUERIDA"
  | "PAYLOAD_INVALIDO"
  | "REGISTRO_NO_ENCONTRADO"
  | "TIPO_FILTRO_NOMBRE_REQUERIDO"
  | "TIPO_FILTRO_NOMBRE_DUPLICADO"
  | "TIPO_FILTRO_NO_ENCONTRADO"
  | "RESPUESTA_INVALIDA"
  | "TRANSPORTE"
  | "DESCONOCIDO";

const KNOWN_CODES: readonly CatalogoTiposFiltroErrorCode[] = [
  "AUTENTICACION_REQUERIDA",
  "PAYLOAD_INVALIDO",
  "REGISTRO_NO_ENCONTRADO",
  "TIPO_FILTRO_NOMBRE_REQUERIDO",
  "TIPO_FILTRO_NOMBRE_DUPLICADO",
  "TIPO_FILTRO_NO_ENCONTRADO",
];

const UI_MESSAGES: Record<CatalogoTiposFiltroErrorCode, string> = {
  AUTENTICACION_REQUERIDA: "Tu sesión ya no es válida. Inicia sesión nuevamente.",
  PAYLOAD_INVALIDO: "No se pudieron validar los datos enviados.",
  REGISTRO_NO_ENCONTRADO: "El registro ya no existe o fue modificado.",
  TIPO_FILTRO_NOMBRE_REQUERIDO: "Ingresa un nombre para mostrar.",
  TIPO_FILTRO_NOMBRE_DUPLICADO: "Ya existe un tipo de filtro con ese nombre.",
  TIPO_FILTRO_NO_ENCONTRADO: "El tipo de filtro ya no está disponible. Actualiza el listado.",
  RESPUESTA_INVALIDA: "La respuesta del catálogo no tiene el formato esperado.",
  TRANSPORTE: "No fue posible comunicarse con el catálogo.",
  DESCONOCIDO: "No se pudo guardar el tipo de filtro. Intenta nuevamente.",
};

export class CatalogoTiposFiltroError extends Error {
  constructor(
    public readonly codigo: CatalogoTiposFiltroErrorCode,
    message = UI_MESSAGES[codigo],
  ) {
    super(message);
    this.name = "CatalogoTiposFiltroError";
  }
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return [record.code, record.message, record.details, record.hint]
      .filter((part): part is string => typeof part === "string")
      .join(" ");
  }
  return "";
}

export function normalizarCatalogoTiposFiltroError(
  error: unknown,
  fallback: CatalogoTiposFiltroErrorCode = "DESCONOCIDO",
): CatalogoTiposFiltroError {
  if (error instanceof CatalogoTiposFiltroError) return error;
  const text = stringifyUnknown(error);
  const codigo = KNOWN_CODES.find((known) => text.includes(known)) ?? fallback;
  return new CatalogoTiposFiltroError(codigo);
}

export function mensajeCatalogoTiposFiltroError(
  error: CatalogoTiposFiltroError | null,
): string | null {
  return error?.message ?? null;
}
