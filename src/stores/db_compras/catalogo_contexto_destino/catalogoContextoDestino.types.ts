import type { ContextoDestinoTipoOrigen } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

export interface CatalogoContextoDestinoRow {
  id: number;
  codigo: string;
  nombre: string;
  tipo_origen: ContextoDestinoTipoOrigen;
  restringido_a_servicios: boolean;
  activo: boolean;
}

export interface CatalogoContextoDestinoOption {
  id: number;
  codigo: string;
  nombre: string;
  tipoOrigen: ContextoDestinoTipoOrigen;
  restringidoAServicios: boolean;
  activo: boolean;
}
