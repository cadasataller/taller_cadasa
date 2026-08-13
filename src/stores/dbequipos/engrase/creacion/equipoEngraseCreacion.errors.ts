import type {
  CrearEquipoSeccionError,
  CrearEquipoValidationIssue,
} from "./equipoEngraseCreacion.types";

interface ErrorRpcCreacionDefinicion {
  paso: 1 | 2 | 3 | 4;
  seccion: CrearEquipoSeccionError;
  mensaje: string;
  fieldId?: string;
}

const erroresRpc: { [codigo: string]: ErrorRpcCreacionDefinicion } = {
  AUTENTICACION_REQUERIDA: { paso: 4, seccion: "general", mensaje: "Tu sesión ya no es válida. Inicia sesión nuevamente para crear el equipo." },
  PAYLOAD_CREACION_INVALIDO: { paso: 4, seccion: "general", mensaje: "Los datos de creación no tienen un formato válido." },
  DATOS_EQUIPO_REQUERIDOS: { paso: 1, seccion: "datos", mensaje: "Completa los datos requeridos del equipo." },
  CODIGO_EQUIPO_REQUERIDO: { paso: 1, seccion: "datos", mensaje: "El código del equipo es obligatorio.", fieldId: "equipo-creacion-codigo" },
  EQUIPO_YA_EXISTE_EN_ENGRASE: { paso: 1, seccion: "datos", mensaje: "Este código ya existe en Engrase.", fieldId: "equipo-creacion-codigo" },
  SUBTIPO_EQUIPO_REQUERIDO: { paso: 1, seccion: "datos", mensaje: "El modelo o subtipo es obligatorio.", fieldId: "equipo-creacion-subtipo" },
  ESTADO_EQUIPO_INVALIDO: { paso: 1, seccion: "datos", mensaje: "El estado del equipo no es válido.", fieldId: "equipo-creacion-estado" },
  TIPO_EQUIPO_REQUERIDO: { paso: 1, seccion: "datos", mensaje: "Selecciona o crea un tipo de equipo.", fieldId: "equipo-creacion-tipo" },
  TIPO_EQUIPO_NO_EXISTE: { paso: 1, seccion: "datos", mensaje: "El tipo de equipo seleccionado ya no existe.", fieldId: "equipo-creacion-tipo" },
  ETAPA_NO_EXISTE: { paso: 1, seccion: "etapas", mensaje: "Una etapa seleccionada ya no existe.", fieldId: "equipo-creacion-etapas" },
  ETAPA_MINIMA_REQUERIDA: { paso: 1, seccion: "etapas", mensaje: "Selecciona al menos una etapa.", fieldId: "equipo-creacion-etapas" },
  FILTRO_MINIMO_REQUERIDO: { paso: 2, seccion: "filtros", mensaje: "Agrega al menos un filtro." },
  CANTIDAD_FILTRO_INVALIDA: { paso: 2, seccion: "filtros", mensaje: "La cantidad del filtro debe ser un entero mayor que cero." },
  TIPO_FILTRO_NO_EXISTE: { paso: 2, seccion: "filtros", mensaje: "Un tipo de filtro seleccionado ya no existe." },
  FILTRO_NO_EXISTE: { paso: 2, seccion: "filtros", mensaje: "Un filtro seleccionado ya no existe." },
  ACEITE_NO_EXISTE: { paso: 3, seccion: "aceites", mensaje: "Un aceite seleccionado ya no existe." },
  SISTEMA_ACEITE_NO_EXISTE: { paso: 3, seccion: "aceites", mensaje: "Un sistema de aceite seleccionado ya no existe." },
  CONFLICTO_DATOS_DUPLICADOS: { paso: 4, seccion: "general", mensaje: "Hay datos duplicados en las asignaciones del equipo." },
  DATOS_INVALIDOS: { paso: 4, seccion: "general", mensaje: "Algunos datos no son válidos. Revisa el formulario e intenta nuevamente." },
};

export function mapearErrorRpcCreacionEquipo(
  codigo: string,
): CrearEquipoValidationIssue {
  const error: ErrorRpcCreacionDefinicion = erroresRpc[codigo] ?? {
    paso: 4,
    seccion: "general",
    mensaje: "No se pudo crear el equipo. Intenta nuevamente.",
  };
  return {
    codigo,
    mensaje: error.mensaje,
    paso: error.paso,
    seccion: error.seccion,
    ...(error.fieldId ? { fieldId: error.fieldId } : {}),
  };
}
