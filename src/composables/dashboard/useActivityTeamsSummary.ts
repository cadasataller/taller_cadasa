import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useActivityTeamsSummaryStore } from "@/stores/dashboard/resumen-actividad-equipos/resumenActividadEquipos.store";

export function useActivityTeamsSummary() {
  const store = useActivityTeamsSummaryStore();
  const state = storeToRefs(store);

  onMounted(() => {
    if (state.state.value === "idle") void store.load();
  });

  return { ...state, setDateRange: store.setDateRange, retry: store.load };
}
