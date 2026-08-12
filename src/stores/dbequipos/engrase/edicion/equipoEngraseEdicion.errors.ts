export const CODIGOS_ERROR_EDICION_EQUIPO = {
  AUTENTICACION_REQUERIDA: "AUTENTICACION_REQUERIDA",
  EQUIPO_NO_ENCONTRADO: "EQUIPO_NO_ENCONTRADO",
  CODIGO_EQUIPO_YA_EXISTE: "CODIGO_EQUIPO_YA_EXISTE",
  SUBTIPO_EQUIPO_REQUERIDO: "SUBTIPO_EQUIPO_REQUERIDO",
  ETAPA_MINIMA_REQUERIDA: "ETAPA_MINIMA_REQUERIDA",
  FILTRO_MINIMO_REQUERIDO: "FILTRO_MINIMO_REQUERIDO",
  CANTIDAD_FILTRO_INVALIDA: "CANTIDAD_FILTRO_INVALIDA",
  FILTRO_ASIGNADO_NO_EXISTE: "FILTRO_ASIGNADO_NO_EXISTE",
  ACEITE_ASIGNADO_NO_EXISTE: "ACEITE_ASIGNADO_NO_EXISTE",
  CONFLICTO_DATOS_DUPLICADOS: "CONFLICTO_DATOS_DUPLICADOS",
  PAYLOAD_CAMBIOS_INVALIDO: "PAYLOAD_CAMBIOS_INVALIDO",
  DATOS_INVALIDOS: "DATOS_INVALIDOS",
  ARCHIVO_STORAGE_NO_ENCONTRADO: "ARCHIVO_STORAGE_NO_ENCONTRADO",
  OPERACION_IMAGEN_INVALIDA: "OPERACION_IMAGEN_INVALIDA",
} as const;
export type CodigoErrorEdicionEquipo =
  | (typeof CODIGOS_ERROR_EDICION_EQUIPO)[keyof typeof CODIGOS_ERROR_EDICION_EQUIPO]
  | string;
export class ErrorEdicionEquipo extends Error {
  constructor(
    public readonly codigo: CodigoErrorEdicionEquipo,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorEdicionEquipo";
  }
}
export const extraerCodigoErrorEdicionEquipo = (
  mensaje: string,
): CodigoErrorEdicionEquipo =>
  mensaje.split(":", 1)[0].trim() || "ERROR_EDICION_EQUIPO";
export const crearErrorEdicionEquipo = (mensaje: string, codigo?: string) =>
  new ErrorEdicionEquipo(
    codigo ?? extraerCodigoErrorEdicionEquipo(mensaje),
    mensaje,
  );
