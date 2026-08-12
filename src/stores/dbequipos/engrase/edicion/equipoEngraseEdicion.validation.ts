import type {
  EquipoEdicionDraft,
  EquipoEdicionValidationIssue,
  EquipoEdicionValidationResult,
  EquipoEdicionSeccionError,
} from "./equipoEngraseEdicion.types";

const normalizarClave = (valor: string): string => valor.trim().replace(/\s+/gu, " ").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
const claveReferencia = (referencia: { estado: "existente"; id: number; nombre: string } | { estado: "nuevo"; tempId: string; nombre: string }): string =>
  referencia.estado === "existente" ? `id:${referencia.id}` : `nombre:${normalizarClave(referencia.nombre)}`;

export const validarEquipoEngrase = (draft: EquipoEdicionDraft): EquipoEdicionValidationResult => {
  const errores: EquipoEdicionValidationIssue[] = [];
  const agregar = (codigo: string, mensaje: string, seccion: EquipoEdicionSeccionError, fieldId?: string): void => {
    errores.push({ codigo, mensaje, seccion, ...(fieldId ? { fieldId } : {}) });
  };
  if (!draft.equipo.codigo.trim()) agregar("CODIGO_EQUIPO_REQUERIDO", "El código del equipo es obligatorio.", "datos", "equipo-codigo");
  if (!draft.equipo.subtipo.trim()) agregar("SUBTIPO_EQUIPO_REQUERIDO", "El modelo o subtipo es obligatorio.", "datos", "equipo-subtipo");
  if (!draft.tipoEquipoReferencia.nombre.trim()) agregar("TIPO_EQUIPO_REQUERIDO", "Selecciona o crea un tipo de equipo.", "datos");
  if (draft.etapas.length === 0) agregar("ETAPA_MINIMA_REQUERIDA", "El equipo debe conservar al menos una etapa activa.", "etapas");

  const filtrosActivos = draft.filtros.filter((filtro) => filtro.estadoOperacion !== "pendiente_eliminacion");
  if (filtrosActivos.length === 0) agregar("FILTRO_MINIMO_REQUERIDO", "El equipo debe conservar al menos un filtro activo.", "filtros");
  filtrosActivos.forEach((filtro) => {
    if (!Number.isInteger(filtro.cantidad) || filtro.cantidad <= 0)
      agregar("CANTIDAD_FILTRO_INVALIDA", `La cantidad de ${filtro.filtro.codigo || "filtro"} debe ser un entero mayor que cero.`, "filtros");
  });
  const tiposFiltro = new Set<string>();
  filtrosActivos.forEach((filtro) => {
    const clave = claveReferencia(filtro.tipoFiltroReferencia);
    if (tiposFiltro.has(clave)) agregar("CONFLICTO_DATOS_DUPLICADOS", `Sólo puede existir un filtro activo para el tipo ${filtro.tipoFiltroReferencia.nombre}.`, "filtros");
    tiposFiltro.add(clave);
  });

  const sistemas = new Set<string>();
  draft.aceites.filter((aceite) => aceite.estadoOperacion !== "pendiente_eliminacion").forEach((aceite) => {
    const clave = claveReferencia(aceite.sistemaReferencia);
    if (sistemas.has(clave)) agregar("CONFLICTO_DATOS_DUPLICADOS", `Sólo puede existir un aceite activo para el sistema ${aceite.sistemaReferencia.nombre}.`, "aceites");
    sistemas.add(clave);
  });
  return { valido: errores.length === 0, errores };
};

const ERRORES_RPC: Record<string, { mensaje: string; seccion: EquipoEdicionSeccionError; fieldId?: string }> = {
  AUTENTICACION_REQUERIDA: { mensaje: "Tu sesión ya no es válida. Inicia sesión nuevamente para guardar.", seccion: "general" },
  EQUIPO_NO_ENCONTRADO: { mensaje: "El equipo ya no existe o no está disponible.", seccion: "general" },
  CODIGO_EQUIPO_YA_EXISTE: { mensaje: "El código ingresado ya pertenece a otro equipo.", seccion: "datos", fieldId: "equipo-codigo" },
  CODIGO_EQUIPO_REQUERIDO: { mensaje: "El código del equipo es obligatorio.", seccion: "datos", fieldId: "equipo-codigo" },
  SUBTIPO_EQUIPO_REQUERIDO: { mensaje: "El modelo o subtipo es obligatorio.", seccion: "datos", fieldId: "equipo-subtipo" },
  ETAPA_NO_EXISTE: { mensaje: "Una de las etapas seleccionadas ya no está disponible.", seccion: "etapas" },
  ETAPA_MINIMA_REQUERIDA: { mensaje: "El equipo debe conservar al menos una etapa activa.", seccion: "etapas" },
  FILTRO_MINIMO_REQUERIDO: { mensaje: "El equipo debe conservar al menos un filtro activo.", seccion: "filtros" },
  FILTRO_ASIGNADO_NO_EXISTE: { mensaje: "Una asignación de filtro ya no existe. Revisa la sección de filtros.", seccion: "filtros" },
  CANTIDAD_FILTRO_INVALIDA: { mensaje: "Todas las cantidades de filtros deben ser enteros mayores que cero.", seccion: "filtros" },
  ACEITE_ASIGNADO_NO_EXISTE: { mensaje: "Una asociación de aceite ya no existe. Revisa la sección de aceites.", seccion: "aceites" },
  CONFLICTO_DATOS_DUPLICADOS: { mensaje: "Hay asignaciones duplicadas. Revisa filtros y aceites.", seccion: "general" },
  PAYLOAD_CAMBIOS_INVALIDO: { mensaje: "Los cambios no tienen un formato válido. Revisa el formulario e intenta de nuevo.", seccion: "general" },
  DATOS_INVALIDOS: { mensaje: "Algunos datos no son válidos. Revisa el formulario e intenta de nuevo.", seccion: "general" },
};

export const mapearErrorRpcEquipo = (codigo: string): EquipoEdicionValidationIssue => {
  const error = ERRORES_RPC[codigo] ?? { mensaje: "No se pudieron guardar los cambios. Intenta nuevamente.", seccion: "general" as const };
  return { codigo, mensaje: error.mensaje, seccion: error.seccion, ...(error.fieldId ? { fieldId: error.fieldId } : {}) };
};
