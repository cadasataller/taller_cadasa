import { defineStore } from 'pinia';
import { supabase } from '@/lib/supabase';
import { ref } from 'vue';
import { generateMockMaintenanceData } from '@/lib/mockMaintenanceData';

export interface OrdenMantenimiento {
  "ID_Orden mantenimiento": string;
  Área: string;
  "ID_#EQUIPO": string;
  "ITEM": string;
  "Sistema": string;
  "Descripcion": string;
  "Tipo de Proceso": string;
  "Estatus": string;
  "Fecha inicio": string;
  "Fecha conclusion": string;
  "Tiene solicitud de compra?": boolean;
  "N° solicitud": string;
  "N° Orden de compra": string;
  "Fecha Entrega": string;
  "Observaciones": string;
  "Semana": string;
  "Etapa": string;
  "IS_SG": boolean;
  "total_ots": number | null;
  "ots_concluidas": number | null;
  "ots_pendientes": number | null;
}

export const useMaintenanceStore = defineStore('maintenance', () => {
  const allOrders = ref<OrdenMantenimiento[]>([]);
  const isLoading = ref(false);
  const loadingProgress = ref(0);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);

  const activeFilters = ref({
    serie: null as string | null,
    estado: null as string | null,
    semana: null as string | null
  });

  const setStatusFilter = (serie: string | null, estado: string | null) => {
    if (activeFilters.value.serie === serie && activeFilters.value.estado === estado) {
      activeFilters.value.serie = null;
      activeFilters.value.estado = null;
    } else {
      activeFilters.value.serie = serie;
      activeFilters.value.estado = estado;
    }
  };

  const setWeekFilter = (semana: string | null) => {
    if (activeFilters.value.semana === semana) {
      activeFilters.value.semana = null;
    } else {
      activeFilters.value.semana = semana;
    }
  };

  const clearInteractiveFilters = () => {
    activeFilters.value.serie = null;
    activeFilters.value.estado = null;
    activeFilters.value.semana = null;
  };

  const fetchAllOrders = async (forceRefresh = false) => {
    if (hasLoaded.value && !forceRefresh) {
      return;
    }

    isLoading.value = true;
    loadingProgress.value = 0;
    error.value = null;

    try {
      // Mock Data Generation in Dev Mode
      if (import.meta.env.VITE_DATA_DEV === 'TRUE') {
        const mockData = generateMockMaintenanceData(500);
        
        // Simulate delay & progress realistically
        for (let i = 1; i <= 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 200));
          loadingProgress.value = (i / 5) * 100;
        }

        allOrders.value = mockData.filter(o => !o['ID_Orden mantenimiento'].startsWith('SG-'));
        hasLoaded.value = true;
        return;
      }

      // Real Supabase Fetching
      const batchSize = 1000;
      let offset = 0;
      let allData: OrdenMantenimiento[] = [];
      let hasMore = true;

      while (hasMore) {
        const { data, error: fetchError, count } = await supabase
          .from('om_con_resumen_ots')
          .select('*', { count: 'exact' })
          .not('ID_Orden mantenimiento', 'ilike', 'SG-%')
          .not('ID_Orden mantenimiento', 'ilike', 'OM-TEST-%')
          .range(offset, offset + batchSize - 1)
          .order('Fecha inicio', { ascending: false })
          .order('ID_Orden mantenimiento', { ascending: false });

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          
          if (count) {
            loadingProgress.value = Math.round((allData.length / count) * 100);
          }
          
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      allOrders.value = allData;
      loadingProgress.value = 100;
      hasLoaded.value = true;
    } catch (e: any) {
      console.error('Error fetching batch orders:', e);
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  };

  const updateOrder = async (id: string, updates: Partial<OrdenMantenimiento>) => {
    try {
      // Mock Update Interceptor for Dev Mode
      console.log('VITE_DATA_DEV:', import.meta.env.VITE_DATA_DEV);
      
      if (import.meta.env.VITE_DATA_DEV === 'TRUE') {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network
        const index = allOrders.value.findIndex(o => o['ID_Orden mantenimiento'] === id);
        
        if (index !== -1) {
          allOrders.value[index] = { ...allOrders.value[index], ...updates };
        }
        return { success: true };
      }

      // Real Supabase Update
      const { data, error: updateError } = await supabase
        .from('ORDEN_MANTENIMIENTO')
        .update(updates)
        .eq('ID_Orden mantenimiento', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        const index = allOrders.value.findIndex(o => o['ID_Orden mantenimiento'] === id);
        if (index !== -1) {
          allOrders.value[index] = { ...allOrders.value[index], ...data };
        }
      }
      return { success: true };
    } catch (e: any) {
      console.error('Error updating order:', e);
      return { success: false, error: e.message };
    }
  };

  return {
    allOrders,
    isLoading,
    loadingProgress,
    error,
    hasLoaded,
    activeFilters,
    setStatusFilter,
    setWeekFilter,
    clearInteractiveFilters,
    fetchAllOrders,
    updateOrder
  };
});
