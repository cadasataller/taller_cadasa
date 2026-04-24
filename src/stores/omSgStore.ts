import { defineStore } from 'pinia';
import { supabase } from '@/lib/supabase';
import { ref } from 'vue';

export interface OrdenMantenimientoBase {
  "ID_Orden mantenimiento": string;
  Área: string;
  "ID_#EQUIPO": string;
  "ITEM": string;
  "Sistema": string;
  "Descripcion": string;
  "Tipo de Proceso": string;
  "Estatus": string;
  "Fecha inicio": string | null;
  "Fecha conclusion": string | null;
  "Tiene solicitud de compra?": boolean;
  "N° solicitud": string | null;
  "N° Orden de compra": string | null;
  "Fecha Entrega": string | null;
  "Observaciones": string | null;
  "Semana": string | null;
  "Etapa": string | null;
  "IS_SG": boolean;
}

export interface OMSGWithOm {
  id_sg: string;
  id_orden_base: string | null;
  fecha_solicitud: string | null;
  tipo_trabajo: string | null;
  estimacion_horas: number | null;
  solicitar_personal: number | null;
  fecha_entrega: string | null;
  fecha_ejecucion: string | null;
  dias: number | null;
  Estatus: string | null;
  Observaciones: string | null;
  "Fecha conclusion": string | null;
  semana: number | null;
  trabajo_realizar: string | null;
  fecha_entrega_sg: string | null;
  ORDEN_MANTENIMIENTO: OrdenMantenimientoBase | null;
}

export const useOmSgStore = defineStore('omSg', () => {
  const allSGOrders = ref<OMSGWithOm[]>([]);
  const isLoadingSG = ref(false);
  const errorSG = ref<string | null>(null);
  const hasLoadedSG = ref(false);

  const fetchSGOrders = async (uArea: string, fromOffset: number = 0, forceRefresh = false) => {
    if (hasLoadedSG.value && !forceRefresh && fromOffset === 0) return;
    
    isLoadingSG.value = true;
    errorSG.value = null;
    
    try {
      if (import.meta.env.VITE_DATA_DEV === 'TRUE') {
        const mockData: OMSGWithOm[] = [];
        const now = new Date();
        for(let i=0; i<100; i++) {
          const date = new Date();
          date.setDate(now.getDate() - (Math.floor(Math.random() * 60)));
          const dtIso = date.toISOString();
          mockData.push({
            id_sg: `sg-${i}`,
            id_orden_base: `OM-${1000 + i}`,
            fecha_solicitud: dtIso,
            tipo_trabajo: i % 2 === 0 ? 'Mecanico' : 'Electrico',
            estimacion_horas: 4,
            solicitar_personal: 1,
            fecha_entrega: dtIso,
            fecha_ejecucion: dtIso,
            dias: Math.floor(Math.random() * 10) - 5,
            Estatus: Math.random() > 0.3 ? 'Concluida' : 'En Proceso',
            Observaciones: 'Mock data',
            "Fecha conclusion": dtIso,
            semana: Math.ceil(date.getDate() / 7) + (date.getMonth() * 4),
            trabajo_realizar: 'Mantenimiento preventivo',
            fecha_entrega_sg: dtIso,
            ORDEN_MANTENIMIENTO: {
              "ID_Orden mantenimiento": `OM-${1000 + i}`,
              "Área": i % 3 === 0 ? "Mecánica" : "Eléctrica",
              "ID_#EQUIPO": "EQ-001",
              "ITEM": "Item 1",
              "Sistema": "Sistema 1",
              "Descripcion": "Desc",
              "Tipo de Proceso": "Preventivo",
              "Estatus": "1",
              "Fecha inicio": dtIso,
              "Fecha conclusion": dtIso,
              "Tiene solicitud de compra?": false,
              "N° solicitud": null,
              "N° Orden de compra": null,
              "Fecha Entrega": dtIso,
              "Observaciones": "",
              "Semana": "1",
              "Etapa": "1",
              "IS_SG": false
            }
          });
        }
        if (fromOffset === 0) {
            allSGOrders.value = mockData;
        }
        hasLoadedSG.value = true;
        return;
      }
      
      let query;

      if (uArea !== 'ALL' && uArea !== 'SERVICIOS GENERALES') {
        // user not admin and not SG, filter by section
        query = supabase
          .from('OM_SG')
          .select(`
            *,
            orden_mantenimiento:ORDEN_MANTENIMIENTO!inner (
              "ID_Orden mantenimiento",
              "Área",
              "ID_#EQUIPO",
              "ITEM",
              "Sistema",
              "Descripcion",
              "Tipo de Proceso",
              "Estatus",
              "Fecha inicio",
              "Fecha conclusion",
              "Tiene solicitud de compra?",
              "N° solicitud",
              "N° Orden de compra",
              "Fecha Entrega",
              "Observaciones",
              "Semana",
              "Etapa",
              "IS_SG"
            )
          `)
          .ilike('ORDEN_MANTENIMIENTO.Área', uArea);
      } else {
        query = supabase
          .from('OM_SG')
          .select(`
            *,
            orden_mantenimiento:ORDEN_MANTENIMIENTO (
              "ID_Orden mantenimiento",
              "Área",
              "ID_#EQUIPO",
              "ITEM",
              "Sistema",
              "Descripcion",
              "Tipo de Proceso",
              "Estatus",
              "Fecha inicio",
              "Fecha conclusion",
              "Tiene solicitud de compra?",
              "N° solicitud",
              "N° Orden de compra",
              "Fecha Entrega",
              "Observaciones",
              "Semana",
              "Etapa",
              "IS_SG"
            )
          `);
        
        if (uArea === 'SERVICIOS GENERALES') {
            query = query.not('id_orden_base', 'ilike', 'OM-TEST%');
        }
      }

      const { data, error: fetchError } = await query
        .order('fecha_solicitud', { ascending: false })
        .range(fromOffset, fromOffset + 999);

      if (fetchError) throw fetchError;

      let resultData: OMSGWithOm[] = ((data as any[]) || []).map(row => ({
        ...row,
        ORDEN_MANTENIMIENTO: row.orden_mantenimiento
      }));

      // Extra in-memory filter per request
      if (uArea === 'SERVICIOS GENERALES') {
        resultData = resultData.filter(row => row.ORDEN_MANTENIMIENTO && row.ORDEN_MANTENIMIENTO["Área"] !== 'TEST');
      }

      if (fromOffset === 0) {
        allSGOrders.value = resultData;
      } else {
        const ids = new Set(allSGOrders.value.map(s => s.id_sg));
        for (const item of resultData) {
          if (!ids.has(item.id_sg)) {
            allSGOrders.value.push(item);
          }
        }
      }
      
      hasLoadedSG.value = true;
    } catch (e: any) {
      console.error('Error fetching SG orders:', e);
      errorSG.value = e.message;
    } finally {
      isLoadingSG.value = false;
    }
  };

  const updateSGOrder = async (id: string, updates: Partial<OMSGWithOm>) => {
    try {
      if (import.meta.env.VITE_DATA_DEV === 'TRUE') {
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = allSGOrders.value.findIndex(o => o.id_sg === id);
        if (index !== -1) {
          allSGOrders.value[index] = { ...allSGOrders.value[index], ...updates };
        }
        return { success: true };
      }

      const omSgUpdates: any = { ...updates };
      delete omSgUpdates.ORDEN_MANTENIMIENTO; // do not update nested struct here directly unless handled

      const { data, error: updateError } = await supabase
        .from('OM_SG')
        .update(omSgUpdates)
        .eq('id_sg', id)
        .select(`
            *,
            orden_mantenimiento:ORDEN_MANTENIMIENTO (
              "ID_Orden mantenimiento",
              "Área",
              "ID_#EQUIPO",
              "ITEM",
              "Sistema",
              "Descripcion",
              "Tipo de Proceso",
              "Estatus",
              "Fecha inicio",
              "Fecha conclusion",
              "Tiene solicitud de compra?",
              "N° solicitud",
              "N° Orden de compra",
              "Fecha Entrega",
              "Observaciones",
              "Semana",
              "Etapa",
              "IS_SG"
            )
          `)
        .single();

      if (updateError) throw updateError;
      
      if (data) {
        const index = allSGOrders.value.findIndex(o => o.id_sg === id);
        if (index !== -1) {
          const freshData: OMSGWithOm = {
            ...(data as any),
            ORDEN_MANTENIMIENTO: (data as any).orden_mantenimiento
          };
          allSGOrders.value[index] = freshData;
        }
      }
      return { success: true };
    } catch (e: any) {
      console.error('Error updating SG order:', e);
      return { success: false, error: e.message };
    }
  };

  return {
    allSGOrders,
    isLoadingSG,
    errorSG,
    hasLoadedSG,
    fetchSGOrders,
    updateSGOrder
  };
});
