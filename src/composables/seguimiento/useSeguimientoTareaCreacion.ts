import { storeToRefs } from "pinia";
import { useTareaCreacionStore } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.store";

/** Coordina el panel y conserva el borrador fuera de los componentes de UI. */
export function useSeguimientoTareaCreacion() {
  const store = useTareaCreacionStore();
  const state = storeToRefs(store);
  return {
    ...state,
    openCreate: (areaId: string | null, scheduledDate: string | null = null) =>
      store.open(areaId, scheduledDate),
    openSpatialCreate: (
      areaId: string | null,
      scheduledDate: string | null = null,
    ) => store.openSpatial(areaId, scheduledDate),
    openCreateDetails: () => store.openDetails(),
    startAdditionalControlZone: () => store.startAdditionalControlZone(),
    finishAdditionalControlZone: () => store.finishAdditionalControlZone(),
    cancelAdditionalControlZone: () => store.cancelAdditionalControlZone(),
    requestCloseCreate: () => store.requestClose(),
    continueCreateEditing: () => store.continueEditing(),
    discardCreate: () => store.discard(),
    updateType: store.updateType,
    updateWorker: store.updateWorker,
    updateTracker: store.updateTracker,
    updateCompanions: store.updateCompanions,
    updateDetails: store.updateDetails,
    updateGeometry: store.updateGeometry,
    beginControlZoneEdit: store.beginControlZoneEdit,
    updateControlZone: store.updateControlZone,
    removeControlZone: store.removeControlZone,
    captureSpatialRoute: store.captureSpatialRoute,
    completeSpatialSelection: store.completeSpatialSelection,
    updateRoute: store.updateRoute,
    setMaximumRouteOrder: store.setMaximumRouteOrder,
    canSubmitCreate: state.canSubmit,
    reportSkippedCreateField: store.reportSkippedField,
    revealCreateSubmitRequirements: store.revealSubmitRequirements,
    beginGeometryEdit: store.beginGeometryEdit,
    finishGeometryEdit: store.finishGeometryEdit,
    submitCreate: store.submit,
  };
}
