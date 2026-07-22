import { supabaseCompras } from '@/lib/supabase';

import type {
  CatalogoServicioContextoOption,
  CatalogoServicioContextoRow,
} from './catalogoServicioContexto.types';

export const catalogoServicioContextoService = {
  async obtenerOpcionesActivas(): Promise<CatalogoServicioContextoOption[]> {
    const { data, error } = await supabaseCompras
      .from('catalogo_servicio_contexto')
      .select('id, codigo, nombre, activo')
      .eq('activo', true)
      .order('nombre', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      throw new Error(error.message || 'No se pudieron obtener los contextos de servicio');
    }

    return ((data ?? []) as CatalogoServicioContextoRow[]).map((row) => ({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre.trim(),
    }));
  },
};
