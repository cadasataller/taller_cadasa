import { computed, ref, shallowRef, toRaw } from "vue";
import { defineStore } from "pinia";
import { validateTareaCreacionDraft } from "./tareaCreacion.validation";
import { toCrearTareaV2Params } from "./tareaCreacion.payload";
import { tareaCreacionService } from "./tareaCreacion.service";
import { toTareaCreacionRemoteError } from "./tareaCreacion.validation";
import type {
  TareaCreacionBloquesValidos,
  TareaCreacionBorrador,
  TareaCreacionCampoError,
  TareaCreacionErrorRemoto,
  TareaCreacionErrorValidacion,
  TareaCreacionEstadoEspacial,
  TareaCreacionEstadoFlujo,
  TareaCreacionModoGeometria,
  TareaCreacionRespuestaRpc,
  TareaCreacionTipo,
  TareaCreacionTrackerSeleccionado,
  TareaCreacionTrabajadorSeleccionado,
} from "./tareaCreacion.types";

const creationFieldOrder: TareaCreacionCampoError[] = [
  "type",
  "worker",
  "tracker",
  "instructions",
  "estimatedMinutes",
  "location",
  "routePoint",
  "controlLine",
  "controlZone",
  "route",
];

const emptyBlocks = (): TareaCreacionBloquesValidos => ({
  type: false,
  assignment: false,
  details: false,
  geometry: false,
  route: false,
});
const createDraft = (
  areaId: string | null,
  scheduledDate: string | null = null,
): TareaCreacionBorrador => ({
  areaId,
  type: null,
  worker: null,
  tracker: null,
  companions: [],
  details: {
    instructions: "",
    scheduledDate,
    priorityId: 1,
    estimatedMinutes: 60,
  },
  geometry: {
    locationId: null,
    routePoint: null,
    controlLine: null,
    controlZones: [],
  },
  route: { order: null },
  validBlocks: emptyBlocks(),
  submitStatus: "idle",
});
const copyDraft = (draft: TareaCreacionBorrador): TareaCreacionBorrador =>
  structuredClone(toRaw(draft));

export const useTareaCreacionStore = defineStore(
  "seguimiento_tareas_creacion",
  () => {
    const draft = ref<TareaCreacionBorrador>(createDraft(null));
    const originalDraft = ref<TareaCreacionBorrador>(copyDraft(draft.value));
    const isPanelOpen = shallowRef(false);
    const flowState = shallowRef<TareaCreacionEstadoFlujo>("idle");
    const validationErrors = ref<TareaCreacionErrorValidacion[]>([]);
    const remoteError = shallowRef<TareaCreacionErrorRemoto | null>(null);
    const geometryMode = shallowRef<TareaCreacionModoGeometria>(null);
    const spatialState = shallowRef<TareaCreacionEstadoEspacial>("idle");
    const lockedFarmId = shallowRef<string | null>(null);
    const isDiscardConfirmationOpen = shallowRef(false);
    const hasUnsavedChanges = computed(
      () => JSON.stringify(draft.value) !== JSON.stringify(originalDraft.value),
    );
    const isSubmitLocked = computed(() => flowState.value === "submitting");
    const canSubmit = computed(
      () =>
        !isSubmitLocked.value &&
        Object.values(draft.value.validBlocks).every(Boolean),
    );
    const needsGeometry = computed(
      () => draft.value.type !== null && !draft.value.validBlocks.geometry,
    );
    function refreshValidation(): void {
      const result = validateTareaCreacionDraft(draft.value);
      draft.value.validBlocks = result.validBlocks;
      const visibleField = validationErrors.value[0]?.field;
      if (!visibleField) return;
      const currentError = result.errors.find(
        (error) => error.field === visibleField,
      );
      validationErrors.value = currentError ? [currentError] : [];
    }
    function reportSkippedField(nextField: TareaCreacionCampoError): void {
      const result = validateTareaCreacionDraft(draft.value);
      draft.value.validBlocks = result.validBlocks;
      const nextFieldIndex = creationFieldOrder.indexOf(nextField);
      validationErrors.value = result.errors
        .filter(
          (error) =>
            creationFieldOrder.indexOf(error.field) >= 0 &&
            creationFieldOrder.indexOf(error.field) < nextFieldIndex,
        )
        .slice(0, 1);
    }
    function open(
      areaId: string | null,
      scheduledDate: string | null = null,
    ): void {
      draft.value = createDraft(areaId, scheduledDate);
      originalDraft.value = copyDraft(draft.value);
      validationErrors.value = [];
      remoteError.value = null;
      isDiscardConfirmationOpen.value = false;
      isPanelOpen.value = true;
      flowState.value = "editing";
      spatialState.value = "ready";
    }
    function openSpatial(
      areaId: string | null,
      scheduledDate: string | null = null,
    ): void {
      draft.value = createDraft(areaId, scheduledDate);
      originalDraft.value = copyDraft(draft.value);
      validationErrors.value = [];
      remoteError.value = null;
      isDiscardConfirmationOpen.value = false;
      isPanelOpen.value = false;
      flowState.value = "editing";
      spatialState.value = "selecting-route-point";
      geometryMode.value = "point";
      lockedFarmId.value = null;
    }
    function captureSpatialRoute(
      routePoint: TareaCreacionBorrador["geometry"]["routePoint"],
      controlLine: TareaCreacionBorrador["geometry"]["controlLine"],
    ): void {
      draft.value.geometry = {
        ...draft.value.geometry,
        routePoint,
        controlLine,
      };
      geometryMode.value = "zone";
      spatialState.value = "drawing-first-zone";
    }
    function completeSpatialSelection(
      type: TareaCreacionTipo,
      locationId: string | null,
      zone: TareaCreacionBorrador["geometry"]["controlZones"][number],
      routePoint: TareaCreacionBorrador["geometry"]["routePoint"],
      controlLine: TareaCreacionBorrador["geometry"]["controlLine"],
      lockToFarm: boolean,
    ): void {
      draft.value.type = type;
      draft.value.geometry = {
        locationId,
        routePoint,
        controlLine: type === "finca" ? controlLine : null,
        controlZones: [zone],
      };
      lockedFarmId.value = lockToFarm ? locationId : null;
      geometryMode.value = null;
      spatialState.value = "ready";
      isPanelOpen.value = true;
      refreshValidation();
    }
    function updateType(type: TareaCreacionTipo): void {
      draft.value.type = type;
      draft.value.geometry = {
        locationId: null,
        routePoint: null,
        controlLine: null,
        controlZones: [],
      };
      geometryMode.value = null;
      lockedFarmId.value = null;
      flowState.value = "editing";
      refreshValidation();
    }
    function updateWorker(
      worker: TareaCreacionTrabajadorSeleccionado | null,
    ): void {
      draft.value.worker = worker;
      refreshValidation();
    }
    function updateTracker(
      tracker: TareaCreacionTrackerSeleccionado | null,
    ): void {
      draft.value.tracker = tracker;
      refreshValidation();
    }
    function updateCompanions(names: string[]): void {
      const seenNames = new Set<string>();
      draft.value.companions = names.reduce<
        TareaCreacionBorrador["companions"]
      >((companions, name) => {
        const normalizedName = name.trim();
        const key = normalizedName.toLocaleLowerCase("es");
        if (!normalizedName || seenNames.has(key)) return companions;
        seenNames.add(key);
        companions.push({ name: normalizedName });
        return companions;
      }, []);
    }
    function updateDetails(
      next: Partial<TareaCreacionBorrador["details"]>,
    ): void {
      draft.value.details = { ...draft.value.details, ...next };
      refreshValidation();
    }
    function updateGeometry(
      next: Partial<TareaCreacionBorrador["geometry"]>,
    ): void {
      draft.value.geometry = { ...draft.value.geometry, ...next };
      remoteError.value = null;
      refreshValidation();
    }
    function updateRoute(order: number | null): void {
      draft.value.route = { order };
      remoteError.value = null;
      refreshValidation();
    }
    function beginGeometryEdit(
      mode: Exclude<TareaCreacionModoGeometria, null>,
    ): void {
      geometryMode.value = mode;
      remoteError.value = null;
    }
    function finishGeometryEdit(): void {
      geometryMode.value = null;
      refreshValidation();
    }
    async function submit(): Promise<TareaCreacionRespuestaRpc | null> {
      const result = validateTareaCreacionDraft(draft.value);
      draft.value.validBlocks = result.validBlocks;
      if (result.errors.length) {
        validationErrors.value = result.errors.slice(0, 1);
        flowState.value = "editing";
        return null;
      }
      validationErrors.value = [];
      flowState.value = "submitting";
      draft.value.submitStatus = "submitting";
      remoteError.value = null;
      try {
        const result = await tareaCreacionService.create(
          toCrearTareaV2Params(draft.value),
        );
        flowState.value = "success";
        draft.value.submitStatus = "success";
        originalDraft.value = copyDraft(draft.value);
        geometryMode.value = null;
        spatialState.value = "idle";
        lockedFarmId.value = null;
        isPanelOpen.value = false;
        return result;
      } catch (error) {
        remoteError.value = toTareaCreacionRemoteError(error);
        flowState.value = "error";
        draft.value.submitStatus = "error";
        return null;
      }
    }
    function requestClose(): boolean {
      if (isSubmitLocked.value) return false;
      if (hasUnsavedChanges.value) {
        isDiscardConfirmationOpen.value = true;
        return false;
      }
      close();
      return true;
    }
    function close(): void {
      isPanelOpen.value = false;
      isDiscardConfirmationOpen.value = false;
      flowState.value = "idle";
      spatialState.value = "idle";
      lockedFarmId.value = null;
    }
    function continueEditing(): void {
      isDiscardConfirmationOpen.value = false;
    }
    function discard(): void {
      draft.value = createDraft(null);
      originalDraft.value = copyDraft(draft.value);
      validationErrors.value = [];
      remoteError.value = null;
      close();
    }
    return {
      draft,
      isPanelOpen,
      flowState,
      validationErrors,
      remoteError,
      geometryMode,
      spatialState,
      lockedFarmId,
      isDiscardConfirmationOpen,
      hasUnsavedChanges,
      isSubmitLocked,
      canSubmit,
      needsGeometry,
      open,
      openSpatial,
      captureSpatialRoute,
      completeSpatialSelection,
      updateType,
      updateWorker,
      updateTracker,
      updateCompanions,
      updateDetails,
      updateGeometry,
      updateRoute,
      beginGeometryEdit,
      finishGeometryEdit,
      submit,
      requestClose,
      close,
      continueEditing,
      discard,
      refreshValidation,
      reportSkippedField,
    };
  },
);
