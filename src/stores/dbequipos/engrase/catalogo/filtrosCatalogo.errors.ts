export type CatalogoFiltrosErrorCode =
  | "AUTENTICACION_REQUERIDA"
  | "PAYLOAD_INVALIDO"
  | "REGISTRO_NO_ENCONTRADO"
  | "CODIGO_FILTRO_REQUERIDO"
  | "CODIGO_FILTRO_DUPLICADO"
  | "FILTRO_NO_ENCONTRADO"
  | "RESPUESTA_INVALIDA"
  | "TRANSPORTE"
  | "DESCONOCIDO";

const KNOWN_CODES: readonly CatalogoFiltrosErrorCode[] = [
  "AUTENTICACION_REQUERIDA", "PAYLOAD_INVALIDO", "REGISTRO_NO_ENCONTRADO",
  "CODIGO_FILTRO_REQUERIDO", "CODIGO_FILTRO_DUPLICADO", "FILTRO_NO_ENCONTRADO",
];

const UI_MESSAGES: Record<CatalogoFiltrosErrorCode, string> = {
  AUTENTICACION_REQUERIDA: "Tu sesión ya no es válida. Inicia sesión nuevamente.",
  PAYLOAD_INVALIDO: "No se pudieron validar los datos enviados.",
  REGISTRO_NO_ENCONTRADO: "El registro ya no existe o fue modificado.",
  CODIGO_FILTRO_REQUERIDO: "Ingresa el código del filtro.",
  CODIGO_FILTRO_DUPLICADO: "Ya existe un filtro con ese código.",
  FILTRO_NO_ENCONTRADO: "El filtro ya no está disponible. Actualiza el listado.",
  RESPUESTA_INVALIDA: "La respuesta del catálogo no tiene el formato esperado.",
  TRANSPORTE: "No fue posible comunicarse con el catálogo.",
  DESCONOCIDO: "No se pudo guardar el filtro. Intenta nuevamente.",
};

export class CatalogoFiltrosError extends Error {
  constructor(public readonly codigo: CatalogoFiltrosErrorCode, message = UI_MESSAGES[codigo]) {
    super(message);
    this.name = "CatalogoFiltrosError";
  }
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return [record.code, record.codigo, record.message, record.details, record.hint]
      .filter((part): part is string => typeof part === "string").join(" ");
  }
  return "";
}

export function normalizarCatalogoFiltrosError(
  error: unknown,
  fallback: CatalogoFiltrosErrorCode = "DESCONOCIDO",
): CatalogoFiltrosError {
  if (error instanceof CatalogoFiltrosError) return error;
  const text = stringifyUnknown(error);
  return new CatalogoFiltrosError(KNOWN_CODES.find((code) => text.includes(code)) ?? fallback);
}

export function mensajeCatalogoFiltrosError(error: CatalogoFiltrosError | null): string | null {
  return error?.message ?? null;
}
