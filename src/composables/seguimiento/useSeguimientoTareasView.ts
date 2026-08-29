import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useTareasSeguimientoStore } from '@/stores/seguimiento/tareas/tareasSeguimiento.store';
import type { TareasSeguimientoFilters } from '@/stores/seguimiento/tareas/tareasSeguimiento.types';

export function useSeguimientoTareasView() {
  const store = useTareasSeguimientoStore();
  const state = storeToRefs(store);
  onMounted(() => { void store.loadWorkspace(); });
  return {
    ...state,
    retry: () => store.loadWorkspace(true),
    updateFilters: (filters: Partial<TareasSeguimientoFilters>) => store.setFilters(filters),
    selectTask: store.selectTask,
    closeDetail: store.closeDetail,
    setMapReady: store.setMapReady,
    setMapError: store.setMapError,
    toggleMapTool: store.toggleMapTool,
  };
}
