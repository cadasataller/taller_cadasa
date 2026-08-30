import type {
  TareaCreacionBorrador,
  TareaCreacionErrorValidacion,
  TareaCreacionResultadoValidacion,
} from "./tareaCreacion.types";

const MINUTES_STEP = 15;
const MINIMUM_MINUTES = 15;
const MAXIMUM_MINUTES = 10080;

const isNonEmptyString = (value: string | null): value is string =>
  Boolean(value?.trim());

const isIsoDate = (value: string | null): value is string =>
  Boolean(
    value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
  );

export const validateTareaCreacionDraft = (
  draft: TareaCreacionBorrador,
): TareaCreacionResultadoValidacion => {
  const errors: TareaCreacionErrorValidacion[] = [];
  const { details, geometry } = draft;

  if (!draft.areaId || !draft.type) {
    errors.push({
      field: "type",
      message: "Selecciona el área y el tipo de tarea.",
    });
  }
  if (!draft.worker || !draft.tracker) {
    errors.push({
      field: "assignment",
      message: "Selecciona un trabajador y un tracker válidos.",
    });
  }
  if (
    !isNonEmptyString(details.instructions) ||
    !isIsoDate(details.scheduledDate) ||
    !Number.isInteger(details.priorityId) ||
    !Number.isInteger(details.estimatedMinutes) ||
    details.estimatedMinutes < MINIMUM_MINUTES ||
    details.estimatedMinutes > MAXIMUM_MINUTES ||
    details.estimatedMinutes % MINUTES_STEP !== 0
  ) {
    errors.push({
      field: "details",
      message:
        "Completa indicaciones, fecha, prioridad y duración en intervalos de 15 minutos.",
    });
  }
  if (
    !geometry.routePoint ||
    (draft.type === "finca" &&
      (!geometry.locationId || !geometry.controlLine)) ||
    (draft.type === "zona" &&
      (!geometry.controlZone || geometry.locationId !== null))
  ) {
    errors.push({
      field: "geometry",
      message: "Completa la geometría requerida para el tipo de tarea.",
    });
  }
  if (
    draft.route.order !== null &&
    (!Number.isInteger(draft.route.order) || draft.route.order < 1)
  ) {
    errors.push({
      field: "route",
      message: "La posición en ruta debe ser un entero positivo.",
    });
  }

  const invalidFields = new Set(errors.map(({ field }) => field));
  const validBlocks = {
    type: !invalidFields.has("type"),
    assignment: !invalidFields.has("assignment"),
    details: !invalidFields.has("details"),
    geometry: !invalidFields.has("geometry"),
    route: !invalidFields.has("route"),
  };
  return { isValid: errors.length === 0, errors, validBlocks };
};
