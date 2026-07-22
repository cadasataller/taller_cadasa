import { supabaseCompras } from '@/lib/supabase';

import type {
  CatalogoContextoDestinoOption,
  CatalogoContextoDestinoRow,
} from './catalogoContextoDestino.types';
import type { SolicitudCompraTipoSolicitud } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

export const catalogoContextoDestinoService = {
  async obtenerOpciones(
    tipoSolicitud: SolicitudCompraTipoSolicitud
  ): Promise<CatalogoContextoDestinoOption[]> {
    const { data, error } = await supabaseCompras
      .rpc('rpc_obtener_catalogo_contexto_destino_visible', {
        p_tipo_solicitud: tipoSolicitud,
      });

    if (error) {
      throw new Error(error.message || 'No se pudieron obtener los destinos');
    }

    return ((data ?? []) as CatalogoContextoDestinoRow[]).map((row) => ({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre.trim(),
      tipoOrigen: row.tipo_origen,
      restringidoAServicios: row.restringido_a_servicios,
      activo: row.activo,
    }));
  },
};
