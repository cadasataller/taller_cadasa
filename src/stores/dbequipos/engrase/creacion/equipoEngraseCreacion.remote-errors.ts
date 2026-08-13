export class ErrorCreacionEquipo extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorCreacionEquipo";
  }
}

export const extraerCodigoErrorCreacionEquipo = (mensaje: string): string =>
  mensaje.split(":", 1)[0].trim() || "ERROR_CREACION_EQUIPO";

export const crearErrorCreacionEquipo = (
  mensaje: string,
  codigo?: string,
): ErrorCreacionEquipo =>
  new ErrorCreacionEquipo(
    codigo?.trim() || extraerCodigoErrorCreacionEquipo(mensaje),
    mensaje || "Ocurrió un error durante la creación del equipo.",
  );
