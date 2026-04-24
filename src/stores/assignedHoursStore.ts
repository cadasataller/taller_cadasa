import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase'; // Maintenance DB

export const useAssignedHoursStore = defineStore('assignedHours', () => {
  // Cache structure: { [area_date_key]: data[] }
  // Example key: "Cosecha Agricola_2026-04-21"
  const cache = ref<Record<string, any[]>>({});
  const areaCache = ref<Record<string, string>>({}); // email -> area

  const fetchSupervisorArea = async (email: string, force = false): Promise<string> => {
    if (!email) return '';
    if (areaCache.value[email] && !force) return areaCache.value[email];

    const { data, error } = await supabase
      .from('PROFILE')
      .select('area')
      .eq('email', email)
      .maybeSingle();

    if (!error && data?.area) {
      areaCache.value[email] = data.area;
      return data.area;
    }
    return '';
  };

  const fetchHours = async (area: string, date: string, force = false) => {
    if (!area || !date) return [];
    
    const cacheKey = `${area}_${date}`;
    if (cache.value[cacheKey] && !force) {
      return cache.value[cacheKey];
    }

    try {
      const summarySelect = `
        ID_OT,
        id_om,
        id_sg,
        Fecha,
        "Duración (horas)",
        Estatus,
        "Retraso (horas)",
        Semana,
        MECANICOS!ORDEN_TRABAJO_ID_Mecanico_fkey (
          id,
          NOMBRE,
          AREA,
          "EQUIPO DE TRABAJO"
        ),
        ORDEN_MANTENIMIENTO!ot_id_om_fkey (
          "Área",
          "Descripcion"
        ),
        OM_SG!OT_id_sg_fkey (
          id_sg,
          tipo_trabajo,
          ORDEN_MANTENIMIENTO!om_servicios_generales_id_orden_base_fkey (
            "Área",
            "Descripcion"
          )
        )
      `;

      const { data, error } = await supabase
        .from('ORDEN_TRABAJO')
        .select(summarySelect)
        .eq('Fecha', date);

      if (error) throw error;
      
      const filtered = (data || []).filter((row: any) => {
         if (area === 'Servicios Generales') {
            // "USA ID_SG" para Servicios Generales
            return row.id_sg != null;
         } else {
            // "PARA LAS OTRAS AREA USADA ID_OM" y asegurarse que no sea SG
            return row.id_om != null && row.id_sg == null && row.ORDEN_MANTENIMIENTO?.['Área'] === area;
         }
      });

      cache.value[cacheKey] = filtered;
      return filtered;
    } catch (err) {
      console.error("Error fetching assigned hours:", err);
      return [];
    }
  };

  return {
    cache,
    areaCache,
    fetchSupervisorArea,
    fetchHours
  };
});
