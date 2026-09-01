import type { RealtimeChannel } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseRastreoTareas } from "@/lib/supabase";

const taskEventSchema = z.object({
  tipo: z.enum([
    "permanencia_iniciada",
    "permanencia_finalizada",
    "estado_tarea_actualizado",
  ]),
  alcance: z.literal("tarea"),
  tarea_id: z.string().min(1),
  area_id: z.string().min(1).optional(),
  tipo_tarea: z.enum(["finca", "zona", "duda_automatica"]),
  source_id: z.number().int().positive().optional(),
  tracker_id: z.number().int().positive().optional(),
  tracker_label: z.string().nullable().optional(),
  segundos_permanencia_actual: z.number().nonnegative().optional(),
  segundos_totales: z.number().nonnegative().optional(),
  visita_abierta: z.boolean().optional(),
  entrada_actual_en: z.string().nullable().optional(),
  primera_entrada_en: z.string().nullable().optional(),
  ultima_salida_en: z.string().nullable().optional(),
  estado_operativo_codigo: z
    .enum(["sin_iniciar", "en_ruta", "en_ubicacion", "visitada"])
    .nullable()
    .optional(),
  estado_operativo_nombre: z.string().nullable().optional(),
  estado_tarea_codigo: z.string().optional(),
  estado_tarea_nombre: z.string().nullable().optional(),
  ocurrido_en: z.string().optional(),
});

const zoneEventSchema = z.object({
  tipo: z.enum([
    "zona_visita_iniciada",
    "zona_visita_finalizada",
    "zona_visita_actualizada",
  ]),
  alcance: z.literal("zona"),
  tarea_id: z.string().min(1),
  area_id: z.string().min(1).optional(),
  tipo_tarea: z.enum(["finca", "zona", "duda_automatica"]),
  zona_id: z.string().min(1),
  segundos_zona_actual: z.number().nonnegative().optional(),
  segundos_zona_totales: z.number().nonnegative().optional(),
  visita_zona_abierta: z.boolean().optional(),
  entrada_zona_actual_en: z.string().nullable().optional(),
  primera_entrada_zona_en: z.string().nullable().optional(),
  ultima_salida_zona_en: z.string().nullable().optional(),
  ocurrido_en: z.string().optional(),
});

const observationEventSchema = z.object({
  tipo: z.literal("observacion_creada"),
  observacion_id: z.string().min(1),
  tarea_id: z.string().min(1),
  area_id: z.string().min(1),
});

export type TareaPermanenciaRealtimeEvent =
  z.infer<typeof taskEventSchema> | z.infer<typeof zoneEventSchema>;
export type TareaObservacionRealtimeEvent = z.infer<
  typeof observationEventSchema
>;

export function parseTareaPermanenciaRealtimeEvent(
  payload: unknown,
): TareaPermanenciaRealtimeEvent | null {
  const taskEvent = taskEventSchema.safeParse(payload);
  if (taskEvent.success) return taskEvent.data;
  const zoneEvent = zoneEventSchema.safeParse(payload);
  return zoneEvent.success ? zoneEvent.data : null;
}

export function parseTareaObservacionRealtimeEvent(
  payload: unknown,
): TareaObservacionRealtimeEvent | null {
  const event = observationEventSchema.safeParse(payload);
  return event.success ? event.data : null;
}

type RealtimeHandlers = {
  onPermanencia: (event: TareaPermanenciaRealtimeEvent) => void;
  onObservacion: (event: TareaObservacionRealtimeEvent) => void;
};

const areaChannels = new Map<string, RealtimeChannel>();

async function subscribeArea(
  areaId: string,
  handlers: RealtimeHandlers,
): Promise<void> {
  if (areaChannels.has(areaId)) return;
  await supabaseRastreoTareas.realtime.setAuth();
  const topic = `area:${areaId}:ubicaciones`;
  const channel = supabaseRastreoTareas
    .channel(topic, { config: { private: true } })
    .on(
      "broadcast",
      { event: "permanencia_tarea_actualizada" },
      ({ payload }) => {
        const event = parseTareaPermanenciaRealtimeEvent(payload);
        if (event && (!event.area_id || event.area_id === areaId))
          handlers.onPermanencia(event);
      },
    )
    .on("broadcast", { event: "observacion_tarea" }, ({ payload }) => {
      const event = parseTareaObservacionRealtimeEvent(payload);
      if (event?.area_id === areaId) handlers.onObservacion(event);
    });
  areaChannels.set(areaId, channel);
  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") return resolve();
      if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
        areaChannels.delete(areaId);
        reject(error ?? new Error(`No se pudo suscribir al área ${areaId}.`));
      }
    });
  });
}

async function unsubscribeArea(areaId: string): Promise<void> {
  const channel = areaChannels.get(areaId);
  if (!channel) return;
  areaChannels.delete(areaId);
  await supabaseRastreoTareas.removeChannel(channel);
}

export const tareaRealtimeService = {
  async sync(
    areaIds: readonly string[],
    handlers: RealtimeHandlers,
  ): Promise<void> {
    const desired = new Set(areaIds.filter(Boolean));
    await Promise.all(
      [...areaChannels.keys()]
        .filter((areaId) => !desired.has(areaId))
        .map(unsubscribeArea),
    );
    await Promise.all(
      [...desired]
        .filter((areaId) => !areaChannels.has(areaId))
        .map((areaId) => subscribeArea(areaId, handlers)),
    );
  },
  async clear(): Promise<void> {
    const channels = [...areaChannels.values()];
    areaChannels.clear();
    await Promise.all(
      channels.map((channel) => supabaseRastreoTareas.removeChannel(channel)),
    );
  },
};
