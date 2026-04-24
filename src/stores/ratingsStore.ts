import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabaseRatings } from '@/lib/supabase';

export const useRatingsStore = defineStore('ratings', () => {
  const empleados = ref<any[]>([]);
  const inspecciones = ref<any[]>([]);
  const detalles = ref<any[]>([]);
  
  const isLoaded = ref(false);
  const isLoading = ref(false);

  const fetchAll = async (force = false) => {
    if (isLoaded.value && !force) return;
    
    isLoading.value = true;
    try {
      const { data: empsLow } = await supabaseRatings.from('empleados').select('*');
      const { data: empsExact } = await supabaseRatings.from('Empleados').select('*');
      empleados.value = (empsLow && empsLow.length > 0) ? empsLow : (empsExact || []);

      const { data: inspsLow } = await supabaseRatings.from('inspecciones').select('*').order('fecha', { ascending: false }).order('hora', { ascending: false });
      const { data: inspsExact } = await supabaseRatings.from('Inspecciones').select('*').order('fecha', { ascending: false }).order('hora', { ascending: false });
      inspecciones.value = (inspsLow && inspsLow.length > 0) ? inspsLow : (inspsExact || []);

      const { data: detsLow } = await supabaseRatings.from('inspecciones_detalle').select('*');
      const { data: detsExact } = await supabaseRatings.from('Inspecciones_Detalle').select('*');
      detalles.value = (detsLow && detsLow.length > 0) ? detsLow : (detsExact || []);

      isLoaded.value = true;
    } catch (e) {
      console.error('Error fetching ratings state', e);
    } finally {
      isLoading.value = false;
    }
  };

  const normalizedInspections = computed(() => {
    return inspecciones.value.map(insp => {
      const inspId = insp.id_inspeccion || insp.id;
      const misDetalles = detalles.value.filter((d: any) => d.id_inspeccion === inspId);
      
      let sum = 0;
      let count = 0;
      misDetalles.forEach((d: any) => {
        if (typeof d.puntuacion === 'number') {
           sum += d.puntuacion;
           count++;
        }
      });
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;
      
      return {
        ...insp,
        final_supervisor_id: insp.id_supervisor || insp.supervisor_id,
        final_inspector_id: insp.id_inspector || insp.inspector_id,
        puntuacion_promedio: avg,
        id_inspeccion: inspId
      };
    });
  });

  const validSupervisors = computed(() => {
    return empleados.value.filter(e => e.rol && e.rol.toLowerCase().trim() === 'supervisor');
  });

  return {
    empleados,
    inspecciones,
    detalles,
    isLoaded,
    isLoading,
    fetchAll,
    normalizedInspections,
    validSupervisors
  };
});
