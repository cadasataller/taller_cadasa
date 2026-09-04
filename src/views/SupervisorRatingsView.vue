<script setup lang="ts">
import { ref, computed, shallowRef, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { supabaseRatings, supabase } from "@/lib/supabase";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  Star,
  Tractor,
  HardHat,
  Truck,
  Loader2,
  X,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  SquarePen,
  Trash,
  Presentation,
} from "lucide-vue-next";
import { useRatingsStore } from "@/stores/ratingsStore";
import { useAssignedHoursStore } from "@/stores/assignedHoursStore";
import { useOmsgAssignmentComplianceStore } from "@/stores/omsgAssignmentComplianceStore";
import { useMecanicosStore } from "@/stores/db_mantenimiento/mecanicos/mecanicos.store";
import BaseKPI from "@/components/BaseKPI.vue";
import BaseInput from "@/components/BaseInput.vue";
import BaseToggle from "@/components/BaseToggle.vue";
import BaseRow from "@/components/BaseRow.vue";
import BaseButton from "@/components/BaseButton.vue";
import MeetingBatchPanel from "@/components/ratings/MeetingBatchPanel.vue";
import SupervisorOtCompliancePanel from "@/components/ratings/SupervisorOtCompliancePanel.vue";
import OmsgAssignmentCompliancePanel from "@/components/ratings/OmsgAssignmentCompliancePanel.vue";
import type { PuntuacionSupervisorOtArea } from "@/stores/ratingsStore.types";
import type { RatingsFetchScope } from "@/stores/ratingsStore.types";
import type { MecanicoMantenimiento } from "@/stores/db_mantenimiento/mecanicos/mecanicos.types";
import type { OmsgAssignmentComplianceItem } from "@/stores/omsgAssignmentCompliance.types";
import type {
  MeetingBatchDraftPayload,
  MeetingBatchItem,
} from "@/components/ratings/meetingBatch.types";
import {
  getMeetingAssignedWeekday,
  getMeetingBadgeLabel,
  getRelativeMeetingWeekdayLabel,
  mergeGeneralObservationWithMeetingBlock,
  parseMeetingObservation,
  resolveMeetingCriterionId,
  upsertMeetingObservationBlock,
} from "@/utils/meetingRatings";

type InspectionKind = "normal" | "meeting";

interface Inspeccion {
  visual_id: string;
  id_inspeccion: number;
  fecha: string;
  hora: string;
  foto_url: string;
  observacion: string;
  observacion_general: string;
  observacion_reunion: string;
  puntuacion_promedio: number;
  puntuacion_reunion: number | null;
  inspector_nombre: string;
  kind: InspectionKind;
  meetingBadgeLabel: string;
  assignedMeetingWeekday: string;
  meetingCriterionId: number | null;
}

interface InspGroup {
  label: string;
  items: Inspeccion[];
}

interface SupervisorScore {
  id: number;
  name: string;
  role: string;
  rating: number; // overall global rating just in case
  evalCount: number;
  inspecciones: Inspeccion[];
  filteredAvg?: number;
  groupedInsps?: InspGroup[];
  meetingWeekday: string;
  meetingRelativeWeekday: string;
}

interface MecanicoHorasAsignadas {
  name: string;
  total: number;
  isAssigned: boolean;
  items: any[];
}

type HorasAsignadasGrupo =
  | {
      isSG: true;
      name: string;
      total: number;
      mecanicos: MecanicoHorasAsignadas[];
    }
  | {
      isSG: false;
      name: string;
      total: number;
      isAssigned: boolean;
      items: any[];
    };

const MEETING_WEEKDAY_INDEX: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
};

const getDateWeekdayIndex = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return null;

  const weekday = date.getDay();
  return weekday === 0 ? 7 : weekday;
};

const getInspectionSortValue = (fecha: string, hora: string) => {
  const date = new Date(`${fecha}T${hora || "00:00"}`);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const buildMeetingObservationText = (
  supervisorObservation: string | undefined,
  managementObservation: string | undefined,
) => {
  const fragments = [
    supervisorObservation ? `Supervisor: ${supervisorObservation}` : "",
    managementObservation ? `Gerencia: ${managementObservation}` : "",
  ].filter(Boolean);

  return fragments.join(" | ");
};

const ratingsStore = useRatingsStore();
const assignedHoursStore = useAssignedHoursStore();
const omsgAssignmentComplianceStore = useOmsgAssignmentComplianceStore();
const mecanicosStore = useMecanicosStore();
const featureAccessStore = useFeatureAccessStore();
const {
  puntuacionSupervisoresOt,
  fechaPuntuacionSupervisoresOt,
  isPuntuacionSupervisoresOtLoading,
  errorPuntuacionSupervisoresOt,
} = storeToRefs(ratingsStore);
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const { mecanicosPorArea, isLoading: isMecanicosLoading } =
  storeToRefs(mecanicosStore);

const now = new Date();
const tzOffset = now.getTimezoneOffset() * 60000;
const todayDate = new Date(Date.now() - tzOffset).toISOString().split("T")[0];
const yesterdayDate = new Date(Date.now() - tzOffset - 86400000)
  .toISOString()
  .split("T")[0];

const d = new Date();
const day = d.getDay();
const diff = d.getDate() - day + (day === 0 ? -6 : 1);
const startOfWeek = new Date(new Date().setDate(diff))
  .toISOString()
  .split("T")[0];
const startOfLastWeek = new Date(new Date(startOfWeek).getTime() - 7 * 86400000)
  .toISOString()
  .split("T")[0];
const endOfLastWeek = new Date(new Date(startOfWeek).getTime() - 1 * 86400000)
  .toISOString()
  .split("T")[0];

const selectedDate = ref("");
const timeFilter = ref("Hoy");

const currentUserArea = ref("ALL");

const getDefaultTimeFilterForArea = (area: string) =>
  area !== "ALL" && area !== "EVALUADOR" ? "Esta semana" : "Hoy";

// Re-evaluate default filter once user role is loaded
watch(
  currentUserArea,
  (newArea) => {
    if (selectedDate.value) return;
    timeFilter.value = getDefaultTimeFilterForArea(newArea);
  },
  { immediate: true },
);

const getRatingsFetchScope = (): RatingsFetchScope => {
  if (selectedDate.value) {
    return {
      mode: "single-date",
      date: selectedDate.value,
    };
  }

  if (timeFilter.value === "Todas") {
    return { mode: "all" };
  }

  return {
    mode: "date-range",
    from: startOfLastWeek,
    to: todayDate,
  };
};

const setTimeFilter = async (f: string) => {
  if (f === "Ayer" && !canUsePreviousRatingsFilter.value) return;

  const previousFilter = timeFilter.value;
  const hadSelectedDate = selectedDate.value !== "";

  timeFilter.value = f;
  selectedDate.value = "";

  if (f === "Todas" || previousFilter === "Todas" || hadSelectedDate) {
    await loadData({ forceStore: true, background: true });
  }
};

const onDateSelect = async () => {
  if (!selectedDate.value) {
    timeFilter.value = getDefaultTimeFilterForArea(currentUserArea.value);
  } else {
    timeFilter.value = "Custom";
  }

  await loadData({ forceStore: true, background: true });
};

const showPhotosModal = ref(false);
const currentPhotos = ref<string[]>([]);
const openPhotos = (urlStr: string) => {
  if (!urlStr) return;
  currentPhotos.value = urlStr.split(",").filter((u) => u.trim() !== "");
  if (currentPhotos.value.length > 0) showPhotosModal.value = true;
};

const isLoading = ref(true);
const supervisors = ref<SupervisorScore[]>([]);

const currentUserName = ref("");
const currentUserEmail = ref("");
const router = useRouter();

const isRegularSup = computed(
  () =>
    currentUserArea.value !== "EVALUADOR" && currentUserArea.value !== "ALL",
);
const canDeleteRatings = computed(() => {
  return (
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad("calificaciones.eliminar")
  );
});
const deleteCandidateSupervisorName = computed(() => {
  if (!deleteCandidate.value) return "";

  return (
    supervisors.value.find((supervisor) =>
      supervisor.inspecciones.some(
        (inspection) =>
          inspection.id_inspeccion === deleteCandidate.value?.id_inspeccion,
      ),
    )?.name || "Desconocido"
  );
});

const filteredSupervisors = computed(() => {
  const yesterdayFilterDate = resolvedPreviousRatingsDate.value;

  let result = supervisors.value.map((sup) => {
    let filteredInsps = sup.inspecciones;

    if (selectedDate.value) {
      filteredInsps = filteredInsps.filter(
        (i) => i.fecha === selectedDate.value,
      );
    } else {
      if (timeFilter.value === "Hoy") {
        filteredInsps = filteredInsps.filter((i) => i.fecha === todayDate);
      } else if (timeFilter.value === "Ayer") {
        filteredInsps = yesterdayFilterDate
          ? filteredInsps.filter((i) => i.fecha === yesterdayFilterDate)
          : [];
      } else if (timeFilter.value === "Esta semana") {
        filteredInsps = filteredInsps.filter(
          (i) => i.fecha >= startOfWeek && i.fecha <= todayDate,
        );
      } else if (timeFilter.value === "Semana pasada") {
        filteredInsps = filteredInsps.filter(
          (i) => i.fecha >= startOfLastWeek && i.fecha <= endOfLastWeek,
        );
      }
    }

    const filteredAvg =
      filteredInsps.length > 0
        ? Number(
            (
              filteredInsps.reduce((acc, i) => acc + i.puntuacion_promedio, 0) /
              filteredInsps.length
            ).toFixed(1),
          )
        : 0;

    const groupsObj: Record<string, Inspeccion[]> = {};
    filteredInsps.forEach((i) => {
      let label = "";

      const isRegularSup =
        currentUserArea.value !== "EVALUADOR" &&
        currentUserArea.value !== "ALL";
      const isServiciosGenerales = sup.name
        .toUpperCase()
        .includes("SERVICIOS GENERALES");

      if (isRegularSup) {
        if (
          timeFilter.value === "Hoy" ||
          timeFilter.value === "Ayer" ||
          selectedDate.value !== ""
        ) {
          label = "Registros"; // Flat
        } else if (
          timeFilter.value === "Esta semana" ||
          timeFilter.value === "Semana pasada"
        ) {
          if (isServiciosGenerales) {
            // Group by day
            label = `Día ${i.fecha}`;
          } else {
            label = "Registros"; // Flat
          }
        } else {
          // timeFilter === 'Todas' -> group by week (default)
          const d = new Date(i.fecha + "T00:00:00");
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const start = new Date(new Date(d).setDate(diff));
          label = `Semana del ${start.toISOString().split("T")[0]}`;
        }
      } else {
        // DEFAULT logic for Evaluador and ALL: group by week
        const d = new Date(i.fecha + "T00:00:00");
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(new Date(d).setDate(diff));
        label = `Semana del ${start.toISOString().split("T")[0]}`;
      }

      if (!groupsObj[label]) groupsObj[label] = [];
      groupsObj[label].push(i);
    });

    const groupedInsps = Object.keys(groupsObj)
      .sort((a, b) => b.localeCompare(a))
      .map((k) => ({
        label: k,
        items: groupsObj[k],
      }));

    return { ...sup, inspecciones: filteredInsps, filteredAvg, groupedInsps };
  });

  if (timeFilter.value !== "Todas" || selectedDate.value !== "") {
    result = result.filter((sup) => sup.inspecciones.length > 0);
  }

  return result;
});

const availablePreviousRatingsDates = computed(() => {
  const dates = new Set<string>();

  supervisors.value.forEach((supervisor) => {
    supervisor.inspecciones.forEach((inspection) => {
      if (inspection.fecha && inspection.fecha < todayDate) {
        dates.add(inspection.fecha);
      }
    });
  });

  return Array.from(dates).sort((a, b) => b.localeCompare(a));
});

const resolvedPreviousRatingsDate = computed(() => {
  return availablePreviousRatingsDates.value[0] || "";
});

const previousRatingsButtonLabel = computed(() => {
  const resolvedDate = resolvedPreviousRatingsDate.value;

  if (!resolvedDate || resolvedDate === yesterdayDate) {
    return "Ayer";
  }

  const date = new Date(`${resolvedDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Ayer";
  }

  const formatted = new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);

  return formatted
    .replace(".", "")
    .split(" ")
    .map((part, index) =>
      index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part,
    )
    .join(" ");
});

const canManageMeetingBatch = computed(() => currentUserArea.value === "ALL");

const meetingBatchRange = computed(() => {
  if (selectedDate.value) {
    return {
      from: selectedDate.value,
      to: selectedDate.value,
      label: `Fecha ${selectedDate.value}`,
    };
  }

  if (timeFilter.value === "Semana pasada") {
    return {
      from: startOfLastWeek,
      to: endOfLastWeek,
      label: `Semana del ${startOfLastWeek} al ${endOfLastWeek}`,
    };
  }

  return {
    from: startOfWeek,
    to: todayDate,
    label: `Semana actual (${startOfWeek} a ${todayDate})`,
  };
});

const meetingBatchSavingBySupervisor = ref<Record<number, boolean>>({});
const meetingBatchErrorBySupervisor = ref<Record<number, string>>({});
const meetingBatchSuccessBySupervisor = ref<Record<number, string>>({});
const meetingBatchSuccessTimeouts = new Map<
  number,
  ReturnType<typeof setTimeout>
>();

const weeklyMeetingBatchItems = computed<MeetingBatchItem[]>(() => {
  const { from, to } = meetingBatchRange.value;
  const employees = ratingsStore.empleados;
  const rawInspections = ratingsStore.inspecciones;
  const details = ratingsStore.detalles;

  return supervisors.value
    .filter((supervisor) => supervisor.meetingWeekday !== "Sin asignar")
    .map((supervisor) => {
      const assignedWeekday = supervisor.meetingWeekday;
      const assignedWeekdayIndex =
        MEETING_WEEKDAY_INDEX[assignedWeekday] ?? null;

      const scopedInspections = rawInspections
        .filter((inspection) => {
          const inspectionSupervisorId =
            inspection.id_supervisor || inspection.supervisor_id;
          return (
            inspectionSupervisorId === supervisor.id &&
            inspection.fecha >= from &&
            inspection.fecha <= to
          );
        })
        .sort(
          (left, right) =>
            getInspectionSortValue(right.fecha, right.hora) -
            getInspectionSortValue(left.fecha, left.hora),
        );

      const inspectionWithMeeting = scopedInspections.find((inspection) => {
        const inspectionId = inspection.id_inspeccion || inspection.id || 0;

        return details.some(
          (detail) =>
            detail.id_inspeccion === inspectionId && detail.id_criterio === 5,
        );
      });

      const assignedDayInspection = scopedInspections.find(
        (inspection) =>
          assignedWeekdayIndex !== null &&
          getDateWeekdayIndex(inspection.fecha) === assignedWeekdayIndex,
      );

      const baseInspection =
        inspectionWithMeeting || assignedDayInspection || null;
      const inspectionId =
        baseInspection?.id_inspeccion || baseInspection?.id || null;
      const meetingDetail = inspectionId
        ? details.find(
            (detail) =>
              detail.id_inspeccion === inspectionId && detail.id_criterio === 5,
          )
        : null;
      const parsedObservation = parseMeetingObservation(
        baseInspection?.observacion || "",
      );
      const inspectorRecord = employees.find(
        (employee) =>
          employee.id_empleado ===
          (baseInspection?.id_inspector || baseInspection?.inspector_id),
      );

      return {
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        assignedMeetingWeekday: assignedWeekday,
        evaluatedDate: baseInspection?.fecha || null,
        inspectionId,
        inspectorId:
          baseInspection?.id_inspector || baseInspection?.inspector_id || null,
        inspectorName:
          inspectorRecord?.nombre_completo || "Sin inspector registrado",
        currentMeetingScore: meetingDetail?.puntuacion ?? null,
        supervisorObservation:
          parsedObservation.meetingObservation.supervisor || "",
        managementObservation:
          parsedObservation.meetingObservation.gerencia || "",
        originalObservation: baseInspection?.observacion || "",
        hasExistingMeeting: !!meetingDetail,
        hasBaseInspection: !!baseInspection,
      };
    });
});

const getInspectionDisplayScore = (inspection: Inspeccion) =>
  inspection.kind === "meeting"
    ? (inspection.puntuacion_reunion ?? 0)
    : inspection.puntuacion_promedio;

const getInspectionObservationText = (inspection: Inspeccion) =>
  inspection.kind === "meeting"
    ? inspection.observacion_reunion || "Sin observacion de reunion"
    : inspection.observacion_general || "Sin observaciones detalladas.";

const getInspectionRowClass = (inspection: Inspeccion) =>
  inspection.kind === "meeting"
    ? "bg-amber-50/70 border-amber-200 shadow-sm"
    : "bg-white rounded-lg shadow-sm border-gray-100";

// --- KPIs ---
const kpiData = computed(() => {
  let totalInsps = 0;
  let totalScoreAvg = 0;
  let excelentes = 0;
  let regular = 0;

  filteredSupervisors.value.forEach((sup) => {
    totalInsps += sup.inspecciones.length;
    sup.inspecciones.forEach((i) => {
      totalScoreAvg += i.puntuacion_promedio;
      if (i.puntuacion_promedio >= 4.5) excelentes++;
      else if (i.puntuacion_promedio > 0) regular++;
    });
  });

  const avg = totalInsps > 0 ? (totalScoreAvg / totalInsps).toFixed(1) : "0.0";

  return {
    avg,
    totalEvals: totalInsps,
    excelentes,
    regular,
  };
});

// --- Modal Nuevo/Editar Registro ---
const showModal = ref(false);
const modalLoading = ref(false);
const btnSaving = ref(false);
const errorMsg = ref("");
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const showMeetingModal = ref(false);
const showMeetingBatchModal = ref(false);
const meetingModalLoading = ref(false);
const meetingSaving = ref(false);
const meetingErrorMsg = ref("");
const meetingEditingInspection = ref<Inspeccion | null>(null);
const deleteCandidate = ref<Inspeccion | null>(null);
const deletingInspectionId = ref<number | null>(null);

const formEmpleados = ref<any[]>([]);
const formCriterios = ref<any[]>([]);
const formNiveles = ref<any[]>([]);
const meetingCriterionId = ref<number | null>(null);

const resolveMeetingCriterionIdFromCatalog = () => {
  meetingCriterionId.value = resolveMeetingCriterionId(formCriterios.value);
  return meetingCriterionId.value;
};

const supervisoresValidos = computed(() => {
  return formEmpleados.value.filter((e) =>
    e.rol?.toUpperCase().includes("SUPERVISOR"),
  );
});

const inspectoresValidos = computed(() => {
  return formEmpleados.value.filter(
    (e) =>
      e.rol?.toUpperCase().includes("EVALUADOR") ||
      e.rol?.toUpperCase().includes("INSPECTOR") ||
      e.rol?.toUpperCase().includes("ADMINISTRADOR"),
  );
});

const visibleDailyCriteria = computed(() => {
  return formCriterios.value.filter((criterio) => criterio.id_criterio !== 5);
});

const meetingCriterionDescription = computed(() => {
  return (
    formCriterios.value.find((criterio) => criterio.id_criterio === 5)
      ?.descripcion_tarea || "Calificacion de Reunion"
  );
});

const ensureRatingsCatalogsLoaded = async () => {
  let shouldLoadProfiles = false;

  if (formEmpleados.value.length === 0) {
    const { data: empleadosData, error } = await supabaseRatings
      .from("empleados")
      .select("*");
    if (error) throw error;
    formEmpleados.value = empleadosData || [];
    shouldLoadProfiles = true;
  }

  if (formNiveles.value.length === 0) {
    const { data: nivelesData, error } = await supabaseRatings
      .from("niveles_calificacion")
      .select("*")
      .order("puntuacion", { ascending: true });

    if (error) throw error;
    formNiveles.value = nivelesData || [];
  }

  if (formCriterios.value.length === 0) {
    const { data: criteriosData, error } = await supabaseRatings
      .from("criterios_evaluacion")
      .select("*");

    if (error) throw error;
    formCriterios.value = criteriosData || [];
  }

  if (shouldLoadProfiles) {
    await loadProfilesForForm(formEmpleados.value);
  }

  resolveMeetingCriterionIdFromCatalog();
};

const form = ref({
  fecha: new Date().toISOString().split("T")[0],
  hora: new Date()
    .toLocaleTimeString("en-GB", { hour12: false })
    .substring(0, 5),
  id_supervisor: "",
  id_inspector: "",
  observacion: "",
  detalles: {} as Record<number, number>, // id_criterio -> puntuacion (1 a 5)
});

const meetingForm = ref({
  fecha: new Date().toISOString().split("T")[0],
  hora: new Date()
    .toLocaleTimeString("en-GB", { hour12: false })
    .substring(0, 5),
  id_supervisor: "",
  id_inspector: "",
  puntuacion: 5,
  observacion: "",
});
const showMeetingSupervisorOptions = ref(false);

const getPreviousBusinessDate = (dateString: string) => {
  const baseDate = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(baseDate.getTime())) return dateString;

  const day = baseDate.getDay();
  const daysToSubtract = day === 1 ? 3 : 1;
  const previousDate = new Date(baseDate.getTime() - daysToSubtract * 86400000);
  const year = previousDate.getFullYear();
  const month = String(previousDate.getMonth() + 1).padStart(2, "0");
  const date = String(previousDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
};

const fechaCumplimientoOt = ref(getPreviousBusinessDate(form.value.fecha));

const actualAssignedHours = ref<any[]>([]);
const isAssignedHoursLoading = ref(false);
const activeSupervisorArea = ref("");
const omsgAssignmentComplianceItems = ref<OmsgAssignmentComplianceItem[]>([]);
const isOmsgAssignmentComplianceLoading = shallowRef(false);
const omsgAssignmentComplianceError = ref<string | null>(null);
const omsgAssignmentComplianceLoadedKey = ref("");

const selectedSupervisorForForm = computed(() => {
  if (!form.value.id_supervisor) return null;

  return (
    formEmpleados.value.find(
      (empleado) =>
        empleado.id_empleado.toString() === form.value.id_supervisor.toString(),
    ) || null
  );
});

const selectedSupervisorEmail = computed(() => {
  const supervisor = selectedSupervisorForForm.value;

  return (supervisor?.correo || supervisor?.email || "").toLowerCase().trim();
});

const selectedMeetingSupervisor = computed(() => {
  if (!meetingForm.value.id_supervisor) return null;

  return (
    formEmpleados.value.find(
      (empleado) =>
        empleado.id_empleado.toString() ===
        meetingForm.value.id_supervisor.toString(),
    ) || null
  );
});

const selectedMeetingAssignedWeekday = computed(() => {
  return getMeetingAssignedWeekday(
    selectedMeetingSupervisor.value?.correo ||
      selectedMeetingSupervisor.value?.email ||
      "",
  );
});

const meetingModalTitle = computed(() =>
  meetingEditingInspection.value ? "Editar Reunion" : "Nueva Reunion",
);

const meetingWeekdayOrder: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
  "Sin asignar": 99,
};

const meetingSupervisorOptions = computed(() => {
  return [...supervisoresValidos.value]
    .map((supervisor) => ({
      ...supervisor,
      meetingWeekday: getMeetingAssignedWeekday(
        supervisor.correo || supervisor.email || "",
      ),
      meetingRelativeWeekday: getRelativeMeetingWeekdayLabel(
        getMeetingAssignedWeekday(supervisor.correo || supervisor.email || ""),
      ),
    }))
    .sort((left, right) => {
      const weekdayDiff =
        (meetingWeekdayOrder[left.meetingWeekday] || 99) -
        (meetingWeekdayOrder[right.meetingWeekday] || 99);

      if (weekdayDiff !== 0) return weekdayDiff;

      return left.nombre_completo.localeCompare(right.nombre_completo);
    });
});

const selectedMeetingSupervisorOption = computed(() => {
  if (!meetingForm.value.id_supervisor) return null;

  return (
    meetingSupervisorOptions.value.find(
      (supervisor) =>
        supervisor.id_empleado.toString() ===
        meetingForm.value.id_supervisor.toString(),
    ) || null
  );
});

const selectedSupervisorOtArea = computed<PuntuacionSupervisorOtArea | null>(
  () => {
    const response = puntuacionSupervisoresOt.value;
    const email = selectedSupervisorEmail.value;

    if (!response?.ok || !email) return null;

    return (
      response.areas.find(
        (area) => (area.supervisor.email || "").toLowerCase().trim() === email,
      ) || null
    );
  },
);

const loadOtComplianceForDate = async (fecha: string) => {
  if (!fecha) return;
  if (
    fechaPuntuacionSupervisoresOt.value === fecha &&
    puntuacionSupervisoresOt.value
  )
    return;

  try {
    await ratingsStore.fetchPuntuacionSupervisoresOt(fecha);
  } catch (error) {
    console.error("Error cargando cumplimiento OT", error);
  }
};

const loadAssignedHours = async (force = false) => {
  if (!form.value.id_supervisor || !form.value.fecha) {
    actualAssignedHours.value = [];
    return;
  }

  isAssignedHoursLoading.value = true;
  try {
    const supervisor = formEmpleados.value.find(
      (e) => e.id_empleado.toString() === form.value.id_supervisor.toString(),
    );

    const email = supervisor?.correo || supervisor?.email || "";

    if (email) {
      const area = await assignedHoursStore.fetchSupervisorArea(email, force);
      activeSupervisorArea.value = area;
      if (area) {
        const [horasAsignadas] = await Promise.all([
          assignedHoursStore.fetchHours(area, form.value.fecha, force),
          mecanicosStore.cargarMecanicosActivosPorArea(area, force),
        ]);

        actualAssignedHours.value = horasAsignadas;
      } else {
        actualAssignedHours.value = [];
      }
    } else {
      actualAssignedHours.value = [];
    }
  } catch (e) {
    console.error(e);
  } finally {
    isAssignedHoursLoading.value = false;
  }
};

const loadOmsgAssignmentCompliance = async (force = false): Promise<void> => {
  if (!selectedSupervisorEmail.value || !form.value.fecha) {
    omsgAssignmentComplianceItems.value = [];
    return;
  }

  const nextKey = `${selectedSupervisorEmail.value}_${form.value.fecha}`;
  if (omsgAssignmentComplianceLoadedKey.value === nextKey && !force) return;

  isOmsgAssignmentComplianceLoading.value = true;
  omsgAssignmentComplianceError.value = null;

  try {
    omsgAssignmentComplianceItems.value =
      await omsgAssignmentComplianceStore.fetchCompliance(
        selectedSupervisorEmail.value,
        form.value.fecha,
        force,
      );
    omsgAssignmentComplianceLoadedKey.value = nextKey;
  } catch (error) {
    omsgAssignmentComplianceError.value =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el cumplimiento de asignación OMSG.";
  } finally {
    isOmsgAssignmentComplianceLoading.value = false;
  }
};

watch(
  () => [form.value.id_supervisor, form.value.fecha],
  () => {
    if (showModal.value && !modalLoading.value) {
      loadAssignedHours();
      loadOmsgAssignmentCompliance();
    }
  },
);

watch(
  () => form.value.fecha,
  (fecha) => {
    fechaCumplimientoOt.value = getPreviousBusinessDate(fecha);
  },
);

watch(
  () => [showModal.value, fechaCumplimientoOt.value] as const,
  ([isOpen, fecha]) => {
    if (!isOpen || !fecha) return;
    loadOtComplianceForDate(fecha);
  },
  { immediate: true },
);

const sgFilterEquipo = ref("");
const selectedExtraSupervisorIds = ref<string[]>([]);
const extraSupervisorScores = ref<Record<string, number>>({});
const extraSupervisorObs = ref<Record<string, string>>({});

const isServiciosGenerales = computed(
  () => activeSupervisorArea.value === "Servicios Generales",
);

const availableOtherSupervisors = computed(() => {
  return formEmpleados.value.filter((e) => {
    // Determine the area from API string or Store Cache reliably
    const cachedArea =
      e.email || e.correo
        ? assignedHoursStore.areaCache[e.email] ||
          assignedHoursStore.areaCache[e.correo]
        : "";
    const eArea = (e.area || cachedArea || "").toUpperCase();
    const eDept = (e.departamento || "").toUpperCase();
    const isSG =
      eArea.includes("SERVICIOS GENERALES") ||
      eDept.includes("SERVICIOS GENERALES");

    return (
      e.rol?.toUpperCase().includes("SUPERVISOR") &&
      e.id_empleado.toString() !== form.value.id_supervisor &&
      !isSG
    ); // Filter those who are NOT from Servicios Generales
  });
});

const setExtraScore = (id: string, score: number) => {
  extraSupervisorScores.value[id] = score;
};
const setExtraObs = (id: string, obs: string) => {
  extraSupervisorObs.value[id] = obs;
};

// Reset extra selections when main supervisor changes
watch(
  () => form.value.id_supervisor,
  () => {
    sgFilterEquipo.value = "";
    selectedExtraSupervisorIds.value = [];
    extraSupervisorScores.value = {};
    extraSupervisorObs.value = {};
  },
);

const criterion3Label = computed(() => {
  const c3 = formCriterios.value.find((c) => c.id_criterio === 3);
  return c3 ? c3.descripcion_tarea : "Trato al Cliente (3)";
});

const mecanicosActivosArea = computed(() => {
  if (!activeSupervisorArea.value) return [];

  return mecanicosPorArea.value[activeSupervisorArea.value] || [];
});

const normalizeText = (value: string | null | undefined) =>
  (value || "").trim().toLowerCase();

const getRowMecanicoId = (row: any) => {
  const mecanico = Array.isArray(row.MECANICOS)
    ? row.MECANICOS[0]
    : row.MECANICOS;

  return typeof mecanico?.id === "number" ? mecanico.id : null;
};

const getRowMecanicoNombre = (row: any) => {
  const mecanico = Array.isArray(row.MECANICOS)
    ? row.MECANICOS[0]
    : row.MECANICOS;

  return mecanico?.NOMBRE || "";
};

const rowBelongsToMecanico = (row: any, mecanico: MecanicoMantenimiento) => {
  const rowId = getRowMecanicoId(row);

  if (rowId !== null) {
    return rowId === mecanico.id;
  }

  return (
    normalizeText(getRowMecanicoNombre(row)) === normalizeText(mecanico.NOMBRE)
  );
};

const parseHoras = (value: unknown) => {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value || "0"));

  return Number.isFinite(parsed) ? parsed : 0;
};

const sgUniqueEquipos = computed(() => {
  if (activeSupervisorArea.value !== "Servicios Generales") return [];

  const equipos = new Set<string>();

  mecanicosActivosArea.value.forEach((mecanico) => {
    equipos.add(mecanico["EQUIPO DE TRABAJO"] || "Sin Equipo");
  });

  return Array.from(equipos).sort();
});

const groupedAssignedHours = computed<HorasAsignadasGrupo[]>(() => {
  const area = activeSupervisorArea.value;
  const mecanicos = mecanicosActivosArea.value;

  if (!area || mecanicos.length === 0) return [];

  if (area === "Servicios Generales") {
    const eMap = new Map<
      string,
      {
        isSG: true;
        name: string;
        total: number;
        mecanicos: Array<{
          name: string;
          total: number;
          isAssigned: boolean;
          items: any[];
        }>;
      }
    >();

    mecanicos.forEach((mecanico) => {
      const eq = mecanico["EQUIPO DE TRABAJO"] || "Sin Equipo";

      if (sgFilterEquipo.value && sgFilterEquipo.value !== eq) return;

      const items = actualAssignedHours.value.filter((row) =>
        rowBelongsToMecanico(row, mecanico),
      );
      const total = items.reduce(
        (acc, row) => acc + parseHoras(row["Duración (horas)"]),
        0,
      );
      const equipo = eMap.get(eq) || {
        isSG: true as const,
        name: eq,
        total: 0,
        mecanicos: [],
      };

      equipo.total += total;
      equipo.mecanicos.push({
        name: mecanico.NOMBRE || "Sin nombre",
        total,
        isAssigned: items.length > 0,
        items,
      });
      eMap.set(eq, equipo);
    });

    return Array.from(eMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  return mecanicos.map((mecanico) => {
    const items = actualAssignedHours.value.filter((row) =>
      rowBelongsToMecanico(row, mecanico),
    );
    const total = items.reduce(
      (acc, row) => acc + parseHoras(row["Duración (horas)"]),
      0,
    );

    return {
      isSG: false as const,
      name: mecanico.NOMBRE || "Sin nombre",
      total,
      isAssigned: items.length > 0,
      items,
    };
  });
});

const getCreatedDateKey = (value: string | null | undefined) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Panama",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

const createdDateBadgeClass = (value: string | null | undefined) => {
  const createdDate = getCreatedDateKey(value);

  if (!createdDate) return "text-gray-500";
  if (createdDate === form.value.fecha) return "text-rose-700";
  if (createdDate < form.value.fecha) return "text-emerald-700";

  return "text-amber-700";
};

const assignedHeaderClass = (isAssigned: boolean) =>
  isAssigned
    ? "bg-gray-50 text-gray-700 border-gray-100"
    : "bg-rose-50 text-rose-700 border-rose-100";

const assignedBadgeClass = (isAssigned: boolean) =>
  isAssigned
    ? "bg-white text-accent border-gray-100"
    : "bg-rose-100 text-rose-700 border-rose-200";

const assignedHoursBadgeClass = (isAssigned: boolean, total: number) => {
  if (!isAssigned) return "bg-rose-100 text-rose-700 border-rose-200";
  if (total === 8) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (total < 8) return "bg-rose-50 text-rose-700 border-rose-200";

  return "bg-orange-50 text-orange-700 border-orange-200";
};

const assignedBadgeText = (isAssigned: boolean, total: number) =>
  isAssigned ? `${total} hrs` : "No asignado";

const resolveTipoTrabajo = (row: any) => {
  if (row.ORDEN_MANTENIMIENTO && row.ORDEN_MANTENIMIENTO.Descripcion)
    return row.ORDEN_MANTENIMIENTO.Descripcion;
  if (row.OM_SG && row.OM_SG.trabajo_realizar)
    return row.OM_SG.trabajo_realizar;
  if (row.OM_SG?.ORDEN_MANTENIMIENTO?.Descripcion)
    return row.OM_SG.ORDEN_MANTENIMIENTO.Descripcion;
  return "Trabajo General";
};

const formatCreatedDate = (value: string | null | undefined) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const getPanamaParts = (targetDate: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Panama",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(targetDate);

    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value || "";

    return {
      day: getPart("day"),
      month: getPart("month"),
      year: getPart("year"),
      hours: getPart("hour"),
      minutes: getPart("minute"),
    };
  };

  const parts = getPanamaParts(date);
  const today = getPanamaParts(new Date());
  const yesterday = getPanamaParts(new Date(Date.now() - 86400000));
  const dateKey = `${parts.day}-${parts.month}-${parts.year}`;
  const time = `${parts.hours}:${parts.minutes}`;
  const todayKey = `${today.day}-${today.month}-${today.year}`;
  const yesterdayKey = `${yesterday.day}-${yesterday.month}-${yesterday.year}`;

  if (dateKey === todayKey) return `Hoy ${time}`;
  if (dateKey === yesterdayKey) return `Ayer ${time}`;

  return `${dateKey} ${time}`;
};
const filesToUpload = ref<File[]>([]);
const existingPhotos = ref<string[]>([]); // New variable to track existing photos when editing

const fileInput = ref<HTMLInputElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    // Almacena y suma las nuevas fotos a la lista existente
    filesToUpload.value = [...filesToUpload.value, ...Array.from(target.files)];
    // Limpia el input para permitir volver a cargar
    target.value = "";
  }
};

const removeFile = (index: number) => {
  filesToUpload.value.splice(index, 1);
};

const removeExistingPhoto = (index: number) => {
  existingPhotos.value.splice(index, 1);
};

const formatFileSize = (bytes: number) => {
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const loadProfilesForForm = async (emps: any[]) => {
  // Pre-load area cache for everyone so the computed properties have real area data immediately
  for (const e of emps) {
    if (e.rol?.toUpperCase().includes("SUPERVISOR")) {
      const email = e.correo || e.email || "";
      if (email) {
        await assignedHoursStore.fetchSupervisorArea(email);
      }
    }
  }
};

const openNewModal = async () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    fecha: new Date().toISOString().split("T")[0],
    hora: new Date()
      .toLocaleTimeString("en-GB", { hour12: false })
      .substring(0, 5),
    id_supervisor: "",
    id_inspector: "",
    observacion: "",
    detalles: {},
  };
  fechaCumplimientoOt.value = getPreviousBusinessDate(form.value.fecha);
  filesToUpload.value = []; // Reset files
  existingPhotos.value = [];

  // Try to use memory first to avoid loading spinner
  const hasData =
    formEmpleados.value.length > 0 &&
    formNiveles.value.length > 0 &&
    formCriterios.value.length > 0;

  if (!hasData) modalLoading.value = true;
  showModal.value = true;

  try {
    await ensureRatingsCatalogsLoaded();
    const emps = formEmpleados.value;

    if (emps) {
      // Pre-fill inspector based on email matching for EVALUADOR or ADMINISTRADOR
      if (
        ["EVALUADOR", "ADMINISTRADOR", "ALL"].includes(
          currentUserArea.value.toUpperCase(),
        )
      ) {
        const myEmpRecord = emps.find(
          (e) =>
            (e.email &&
              e.email.toLowerCase() === currentUserEmail.value.toLowerCase()) ||
            (e.correo &&
              e.correo.toLowerCase() === currentUserEmail.value.toLowerCase()),
        );
        if (myEmpRecord) {
          form.value.id_inspector = myEmpRecord.id_empleado.toString();
        }
      }
    }
    const niveles = formNiveles.value;
    const crits = formCriterios.value;

    if (crits) {
      visibleDailyCriteria.value.forEach((c) => {
        // Seleccionamos la puntuación más alta por defecto si hay niveles, si no 5
        form.value.detalles[c.id_criterio] =
          niveles && niveles.length > 0
            ? niveles[niveles.length - 1].puntuacion
            : 5;
      });
    }
  } catch (e) {
    console.error(e);
  } finally {
    modalLoading.value = false;
  }
};

const openEditModal = async (insp: any) => {
  isEditing.value = true;
  editingId.value = insp.id_inspeccion;
  filesToUpload.value = [];
  existingPhotos.value = insp.foto_url
    ? insp.foto_url.split(",").filter((u: string) => u.trim() !== "")
    : [];

  // Pree-fill initial known data
  const parsedObservation = parseMeetingObservation(insp.observacion || "");
  form.value = {
    fecha: insp.fecha,
    hora: insp.hora,
    id_supervisor: "",
    id_inspector: "",
    observacion: parsedObservation.generalObservation || "",
    detalles: {},
  };
  fechaCumplimientoOt.value = getPreviousBusinessDate(form.value.fecha);

  const hasData =
    formEmpleados.value.length > 0 &&
    formNiveles.value.length > 0 &&
    formCriterios.value.length > 0;

  if (!hasData) modalLoading.value = true;
  showModal.value = true;

  try {
    await ensureRatingsCatalogsLoaded();
    const emps = formEmpleados.value;

    if (emps) {
      // Find the right supervisor matching original DDL lookup
      const mainRecord = ratingsStore.inspecciones.find(
        (i) => (i.id_inspeccion || i.id) === insp.id_inspeccion,
      );
      if (mainRecord) {
        form.value.id_supervisor = (
          mainRecord.id_supervisor || mainRecord.supervisor_id
        ).toString();
        form.value.id_inspector = (
          mainRecord.id_inspector || mainRecord.inspector_id
        ).toString();
      }
    }
    const niveles = formNiveles.value;
    const crits = formCriterios.value;

    if (crits) {
      // Load actual details
      visibleDailyCriteria.value.forEach((c) => {
        const myDet = ratingsStore.detalles.find(
          (d) =>
            d.id_inspeccion === insp.id_inspeccion &&
            d.id_criterio === c.id_criterio,
        );
        if (myDet) {
          form.value.detalles[c.id_criterio] = myDet.puntuacion;
        } else {
          form.value.detalles[c.id_criterio] =
            niveles && niveles.length > 0
              ? niveles[niveles.length - 1].puntuacion
              : 5;
        }
      });
    }
  } catch (e) {
    console.error(e);
  } finally {
    modalLoading.value = false;
  }
};

const closeMeetingModal = () => {
  if (meetingSaving.value) return;
  resetMeetingModalState();
};

const resetMeetingModalState = () => {
  showMeetingModal.value = false;
  meetingErrorMsg.value = "";
  meetingEditingInspection.value = null;
  showMeetingSupervisorOptions.value = false;
};

const openNewMeetingModal = async () => {
  meetingErrorMsg.value = "";
  meetingEditingInspection.value = null;
  meetingForm.value = {
    fecha: new Date().toISOString().split("T")[0],
    hora: new Date()
      .toLocaleTimeString("en-GB", { hour12: false })
      .substring(0, 5),
    id_supervisor: "",
    id_inspector: "",
    puntuacion: formNiveles.value.at(-1)?.puntuacion || 5,
    observacion: "",
  };
  showMeetingSupervisorOptions.value = false;

  const hasData =
    formEmpleados.value.length > 0 &&
    formNiveles.value.length > 0 &&
    formCriterios.value.length > 0;
  if (!hasData) meetingModalLoading.value = true;
  showMeetingModal.value = true;

  try {
    await ensureRatingsCatalogsLoaded();

    const myEmpRecord = formEmpleados.value.find(
      (empleado) =>
        (empleado.email &&
          empleado.email.toLowerCase() ===
            currentUserEmail.value.toLowerCase()) ||
        (empleado.correo &&
          empleado.correo.toLowerCase() ===
            currentUserEmail.value.toLowerCase()),
    );

    if (myEmpRecord) {
      meetingForm.value.id_inspector = myEmpRecord.id_empleado.toString();
    }

    if (formNiveles.value.length > 0) {
      meetingForm.value.puntuacion =
        formNiveles.value[formNiveles.value.length - 1].puntuacion;
    }
  } catch (error: any) {
    meetingErrorMsg.value =
      error.message || "No se pudo preparar el formulario de reunion";
  } finally {
    meetingModalLoading.value = false;
  }
};

const openEditMeetingModal = async (inspection: Inspeccion) => {
  meetingErrorMsg.value = "";
  meetingEditingInspection.value = inspection;
  const parsedObservation = parseMeetingObservation(inspection.observacion);

  meetingForm.value = {
    fecha: inspection.fecha,
    hora: inspection.hora,
    id_supervisor: "",
    id_inspector: "",
    puntuacion:
      inspection.puntuacion_reunion ??
      formNiveles.value.at(-1)?.puntuacion ??
      5,
    observacion: parsedObservation.meetingObservation.supervisor || "",
  };
  showMeetingSupervisorOptions.value = false;

  const hasData =
    formEmpleados.value.length > 0 &&
    formNiveles.value.length > 0 &&
    formCriterios.value.length > 0;
  if (!hasData) meetingModalLoading.value = true;
  showMeetingModal.value = true;

  try {
    await ensureRatingsCatalogsLoaded();

    const mainRecord = ratingsStore.inspecciones.find(
      (item) => (item.id_inspeccion || item.id) === inspection.id_inspeccion,
    );

    if (mainRecord) {
      meetingForm.value.id_supervisor = String(
        mainRecord.id_supervisor || mainRecord.supervisor_id || "",
      );
      meetingForm.value.id_inspector = String(
        mainRecord.id_inspector || mainRecord.inspector_id || "",
      );
    }
  } catch (error: any) {
    meetingErrorMsg.value = error.message || "No se pudo cargar la reunion";
  } finally {
    meetingModalLoading.value = false;
  }
};

const saveMeeting = async () => {
  if (!meetingEditingInspection.value) {
    meetingErrorMsg.value =
      "La reunion debe asociarse a una inspeccion existente";
    return;
  }

  if (!meetingForm.value.id_supervisor || !meetingForm.value.id_inspector) {
    meetingErrorMsg.value =
      "Debe seleccionar supervisor e inspector para la reunion";
    return;
  }

  await ensureRatingsCatalogsLoaded();

  if (!meetingCriterionId.value) {
    meetingErrorMsg.value =
      "No se encontro el criterio dedicado de reunion en criterios_evaluacion";
    return;
  }

  meetingSaving.value = true;
  meetingErrorMsg.value = "";

  try {
    const originalObservation =
      meetingEditingInspection.value?.observacion || "";
    const mergedObservation = upsertMeetingObservationBlock(
      originalObservation,
      "supervisor",
      meetingForm.value.observacion,
    );

    await ratingsStore.upsertMeetingRating({
      inspectionId: meetingEditingInspection.value.id_inspeccion,
      fecha: meetingForm.value.fecha,
      hora: meetingForm.value.hora,
      id_supervisor: Number.parseInt(meetingForm.value.id_supervisor, 10),
      id_inspector: Number.parseInt(meetingForm.value.id_inspector, 10),
      meetingCriterionId: meetingCriterionId.value,
      puntuacion: meetingForm.value.puntuacion,
      observacion: mergedObservation,
    });

    resetMeetingModalState();
    await loadData({ forceStore: true, background: true });
  } catch (error: any) {
    meetingErrorMsg.value = error.message || "No se pudo guardar la reunion";
  } finally {
    meetingSaving.value = false;
  }
};

const saveMeetingBatchItem = async (payload: MeetingBatchDraftPayload) => {
  const batchItem = weeklyMeetingBatchItems.value.find(
    (item) => item.supervisorId === payload.supervisorId,
  );

  if (!batchItem) {
    return;
  }

  if (!batchItem.hasBaseInspection || !batchItem.inspectionId) {
    meetingBatchErrorBySupervisor.value = {
      ...meetingBatchErrorBySupervisor.value,
      [payload.supervisorId]:
        "No existe inspeccion diaria base para registrar la reunion en este rango.",
    };
    return;
  }

  await ensureRatingsCatalogsLoaded();

  if (!meetingCriterionId.value) {
    meetingBatchErrorBySupervisor.value = {
      ...meetingBatchErrorBySupervisor.value,
      [payload.supervisorId]: "No se encontró el criterio dedicado de reunión.",
    };
    return;
  }

  meetingBatchSavingBySupervisor.value = {
    ...meetingBatchSavingBySupervisor.value,
    [payload.supervisorId]: true,
  };
  meetingBatchErrorBySupervisor.value = {
    ...meetingBatchErrorBySupervisor.value,
    [payload.supervisorId]: "",
  };
  meetingBatchSuccessBySupervisor.value = {
    ...meetingBatchSuccessBySupervisor.value,
    [payload.supervisorId]: "",
  };

  try {
    const successMessage = batchItem.hasExistingMeeting
      ? "Reunión actualizada correctamente."
      : "Reunión creada correctamente.";
    const mergedObservation = upsertMeetingObservationBlock(
      batchItem.originalObservation,
      "gerencia",
      payload.observacionGerencia,
    );

    await ratingsStore.upsertMeetingRating({
      inspectionId: batchItem.inspectionId,
      fecha: batchItem.evaluatedDate || meetingBatchRange.value.to,
      hora: "00:00",
      id_supervisor: batchItem.supervisorId,
      id_inspector: batchItem.inspectorId || 0,
      meetingCriterionId: meetingCriterionId.value,
      puntuacion: payload.puntuacion,
      observacion: mergedObservation,
    });

    await loadData({ forceStore: true, background: true });
    meetingBatchSuccessBySupervisor.value = {
      ...meetingBatchSuccessBySupervisor.value,
      [payload.supervisorId]: successMessage,
    };

    const existingTimeout = meetingBatchSuccessTimeouts.get(
      payload.supervisorId,
    );
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(() => {
      meetingBatchSuccessBySupervisor.value = {
        ...meetingBatchSuccessBySupervisor.value,
        [payload.supervisorId]: "",
      };
      meetingBatchSuccessTimeouts.delete(payload.supervisorId);
    }, 3000);

    meetingBatchSuccessTimeouts.set(payload.supervisorId, timeoutId);
  } catch (error: any) {
    meetingBatchErrorBySupervisor.value = {
      ...meetingBatchErrorBySupervisor.value,
      [payload.supervisorId]:
        error.message || "No se pudo guardar la validación semanal de reunión.",
    };
    meetingBatchSuccessBySupervisor.value = {
      ...meetingBatchSuccessBySupervisor.value,
      [payload.supervisorId]: "",
    };
  } finally {
    meetingBatchSavingBySupervisor.value = {
      ...meetingBatchSavingBySupervisor.value,
      [payload.supervisorId]: false,
    };
  }
};

const saveInspeccion = async () => {
  if (!form.value.id_supervisor || !form.value.id_inspector) {
    errorMsg.value = "Debe seleccionar un Supervisor y un Inspector";
    return;
  }

  // Validate SG Extra Observables
  if (
    isServiciosGenerales.value &&
    selectedExtraSupervisorIds.value.length > 0
  ) {
    for (const supId of selectedExtraSupervisorIds.value) {
      if (
        !extraSupervisorObs.value[supId] ||
        extraSupervisorObs.value[supId].trim() === ""
      ) {
        errorMsg.value =
          "La observación es obligatoria para los supervisores extra (Apoyo SG).";
        return;
      }
    }
  }

  btnSaving.value = true;
  errorMsg.value = "";

  try {
    const uploadedUrls: string[] = [...existingPhotos.value]; // Keep old photos
    if (filesToUpload.value.length > 0) {
      for (const file of filesToUpload.value) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabaseRatings.storage
          .from("inspecciones_fotos")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Error upload:", uploadError);
          throw new Error(
            "Error subiendo imagen. Verifique que el bucket 'inspecciones_fotos' exista y sea público.",
          );
        }

        const { data: publicUrlData } = supabaseRatings.storage
          .from("inspecciones_fotos")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    const foto_url_string = uploadedUrls.join(",");

    let realId = editingId.value;
    const detallesPayload = Object.keys(form.value.detalles).map(
      (id_criterio) => ({
        id_inspeccion: realId || 0,
        id_criterio: parseInt(id_criterio),
        puntuacion: form.value.detalles[parseInt(id_criterio)],
      }),
    );

    if (isEditing.value && editingId.value) {
      const mainRecord = ratingsStore.inspecciones.find(
        (item) => (item.id_inspeccion || item.id) === editingId.value,
      );
      const mergedObservation = mergeGeneralObservationWithMeetingBlock(
        form.value.observacion,
        mainRecord?.observacion || "",
      );

      // Update Inspeccion
      const { error: errInsp } = await supabaseRatings
        .from("inspecciones")
        .update({
          fecha: form.value.fecha,
          hora: form.value.hora,
          observacion: mergedObservation,
          foto_url: foto_url_string || null,
          id_supervisor: parseInt(form.value.id_supervisor),
          id_inspector: parseInt(form.value.id_inspector),
        })
        .eq("id_inspeccion", editingId.value);

      if (errInsp) throw errInsp;
    } else {
      // Create New
      const id_inspeccion = Date.now();
      const { data: newInsp, error: errInsp } = await supabaseRatings
        .from("inspecciones")
        .insert({
          id_inspeccion,
          fecha: form.value.fecha,
          hora: form.value.hora,
          observacion: form.value.observacion,
          foto_url: foto_url_string || null,
          id_supervisor: parseInt(form.value.id_supervisor),
          id_inspector: parseInt(form.value.id_inspector),
        })
        .select()
        .single();

      if (errInsp) throw errInsp;
      realId = newInsp.id_inspeccion || newInsp.id;
    }

    if (!realId) {
      throw new Error("No se pudo resolver la inspeccion a actualizar");
    }

    const resolvedDetallesPayload = detallesPayload.map((detalle) => ({
      ...detalle,
      id_inspeccion: realId,
    }));

    if (isEditing.value && editingId.value) {
      const existingDailyDetails = ratingsStore.detalles.filter(
        (detalle) =>
          detalle.id_inspeccion === editingId.value &&
          visibleDailyCriteria.value.some(
            (criterio) => criterio.id_criterio === detalle.id_criterio,
          ),
      );

      const existingDetailIds = new Set(
        existingDailyDetails.map((detalle) => detalle.id_criterio),
      );
      const detallesToUpdate = resolvedDetallesPayload.filter((detalle) =>
        existingDetailIds.has(detalle.id_criterio),
      );
      const detallesToInsert = resolvedDetallesPayload.filter(
        (detalle) => !existingDetailIds.has(detalle.id_criterio),
      );

      await Promise.all(
        detallesToUpdate.map(async (detalle) => {
          const { error } = await supabaseRatings
            .from("inspecciones_detalle")
            .update({ puntuacion: detalle.puntuacion })
            .eq("id_inspeccion", realId)
            .eq("id_criterio", detalle.id_criterio);

          if (error) {
            throw error;
          }
        }),
      );

      if (detallesToInsert.length > 0) {
        const { error: errDetInsert } = await supabaseRatings
          .from("inspecciones_detalle")
          .insert(detallesToInsert);

        if (errDetInsert) throw errDetInsert;
      }
    } else {
      const { error: errDet } = await supabaseRatings
        .from("inspecciones_detalle")
        .insert(resolvedDetallesPayload);

      if (errDet) throw errDet;
    }

    // === SG EXTRA SUPERVISORS (TRATO AL CLIENTE #3) ===
    if (
      isServiciosGenerales.value &&
      selectedExtraSupervisorIds.value.length > 0
    ) {
      for (const [
        index,
        extraIdStr,
      ] of selectedExtraSupervisorIds.value.entries()) {
        const extraScore = extraSupervisorScores.value[extraIdStr] || 5;
        const extraObsRaw = (extraSupervisorObs.value[extraIdStr] || "").trim();
        const sgObsText = `[SG - ${extraObsRaw}]`;
        const extraId = parseInt(extraIdStr);

        // Find if there is an existing eval for this extraId today
        const existingInsp = ratingsStore.inspecciones.find(
          (i) =>
            (i.id_supervisor === extraId || i.supervisor_id === extraId) &&
            i.fecha === form.value.fecha,
        );

        if (existingInsp) {
          const existingId = existingInsp.id_inspeccion || existingInsp.id;
          const existingObs = existingInsp.observacion || "";

          // solo añade si no lo dice ya para no duplicar inmensamente si el usuario actualiza 2 veces.
          const newObs = existingObs.includes(sgObsText)
            ? existingObs
            : existingObs.length > 0
              ? `${existingObs}\n${sgObsText}`
              : sgObsText;

          // Update inspecciones table obs
          await supabaseRatings
            .from("inspecciones")
            .update({ observacion: newObs })
            .eq("id_inspeccion", existingId);

          const countRes = await supabaseRatings
            .from("inspecciones_detalle")
            .select("*", { count: "exact", head: true })
            .eq("id_inspeccion", existingId)
            .eq("id_criterio", 3);

          if ((countRes.count ?? 0) > 0) {
            await supabaseRatings
              .from("inspecciones_detalle")
              .update({ puntuacion: extraScore })
              .eq("id_inspeccion", existingId)
              .eq("id_criterio", 3);
          } else {
            await supabaseRatings.from("inspecciones_detalle").insert({
              id_inspeccion: existingId,
              id_criterio: 3,
              puntuacion: extraScore,
            });
          }
        } else {
          // Create New Inspection
          const newInspId = Date.now() + 1000 + index; // Simple offset
          const { data: newExtra, error: errExtra } = await supabaseRatings
            .from("inspecciones")
            .insert({
              id_inspeccion: newInspId,
              fecha: form.value.fecha,
              hora: form.value.hora,
              observacion: sgObsText,
              foto_url: null,
              id_supervisor: extraId,
              id_inspector: parseInt(form.value.id_inspector),
            })
            .select()
            .single();

          if (!errExtra && newExtra) {
            await supabaseRatings.from("inspecciones_detalle").insert({
              id_inspeccion: newExtra.id_inspeccion || newExtra.id,
              id_criterio: 3,
              puntuacion: extraScore,
            });
          }
        }
      }
    }

    showModal.value = false;
    await loadData({ forceStore: true, background: true });

    // Reset form
    form.value.observacion = "";
  } catch (e: any) {
    errorMsg.value = e.message || "Error guardando registro";
  } finally {
    btnSaving.value = false;
  }
};

const openDeleteModal = (insp: Inspeccion) => {
  if (!canDeleteRatings.value) return;

  deleteCandidate.value = insp;
};

const closeDeleteModal = () => {
  if (deletingInspectionId.value) return;
  deleteCandidate.value = null;
};

const removeInspectionFromSupervisors = (inspectionId: number) => {
  supervisors.value = supervisors.value
    .map((supervisor) => ({
      ...supervisor,
      inspecciones: supervisor.inspecciones.filter(
        (inspection) => inspection.id_inspeccion !== inspectionId,
      ),
    }))
    .filter((supervisor) => supervisor.inspecciones.length > 0);
};

const deleteInspeccion = async () => {
  if (!canDeleteRatings.value) return;
  if (!deleteCandidate.value) return;

  const inspectionId = deleteCandidate.value.id_inspeccion;
  deletingInspectionId.value = inspectionId;

  try {
    if (deleteCandidate.value.kind === "meeting") {
      if (!deleteCandidate.value.meetingCriterionId) {
        throw new Error(
          "No se encontro el criterio de reunion para eliminar el registro",
        );
      }

      await ratingsStore.deleteMeetingRating({
        inspectionId,
        meetingCriterionId: deleteCandidate.value.meetingCriterionId,
      });

      await loadData({ forceStore: true, background: true });
    } else {
      await ratingsStore.deleteInspection(inspectionId);
      removeInspectionFromSupervisors(inspectionId);
    }

    deleteCandidate.value = null;
  } catch (error) {
    console.error("Error eliminando inspección", error);
  } finally {
    deletingInspectionId.value = null;
  }
};

// --- Carga de datos principales ---

const loadData = async ({ forceStore = false, background = false } = {}) => {
  if (!background) isLoading.value = true;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      currentUserEmail.value = user.email || "";
      const { data: profile } = await supabase
        .from("PROFILE")
        .select("*")
        .eq("email", currentUserEmail.value)
        .maybeSingle();
      if (profile) {
        currentUserArea.value = profile.area?.toUpperCase() || "ALL";
        currentUserName.value = profile.nombre || "";
      }
    }

    await ensureRatingsCatalogsLoaded();
    await ratingsStore.fetchAll(forceStore, getRatingsFetchScope());

    let sups = ratingsStore.validSupervisors;
    const emps = ratingsStore.empleados;
    const inspecciones = ratingsStore.inspecciones;
    const detalles = ratingsStore.detalles;

    if (emps.length === 0) return;

    // Filtro estricto: Si el área no es EVALUADOR ni ALL, solo ve a sí mismo (filtrado por nombre o hipotetico email)
    if (
      currentUserArea.value !== "EVALUADOR" &&
      currentUserArea.value !== "ALL" &&
      currentUserEmail.value
    ) {
      sups = sups.filter((e: any) => {
        const isEmail =
          (e.email &&
            e.email.toLowerCase() === currentUserEmail.value.toLowerCase()) ||
          (e.correo &&
            e.correo.toLowerCase() === currentUserEmail.value.toLowerCase());
        const isName =
          e.nombre_completo &&
          currentUserName.value &&
          e.nombre_completo.toLowerCase() ===
            currentUserName.value.toLowerCase();
        return isEmail || isName;
      });
    }

    const mapped: SupervisorScore[] = sups.map((sup: any) => {
      // Normalizing ID references
      const myInspsRaw =
        inspecciones?.filter(
          (i: any) => (i.id_supervisor || i.supervisor_id) === sup.id_empleado,
        ) || [];

      let totalScoreGlobal = 0;
      let countGlobal = 0;

      const myInsps: Inspeccion[] = myInspsRaw.flatMap((insp: any) => {
        const inspId = insp.id_inspeccion || insp.id;
        const misDetalles =
          detalles?.filter((d: any) => d.id_inspeccion === inspId) || [];
        if (misDetalles.length === 0) return [];

        let scoreInsp = 0;
        misDetalles.forEach((d: any) => (scoreInsp += d.puntuacion));
        const avgInsp =
          misDetalles.length > 0
            ? Number((scoreInsp / misDetalles.length).toFixed(1))
            : 0;
        const parsedObservation = parseMeetingObservation(insp.observacion);
        const meetingDetail = meetingCriterionId.value
          ? misDetalles.find(
              (detalle: any) =>
                detalle.id_criterio === meetingCriterionId.value,
            )
          : null;
        const nonMeetingDetails = meetingCriterionId.value
          ? misDetalles.filter(
              (detalle: any) =>
                detalle.id_criterio !== meetingCriterionId.value,
            )
          : misDetalles;
        let normalScore = 0;
        nonMeetingDetails.forEach((detalle: any) => {
          normalScore += detalle.puntuacion;
        });
        const normalAvg =
          nonMeetingDetails.length > 0
            ? Number((normalScore / nonMeetingDetails.length).toFixed(1))
            : 0;

        totalScoreGlobal += scoreInsp;
        countGlobal += misDetalles.length;

        const inspector = emps.find(
          (e: any) =>
            e.id_empleado === (insp.id_inspector || insp.inspector_id),
        );
        const rows: Inspeccion[] = [];

        if (nonMeetingDetails.length > 0) {
          rows.push({
            visual_id: `${inspId}-normal`,
            id_inspeccion: inspId,
            fecha: insp.fecha,
            hora: insp.hora,
            foto_url: insp.foto_url,
            observacion: insp.observacion,
            observacion_general: parsedObservation.generalObservation,
            observacion_reunion: buildMeetingObservationText(
              parsedObservation.meetingObservation.supervisor,
              parsedObservation.meetingObservation.gerencia,
            ),
            puntuacion_promedio: normalAvg,
            puntuacion_reunion: meetingDetail?.puntuacion ?? null,
            inspector_nombre: inspector
              ? inspector.nombre_completo
              : "Desconocido",
            kind: "normal",
            meetingBadgeLabel: "",
            assignedMeetingWeekday: getMeetingAssignedWeekday(
              sup.correo || sup.email || "",
            ),
            meetingCriterionId: meetingDetail ? meetingCriterionId.value : null,
          });
        }

        if (meetingDetail) {
          rows.push({
            visual_id: `${inspId}-meeting`,
            id_inspeccion: inspId,
            fecha: insp.fecha,
            hora: insp.hora,
            foto_url: insp.foto_url,
            observacion: insp.observacion,
            observacion_general: parsedObservation.generalObservation,
            observacion_reunion: buildMeetingObservationText(
              parsedObservation.meetingObservation.supervisor,
              parsedObservation.meetingObservation.gerencia,
            ),
            puntuacion_promedio: avgInsp,
            puntuacion_reunion: meetingDetail.puntuacion ?? null,
            inspector_nombre: inspector
              ? inspector.nombre_completo
              : "Desconocido",
            kind: "meeting",
            meetingBadgeLabel: getMeetingBadgeLabel(
              selectedDate.value ? "Custom" : timeFilter.value,
              insp.fecha,
            ),
            assignedMeetingWeekday: getMeetingAssignedWeekday(
              sup.correo || sup.email || "",
            ),
            meetingCriterionId: meetingCriterionId.value,
          });
        }

        return rows;
      });

      const rating_global =
        countGlobal > 0
          ? Number((totalScoreGlobal / countGlobal).toFixed(1))
          : 0;

      return {
        id: sup.id_empleado,
        name: sup.nombre_completo,
        role: sup.rol,
        rating: rating_global,
        evalCount: myInsps.length,
        inspecciones: myInsps,
        meetingWeekday: getMeetingAssignedWeekday(
          sup.correo || sup.email || "",
        ),
        meetingRelativeWeekday: getRelativeMeetingWeekdayLabel(
          getMeetingAssignedWeekday(sup.correo || sup.email || ""),
        ),
      };
    });

    supervisors.value = mapped;
    meetingBatchErrorBySupervisor.value = {};
  } catch (error) {
    console.error("Error fetching data", error);
  } finally {
    isLoading.value = false;
  }
};

const canUsePreviousRatingsFilter = computed(() => {
  return resolvedPreviousRatingsDate.value !== "";
});

onMounted(() => {
  loadData();
  window.addEventListener("open-new-record", openNewModal);
});

onUnmounted(() => {
  window.removeEventListener("open-new-record", openNewModal);
  meetingBatchSuccessTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  meetingBatchSuccessTimeouts.clear();
});
</script>

<template>
  <div class="p-4 md:p-8 space-y-8 pb-32 md:pb-8">
    <!-- Header/Title -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl text-gray-900 tracking-tight">
          {{
            ["ALL", "EVALUADOR"].includes(currentUserArea)
              ? "Calificaciones de Supervisores"
              : "Tus Calificaciones"
          }}
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          v-if="['ALL', 'EVALUADOR'].includes(currentUserArea)"
          variant="outline"
          class="border-gray-200 text-gray-500 shadow-sm bg-white cursor-pointer hover:cursor-pointer"
          @click="
            router.push('/dashboard?slide=calificaciones&back=/calificaciones')
          "
          >Ver Dashboard</BaseButton
        >
        <BaseButton
          v-if="canManageMeetingBatch"
          variant="outline"
          class="border-gray-200 text-amber-700 shadow-sm bg-white cursor-pointer hover:bg-amber-50 hover:cursor-pointer"
          @click="showMeetingBatchModal = true"
        >
          Revisión Reunión
        </BaseButton>
        <BaseButton
          v-if="['ALL', 'EVALUADOR'].includes(currentUserArea)"
          variant="secondary"
          class="cursor-pointer hover:cursor-pointer"
          @click="openNewModal"
        >
          Nueva Calificación
        </BaseButton>
      </div>
    </div>

    <!-- Loader principal -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-main" />
    </div>

    <!-- Contenido cuando ya se cargó todo -->
    <div v-else>
      <!-- KPIs -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        <BaseKPI
          name="Promedio General"
          :value="kpiData.avg"
          color="border-accent"
        />
        <BaseKPI
          name="Total Evaluaciones"
          :value="kpiData.totalEvals.toString()"
          color="border-main"
        />
      </div>

      <!-- Main Split Layout -->
      <div class="flex flex-col gap-8 items-start">
        <!-- Main List Container -->
        <div
          class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col min-h-[600px] w-full"
        >
          <div
            class="p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between bg-gray-50/50 gap-4"
          >
            <div class="relative flex-1 w-full max-w-sm px-1 flex gap-2">
              <div class="relative flex-1">
                <span class="absolute left-4 top-2.5 text-gray-400">
                  <Search class="w-4 h-4" />
                </span>
                <input
                  v-model="selectedDate"
                  @change="onDateSelect"
                  type="date"
                  class="w-full pl-11 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-main focus:border-main bg-white"
                />
              </div>
              <button
                @click="loadData({ forceStore: true })"
                :disabled="isLoading"
                class="flex-shrink-0 p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-main transition-colors disabled:opacity-50"
                title="Actualizar datos"
              >
                <RefreshCw
                  class="w-4 h-4"
                  :class="isLoading ? 'animate-spin' : ''"
                />
              </button>
            </div>
            <div
              class="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0"
            >
              <button
                @click="setTimeFilter('Todas')"
                :class="
                  timeFilter === 'Todas'
                    ? 'bg-accent text-main-dark'
                    : 'bg-gray-200 text-gray-500'
                "
                class="px-3 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap transition-colors"
              >
                Todas
              </button>
              <button
                v-if="!isRegularSup"
                @click="setTimeFilter('Hoy')"
                :class="
                  timeFilter === 'Hoy'
                    ? 'bg-accent text-main-dark'
                    : 'bg-gray-200 text-gray-500'
                "
                class="px-3 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap transition-colors"
              >
                Hoy
              </button>
              <button
                v-if="!isRegularSup"
                @click="setTimeFilter('Ayer')"
                :disabled="!canUsePreviousRatingsFilter"
                :class="
                  timeFilter === 'Ayer'
                    ? 'bg-accent text-main-dark'
                    : 'bg-gray-200 text-gray-500'
                "
                class="px-3 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ previousRatingsButtonLabel }}
              </button>
              <button
                @click="setTimeFilter('Esta semana')"
                :class="
                  timeFilter === 'Esta semana'
                    ? 'bg-accent text-main-dark'
                    : 'bg-gray-200 text-gray-500'
                "
                class="px-3 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap transition-colors"
              >
                Esta semana
              </button>
              <button
                @click="setTimeFilter('Semana pasada')"
                :class="
                  timeFilter === 'Semana pasada'
                    ? 'bg-accent text-main-dark'
                    : 'bg-gray-200 text-gray-500'
                "
                class="px-3 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap transition-colors"
              >
                Semana pasada
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto bg-gray-50/30">
            <div
              v-for="supervisor in filteredSupervisors"
              :key="supervisor.id"
              class="mb-4"
            >
              <!-- Modo Administrador/Evaluador: Vista Plana para 1 registro en Hoy/Ayer O para Modo Normal -->
              <template
                v-if="
                  isRegularSup ||
                  ((timeFilter === 'Hoy' || timeFilter === 'Ayer') &&
                    supervisor.inspecciones.length === 1)
                "
              >
                <div
                  class="px-4 py-2 border border-gray-100 bg-white rounded-xl shadow-sm mb-2"
                >
                  <div
                    v-if="!isRegularSup"
                    class="mb-2 mt-2 flex items-center justify-between gap-3"
                  >
                    <h3 class="text-sm font-bold text-gray-800">
                      {{ supervisor.name }}
                    </h3>
                    <span
                      class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800"
                      :title="supervisor.meetingWeekday"
                    >
                      Reunion {{ supervisor.meetingRelativeWeekday }}
                    </span>
                  </div>
                  <div class="flex flex-col gap-4 mb-2">
                    <div
                      v-for="group in supervisor.groupedInsps"
                      :key="group.label"
                    >
                      <h4
                        v-if="group.label !== 'Registros'"
                        class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2"
                      >
                        {{ group.label }}
                      </h4>
                      <div class="divide-y divide-gray-100 flex flex-col gap-2">
                        <div
                          v-for="insp in group.items"
                          :key="insp.visual_id"
                          class="relative p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl"
                          :class="
                            insp.kind === 'meeting'
                              ? 'border-amber-200 bg-amber-50/70 shadow-sm'
                              : 'border-gray-100 bg-gray-50/50'
                          "
                        >
                          <div
                            v-if="deletingInspectionId === insp.id_inspeccion"
                            class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-[1px]"
                          >
                            <div
                              class="flex items-center gap-2 text-sm font-semibold text-rose-700"
                            >
                              <Loader2 class="w-4 h-4 animate-spin" />
                              Eliminando...
                            </div>
                          </div>
                          <div class="min-w-[150px]">
                            <p class="text-xs font-bold text-gray-900">
                              {{ insp.fecha }} &bull;
                              <span class="text-gray-500 font-medium">{{
                                insp.hora
                              }}</span>
                            </p>
                            <p class="text-[10px] text-gray-500 uppercase mt-1">
                              Inspector:
                              <span class="font-bold text-gray-700">{{
                                insp.inspector_nombre
                              }}</span>
                            </p>
                            <div
                              v-if="insp.kind === 'meeting'"
                              class="mt-2 flex flex-wrap gap-2"
                            >
                              <span
                                class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800"
                                >{{ insp.meetingBadgeLabel }}</span
                              >
                              <span
                                class="inline-flex items-center rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                                >Dia asignado:
                                {{ insp.assignedMeetingWeekday }}</span
                              >
                            </div>
                          </div>
                          <div
                            class="text-sm font-bold flex items-center gap-1 min-w-[70px]"
                            :class="
                              getInspectionDisplayScore(insp) >= 4.5
                                ? 'text-success'
                                : getInspectionDisplayScore(insp) >= 3
                                  ? 'text-main'
                                  : 'text-warning'
                            "
                          >
                            {{ getInspectionDisplayScore(insp) }}
                            <Star
                              class="w-3 h-3 inline pb-0.5"
                              :class="
                                getInspectionDisplayScore(insp) >= 4.5
                                  ? 'fill-success'
                                  : ''
                              "
                            />
                          </div>
                          <div
                            class="flex-1 px-2 md:px-6 text-xs text-gray-600 line-clamp-3"
                          >
                            {{ getInspectionObservationText(insp) }}
                          </div>
                          <div
                            class="flex-shrink-0 text-right flex items-center justify-end gap-2"
                          >
                            <BaseButton
                              v-if="!isRegularSup && canDeleteRatings"
                              variant="outline"
                              class="!py-1.5 !px-3 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer hover:cursor-pointer"
                              :disabled="
                                deletingInspectionId === insp.id_inspeccion
                              "
                              @click="openDeleteModal(insp)"
                            >
                              <Trash class="w-3.5 h-3.5" />
                            </BaseButton>
                            <BaseButton
                              v-if="
                                !isRegularSup &&
                                insp.kind !== 'meeting' &&
                                !insp.meetingCriterionId
                              "
                              variant="outline"
                              class="!py-1.5 !px-3 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer hover:cursor-pointer"
                              @click="openEditMeetingModal(insp)"
                            >
                              <Presentation class="w-3.5 h-3.5" />
                            </BaseButton>
                            <BaseButton
                              v-if="!isRegularSup"
                              variant="outline"
                              class="!py-1.5 !px-3 border-gray-200 cursor-pointer hover:cursor-pointer"
                              @click="
                                insp.kind === 'meeting'
                                  ? openEditMeetingModal(insp)
                                  : openEditModal(insp)
                              "
                            >
                              <SquarePen class="w-3.5 h-3.5" />
                            </BaseButton>
                            <BaseButton
                              v-if="insp.foto_url && insp.kind !== 'meeting'"
                              variant="secondary"
                              class="!py-1.5 !px-3 text-[10px] border-gray-200 cursor-pointer hover:cursor-pointer"
                              @click="openPhotos(insp.foto_url)"
                              >Ver Fotos</BaseButton
                            >
                            <span
                              v-else
                              class="text-[10px] text-gray-400 italic px-2"
                              >Sin registro visual</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      v-if="supervisor.inspecciones.length === 0"
                      class="text-xs text-gray-400 py-4 italic px-2 text-center bg-gray-50 rounded-lg"
                    >
                      No hay inspecciones para el filtro seleccionado.
                    </div>
                  </div>
                </div>
              </template>

              <!-- Modo Administrador/Evaluador: Expandible con Todos -->
              <template v-else>
                <BaseToggle
                  :title="supervisor.name"
                  :extra="`${supervisor.inspecciones.length} inspecciones`"
                >
                  <template #title-extra>
                    <div class="flex items-center gap-2 ml-2">
                      <span
                        class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800"
                        :title="supervisor.meetingWeekday"
                      >
                        Reunion {{ supervisor.meetingRelativeWeekday }}
                      </span>
                      <div
                        v-if="supervisor.inspecciones.length > 0"
                        class="text-sm font-bold flex items-center gap-1"
                        :class="
                          supervisor.filteredAvg >= 4.5
                            ? 'text-success'
                            : supervisor.filteredAvg >= 3
                              ? 'text-main'
                              : 'text-warning'
                        "
                      >
                        {{ supervisor.filteredAvg }}
                        <Star
                          class="w-3 h-3 inline pb-0.5"
                          :class="
                            supervisor.filteredAvg >= 4.5 ? 'fill-success' : ''
                          "
                        />
                      </div>
                    </div>
                  </template>
                  <div class="flex flex-col gap-4 mt-4">
                    <div
                      v-for="group in supervisor.groupedInsps"
                      :key="group.label"
                    >
                      <h4
                        v-if="group.label !== 'Registros'"
                        class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2"
                      >
                        {{ group.label }}
                      </h4>
                      <div class="divide-y divide-gray-100 flex flex-col gap-2">
                        <div
                          v-for="insp in group.items"
                          :key="insp.visual_id"
                          class="relative p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg"
                          :class="getInspectionRowClass(insp)"
                        >
                          <div
                            v-if="deletingInspectionId === insp.id_inspeccion"
                            class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-[1px]"
                          >
                            <div
                              class="flex items-center gap-2 text-sm font-semibold text-rose-700"
                            >
                              <Loader2 class="w-4 h-4 animate-spin" />
                              Eliminando...
                            </div>
                          </div>
                          <div class="min-w-[150px]">
                            <p class="text-xs font-bold text-gray-900">
                              {{ insp.fecha }} &bull;
                              <span class="text-gray-500 font-medium">{{
                                insp.hora
                              }}</span>
                            </p>
                            <p class="text-[10px] text-gray-500 uppercase mt-1">
                              Inspector:
                              <span class="font-bold text-gray-700">{{
                                insp.inspector_nombre
                              }}</span>
                            </p>
                            <div
                              v-if="insp.kind === 'meeting'"
                              class="mt-2 flex flex-wrap gap-2"
                            >
                              <span
                                class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800"
                                >{{ insp.meetingBadgeLabel }}</span
                              >
                              <span
                                class="inline-flex items-center rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                                >Dia asignado:
                                {{ insp.assignedMeetingWeekday }}</span
                              >
                            </div>
                          </div>
                          <div
                            class="text-sm font-bold flex items-center gap-1 min-w-[70px]"
                            :class="
                              getInspectionDisplayScore(insp) >= 4.5
                                ? 'text-success'
                                : getInspectionDisplayScore(insp) >= 3
                                  ? 'text-main'
                                  : 'text-warning'
                            "
                          >
                            {{ getInspectionDisplayScore(insp) }}
                            <Star
                              class="w-3 h-3 inline pb-0.5"
                              :class="
                                getInspectionDisplayScore(insp) >= 4.5
                                  ? 'fill-success'
                                  : ''
                              "
                            />
                          </div>
                          <div
                            class="flex-1 px-2 md:px-6 text-xs text-gray-600 line-clamp-3"
                          >
                            {{ getInspectionObservationText(insp) }}
                          </div>
                          <div
                            class="flex-shrink-0 text-right flex items-center justify-end gap-2"
                          >
                            <BaseButton
                              v-if="!isRegularSup && canDeleteRatings"
                              variant="outline"
                              class="!py-1.5 !px-3 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer hover:cursor-pointer"
                              :disabled="
                                deletingInspectionId === insp.id_inspeccion
                              "
                              @click="openDeleteModal(insp)"
                            >
                              <Trash class="w-3.5 h-3.5" />
                            </BaseButton>
                            <BaseButton
                              v-if="
                                !isRegularSup &&
                                insp.kind !== 'meeting' &&
                                !insp.meetingCriterionId
                              "
                              variant="outline"
                              class="!py-1.5 !px-3 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer hover:cursor-pointer"
                              @click="openEditMeetingModal(insp)"
                            >
                              <Presentation class="w-3.5 h-3.5" />
                            </BaseButton>
                            <BaseButton
                              v-if="!isRegularSup"
                              variant="outline"
                              class="!py-1.5 !px-3 border-gray-200 cursor-pointer hover:cursor-pointer"
                              @click="
                                insp.kind === 'meeting'
                                  ? openEditMeetingModal(insp)
                                  : openEditModal(insp)
                              "
                            >
                              <SquarePen class="w-3.5 h-3.5" />
                            </BaseButton>
                            <BaseButton
                              v-if="insp.foto_url && insp.kind !== 'meeting'"
                              variant="secondary"
                              class="!py-1.5 !px-3 text-[10px] border-gray-200 cursor-pointer hover:cursor-pointer"
                              @click="openPhotos(insp.foto_url)"
                              >Ver Fotos</BaseButton
                            >
                            <span
                              v-else
                              class="text-[10px] text-gray-400 italic px-2"
                              >Sin registro visual</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      v-if="supervisor.inspecciones.length === 0"
                      class="text-xs text-gray-400 py-4 italic px-2 text-center bg-gray-50 rounded-lg"
                    >
                      No hay inspecciones para el filtro seleccionado.
                    </div>
                  </div>
                </BaseToggle>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredSupervisors.length === 0"
        class="py-20 text-center w-full"
      >
        <Users class="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p class="text-gray-400 font-medium">
          No hay inspecciones para el filtro seleccionado
        </p>
      </div>
      <!-- Modal Ver Fotos -->
      <div
        v-if="showPhotosModal"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div
            class="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50"
          >
            <h3 class="font-display text-xl text-gray-900 tracking-tight">
              Fotos de la Inspección
            </h3>
            <button
              @click="showPhotosModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 overflow-y-auto flex-1 bg-gray-100/50">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <img
                v-for="(img, i) in currentPhotos"
                :key="i"
                :src="img"
                class="w-full h-auto rounded-lg shadow-sm border border-gray-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="showMeetingBatchModal"
        class="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="w-full max-w-5xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div
            class="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50"
          >
            <div>
              <h3 class="font-display text-xl text-gray-900 tracking-tight">
                Revisión Semanal de Reunión
              </h3>
            </div>
            <button
              @click="showMeetingBatchModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto flex-1 bg-gray-50/40">
            <MeetingBatchPanel
              :items="weeklyMeetingBatchItems"
              :levels="formNiveles"
              :is-saving-by-supervisor="meetingBatchSavingBySupervisor"
              :error-by-supervisor="meetingBatchErrorBySupervisor"
              :success-by-supervisor="meetingBatchSuccessBySupervisor"
              :range-label="meetingBatchRange.label"
              @save="saveMeetingBatchItem"
            />
          </div>

          <div
            class="px-6 py-4 border-t border-gray-100 bg-white flex justify-end"
          >
            <BaseButton
              variant="tertiary"
              @click="showMeetingBatchModal = false"
              >Cerrar</BaseButton
            >
          </div>
        </div>
      </div>

      <div
        v-if="showMeetingModal"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden"
        >
          <div
            class="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50"
          >
            <div>
              <h3 class="font-display text-xl text-gray-900 tracking-tight">
                {{ meetingModalTitle }}
              </h3>
              <p class="text-xs text-amber-700 font-medium mt-1">
                Este flujo solo modifica la puntuacion y observacion reservada
                de reunion.
              </p>
            </div>
            <button
              @click="closeMeetingModal"
              class="text-gray-400 hover:text-gray-600"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 space-y-5">
            <div v-if="meetingModalLoading" class="py-10 flex justify-center">
              <Loader2 class="w-8 h-8 animate-spin text-main" />
            </div>

            <template v-else>
              <div class="grid grid-cols-2 gap-4">
                <BaseInput
                  type="date"
                  v-model="meetingForm.fecha"
                  label="Fecha de Reunion"
                  :disabled="true"
                />
                <BaseInput
                  type="time"
                  v-model="meetingForm.hora"
                  label="Hora de Registro"
                  :disabled="true"
                />
              </div>

              <div class="grid grid-cols-2 gap-4 items-start">
                <div class="flex flex-col gap-1.5 relative">
                  <label class="text-xs font-medium text-gray-500 ml-1"
                    >Supervisor</label
                  >
                  <button
                    type="button"
                    :disabled="!!meetingEditingInspection"
                    class="w-full rounded-xl border px-4 py-2 text-left transition-all disabled:opacity-60"
                    :class="
                      showMeetingSupervisorOptions
                        ? 'border-amber-300 bg-amber-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-amber-200'
                    "
                    @click="
                      showMeetingSupervisorOptions =
                        !showMeetingSupervisorOptions
                    "
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div v-if="selectedMeetingSupervisorOption">
                        <p class="text-sm font-semibold text-gray-900">
                          {{ selectedMeetingSupervisorOption.nombre_completo }}
                        </p>
                      </div>
                      <p v-else class="text-sm text-gray-500">
                        Seleccione un supervisor...
                      </p>
                      <span
                        v-if="selectedMeetingSupervisorOption"
                        class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800"
                        :title="selectedMeetingSupervisorOption.meetingWeekday"
                      >
                        {{
                          selectedMeetingSupervisorOption.meetingRelativeWeekday
                        }}
                      </span>
                    </div>
                  </button>

                  <div
                    v-if="
                      showMeetingSupervisorOptions && !meetingEditingInspection
                    "
                    class="absolute left-0 right-0 top-full z-10 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl"
                  >
                    <button
                      v-for="emp in meetingSupervisorOptions"
                      :key="emp.id_empleado"
                      type="button"
                      class="w-full rounded-xl border px-4 py-3 text-left transition-all mb-2 last:mb-0"
                      :class="
                        meetingForm.id_supervisor.toString() ===
                        emp.id_empleado.toString()
                          ? 'border-amber-300 bg-amber-50 shadow-sm'
                          : 'border-transparent bg-white hover:border-amber-200 hover:bg-amber-50/40'
                      "
                      @click="
                        meetingForm.id_supervisor = emp.id_empleado.toString();
                        showMeetingSupervisorOptions = false;
                      "
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="text-sm font-semibold text-gray-900">
                            {{ emp.nombre_completo }}
                          </p>
                        </div>
                        <span
                          class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800"
                          :title="emp.meetingWeekday"
                        >
                          {{ emp.meetingRelativeWeekday }}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-gray-500 ml-1"
                    >Inspector</label
                  >
                  <select
                    v-model="meetingForm.id_inspector"
                    :disabled="
                      !!meetingEditingInspection ||
                      currentUserArea.toUpperCase() !== 'ALL'
                    "
                    class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg disabled:opacity-60"
                  >
                    <option value="" disabled>Seleccione...</option>
                    <option
                      v-for="emp in inspectoresValidos"
                      :key="emp.id_empleado"
                      :value="emp.id_empleado"
                    >
                      {{ emp.nombre_completo }}
                    </option>
                  </select>
                </div>
              </div>

              <div
                class="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5"
              >
                <div class="flex items-center justify-between gap-3 mb-2.5">
                  <div>
                    <p
                      class="text-[10px] uppercase tracking-widest font-bold text-amber-700"
                    >
                      {{ meetingCriterionDescription }}
                    </p>
                    <p class="text-sm text-gray-600 mt-1">
                      Dia asignado:
                      <span class="font-semibold text-gray-900">{{
                        selectedMeetingAssignedWeekday
                      }}</span>
                    </p>
                  </div>
                  <div class="text-lg font-bold text-amber-800">
                    {{ meetingForm.puntuacion }}
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="nivel in formNiveles"
                    :key="nivel.puntuacion"
                    type="button"
                    class="w-10 h-10 rounded-lg border text-sm font-bold transition-all"
                    :class="
                      meetingForm.puntuacion === nivel.puntuacion
                        ? 'border-amber-300 bg-amber-200 text-amber-900'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-amber-200 hover:text-amber-700'
                    "
                    @click="meetingForm.puntuacion = nivel.puntuacion"
                  >
                    {{ nivel.puntuacion }}
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-500 ml-1"
                  >Observacion de Reunion del Supervisor</label
                >
                <textarea
                  v-model="meetingForm.observacion"
                  rows="4"
                  placeholder="Registrar contexto puntual de la reunion..."
                  class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-main focus:border-main resize-none"
                ></textarea>
                <p class="text-[11px] text-gray-500">
                  Si lo dejas vacio, no se guardara el subbloque reservado de
                  supervisor.
                </p>
              </div>

              <div
                v-if="meetingErrorMsg"
                class="p-3 bg-danger-bg text-danger text-[11px] font-bold rounded-lg"
              >
                {{ meetingErrorMsg }}
              </div>
            </template>
          </div>

          <div
            class="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3"
          >
            <BaseButton
              variant="tertiary"
              :disabled="meetingSaving"
              @click="closeMeetingModal"
              >Cancelar</BaseButton
            >
            <BaseButton
              variant="primary"
              :disabled="meetingModalLoading || meetingSaving"
              @click="saveMeeting"
            >
              <span v-if="!meetingSaving">{{
                meetingEditingInspection
                  ? "Actualizar Reunion"
                  : "Guardar Reunion"
              }}</span>
              <span v-else class="flex items-center gap-2"
                ><Loader2 class="w-4 h-4 animate-spin" /> Procesando...</span
              >
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Modal Nuevo Registro -->
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh] max-h-[90vh]"
        >
          <div
            class="p-6 border-b border-gray-100 flex flex-none items-center justify-between bg-gray-50"
          >
            <h3 class="font-display text-xl text-gray-900 tracking-tight">
              {{ isEditing ? "Actualizar Inspección" : "Nueva Inspección" }}
            </h3>
            <button
              @click="showModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 overflow-hidden flex-1 min-h-0">
            <div v-if="modalLoading" class="py-10 flex justify-center">
              <Loader2 class="w-8 h-8 animate-spin text-main" />
            </div>

            <template v-else>
              <div
                class="grid h-full min-h-0 overflow-hidden gap-5 lg:grid-cols-[minmax(0,1fr)_420px]"
              >
                <div
                  class="min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-1 lg:pr-3 space-y-6"
                >
                  <!-- Basic Info -->
                  <div class="grid grid-cols-2 gap-4">
                    <BaseInput
                      type="date"
                      v-model="form.fecha"
                      label="Fecha de Inspección"
                    />
                    <BaseInput type="time" v-model="form.hora" label="Hora" />
                  </div>

                  <!-- Personnels -->
                  <div
                    id="inspector-selection-container"
                    class="grid grid-cols-2 gap-4"
                  >
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-medium text-gray-500 ml-1"
                        >Supervisor a Evaluar</label
                      >
                      <!-- Disabled if editing because changing IDs can break mappings depending on rules, but left open just logic. -->
                      <select
                        id="select-supervisor-evaluacion"
                        v-model="form.id_supervisor"
                        :disabled="isEditing"
                        class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-main focus:border-main disabled:opacity-50"
                      >
                        <option value="" disabled>Seleccione...</option>
                        <option
                          v-for="emp in supervisoresValidos"
                          :key="emp.id_empleado"
                          :value="emp.id_empleado"
                        >
                          {{ emp.nombre_completo }}
                        </option>
                      </select>
                      <p
                        v-if="supervisoresValidos.length === 0"
                        class="text-[10px] text-danger ml-1"
                      >
                        No hay empleados con rol SUPERVISOR.
                      </p>
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-medium text-gray-500 ml-1"
                        >Inspector</label
                      >
                      <select
                        id="select-inspector-evaluacion"
                        v-model="form.id_inspector"
                        :disabled="
                          isEditing ||
                          currentUserArea.toUpperCase() === 'EVALUADOR'
                        "
                        class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-main focus:border-main disabled:opacity-50"
                      >
                        <option value="" disabled>Seleccione...</option>
                        <option
                          v-for="emp in inspectoresValidos"
                          :key="emp.id_empleado"
                          :value="emp.id_empleado"
                        >
                          {{ emp.nombre_completo }}
                        </option>
                      </select>
                      <p
                        v-if="inspectoresValidos.length === 0"
                        class="text-[10px] text-danger ml-1"
                      >
                        No hay empleados con rol EVALUADOR o ADMINISTRADOR.
                      </p>
                    </div>
                  </div>

                  <!-- Criterios -->
                  <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p
                      class="text-[10px] uppercase font-bold text-gray-500 mb-4 tracking-widest"
                    >
                      Criterios a Evaluar
                    </p>
                    <div
                      v-if="formNiveles.length === 0"
                      class="text-xs text-warning font-bold"
                    >
                      Cargando niveles de calificación o tabla vacía...
                    </div>
                    <div class="space-y-4">
                      <div
                        v-for="criterio in visibleDailyCriteria"
                        :key="criterio.id_criterio"
                        class="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                      >
                        <span class="text-sm font-medium text-gray-700">{{
                          criterio.descripcion_tarea
                        }}</span>
                        <div class="flex items-center gap-1">
                          <button
                            v-for="nivel in formNiveles"
                            :key="nivel.puntuacion"
                            @click="
                              form.detalles[criterio.id_criterio] =
                                nivel.puntuacion
                            "
                            type="button"
                            :title="nivel.etiqueta"
                            class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm transition-all"
                            :class="
                              form.detalles[criterio.id_criterio] ===
                              nivel.puntuacion
                                ? 'bg-accent text-main-dark shadow-sm'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            "
                          >
                            {{ nivel.puntuacion }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Horas de Trabajo Asignadas (Mantenimiento) -->
                  <BaseToggle
                    v-if="form.id_supervisor && form.fecha"
                    title="Horas Asignadas (Mantenimiento)"
                    :extra="actualAssignedHours.length + ' Registros'"
                    :initiallyOpen="false"
                    class="border-main/20 ring-1 ring-main/10 shadow-sm"
                  >
                    <div class="px-2 py-2 flex flex-col gap-3">
                      <div
                        class="flex items-center justify-between pb-2 border-b border-gray-100"
                      >
                        <p
                          class="text-[10px] text-gray-500 font-bold uppercase tracking-widest"
                        >
                          Información proveniente de Sistema de Mantenimiento
                        </p>
                        <BaseButton
                          type="button"
                          variant="outline"
                          class="!py-1 !px-2 text-[10px] bg-white"
                          @click.stop="loadAssignedHours(true)"
                        >
                          <RefreshCw
                            v-if="isAssignedHoursLoading"
                            class="w-3 h-3 animate-spin mr-1 inline"
                          />
                          <RefreshCw v-else class="w-3 h-3 mr-1 inline" />
                          Actualizar de BD
                        </BaseButton>
                      </div>

                      <div
                        v-if="isAssignedHoursLoading || isMecanicosLoading"
                        class="py-6 flex justify-center"
                      >
                        <Loader2 class="w-5 h-5 animate-spin text-main" />
                      </div>
                      <div
                        v-else-if="groupedAssignedHours.length === 0"
                        class="py-4 text-center text-xs text-gray-400 italic bg-gray-50 rounded-lg"
                      >
                        No hay mecánicos activos para el área del supervisor
                        seleccionado.
                      </div>
                      <div v-else class="flex flex-col gap-4">
                        <!-- SG Equipo Filter -->
                        <div
                          v-if="
                            isServiciosGenerales && sgUniqueEquipos.length > 1
                          "
                          class="flex flex-wrap gap-2 pt-1 pb-2"
                        >
                          <label
                            class="px-3 py-1 flex items-center gap-1.5 border rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                            :class="
                              sgFilterEquipo === ''
                                ? 'bg-main text-white border-main'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            "
                          >
                            <input
                              type="radio"
                              value=""
                              v-model="sgFilterEquipo"
                              class="hidden"
                            />
                            Todos
                          </label>
                          <label
                            v-for="eq in sgUniqueEquipos"
                            :key="eq"
                            class="px-3 py-1 flex items-center gap-1.5 border rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                            :class="
                              sgFilterEquipo === eq
                                ? 'bg-accent text-main-dark border-accent-light'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            "
                          >
                            <input
                              type="radio"
                              :value="eq"
                              v-model="sgFilterEquipo"
                              class="hidden"
                            />
                            {{ eq }}
                          </label>
                        </div>

                        <div
                          v-for="(group, idx) in groupedAssignedHours"
                          :key="idx"
                          class="bg-white border text-sm border-gray-100 rounded-xl shadow-sm overflow-hidden"
                        >
                          <!-- For Servicios Generales (2 levels) -->
                          <template v-if="group.isSG">
                            <div
                              class="bg-gray-100/80 px-4 py-2 font-bold text-gray-800 flex justify-between items-center text-xs border-b border-gray-200"
                            >
                              <span class="uppercase tracking-wide text-main">{{
                                group.name
                              }}</span>
                              <span
                                class="bg-white px-2 py-0.5 rounded shadow-sm text-gray-600"
                                >{{ group.total }} hrs totales</span
                              >
                            </div>
                            <div
                              v-for="(mech, midx) in group.mecanicos"
                              :key="midx"
                              class="border-b last:border-0 border-gray-100"
                            >
                              <div
                                class="px-4 py-2 font-bold text-[11px] flex justify-between items-center border-b"
                                :class="assignedHeaderClass(mech.isAssigned)"
                              >
                                <span
                                  ><HardHat
                                    class="w-3 h-3 inline mr-1 text-gray-400 relative -top-[1px]"
                                  />
                                  {{ mech.name }}</span
                                >
                                <span
                                  class="px-2 py-0.5 rounded border text-[10px]"
                                  :class="
                                    assignedHoursBadgeClass(
                                      mech.isAssigned,
                                      mech.total,
                                    )
                                  "
                                >
                                  {{
                                    assignedBadgeText(
                                      mech.isAssigned,
                                      mech.total,
                                    )
                                  }}
                                </span>
                              </div>
                              <div class="divide-y divide-gray-50">
                                <div
                                  v-for="item in mech.items"
                                  :key="item.ID_OT"
                                  class="px-4 py-2 hover:bg-gray-50 flex items-center justify-between gap-4 text-xs group transition-colors"
                                >
                                  <div class="min-w-[120px] flex-1">
                                    <p
                                      class="font-medium text-gray-800 line-clamp-2"
                                      :title="resolveTipoTrabajo(item)"
                                    >
                                      {{ resolveTipoTrabajo(item) }}
                                    </p>
                                  </div>
                                  <div
                                    class="text-right flex flex-wrap items-center gap-2 md:gap-3 w-48 md:w-60 justify-end shrink-0"
                                  >
                                    <span class="font-bold text-main"
                                      >{{
                                        item["Duración (horas)"] || "0"
                                      }}h</span
                                    >
                                    <span
                                      class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm"
                                      :class="
                                        item.Estatus === 'Cerrada'
                                          ? 'bg-success/10 text-success'
                                          : 'bg-warning/10 text-warning'
                                      "
                                      >{{ item.Estatus || "Abierta" }}</span
                                    >
                                    <span
                                      v-if="formatCreatedDate(item.created)"
                                      class="text-[10px] font-bold whitespace-nowrap"
                                      :class="
                                        createdDateBadgeClass(item.created)
                                      "
                                    >
                                      {{ formatCreatedDate(item.created) }}
                                    </span>
                                  </div>
                                </div>
                                <div
                                  v-if="mech.items.length === 0"
                                  class="px-4 py-3 text-[11px] font-bold text-rose-600 bg-rose-50/60"
                                >
                                  No tiene OT asignadas para esta fecha.
                                </div>
                              </div>
                            </div>
                          </template>

                          <!-- For other areas (1 level) -->
                          <template v-else>
                            <div
                              class="px-4 py-2 font-bold flex justify-between items-center text-[11px] border-b"
                              :class="assignedHeaderClass(group.isAssigned)"
                            >
                              <span
                                ><HardHat
                                  class="w-3 h-3 inline mr-1 text-gray-500 relative -top-[1px]"
                                />
                                {{ group.name }}</span
                              >
                              <span
                                class="px-2 py-0.5 rounded border font-bold"
                                :class="
                                  assignedHoursBadgeClass(
                                    group.isAssigned,
                                    group.total,
                                  )
                                "
                              >
                                {{
                                  assignedBadgeText(
                                    group.isAssigned,
                                    group.total,
                                  )
                                }}
                              </span>
                            </div>
                            <div class="divide-y divide-gray-50">
                              <div
                                v-for="item in group.items"
                                :key="item.ID_OT"
                                class="px-4 py-2 hover:bg-gray-50 flex items-center justify-between gap-4 text-xs group transition-colors"
                              >
                                <div class="min-w-[120px] flex-1">
                                  <p
                                    class="font-medium text-gray-800 line-clamp-2"
                                    :title="resolveTipoTrabajo(item)"
                                  >
                                    {{ resolveTipoTrabajo(item) }}
                                  </p>
                                </div>
                                <div
                                  class="text-right flex flex-wrap items-center gap-2 md:gap-3 w-48 md:w-60 justify-end shrink-0"
                                >
                                  <span class="font-bold text-main"
                                    >{{
                                      item["Duración (horas)"] || "0"
                                    }}h</span
                                  >
                                  <span
                                    class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm"
                                    :class="
                                      item.Estatus === 'Cerrada'
                                        ? 'bg-success/10 text-success'
                                        : 'bg-warning/10 text-warning'
                                    "
                                    >{{ item.Estatus || "Abierta" }}</span
                                  >
                                  <span
                                    v-if="formatCreatedDate(item.created)"
                                    class="text-[10px] font-bold whitespace-nowrap"
                                    :class="createdDateBadgeClass(item.created)"
                                  >
                                    {{ formatCreatedDate(item.created) }}
                                  </span>
                                </div>
                              </div>
                              <div
                                v-if="group.items.length === 0"
                                class="px-4 py-3 text-[11px] font-bold text-rose-600 bg-rose-50/60"
                              >
                                No tiene OT asignadas para esta fecha.
                              </div>
                            </div>
                          </template>
                        </div>
                      </div>
                    </div>
                  </BaseToggle>

                  <OmsgAssignmentCompliancePanel
                    v-if="form.id_supervisor && form.fecha"
                    :items="omsgAssignmentComplianceItems"
                    :is-loading="isOmsgAssignmentComplianceLoading"
                    :error="omsgAssignmentComplianceError"
                    @load="loadOmsgAssignmentCompliance"
                  />

                  <div
                    v-if="form.id_supervisor && form.fecha"
                    class="lg:hidden"
                  >
                    <BaseInput
                      type="date"
                      v-model="fechaCumplimientoOt"
                      label="Fecha de Cumplimiento de Cierre"
                    />
                    <SupervisorOtCompliancePanel
                      class="mt-3"
                      mode="toggle"
                      :area="selectedSupervisorOtArea"
                      :fecha="fechaCumplimientoOt"
                      :is-loading="isPuntuacionSupervisoresOtLoading"
                      :error="errorPuntuacionSupervisoresOt"
                    />
                  </div>

                  <!-- Extra Supervisors (SG) -->
                  <BaseToggle
                    v-if="
                      form.id_supervisor && form.fecha && isServiciosGenerales
                    "
                    title="Calificar a otros Supervisores (Apoyo Servicio / Criterio #3)"
                    class="border-accent/40 ring-1 ring-accent/20 bg-accent/5 shadow-sm"
                    :initiallyOpen="false"
                  >
                    <div
                      class="px-4 py-3 flex flex-col gap-4 bg-white border-t border-accent/20 rounded-b-xl"
                    >
                      <p class="text-xs text-gray-500 italic mb-1">
                        Selecciona los supervisores de otras áreas que brindaron
                        atención a este trabajador de Servicios Generales hoy.
                        Se generará una evaluación de trato para el mismo.
                      </p>
                      <div
                        v-for="sup in availableOtherSupervisors"
                        :key="sup.id_empleado"
                        class="flex flex-col gap-2 p-2 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50/50"
                      >
                        <label
                          class="flex items-center gap-3 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            :value="sup.id_empleado.toString()"
                            v-model="selectedExtraSupervisorIds"
                            class="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent"
                          />
                          <span class="text-sm font-bold text-gray-800"
                            >{{ sup.nombre_completo }}
                            <span class="font-normal text-gray-500 text-xs ml-1"
                              >({{ sup.area }})</span
                            ></span
                          >
                        </label>

                        <div
                          v-if="
                            selectedExtraSupervisorIds.includes(
                              sup.id_empleado.toString(),
                            )
                          "
                          class="pl-7 mt-2 flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                          <!-- Criterio 3 -->
                          <div
                            class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <span class="text-xs font-bold text-gray-700">{{
                              criterion3Label
                            }}</span>
                            <div class="flex items-center gap-1">
                              <button
                                v-for="nivel in formNiveles"
                                :key="nivel.puntuacion"
                                @click="
                                  setExtraScore(
                                    sup.id_empleado.toString(),
                                    nivel.puntuacion,
                                  )
                                "
                                type="button"
                                :title="nivel.etiqueta"
                                class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm transition-all shadow-sm"
                                :class="
                                  extraSupervisorScores[
                                    sup.id_empleado.toString()
                                  ] === nivel.puntuacion
                                    ? 'bg-accent text-main-dark'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                "
                              >
                                {{ nivel.puntuacion }}
                              </button>
                            </div>
                          </div>

                          <!-- Observacion Extra -->
                          <div>
                            <label
                              class="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block"
                              >Observación (Requerida)</label
                            >
                            <textarea
                              :value="
                                extraSupervisorObs[
                                  sup.id_empleado.toString()
                                ] || ''
                              "
                              @input="
                                setExtraObs(
                                  sup.id_empleado.toString(),
                                  ($event.target as HTMLTextAreaElement).value,
                                )
                              "
                              rows="2"
                              placeholder="Detalle sobre el trato de este supervisor..."
                              class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none shadow-sm"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </BaseToggle>

                  <!-- Fotos y Observacion -->
                  <div class="space-y-4">
                    <!-- Existing Photos (when editing) -->
                    <div
                      v-if="isEditing && existingPhotos.length > 0"
                      class="flex flex-col gap-1.5 pt-2"
                    >
                      <label class="text-xs font-medium text-gray-500 ml-1"
                        >Fotos Actuales</label
                      >
                      <div
                        class="flex gap-4 overflow-x-auto p-2 border border-gray-100 rounded-lg bg-gray-50"
                      >
                        <div
                          v-for="(photo, idx) in existingPhotos"
                          :key="idx"
                          class="relative group flex-shrink-0 w-24 h-24 rounded overflow-hidden"
                        >
                          <img
                            :src="photo"
                            class="w-full h-full object-cover"
                          />
                          <div
                            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <button
                              @click="removeExistingPhoto(idx)"
                              title="Remover"
                              class="w-8 h-8 bg-white/20 rounded text-white hover:bg-danger/80 hover:text-white flex items-center justify-center transition-colors"
                            >
                              <X class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      class="flex flex-col gap-1.5 focus-within:ring-main-light transition-all"
                    >
                      <label class="text-xs font-medium text-gray-500 ml-1">{{
                        isEditing
                          ? "Adjuntar Nuevas Fotos"
                          : "Fotos de la Inspección"
                      }}</label>

                      <div class="flex gap-4">
                        <!-- Opción Archivos/Galería -->
                        <button
                          type="button"
                          @click="fileInput?.click()"
                          class="flex-1 flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-main hover:bg-main/5 transition-all group"
                        >
                          <ImageIcon
                            class="w-6 h-6 text-gray-300 group-hover:text-main"
                          />
                          <span
                            class="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-main"
                            >Galería / Archivos</span
                          >
                        </button>

                        <!-- Opción Cámara Directa -->
                        <button
                          type="button"
                          @click="cameraInput?.click()"
                          class="flex-1 flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
                        >
                          <Camera
                            class="w-6 h-6 text-gray-300 group-hover:text-accent"
                          />
                          <span
                            class="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-accent"
                            >Tomar Foto</span
                          >
                        </button>
                      </div>

                      <!-- Inputs Ocultos -->
                      <input
                        ref="fileInput"
                        type="file"
                        multiple
                        accept="image/*"
                        @change="handleFileUpload"
                        class="hidden"
                      />
                      <input
                        ref="cameraInput"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        @change="handleFileUpload"
                        class="hidden"
                      />

                      <div
                        v-if="filesToUpload.length > 0"
                        class="flex flex-col gap-2 mt-3 p-1 max-h-48 overflow-y-auto"
                      >
                        <div
                          v-for="(file, index) in filesToUpload"
                          :key="index"
                          class="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm shadow-sm"
                        >
                          <div
                            class="flex flex-col overflow-hidden max-w-[85%]"
                          >
                            <span
                              class="font-medium text-gray-700 truncate"
                              :title="file.name"
                              >{{ file.name }}</span
                            >
                            <span
                              class="text-[10px] text-gray-500 font-bold uppercase tracking-wider"
                              >{{ formatFileSize(file.size) }}</span
                            >
                          </div>
                          <button
                            type="button"
                            @click="removeFile(index)"
                            class="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                            title="Eliminar foto"
                          >
                            <X class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-medium text-gray-500 ml-1"
                        >Observaciones</label
                      >
                      <textarea
                        v-model="form.observacion"
                        rows="3"
                        placeholder="Detalles adicionales sobre la inspección..."
                        class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-main focus:border-main resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <div
                    v-if="errorMsg"
                    class="p-3 bg-danger-bg text-danger text-[11px] font-bold rounded-lg"
                  >
                    {{ errorMsg }}
                  </div>
                </div>

                <div
                  class="hidden lg:block min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-1"
                >
                  <div class="space-y-3">
                    <BaseInput
                      type="date"
                      v-model="fechaCumplimientoOt"
                      label="Fecha de Cumplimiento de Cierre"
                    />
                    <SupervisorOtCompliancePanel
                      :area="selectedSupervisorOtArea"
                      :fecha="fechaCumplimientoOt"
                      :is-loading="isPuntuacionSupervisoresOtLoading"
                      :error="errorPuntuacionSupervisoresOt"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div
            class="p-4 border-t border-gray-100 bg-white flex flex-none justify-end gap-3"
          >
            <BaseButton variant="tertiary" @click="showModal = false"
              >Cancelar</BaseButton
            >
            <BaseButton
              variant="primary"
              :disabled="modalLoading || btnSaving"
              @click="saveInspeccion"
            >
              <span v-if="!btnSaving">{{
                isEditing ? "Actualizar Inspección" : "Guardar Inspección"
              }}</span>
              <span v-else class="flex items-center gap-2"
                ><Loader2 class="w-4 h-4 animate-spin" /> Procesando...</span
              >
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="deleteCandidate"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
      >
        <div class="px-6 py-5 border-b border-gray-100">
          <h3 class="text-lg font-bold text-gray-900">
            {{
              deleteCandidate.kind === "meeting"
                ? "Reunion a eliminar"
                : "Calificación a eliminar"
            }}
          </h3>
        </div>
        <div class="px-6 py-4 text-sm text-gray-600 space-y-1">
          <p>
            <span class="font-semibold text-gray-800">Supervisor:</span>
            {{ deleteCandidateSupervisorName }}
          </p>
          <p>
            <span class="font-semibold text-gray-800">Puntuación:</span>
            {{ getInspectionDisplayScore(deleteCandidate) }}
          </p>
          <p>
            <span class="font-semibold text-gray-800">Fecha:</span>
            {{ deleteCandidate.fecha }}
          </p>
          <p>
            <span class="font-semibold text-gray-800">Hora:</span>
            {{ deleteCandidate.hora }}
          </p>
          <p>
            <span class="font-semibold text-gray-800">Inspector:</span>
            {{ deleteCandidate.inspector_nombre }}
          </p>
          <p
            v-if="deleteCandidate.kind === 'meeting'"
            class="pt-2 text-rose-700"
          >
            Se eliminara solo la reunion, su puntuacion y toda la observacion
            reservada de reunion. La inspeccion diaria base no se eliminara.
          </p>
        </div>
        <div
          class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50"
        >
          <BaseButton
            variant="tertiary"
            :disabled="!!deletingInspectionId"
            class="cursor-pointer"
            @click="closeDeleteModal"
            >Cancelar</BaseButton
          >
          <BaseButton
            variant="outline"
            class="border-rose-200 cursor-pointer text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            :disabled="!!deletingInspectionId"
            @click="deleteInspeccion"
          >
            <span v-if="!deletingInspectionId" class="flex items-center gap-2">
              <Trash class="w-4 h-4" />
              Eliminar
            </span>
            <span v-else class="flex items-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" />
              Eliminando...
            </span>
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
