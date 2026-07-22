import { supabaseCompras } from '@/lib/supabase';
import { normalizeSolicitudCompraListConfig } from './solicitudesCompra.config.helpers';
import type { SolicitudCompraListConfigRpc } from './solicitudesCompra.config.types';
import type {
  SolicitudCompraListRpcParams,
  SolicitudCompraListRpcRow,
} from './solicitudesCompra.types';

const RPC_NAME = 'rpc_obtener_solicitudes_lista_usuario';
const CONFIG_RPC_NAME = 'rpc_obtener_config_listado_solicitudes';
const DEFAULT_PAGE_SIZE = 25;
const SEARCH_LIMIT = 500;

const ejecutarListadoRpc = async (
  params: SolicitudCompraListRpcParams
): Promise<SolicitudCompraListRpcRow[]> => {
  const { data, error } = await supabaseCompras.rpc(RPC_NAME, params);

  if (error) {
    throw new Error(error.message || 'No se pudieron obtener las solicitudes');
  }

  return (data ?? []) as SolicitudCompraListRpcRow[];
};

export const solicitudesCompraService = {
  async obtenerConfigListado(): Promise<SolicitudCompraListConfigRpc> {
    const { data, error } = await supabaseCompras.rpc(CONFIG_RPC_NAME);

    if (error) {
      throw new Error(error.message || 'No se pudo cargar la configuración del listado');
    }

    const config = normalizeSolicitudCompraListConfig(data);

    if (!config) {
      throw new Error('La configuración del listado no tiene un formato válido');
    }

    return config;
  },

  async obtenerSolicitudesListaPagina(
    params: SolicitudCompraListRpcParams
  ): Promise<SolicitudCompraListRpcRow[]> {
    const normalizedBusqueda = params.p_busqueda?.trim() || null;
    const pageSize = typeof params.p_limit === 'number' && params.p_limit > 0
      ? params.p_limit
      : DEFAULT_PAGE_SIZE;

    return ejecutarListadoRpc({
      ...params,
      p_busqueda: normalizedBusqueda && normalizedBusqueda.length > 0 ? normalizedBusqueda : null,
      p_limit: pageSize,
      p_offset: params.p_offset ?? 0,
    });
  },

  async buscarSolicitudesLista(
    params: SolicitudCompraListRpcParams
  ): Promise<SolicitudCompraListRpcRow[]> {
    const normalizedBusqueda = params.p_busqueda?.trim() || null;

    return ejecutarListadoRpc({
      ...params,
      p_busqueda: normalizedBusqueda,
      p_limit: SEARCH_LIMIT,
      p_offset: 0,
    });
  },
};
