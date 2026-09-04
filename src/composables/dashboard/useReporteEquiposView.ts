import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useReporteEquiposStore } from "@/stores/dashboard/reporte-equipos/reporteEquipos.store";

export function useReporteEquiposView() {
  const store = useReporteEquiposStore();
  const state = storeToRefs(store);
  onMounted(() => {
    void store.loadInitial();
  });
  return {
    ...state,
    equipmentListState: computed(() => state.loadStates.value.equipmentList),
    retry: store.loadInitial,
    selectEquipment: store.selectEquipment,
    setTab: store.setTab,
    setDateRange: store.setDateRange,
    setSearch: store.setSearch,
    clearFilters: store.clearFilters,
  };
}
