import { storeToRefs } from "pinia";
import { useTareaCreacionStore } from "@/stores/seguimiento/tareas/creacion/tareaCreacion.store";

/** Coordina el panel y conserva el borrador fuera de los componentes de UI. */
export function useSeguimientoTareaCreacion() {
  const store = useTareaCreacionStore();
  const state = storeToRefs(store);
  return {
    ...state,
    openCreate: (areaId: string | null) => store.open(areaId),
    requestCloseCreate: () => store.requestClose(),
    continueCreateEditing: () => store.continueEditing(),
    discardCreate: () => store.discard(),
    updateType: store.updateType,
    updateWorker: store.updateWorker,
    updateTracker: store.updateTracker,
    updateCompanion: store.updateCompanion,
    updateDetails: store.updateDetails,
    updateGeometry: store.updateGeometry,
    updateRoute: store.updateRoute,
    beginGeometryEdit: store.beginGeometryEdit,
    finishGeometryEdit: store.finishGeometryEdit,
    submitCreate: store.submit,
  };
}
