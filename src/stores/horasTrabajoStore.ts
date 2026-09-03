import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { supabase } from "@/lib/supabase";
import { getLocalDateInputValue } from "./horasTrabajo.helpers";
import { horasTrabajoService } from "./horasTrabajo.service";
import { useMaintenanceStore } from "./maintenanceStore";
import { useUserStore } from "./userStore";
import { buildProductividadSemanalDashboardTables } from "./productividadSemanalDashboard";
import type {
  HoraTrabajoData,
  HorasPerdidasPersonalRow,
  PersonalDisponibilidadSemanalRow,
  ProductividadSemanalResponse,
  WorkOrderTodayRow,
  WorkOrderUpdatePayload,
} from "./horasTrabajo.types";
import type { ProductividadDashboardTableItem } from "./productividadSemanalDashboard.types";

export type {
  HoraTrabajoData,
  HorasPerdidasPersonalRow,
  PersonalDisponibilidadSemanalRow,
  ProductividadSemanalResponse,
  WorkOrderTodayRow,
  WorkOrderUpdatePayload,
};
export type { ProductividadDashboardTableItem } from "./productividadSemanalDashboard.types";

type DashboardRawRow = Record<string, unknown>;

const readString = (row: DashboardRawRow, key: string): string | undefined => {
  const value = row[key];
  return typeof value === "string" ? value : undefined;
};

const readNumber = (row: DashboardRawRow, key: string): number => {
  const value = row[key];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const useHorasTrabajoStore = defineStore("horasTrabajo", () => {
  const maintenanceStore = useMaintenanceStore();

  const data = ref<HoraTrabajoData[]>([]);
  const horasPerdidasPersonal = ref<HorasPerdidasPersonalRow[]>([]);
  const personalDisponibilidadSemanal = ref<PersonalDisponibilidadSemanalRow[]>(
    [],
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  const todayWorkOrders = ref<WorkOrderTodayRow[]>([]);
  const todayWorkOrdersLoading = ref(false);
  const todayWorkOrdersError = ref<string | null>(null);
  const todayWorkOrdersDate = ref(getLocalDateInputValue());

  const productividadSemanal = ref<ProductividadSemanalResponse | null>(null);
  const productividadSemanalLoading = ref(false);
  const productividadSemanalError = ref<string | null>(null);
  const productividadSemanalDashboardTablas = computed<
    ProductividadDashboardTableItem[]
  >(() =>
    buildProductividadSemanalDashboardTables({
      orders: maintenanceStore.allOrders,
      horasTrabajo: data.value,
      horasPerdidasPersonal: horasPerdidasPersonal.value,
      personalDisponibilidadSemanal: personalDisponibilidadSemanal.value,
      zafraOrderTotalsByArea: maintenanceStore.zafraOrderTotalsByArea,
      zafraOrderTotalsGeneral: maintenanceStore.zafraOrderTotalsGeneral,
      currentDate: new Date(),
      etapa: "ZAFRA",
    }),
  );

  const fetchDashboardTable = async (
    table: string,
    area: string | null,
  ): Promise<DashboardRawRow[]> => {
    const rows: DashboardRawRow[] = [];
    let from = 0;
    const limit = 1000;

    while (true) {
      let query = supabase
        .from(table)
        .select("*")
        .order("semana", { ascending: true });

      if (area) {
        query = query.ilike("area", area);
      }

      const { data: pageData, error: pageError } = await query.range(
        from,
        from + limit - 1,
      );

      if (pageError) throw pageError;
      if (!pageData || pageData.length === 0) break;

      rows.push(...(pageData as unknown as DashboardRawRow[]));
      if (pageData.length < limit) break;
      from += limit;
    }

    return rows;
  };

  const mapRetrasada = (
    row: DashboardRawRow,
    index: number,
  ): HoraTrabajoData => ({
    id_registro: `RET-${index}`,
    is_retrasada: true,
    area: readString(row, "area") || "Sin Área",
    equipo: readString(row, "equipo") || "Sin Equipo",
    estatus: "Retrasada",
    semana_inicio: String(row.semana || "0"),
    horas_calculadas: readNumber(row, "horas_retraso"),
    fecha_base: readString(row, "fecha"),
    descripcion_orden: readString(row, "descripcion_orden"),
    causa_retraso: readString(row, "causa"),
  });

  const mapOtroEstado = (
    row: DashboardRawRow,
    index: number,
  ): HoraTrabajoData => ({
    id_registro: `OTR-${index}`,
    is_retrasada: false,
    area: readString(row, "area") || "Sin Área",
    equipo: readString(row, "equipo") || "NO ASIGNADA",
    estatus: readString(row, "estado") || "Desconocido",
    semana_inicio: String(row.semana || "0"),
    horas_calculadas: readNumber(row, "horas_asignadas"),
  });

  const fetchData = async () => {
    loading.value = true;
    error.value = null;

    try {
      const userStore = useUserStore();
      const profile = await userStore.fetchCurrentUserProfile();
      const userArea = (profile?.area || userStore.getArea()).trim();

      if (!userArea) {
        throw new Error(
          "No se pudo identificar el área del usuario autenticado",
        );
      }

      const dashboardArea = userArea.toUpperCase() === "ALL" ? null : userArea;
      const [
        retrasadasData,
        otrosEstadosData,
        personalData,
        personalDisponibilidadData,
      ] = await Promise.all([
        fetchDashboardTable("vw_ot_retrasadas_dashboard", dashboardArea),
        fetchDashboardTable("vw_ot_otros_estados_dashboard", dashboardArea),
        horasTrabajoService.fetchHorasPerdidasPersonalSemanal(),
        horasTrabajoService.fetchPersonalDisponibilidadSemanal(),
      ]);

      const retrasadas = retrasadasData.map(mapRetrasada);
      const otrosEstados = otrosEstadosData.map((row, index) =>
        mapOtroEstado(row, retrasadas.length + index),
      );

      data.value = [...retrasadas, ...otrosEstados];
      horasPerdidasPersonal.value = personalData;
      personalDisponibilidadSemanal.value = personalDisponibilidadData;
    } catch (err) {
      console.error("Error fetching horas de trabajo:", err);
      error.value =
        err instanceof Error
          ? err.message
          : "There was an error loading the data.";
    } finally {
      loading.value = false;
    }
  };

  const fetchTodayWorkOrders = async (date = todayWorkOrdersDate.value) => {
    todayWorkOrdersLoading.value = true;
    todayWorkOrdersError.value = null;
    todayWorkOrdersDate.value = date;

    try {
      todayWorkOrders.value =
        await horasTrabajoService.fetchTodayWorkOrders(date);
    } catch (err) {
      todayWorkOrdersError.value =
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las órdenes de trabajo";
      throw err;
    } finally {
      todayWorkOrdersLoading.value = false;
    }
  };

  const fetchProductividadSemanalPorEquipo = async (
    semana: string,
    topLimit = 3,
  ) => {
    productividadSemanalLoading.value = true;
    productividadSemanalError.value = null;

    try {
      const response = await horasTrabajoService.fetchProductividadSemanal(
        semana,
        topLimit,
      );
      productividadSemanal.value = response;
      return response;
    } catch (err) {
      productividadSemanalError.value =
        err instanceof Error
          ? err.message
          : "No se pudo cargar la productividad semanal por equipo";
      throw err;
    } finally {
      productividadSemanalLoading.value = false;
    }
  };

  const updateWorkOrder = async (
    id: string,
    payload: WorkOrderUpdatePayload,
  ) => {
    const updated = await horasTrabajoService.updateWorkOrder(id, payload);
    const index = todayWorkOrders.value.findIndex((row) => row.idOt === id);

    if (index >= 0) {
      todayWorkOrders.value[index] = updated;
    }

    return updated;
  };

  const deleteWorkOrder = async (id: string) => {
    await horasTrabajoService.deleteWorkOrder(id);
    todayWorkOrders.value = todayWorkOrders.value.filter(
      (row) => row.idOt !== id,
    );
  };

  return {
    data,
    horasPerdidasPersonal,
    personalDisponibilidadSemanal,
    loading,
    error,
    todayWorkOrders,
    todayWorkOrdersLoading,
    todayWorkOrdersError,
    todayWorkOrdersDate,
    productividadSemanal,
    productividadSemanalLoading,
    productividadSemanalError,
    productividadSemanalDashboardTablas,
    fetchData,
    fetchTodayWorkOrders,
    fetchProductividadSemanalPorEquipo,
    updateWorkOrder,
    deleteWorkOrder,
  };
});
