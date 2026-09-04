import { z } from "zod";
import { supabase } from "@/lib/supabase";
import type {
  OmsgAssignmentComplianceItem,
  OmsgAssignmentComplianceParams,
} from "./omsgAssignmentCompliance.types";

const omsgAssignmentComplianceItemSchema = z.object({
  semana: z.string().nullable(),
  fecha_trabajo: z.string().nullable(),
  dia: z.string().nullable(),
  area_objetivo: z.string().nullable(),
  email_supervisor: z.string().nullable(),
  id_sg: z.string().nullable(),
  id_orden_base: z.string().nullable(),
  equipo: z.string().nullable(),
  trabajo_realizar: z.string().nullable(),
  fecha_creacion: z.string().nullable(),
  creado_por: z.string().nullable(),
  nombre_creador: z.string().nullable(),
  area_creador: z.string().nullable(),
  mecanicos: z.string().nullable(),
  cantidad_ot: z.number().nullable(),
  horas_trabajadas: z.number().nullable(),
  creador_correcto: z.boolean().nullable(),
  creada_antes: z.boolean().nullable(),
  creada_mismo_dia: z.boolean().nullable(),
  creada_despues: z.boolean().nullable(),
  motivo_incumplimiento: z.string().nullable(),
});

const omsgAssignmentComplianceSchema = z.array(
  omsgAssignmentComplianceItemSchema,
);

export const omsgAssignmentComplianceService = {
  async fetch(
    params: OmsgAssignmentComplianceParams,
  ): Promise<OmsgAssignmentComplianceItem[]> {
    const { data, error } = await supabase.rpc(
      "rpc_omsg_incumplimientos_detalle",
      {
        p_fecha: params.fecha,
        p_email: params.email,
      },
    );

    if (error) {
      throw new Error(
        error.message || "No se pudo cargar el cumplimiento de asignación OMSG",
      );
    }

    return omsgAssignmentComplianceSchema.parse(data ?? []);
  },
};
