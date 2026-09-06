import {
  supabaseCapturaOperador,
  supabaseEquipos,
  supabaseRastreoTareas,
} from "@/lib/supabase";
import {
  mapContext,
  mapEquipmentList,
  mapMaster,
  mapStops,
  mapSummary,
} from "./reporteEquipos.mappers";
import {
  contextSchema,
  equipmentListSchema,
  farmResolutionSchema,
  masterSchema,
  summarySchema,
  stopsSchema,
} from "./reporteEquipos.schemas";
import type {
  EquipmentContext,
  EquipmentListItem,
  EquipmentMasterDetail,
  EquipmentSummary,
  EquipmentStops,
  ReportFilters,
} from "./reporteEquipos.types";

const throwRemoteError = (
  message: string | undefined,
  fallback: string,
): never => {
  throw new Error(message || fallback);
};
export const reporteEquiposService = {
  async loadEquipmentList(
    filters: ReportFilters,
  ): Promise<EquipmentListItem[]> {
    const { data, error } = await supabaseCapturaOperador.functions.invoke(
      "buscar-equipos-reporte",
      {
        body: {
          q: filters.search,
          limit: 50,
          full: true,
          desde: filters.startDate,
          hasta: filters.endDate,
        },
      },
    );
    if (error)
      return throwRemoteError(
        error.message,
        "No se pudo cargar el listado de equipos.",
      );
    return mapEquipmentList(equipmentListSchema.parse(data));
  },
  async loadContext(
    code: string,
    filters: ReportFilters,
  ): Promise<EquipmentContext> {
    const { data, error } = await supabaseCapturaOperador.rpc(
      "rpc_reporte_equipo_contexto",
      { p_equipo: code, p_desde: filters.startDate, p_hasta: filters.endDate },
    );
    if (error)
      return throwRemoteError(
        error.message,
        "No se pudo cargar el contexto del equipo.",
      );
    return mapContext(contextSchema.parse(data));
  },
  async loadSummary(
    code: string,
    filters: ReportFilters,
  ): Promise<EquipmentSummary> {
    const { data, error } = await supabaseCapturaOperador.rpc(
      "rpc_reporte_equipo_resumen",
      { p_equipo: code, p_desde: filters.startDate, p_hasta: filters.endDate },
    );
    if (error)
      return throwRemoteError(
        error.message,
        "No se pudo cargar el resumen del equipo.",
      );
    const summary = mapSummary(summarySchema.parse(data));
    const recentLocation = summary.recentLocation;
    if (!recentLocation) return summary;

    const farm = await this.resolveFarmByPoint(
      recentLocation.latitude,
      recentLocation.longitude,
    );
    return {
      ...summary,
      recentLocation: {
        ...recentLocation,
        farmName: farm,
      },
    };
  },
  async resolveFarmByPoint(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    const { data, error } = await supabaseRastreoTareas.rpc(
      "resolver_finca_por_punto_v2",
      { p_latitud: latitude, p_longitud: longitude },
    );
    if (error) return null;
    const farm = farmResolutionSchema.parse(data ?? [])[0] ?? null;
    return farm?.nombre ?? null;
  },
  async loadStops(
    code: string,
    filters: ReportFilters,
  ): Promise<EquipmentStops> {
    const { data, error } = await supabaseCapturaOperador.rpc(
      "rpc_reporte_equipo_paradas",
      { p_equipo: code, p_desde: filters.startDate, p_hasta: filters.endDate },
    );
    if (error)
      return throwRemoteError(
        error.message,
        "No se pudo cargar las paradas del equipo.",
      );
    return mapStops(stopsSchema.parse(data));
  },
  async loadMasterDetail(code: string): Promise<EquipmentMasterDetail | null> {
    const { data, error } = await supabaseEquipos.rpc(
      "rpc_reporte_equipo_detalle",
      { p_equipo: code },
    );
    if (error)
      return throwRemoteError(
        error.message,
        "No se pudo cargar el detalle del equipo.",
      );
    const detail = mapMaster(masterSchema.parse(data));
    if (!detail?.imagePath) return detail;
    const { data: signed, error: imageError } = await supabaseEquipos.storage
      .from("imagenes-equipos")
      .createSignedUrl(detail.imagePath, 600);
    if (imageError || !signed?.signedUrl) return detail;
    return { ...detail, imageUrl: signed.signedUrl };
  },
};
