import { supabaseCompras } from '@/lib/supabase';

import type {
  SolicitudCompraBorradorCreatePayload,
  SolicitudCompraBorradorListadoItem,
  SolicitudCompraBorradorRow,
  SolicitudCompraBorradorUpdatePayload,
} from './solicitudesCompraBorradores.types';

const BORRADORES_TABLE = 'solicitud_compra_borrador';
const BORRADORES_LIST_RPC = 'rpc_obtener_mis_borradores_solicitud_compra';
const BORRADOR_SELECT = `
  id,
  creado_por_user_id,
  creado_por_email,
  creado_por_nombre,
  creado_por_area,
  activo,
  schema_version,
  current_step,
  tipo_solicitud,
  fecha_entrega,
  observacion,
  solicitar_urgente,
  motivo_urgencia,
  destinos,
  productos,
  servicios,
  enviado_at,
  created_at,
  updated_at
`;

const mapRowToListadoItem = (
  row: SolicitudCompraBorradorRow
): SolicitudCompraBorradorListadoItem => ({
  id: row.id,
  schemaVersion: row.schema_version,
  currentStep: row.current_step,
  tipoSolicitud: row.tipo_solicitud,
  fechaEntrega: row.fecha_entrega,
  observacion: row.observacion,
  solicitarUrgente: row.solicitar_urgente,
  motivoUrgencia: row.motivo_urgencia ?? '',
  destinos: row.destinos,
  productos: row.productos,
  servicios: row.servicios,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const solicitudesCompraBorradoresService = {
  async obtenerMisBorradores(): Promise<SolicitudCompraBorradorListadoItem[]> {
    const { data, error } = await supabaseCompras.rpc(BORRADORES_LIST_RPC);

    if (error) {
      throw new Error(error.message || 'No se pudieron obtener los borradores');
    }

    const rows = Array.isArray(data)
      ? data as SolicitudCompraBorradorRow[]
      : [];

    return rows
      .map(mapRowToListadoItem)
      .sort((left, right) => (
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      ));
  },

  async crearBorrador(
    payload: SolicitudCompraBorradorCreatePayload
  ): Promise<SolicitudCompraBorradorRow> {
    const { data, error } = await supabaseCompras
      .from(BORRADORES_TABLE)
      .insert(payload)
      .select(BORRADOR_SELECT)
      .single();

    if (error) {
      throw new Error(error.message || 'No se pudo guardar el borrador');
    }

    return data as SolicitudCompraBorradorRow;
  },

  async actualizarBorrador(
    draftId: string,
    payload: SolicitudCompraBorradorUpdatePayload
  ): Promise<SolicitudCompraBorradorRow> {
    const { data, error } = await supabaseCompras
      .from(BORRADORES_TABLE)
      .update(payload)
      .eq('id', draftId)
      .select(BORRADOR_SELECT)
      .single();

    if (error) {
      throw new Error(error.message || 'No se pudo actualizar el borrador');
    }

    return data as SolicitudCompraBorradorRow;
  },

  async desactivarBorrador(draftId: string): Promise<SolicitudCompraBorradorRow> {
    const { data, error } = await supabaseCompras
      .from(BORRADORES_TABLE)
      .update({ activo: false })
      .eq('id', draftId)
      .select(BORRADOR_SELECT)
      .single();

    if (error) {
      throw new Error(error.message || 'No se pudo desactivar el borrador');
    }

    return data as SolicitudCompraBorradorRow;
  },
};
