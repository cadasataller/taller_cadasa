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
        message: "Selecciona el área y el tipo de tarea.",
      });
    }
    if (!draft.worker || !draft.tracker) {
      context.addIssue({
        code: "custom",
        path: ["worker"],
        message: "Selecciona un trabajador y un tracker válidos.",
      });
    }
    if (
      !draft.details.instructions.trim() ||
      !draft.details.scheduledDate ||
      !isoDateSchema.safeParse(draft.details.scheduledDate).success ||
      !Number.isInteger(draft.details.priorityId) ||
      !minutesSchema.safeParse(draft.details.estimatedMinutes).success
    ) {
      context.addIssue({
        code: "custom",
        path: ["details"],
        message:
          "Completa indicaciones, fecha, prioridad y duración en intervalos de 15 minutos.",
      });
    }
    if (
      draft.type === "finca" &&
      (!draft.geometry.locationId ||
        !isValidControlLine(draft.geometry.controlLine))
    ) {
      context.addIssue({
        code: "custom",
        path: ["geometry"],
        message: "La finca requiere ubicación y línea de control.",
      });
    }
    if (
      draft.type === "zona" &&
      (!isValidControlZone(draft.geometry.controlZone) ||
        draft.geometry.locationId !== null)
    ) {
      context.addIssue({
        code: "custom",
        path: ["geometry"],
        message: "La zona requiere polígono de control y no usa ubicación.",
      });
    }
    if (!isValidRoutePoint(draft.geometry.routePoint)) {
      context.addIssue({
        code: "custom",
        path: ["geometry"],
        message: "Selecciona un punto de enrutado.",
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
const fieldForIssue = (path: PropertyKey[]): TareaCreacionCampo => {
  const [first] = path;
  if (first === "areaId" || first === "type") return "type";
  if (first === "worker" || first === "tracker") return "assignment";
  if (first === "details") return "details";
  if (first === "route") return "route";
  return "geometry";
};

export const validateTareaCreacionDraft = (
  draft: TareaCreacionBorrador,
): TareaCreacionResultadoValidacion => {
  const result = creationDraftSchema.safeParse(draft);
  const validBlocks = initialValidBlocks();
  const errorsByField = new Map<
    TareaCreacionCampo,
    TareaCreacionErrorValidacion
  >();
  for (const issue of result.error?.issues ?? []) {
    const field = fieldForIssue(issue.path);
    if (!errorsByField.has(field))
      errorsByField.set(field, { field, message: issue.message });
  }
  (Object.keys(validBlocks) as TareaCreacionCampo[]).forEach((field) => {
    validBlocks[field] = !errorsByField.has(field);
  });
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
