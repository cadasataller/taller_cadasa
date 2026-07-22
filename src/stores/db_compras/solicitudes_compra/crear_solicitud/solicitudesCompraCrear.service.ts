import { supabaseCompras } from '@/lib/supabase';

import type {
  CrearSolicitudAdjuntoLocalItem,
  CrearSolicitudAdjuntoUploadMetadata,
  CrearSolicitudUploadSession,
  ProductoCatalogoRow,
  SolicitudCompraCrearPayload,
  SolicitudCompraCrearResponse,
} from './solicitudesCompraCrear.types';

const RPC_PREPARAR_UPLOAD = 'rpc_preparar_upload_solicitud_go';
const RPC_CREAR_SOLICITUD = 'rpc_crear_solicitud_compra_go';
const RPC_BUSCAR_PRODUCTOS = 'rpc_buscar_productos_solicitud_go';
const DEFAULT_PRODUCT_SEARCH_LIMIT = 10;

const getFileExtension = (fileName: string): string | null => {
  const segments = fileName.split('.');
  return segments.length > 1 ? segments.at(-1)?.toLowerCase() ?? null : null;
};

const buildSafeFileName = (fileName: string, index: number): string => {
  const sanitizedName = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `adj-${String(index + 1).padStart(3, '0')}-${sanitizedName || 'archivo'}`;
};

export const solicitudesCompraCrearService = {
  async buscarProductos(query: string): Promise<ProductoCatalogoRow[]> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      return [];
    }

    const { data, error } = await supabaseCompras
      .rpc(RPC_BUSCAR_PRODUCTOS, {
        p_query: normalizedQuery,
        p_limit: DEFAULT_PRODUCT_SEARCH_LIMIT,
      });

    if (error) {
      throw new Error(error.message || 'No se pudieron obtener los productos');
    }

    return (data ?? []) as ProductoCatalogoRow[];
  },

  async prepararUploadSession(): Promise<CrearSolicitudUploadSession> {
    const { data, error } = await supabaseCompras
      .rpc(RPC_PREPARAR_UPLOAD);

    if (error) {
      throw new Error(error.message || 'No se pudo preparar la sesión de adjuntos');
    }

    return data as CrearSolicitudUploadSession;
  },

  async subirAdjuntos(
    session: CrearSolicitudUploadSession,
    files: CrearSolicitudAdjuntoLocalItem[]
  ): Promise<CrearSolicitudAdjuntoUploadMetadata[]> {
    const uploads = await Promise.all(files.map(async (item, index) => {
      const safeFileName = buildSafeFileName(item.displayName, index);
      const storagePath = `${session.base_path}/${safeFileName}`;
      const { error } = await supabaseCompras.storage
        .from(session.bucket_id)
        .upload(storagePath, item.file, {
          upsert: false,
          contentType: item.file.type || undefined,
        });

      if (error) {
        throw new Error(error.message || 'No se pudo subir un adjunto');
      }

      return {
        bucketId: session.bucket_id,
        storagePath,
        nombreOriginal: item.displayName,
        mimeType: item.file.type || 'application/octet-stream',
        extension: getFileExtension(item.displayName),
        sizeBytes: item.file.size,
        tipoAdjuntoCodigo: 'general',
        descripcion: null,
      } satisfies CrearSolicitudAdjuntoUploadMetadata;
    }));

    return uploads;
  },

  async crearSolicitud(
    payload: SolicitudCompraCrearPayload
  ): Promise<SolicitudCompraCrearResponse> {
    const { data, error } = await supabaseCompras
      .rpc(RPC_CREAR_SOLICITUD, payload);

    if (error) {
      throw new Error(error.message || 'No se pudo crear la solicitud');
    }

    return data as SolicitudCompraCrearResponse;
  },
};
