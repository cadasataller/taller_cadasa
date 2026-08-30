import { z } from "zod";
import type {
  TareaCreacionBloquesValidos,
  TareaCreacionBorrador,
  TareaCreacionCampo,
  TareaCreacionErrorRemoto,
  TareaCreacionErrorValidacion,
  TareaCreacionResultadoValidacion,
} from "./tareaCreacion.types";
import {
  isValidControlLine,
  isValidControlZone,
  isValidRoutePoint,
} from "./tareaCreacion.geometry";

const minutesSchema = z.number().int().min(15).max(10080).multipleOf(15);
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  });

const creationDraftSchema = z
  .object({
    areaId: z.string().nullable(),
    type: z.enum(["finca", "zona"]).nullable(),
    worker: z
      .object({ id: z.string().min(1), label: z.string().min(1) })
      .nullable(),
    tracker: z
      .object({
        id: z.number().int().positive(),
        sourceId: z.number().int().positive(),
        label: z.string().min(1),
      })
      .nullable(),
    details: z.object({
      instructions: z.string(),
      scheduledDate: z.string().nullable(),
      priorityId: z.number().nullable(),
      estimatedMinutes: z.number().nullable(),
    }),
    geometry: z.object({
      locationId: z.string().min(1).nullable(),
      routePoint: z
        .object({
          latitude: z.number().finite(),
          longitude: z.number().finite(),
        })
        .nullable(),
      controlLine: z
        .object({
          type: z.literal("MultiLineString"),
          coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
        })
        .nullable(),
      controlZone: z
        .object({
          type: z.literal("MultiPolygon"),
          coordinates: z.array(
            z.array(z.array(z.tuple([z.number(), z.number()]))),
          ),
        })
        .nullable(),
    }),
    route: z.object({ order: z.number().int().positive().nullable() }),
  })
  .superRefine((draft, context) => {
    if (!draft.areaId || !draft.type) {
      context.addIssue({
        code: "custom",
        path: ["type"],
        message: "Selecciona un tipo de tarea.",
      });
    }
    if (!draft.worker) {
      context.addIssue({
        code: "custom",
        path: ["worker"],
        message: "Selecciona un trabajador válido.",
      });
    }
    if (!draft.tracker) {
      context.addIssue({
        code: "custom",
        path: ["tracker"],
        message: "Selecciona un equipo válido.",
      });
    }
    if (!draft.details.instructions.trim()) {
      context.addIssue({
        code: "custom",
        path: ["details", "instructions"],
        message: "Escribe las indicaciones de la tarea.",
      });
    }
    if (
      !draft.details.scheduledDate ||
      !isoDateSchema.safeParse(draft.details.scheduledDate).success
    ) {
      context.addIssue({
        code: "custom",
        path: ["details", "scheduledDate"],
        message: "Selecciona una fecha programada válida.",
      });
    }
    if (!Number.isInteger(draft.details.priorityId)) {
      context.addIssue({
        code: "custom",
        path: ["details", "priorityId"],
        message: "Selecciona una prioridad válida.",
      });
    }
    if (!minutesSchema.safeParse(draft.details.estimatedMinutes).success) {
      context.addIssue({
        code: "custom",
        path: ["details", "estimatedMinutes"],
        message:
          "Indica una duración entre 15 minutos y 7 días, en intervalos de 15 minutos.",
      });
    }
    if (draft.type === "finca" && !draft.geometry.locationId) {
      context.addIssue({
        code: "custom",
        path: ["geometry", "locationId"],
        message: "Selecciona una finca activa.",
      });
    }
    if (!isValidRoutePoint(draft.geometry.routePoint)) {
      context.addIssue({
        code: "custom",
        path: ["geometry", "routePoint"],
        message: "Selecciona un punto de enrutado.",
      });
    }
    if (
      draft.type === "finca" &&
      !isValidControlLine(draft.geometry.controlLine)
    ) {
      context.addIssue({
        code: "custom",
        path: ["geometry", "controlLine"],
        message: "Dibuja la línea de control de la finca.",
      });
    }
    if (
      draft.type === "zona" &&
      (!isValidControlZone(draft.geometry.controlZone) ||
        draft.geometry.locationId !== null)
    ) {
      context.addIssue({
        code: "custom",
        path: ["geometry", "controlZone"],
        message: "Dibuja el polígono de control de la zona.",
      });
    }
  });

const initialValidBlocks = (): TareaCreacionBloquesValidos => ({
  type: false,
  assignment: false,
  details: false,
  geometry: false,
  route: false,
});
const errorFieldForIssue = (
  path: PropertyKey[],
): TareaCreacionErrorValidacion["field"] => {
  const [first, second] = path;
  if (first === "areaId" || first === "type") return "type";
  if (first === "worker") return "worker";
  if (first === "tracker") return "tracker";
  if (first === "details") {
    if (second === "instructions") return "instructions";
    if (second === "scheduledDate") return "scheduledDate";
    if (second === "priorityId") return "priority";
    return "estimatedMinutes";
  }
  if (first === "route") return "route";
  if (second === "locationId") return "location";
  if (second === "routePoint") return "routePoint";
  if (second === "controlLine") return "controlLine";
  return "controlZone";
};
const blockForErrorField = (
  field: TareaCreacionErrorValidacion["field"],
): TareaCreacionCampo => {
  if (field === "type") return "type";
  if (field === "worker" || field === "tracker") return "assignment";
  if (
    field === "instructions" ||
    field === "scheduledDate" ||
    field === "priority" ||
    field === "estimatedMinutes"
  )
    return "details";
  if (field === "route") return "route";
  return "geometry";
};

export const validateTareaCreacionDraft = (
  draft: TareaCreacionBorrador,
): TareaCreacionResultadoValidacion => {
  const result = creationDraftSchema.safeParse(draft);
  const validBlocks = initialValidBlocks();
  (Object.keys(validBlocks) as TareaCreacionCampo[]).forEach((field) => {
    validBlocks[field] = true;
  });
  const errorsByField = new Map<string, TareaCreacionErrorValidacion>();
  for (const issue of result.error?.issues ?? []) {
    const field = errorFieldForIssue(issue.path);
    if (!errorsByField.has(field))
      errorsByField.set(field, { field, message: issue.message });
  }
  for (const error of errorsByField.values()) {
    validBlocks[blockForErrorField(error.field)] = false;
  }
  return {
    isValid: result.success,
    errors: [...errorsByField.values()],
    validBlocks,
  };
};

export const toTareaCreacionRemoteError = (
  error: unknown,
): TareaCreacionErrorRemoto => {
  const source = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  return {
    message: source?.message || "No se pudo crear la tarea.",
    code: source?.code ?? null,
    details: source?.details ?? null,
    hint: source?.hint ?? null,
  };
};
