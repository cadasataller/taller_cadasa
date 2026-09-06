import { supabaseCapturaOperador } from "@/lib/supabase";
import {
  jornadaEventoDetalleSchema,
  jornadaEventoDetalleRawSchema,
  jornadaEventosListaSchema,
} from "./jornadaEventos.schemas";
import type {
  JornadaEventoDetalle,
  JornadaEventoFilters,
  JornadaEventosCursor,
  JornadaEventosListaResponse,
} from "./reporteEquipos.types";

interface JornadaEventosListParams {
  equipos: string[] | null;
  desde: string | null;
  hasta: string | null;
  cursor: JornadaEventosCursor | null;
  snapshotRegistradoEn: string | null;
  filters: JornadaEventoFilters;
}

const throwRemoteError = (
  message: string | undefined,
  fallback: string,
): never => {
  throw new Error(message || fallback);
};
const toPanamaDateTime = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const parts = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!parts) return value;
  const [, day, month, year, hour, minute, second = "00"] = parts;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}-05:00`;
};
const implementLabel = (
  implemento:
    | string
    | { numero?: string | null; nombre?: string | null }
    | null
    | undefined,
): string | null => {
  if (typeof implemento === "string") return implemento;
  if (!implemento) return null;
  const parts = [implemento.numero, implemento.nombre].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length ? parts.join(" · ") : null;
};

export const jornadaEventosService = {
  async loadList(
    params: JornadaEventosListParams,
  ): Promise<JornadaEventosListaResponse> {
    const { data, error } = await supabaseCapturaOperador.rpc(
      "rpc_jornada_eventos_listar",
      {
        p_equipos: params.equipos,
        p_desde: params.desde,
        p_hasta: params.hasta,
        p_limit: 25,
        p_cursor_ocurrio_en: params.cursor?.ocurrioEn ?? null,
        p_cursor_id: params.cursor?.id ?? null,
        p_snapshot_registrado_en: params.snapshotRegistradoEn,
        p_tipo_evento: params.filters.tipoEvento,
        p_tipo_parada_id: null,
        p_operador: null,
      },
    );
    if (error)
      throwRemoteError(
        error.message,
        "No se pudo cargar el historial de eventos.",
      );
    const dto = jornadaEventosListaSchema.parse(data);
    return {
      modo: dto.modo,
      snapshotRegistradoEn: dto.snapshot_registrado_en,
      pageSize: dto.page_size,
      hasMore: dto.has_more,
      nextCursor: dto.next_cursor
        ? { ocurrioEn: dto.next_cursor.ocurrio_en, id: dto.next_cursor.id }
        : null,
      items: dto.items.map((item) => ({
        eventoId: item.evento_id,
        fechaHora: item.fecha_hora,
        operadorId: item.operador_id,
        operador: item.operador,
        equipo: item.equipo,
        tipoEvento: item.tipo_evento,
        evento: item.evento,
        detalle: item.detalle,
        labor: item.labor,
      })),
    };
  },
  async loadDetail(eventoId: string): Promise<JornadaEventoDetalle> {
    const { data, error } = await supabaseCapturaOperador.rpc(
      "rpc_jornada_evento_detalle",
      { p_evento_id: eventoId },
    );
    if (error)
      throwRemoteError(
        error.message,
        "No se pudo cargar el detalle del evento.",
      );
    const dto = jornadaEventoDetalleSchema.parse(data);
    const raw = jornadaEventoDetalleRawSchema.parse(data);
    return {
      raw,
      evento: {
        id: dto.evento.id ?? eventoId,
        clientEventId: dto.evento.client_event_id ?? null,
        jornadaId: dto.evento.jornada_id ?? null,
        asignacionId: dto.evento.asignacion_id ?? null,
        periodoId: dto.evento.periodo_id ?? null,
        tipoEvento: dto.evento.tipo_evento,
        ocurrioEn:
          toPanamaDateTime(dto.evento.ocurrio_en) ??
          toPanamaDateTime(dto.evento.ocurrio_en_local) ??
          "",
        registradoEn: dto.evento.registrado_en ?? null,
        sincronizadoEn: dto.evento.sincronizado_en ?? null,
        retroactivoMinutos: dto.evento.retroactivo_minutos ?? null,
        latitud: dto.evento.latitud ?? null,
        longitud: dto.evento.longitud ?? null,
        creadoPorAuthUserId: dto.evento.creado_por_auth_user_id ?? null,
        datos: dto.evento.datos ?? null,
        creadoEn: dto.evento.creado_en ?? null,
        secuencia: dto.evento.secuencia ?? null,
      },
      contexto: {
        operador: dto.contexto.operador ?? null,
        equipo: dto.contexto.equipo ?? null,
        labor: dto.contexto.labor ?? null,
        implemento:
          dto.contexto.implemento ??
          ([dto.contexto.implemento_numero, dto.contexto.implemento_nombre]
            .filter((part): part is string => Boolean(part))
            .join(" · ") ||
            null),
      },
      intervalos: dto.intervalos.map((item) => ({
        id: item.id ?? null,
        tipo: item.tipo,
        etiqueta: item.etiqueta,
        estado: item.estado ?? null,
        inicio:
          toPanamaDateTime(item.inicio) ?? toPanamaDateTime(item.inicio_local),
        fin: toPanamaDateTime(item.fin) ?? toPanamaDateTime(item.fin_local),
        duracionSegundos: item.duracion_segundos ?? null,
        clasificacion: item.clasificacion ?? null,
        motorEncendido: item.motor_encendido ?? null,
        equipo: item.equipo ?? null,
        implemento: implementLabel(item.implemento),
        labor: item.labor ?? null,
      })),
    };
  },
};
