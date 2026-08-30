import { computed, ref, shallowRef, toRaw } from "vue";
import { defineStore } from "pinia";
import { validateTareaCreacionDraft } from "./tareaCreacion.validation";
import type {
  TareaCreacionBloquesValidos,
  TareaCreacionBorrador,
  TareaCreacionErrorRemoto,
  TareaCreacionErrorValidacion,
  TareaCreacionEstadoFlujo,
  TareaCreacionTipo,
  TareaCreacionTrackerSeleccionado,
  TareaCreacionTrabajadorSeleccionado,
} from "./tareaCreacion.types";

const emptyBlocks = (): TareaCreacionBloquesValidos => ({
  type: false,
  assignment: false,
  details: false,
  geometry: false,
  route: false,
});
const createDraft = (areaId: string | null): TareaCreacionBorrador => ({
  areaId,
  type: null,
  worker: null,
  tracker: null,
  companion: null,
  details: {
    instructions: "",
    scheduledDate: null,
    priorityId: null,
    estimatedMinutes: 60,
  },
  geometry: {
    locationId: null,
    routePoint: null,
    controlLine: null,
    controlZone: null,
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
    const isDiscardConfirmationOpen = shallowRef(false);
    const hasUnsavedChanges = computed(
      () => JSON.stringify(draft.value) !== JSON.stringify(originalDraft.value),
    );
    const isSubmitLocked = computed(() => flowState.value === "submitting");
    const needsGeometry = computed(
      () => draft.value.type !== null && !draft.value.validBlocks.geometry,
    );
    function refreshValidation(): void {
      const result = validateTareaCreacionDraft(draft.value);
      draft.value.validBlocks = result.validBlocks;
      validationErrors.value = result.errors;
    }
    function open(areaId: string | null): void {
      draft.value = createDraft(areaId);
      originalDraft.value = copyDraft(draft.value);
      validationErrors.value = [];
      remoteError.value = null;
      isDiscardConfirmationOpen.value = false;
      isPanelOpen.value = true;
      flowState.value = "editing";
    }
    function updateType(type: TareaCreacionTipo): void {
      draft.value.type = type;
      draft.value.geometry = {
        locationId: null,
        routePoint: null,
        controlLine: null,
        controlZone: null,
      };
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
    function updateCompanion(name: string | null): void {
      draft.value.companion = name ? { name } : null;
    }
    function updateDetails(
      next: Partial<TareaCreacionBorrador["details"]>,
    ): void {
      draft.value.details = { ...draft.value.details, ...next };
      refreshValidation();
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
      isDiscardConfirmationOpen,
      hasUnsavedChanges,
      isSubmitLocked,
      needsGeometry,
      open,
      updateType,
      updateWorker,
      updateTracker,
      updateCompanion,
      updateDetails,
      requestClose,
      close,
      continueEditing,
      discard,
      refreshValidation,
    };
  },
);
