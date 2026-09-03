import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ratingsService } from "./ratingsStore.service";
import type {
  DeleteMeetingRatingPayload,
  RatingsAccessScope,
  RatingsFetchScope,
  PuntuacionSupervisoresOtResponse,
  RatingsDetalle,
  RatingsEmpleado,
  RatingsInspeccion,
  RatingsInspeccionNormalizada,
  UpsertMeetingRatingPayload,
} from "./ratingsStore.types";

export const useRatingsStore = defineStore("ratings", () => {
  const empleados = ref<RatingsEmpleado[]>([]);
  const inspecciones = ref<RatingsInspeccion[]>([]);
  const detalles = ref<RatingsDetalle[]>([]);
  const puntuacionSupervisoresOt = ref<PuntuacionSupervisoresOtResponse | null>(
    null,
  );
  const fechaPuntuacionSupervisoresOt = ref<string | null>(null);

  const isLoaded = ref(false);
  const isLoading = ref(false);
  const isPuntuacionSupervisoresOtLoading = ref(false);
  const errorPuntuacionSupervisoresOt = ref<string | null>(null);
  const loadedScopeKey = ref("");

  const fetchAll = async (
    force = false,
    scope: RatingsFetchScope = { mode: "all" },
    access: RatingsAccessScope = { mode: "all" },
  ) => {
    const nextScopeKey = JSON.stringify({ scope, access });

    if (isLoaded.value && !force && loadedScopeKey.value === nextScopeKey)
      return;

    isLoading.value = true;
    try {
      const [empleadosData, inspeccionesData] =
        access.mode === "all"
          ? await Promise.all([
              ratingsService.fetchEmpleados(),
              ratingsService.fetchInspecciones(scope),
            ])
          : await loadCurrentEmployeeRatings(scope, access.email);
      const detallesData = await ratingsService.fetchDetalles(
        inspeccionesData.map(
          (inspeccion) => inspeccion.id_inspeccion || inspeccion.id || 0,
        ),
      );

      empleados.value = empleadosData;
      inspecciones.value = inspeccionesData;
      detalles.value = detallesData;

      isLoaded.value = true;
      loadedScopeKey.value = nextScopeKey;
    } catch (e) {
      console.error("Error fetching ratings state", e);
    } finally {
      isLoading.value = false;
    }
  };

  const loadCurrentEmployeeRatings = async (
    scope: RatingsFetchScope,
    email: string,
  ): Promise<[RatingsEmpleado[], RatingsInspeccion[]]> => {
    const employee = await ratingsService.fetchEmpleadoActivoPorEmail(email);

    if (!employee) {
      return [[], []];
    }

    const inspections = await ratingsService.fetchInspecciones(
      scope,
      employee.id_empleado,
    );

    return [[employee], inspections];
  };

  const fetchPuntuacionSupervisoresOt = async (
    fecha: string,
    force = false,
  ): Promise<PuntuacionSupervisoresOtResponse> => {
    if (
      puntuacionSupervisoresOt.value &&
      fechaPuntuacionSupervisoresOt.value === fecha &&
      !force
    ) {
      return puntuacionSupervisoresOt.value;
    }

    isPuntuacionSupervisoresOtLoading.value = true;
    errorPuntuacionSupervisoresOt.value = null;

    try {
      const response =
        await ratingsService.fetchPuntuacionSupervisoresOt(fecha);
      puntuacionSupervisoresOt.value = response;
      fechaPuntuacionSupervisoresOt.value = fecha;

      if (!response.ok) {
        errorPuntuacionSupervisoresOt.value = response.error;
      }

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cargar la puntuación de supervisores OT";

      errorPuntuacionSupervisoresOt.value = message;
      throw error;
    } finally {
      isPuntuacionSupervisoresOtLoading.value = false;
    }
  };

  const normalizedInspections = computed<RatingsInspeccionNormalizada[]>(() => {
    return inspecciones.value.map((insp) => {
      const inspId = insp.id_inspeccion || insp.id;
      const misDetalles = detalles.value.filter(
        (d) => d.id_inspeccion === inspId,
      );

      let sum = 0;
      let count = 0;
      misDetalles.forEach((d) => {
        if (typeof d.puntuacion === "number") {
          sum += d.puntuacion;
          count++;
        }
      });
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;

      return {
        ...insp,
        final_supervisor_id: insp.id_supervisor || insp.supervisor_id || 0,
        final_inspector_id: insp.id_inspector || insp.inspector_id || 0,
        puntuacion_promedio: avg,
        id_inspeccion: inspId || 0,
      };
    });
  });

  const validSupervisors = computed(() => {
    return empleados.value.filter(
      (e) => e.rol && e.rol.toLowerCase().trim() === "supervisor",
    );
  });

  const removeInspectionFromState = (inspectionId: number) => {
    inspecciones.value = inspecciones.value.filter((insp) => {
      const currentInspectionId = insp.id_inspeccion || insp.id || 0;
      return currentInspectionId !== inspectionId;
    });

    detalles.value = detalles.value.filter(
      (detalle) => detalle.id_inspeccion !== inspectionId,
    );
  };

  const deleteInspection = async (inspectionId: number) => {
    await ratingsService.deleteInspeccion(inspectionId);
    removeInspectionFromState(inspectionId);
  };

  const upsertMeetingRating = async (payload: UpsertMeetingRatingPayload) => {
    return ratingsService.upsertMeetingRating(payload);
  };

  const deleteMeetingRating = async (payload: DeleteMeetingRatingPayload) => {
    await ratingsService.deleteMeetingRating(payload);
  };

  return {
    empleados,
    inspecciones,
    detalles,
    puntuacionSupervisoresOt,
    fechaPuntuacionSupervisoresOt,
    isLoaded,
    isLoading,
    isPuntuacionSupervisoresOtLoading,
    errorPuntuacionSupervisoresOt,
    fetchAll,
    fetchPuntuacionSupervisoresOt,
    deleteInspection,
    upsertMeetingRating,
    deleteMeetingRating,
    normalizedInspections,
    validSupervisors,
  };
});
