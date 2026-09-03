import { supabase, supabaseRatings } from "@/lib/supabase";
import type {
  DeleteMeetingRatingPayload,
  RatingsFetchScope,
  PuntuacionSupervisoresOtResponse,
  RatingsDetalle,
  RatingsEmpleado,
  RatingsInspeccion,
  UpsertMeetingRatingPayload,
} from "./ratingsStore.types";
import { removeMeetingObservationBlock } from "@/utils/meetingRatings";

const SUPABASE_BATCH_SIZE = 1000;
const DETAIL_ID_CHUNK_SIZE = 200;

type PagedQueryResponse<T> = Promise<{
  data: T[] | null;
  error: { message?: string } | null;
}>;

const fetchTableData = async <T>(
  tableName: string,
  select = "*",
): Promise<T[]> => {
  const { data, error } = await supabaseRatings.from(tableName).select(select);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as T[];
};

const buildInspeccionesScopeQuery = (
  tableName: string,
  scope: RatingsFetchScope,
  from: number,
  supervisorId?: number,
) => {
  let query = supabaseRatings
    .from(tableName)
    .select("*")
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })
    .range(from, from + SUPABASE_BATCH_SIZE - 1);

  if (scope.mode === "single-date") {
    query = query.eq("fecha", scope.date);
  } else if (scope.mode === "date-range") {
    query = query.gte("fecha", scope.from).lte("fecha", scope.to);
  }

  if (supervisorId !== undefined) {
    query = query.eq("id_supervisor", supervisorId);
  }

  return query;
};

const buildDetallesPageQuery = (
  tableName: string,
  from: number,
  inspectionIds?: number[],
) => {
  let query = supabaseRatings
    .from(tableName)
    .select("*")
    .order("id_inspeccion", { ascending: false })
    .order("id_criterio", { ascending: true })
    .range(from, from + SUPABASE_BATCH_SIZE - 1);

  if (inspectionIds && inspectionIds.length > 0) {
    query = query.in("id_inspeccion", inspectionIds);
  }

  return query;
};

const fetchPagedData = async <T>(
  tableName: string,
  queryFactory: (tableName: string, from: number) => PagedQueryResponse<T>,
): Promise<T[]> => {
  const { data: initialData, error: initialError } = await queryFactory(
    tableName,
    0,
  );

  if (initialError) {
    throw new Error(initialError.message);
  }

  const records = [...((initialData || []) as T[])];

  if (records.length < SUPABASE_BATCH_SIZE) {
    return records;
  }

  let from = SUPABASE_BATCH_SIZE;

  while (true) {
    const { data, error } = await queryFactory(tableName, from);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data || []) as T[];

    records.push(...batch);

    if (batch.length < SUPABASE_BATCH_SIZE) {
      break;
    }

    from += SUPABASE_BATCH_SIZE;
  }

  return records;
};

export const ratingsService = {
  async fetchEmpleados(): Promise<RatingsEmpleado[]> {
    return fetchTableData<RatingsEmpleado>("empleados");
  },

  async fetchEmpleadoActivoPorEmail(
    email: string,
  ): Promise<RatingsEmpleado | null> {
    const { data, error } = await supabaseRatings
      .from("empleados")
      .select("*")
      .eq("email", email)
      .eq("activo", true)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data as RatingsEmpleado | null;
  },

  async fetchInspecciones(
    scope: RatingsFetchScope = { mode: "all" },
    supervisorId?: number,
  ): Promise<RatingsInspeccion[]> {
    return fetchPagedData<RatingsInspeccion>(
      "inspecciones",
      (tableName, from) =>
        buildInspeccionesScopeQuery(
          tableName,
          scope,
          from,
          supervisorId,
        ) as unknown as PagedQueryResponse<RatingsInspeccion>,
    );
  },

  async fetchDetalles(inspectionIds: number[] = []): Promise<RatingsDetalle[]> {
    if (inspectionIds.length === 0) {
      return [];
    }

    const uniqueInspectionIds = [...new Set(inspectionIds)];
    const detailRecords: RatingsDetalle[] = [];

    for (
      let index = 0;
      index < uniqueInspectionIds.length;
      index += DETAIL_ID_CHUNK_SIZE
    ) {
      const idChunk = uniqueInspectionIds.slice(
        index,
        index + DETAIL_ID_CHUNK_SIZE,
      );
      const chunkRecords = await fetchPagedData<RatingsDetalle>(
        "inspecciones_detalle",
        (tableName, from) =>
          buildDetallesPageQuery(
            tableName,
            from,
            idChunk,
          ) as unknown as PagedQueryResponse<RatingsDetalle>,
      );

      detailRecords.push(...chunkRecords);
    }

    return detailRecords;
  },

  async fetchPuntuacionSupervisoresOt(
    fecha: string,
  ): Promise<PuntuacionSupervisoresOtResponse> {
    const { data, error } = await supabase.rpc(
      "rpc_puntuacion_supervisores_ot",
      {
        p_fecha: fecha,
      },
    );

    if (error) {
      throw new Error(
        error.message || "No se pudo cargar la puntuación de supervisores OT",
      );
    }

    if (!data || typeof data !== "object") {
      throw new Error(
        "La RPC de puntuación de supervisores OT no devolvió una respuesta válida",
      );
    }

    return data as PuntuacionSupervisoresOtResponse;
  },

  async deleteInspeccion(inspectionId: number): Promise<void> {
    const { error: detailsError } = await supabaseRatings
      .from("inspecciones_detalle")
      .delete()
      .eq("id_inspeccion", inspectionId);

    if (detailsError) {
      throw new Error(
        detailsError.message ||
          "No se pudieron eliminar los detalles de la inspeccion",
      );
    }

    const { error: inspectionError } = await supabaseRatings
      .from("inspecciones")
      .delete()
      .eq("id_inspeccion", inspectionId);

    if (inspectionError) {
      throw new Error(
        inspectionError.message || "No se pudo eliminar la inspeccion",
      );
    }
  },

  async upsertMeetingRating(
    payload: UpsertMeetingRatingPayload,
  ): Promise<number> {
    const observation = payload.observacion.trim() || null;

    if (!payload.inspectionId) {
      throw new Error(
        "La reunion debe asociarse a una inspeccion base existente",
      );
    }

    const { error: inspectionError } = await supabaseRatings
      .from("inspecciones")
      .update({
        observacion: observation,
      })
      .eq("id_inspeccion", payload.inspectionId);

    if (inspectionError) {
      throw new Error(
        inspectionError.message || "No se pudo actualizar la reunion",
      );
    }

    const { data: existingDetail, error: detailFetchError } =
      await supabaseRatings
        .from("inspecciones_detalle")
        .select("id_inspeccion, id_criterio")
        .eq("id_inspeccion", payload.inspectionId)
        .eq("id_criterio", payload.meetingCriterionId)
        .maybeSingle();

    if (detailFetchError) {
      throw new Error(
        detailFetchError.message || "No se pudo validar el detalle de reunion",
      );
    }

    if (existingDetail) {
      const { error: detailUpdateError } = await supabaseRatings
        .from("inspecciones_detalle")
        .update({ puntuacion: payload.puntuacion })
        .eq("id_inspeccion", payload.inspectionId)
        .eq("id_criterio", payload.meetingCriterionId);

      if (detailUpdateError) {
        throw new Error(
          detailUpdateError.message ||
            "No se pudo actualizar la puntuacion de reunion",
        );
      }
    } else {
      const { error: detailInsertError } = await supabaseRatings
        .from("inspecciones_detalle")
        .insert({
          id_inspeccion: payload.inspectionId,
          id_criterio: payload.meetingCriterionId,
          puntuacion: payload.puntuacion,
        });

      if (detailInsertError) {
        throw new Error(
          detailInsertError.message ||
            "No se pudo crear la puntuacion de reunion",
        );
      }
    }

    return payload.inspectionId;
  },

  async deleteMeetingRating(
    payload: DeleteMeetingRatingPayload,
  ): Promise<void> {
    const { data: inspectionRecord, error: inspectionFetchError } =
      await supabaseRatings
        .from("inspecciones")
        .select("observacion")
        .eq("id_inspeccion", payload.inspectionId)
        .maybeSingle();

    if (inspectionFetchError) {
      throw new Error(
        inspectionFetchError.message ||
          "No se pudo cargar la reunion a eliminar",
      );
    }

    const nextObservation = removeMeetingObservationBlock(
      inspectionRecord?.observacion || "",
    );

    const { error: detailDeleteError } = await supabaseRatings
      .from("inspecciones_detalle")
      .delete()
      .eq("id_inspeccion", payload.inspectionId)
      .eq("id_criterio", payload.meetingCriterionId);

    if (detailDeleteError) {
      throw new Error(
        detailDeleteError.message ||
          "No se pudo eliminar la puntuacion de reunion",
      );
    }

    const { error: inspectionUpdateError } = await supabaseRatings
      .from("inspecciones")
      .update({
        observacion: nextObservation || null,
      })
      .eq("id_inspeccion", payload.inspectionId);

    if (inspectionUpdateError) {
      throw new Error(
        inspectionUpdateError.message ||
          "No se pudo limpiar la observacion de reunion",
      );
    }
  },
};
