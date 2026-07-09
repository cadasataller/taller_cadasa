import type { SolicitudCompraGrupoListado } from './solicitudesCompra.types';

export interface SolicitudCompraListConfigViewer {
  email: string | null;
  role_codigo: string | null;
  area_codigo: string | null;
}

export interface SolicitudCompraListConfigAlcance {
  codigo: string;
  descripcion: string | null;
}

export interface SolicitudCompraListConfigSeguimiento {
  codigo: string;
  label: string;
  origen: string | null;
  fecha_label: string | null;
  aplica_alcance_codigo: string | null;
  aplica_alcance_codigos: string[];
  visible_en_filtro: boolean;
}

export interface SolicitudCompraListConfigGrupo {
  codigo: SolicitudCompraGrupoListado;
  label: string;
  visible: boolean;
  seguimientos: SolicitudCompraListConfigSeguimiento[];
}

export interface SolicitudCompraListConfigBadgeDelegacion {
  codigo: string;
  label: string;
  tipo_delegacion: string | null;
}

export interface SolicitudCompraListConfigRpc {
  viewer: SolicitudCompraListConfigViewer;
  alcances: SolicitudCompraListConfigAlcance[];
  grupos: SolicitudCompraListConfigGrupo[];
  badges_delegacion: SolicitudCompraListConfigBadgeDelegacion[];
}
