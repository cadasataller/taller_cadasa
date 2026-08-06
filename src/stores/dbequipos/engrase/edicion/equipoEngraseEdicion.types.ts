import type { EquipoEngraseListItem } from "../filtrosEngrase.types";

export type EquipoEstado = "activo" | "descartado";
export type EntidadDraftEstado = "existente" | "nuevo";
export type OperacionDraft =
  | "existente"
  | "nuevo"
  | "actualizado"
  | "pendiente_eliminacion";

export interface CatalogoIdNombre {
  id: number;
  nombre: string;
}
export interface EquipoEdicionDatos {
  id: number;
  codigo: string;
  tipoEquipoId: number;
  tipoEquipo: string;
  subtipo: string;
  estado: EquipoEstado;
}
export interface EquipoEdicionFiltro {
  id: number;
  equipoId: number;
  tipoFiltro: CatalogoIdNombre;
  filtro: { id: number; codigo: string; estaEnListaCompras: boolean };
  cantidad: number;
  cantidadEquivalencias: number;
}
export interface EquipoEdicionAceite {
  equipoAceiteId: number;
  sistema: CatalogoIdNombre;
  aceite: CatalogoIdNombre;
}
export interface EquipoParaEdicion {
  equipo: EquipoEdicionDatos;
  etapas: CatalogoIdNombre[];
  filtros: EquipoEdicionFiltro[];
  aceites: EquipoEdicionAceite[];
}
export interface EquipoImagenPersistida {
  mainStoragePath: string | null;
  tieneImagenMain: boolean;
  imagenActualizadaEn: string | null;
}
export interface EquipoEdicionSnapshot extends EquipoParaEdicion {
  imagen: EquipoImagenPersistida;
}
export interface TipoEquipoExistenteDraftReference extends CatalogoIdNombre { estado: "existente"; tempId: null }
export interface TipoEquipoNuevoDraftReference { estado: "nuevo"; id: null; tempId: string; nombre: string; subtiposSugeridos: string[] }
export type TipoEquipoDraftReference = TipoEquipoExistenteDraftReference | TipoEquipoNuevoDraftReference;
export interface EquipoEdicionDraft extends EquipoEdicionSnapshot {
  tipoEquipoReferencia: TipoEquipoDraftReference;
  operaciones: {
    datos: OperacionDraft;
    etapas: OperacionDraft;
    filtros: OperacionDraft;
    aceites: OperacionDraft;
  };
}
export type EquipoEdicionOverlay = "confirmar_salida" | "nuevo_tipo_equipo";
export interface EquipoEdicionError { codigo: string; mensaje: string }

export interface TipoEquipoAuxiliar extends CatalogoIdNombre {
  subtiposSugeridos: string[];
}
export interface TipoFiltroAuxiliar extends CatalogoIdNombre {
  tiposEquipoQueLoUsan: string[];
}
export interface AuxiliaresEdicionEquipo {
  tiposEquipo: TipoEquipoAuxiliar[];
  etapas: CatalogoIdNombre[];
  tiposFiltro: TipoFiltroAuxiliar[];
  sistemasAceite: CatalogoIdNombre[];
  aceites: CatalogoIdNombre[];
}

export interface FiltroOriginal {
  id: number;
  codigo: string;
  estaEnListaCompras: boolean;
}
export interface EquipoFiltroActual {
  equipoFiltroId: number;
  codigo: string;
  cantidad: number;
}
export interface TipoFiltroPosible {
  tipoFiltro: CatalogoIdNombre;
  tiposEquipoQueLoUsan: string[];
  yaAsignadoAlEquipo: boolean;
  equipoFiltroActual: EquipoFiltroActual | null;
}
export interface ResultadoFiltroEncontrado {
  encontrado: true;
  codigo: string;
  filtro: FiltroOriginal;
  requiereSeleccionarTipo: boolean;
  sinTiposRegistrados: boolean;
  tiposPosibles: TipoFiltroPosible[];
}
export interface ResultadoFiltroNoEncontrado {
  encontrado: false;
  codigo: string;
  codigoBuscado: string;
  puedeCrearse: boolean;
}
export type ResultadoBusquedaFiltroOriginal =
  | ResultadoFiltroEncontrado
  | ResultadoFiltroNoEncontrado;

export interface EntidadExistenteNombre {
  estado: "existente";
  id: number;
  nombre: string;
}
export interface EntidadNuevaNombre {
  estado: "nuevo";
  id: null;
  temp_id: string;
  nombre: string;
}
export type EntidadNombrePayload = EntidadExistenteNombre | EntidadNuevaNombre;
export interface FiltroExistentePayload {
  estado: "existente";
  id: number;
  codigo: string;
  esta_en_lista_compras: boolean;
}
export interface FiltroNuevoCatalogoPayload {
  estado: "nuevo";
  id: null;
  temp_id: string;
  codigo: string;
  esta_en_lista_compras: boolean;
}
export type FiltroCatalogoPayload =
  | FiltroExistentePayload
  | FiltroNuevoCatalogoPayload;
export interface DatosEquipoCambiosPayload {
  estado_operacion: "actualizado";
  codigo_nuevo?: string;
  subtipo?: string;
  estado?: EquipoEstado;
  tipo_equipo?: EntidadNombrePayload;
}
export interface EtapaAgregadaPayload {
  estado_operacion: "nuevo";
  etapa_id: number;
}
export interface EtapaEliminadaPayload {
  estado_operacion: "eliminado";
  etapa_id: number;
}
export interface EtapasCambiosPayload {
  agregadas?: EtapaAgregadaPayload[];
  eliminadas?: EtapaEliminadaPayload[];
}
export interface FiltroNuevoPayload {
  estado_operacion: "nuevo";
  temp_id: string;
  tipo_filtro: EntidadNombrePayload;
  filtro: FiltroCatalogoPayload;
  cantidad: number;
}
export interface FiltroActualizadoPayload {
  estado_operacion: "actualizado";
  equipo_filtro_id: number;
  tipo_filtro: EntidadNombrePayload;
  filtro: FiltroCatalogoPayload;
  cantidad: number;
  motivo_cambio?: string;
}
export interface FiltroEliminadoPayload {
  estado_operacion: "eliminado";
  equipo_filtro_id: number;
}
export interface FiltrosCambiosPayload {
  nuevos?: FiltroNuevoPayload[];
  actualizados?: FiltroActualizadoPayload[];
  eliminados?: FiltroEliminadoPayload[];
}
export interface AceiteNuevoPayload {
  estado_operacion: "nuevo";
  temp_id: string;
  sistema: EntidadNombrePayload;
  aceite: EntidadNombrePayload;
}
export interface AceiteActualizadoPayload {
  estado_operacion: "actualizado";
  equipo_aceite_id: number;
  sistema: EntidadNombrePayload;
  aceite: EntidadNombrePayload;
}
export interface AceiteEliminadoPayload {
  estado_operacion: "eliminado";
  equipo_aceite_id: number;
}
export interface AceitesCambiosPayload {
  nuevos?: AceiteNuevoPayload[];
  actualizados?: AceiteActualizadoPayload[];
  eliminados?: AceiteEliminadoPayload[];
}
export interface CambiosEquipoPayload {
  datos_equipo?: DatosEquipoCambiosPayload;
  etapas?: EtapasCambiosPayload;
  filtros?: FiltrosCambiosPayload;
  aceites?: AceitesCambiosPayload;
}

export interface CambiosDetalleEquipo {
  datosEquipoCambiaron: boolean;
  etapasCambiaron: boolean;
  filtrosCambiaron: boolean;
  aceitesCambiaron: boolean;
}
export interface ResumenOperacionesEquipo {
  etapasAgregadas: number;
  etapasEliminadas: number;
  filtrosAgregados: number;
  filtrosActualizados: number;
  filtrosEliminados: number;
  historialesFiltroCreados: number;
  aceitesAgregados: number;
  aceitesActualizados: number;
  aceitesEliminados: number;
}
export interface ActualizarEquipoCompletoRespuesta {
  codigo: string;
  mensaje: string;
  equipoLista: EquipoEngraseListItem;
  cambiosDetalle: CambiosDetalleEquipo;
  resumenOperaciones: ResumenOperacionesEquipo;
}

export type OperacionImagenEquipo = "agregar" | "actualizar" | "eliminar";
export interface AdministrarImagenAgregarActualizar {
  codigoEquipo: string;
  operacion: "agregar" | "actualizar";
  storagePath: `${string}.webp`;
  descripcion: string | null;
}
export interface AdministrarImagenEliminar {
  codigoEquipo: string;
  operacion: "eliminar";
  storagePath: null;
  descripcion: null;
}
export type AdministrarImagenEquipoEntrada =
  | AdministrarImagenAgregarActualizar
  | AdministrarImagenEliminar;
export interface ImagenEquipoResultado {
  mainStoragePath: string | null;
  tieneImagenMain: boolean;
  imagenActualizadaEn: string | null;
}
export interface AdministrarImagenEquipoRespuesta {
  codigo: string;
  equipoId: number;
  operacion: OperacionImagenEquipo;
  imagen: ImagenEquipoResultado;
  storagePathAnterior: string | null;
}

export interface ObtenerEquipoParaEdicionDto {
  ok: boolean;
  codigo?: string;
  mensaje?: string;
  equipo?: {
    id: number;
    codigo: string;
    tipo_equipo_id: number;
    tipo_equipo: string;
    subtipo: string | null;
    estado: EquipoEstado;
  };
  etapas?: { id: number; nombre: string }[];
  filtros?: {
    id: number;
    equipo_id: number;
    tipo_filtro_id: number;
    filtro_id: number;
    cantidad: number;
    tipoFiltro: { id: number; nombre: string };
    filtro: { id: number; codigo: string; esta_en_lista_compras: boolean };
    cantidad_equivalencias: number;
  }[];
  aceites?: {
    equipo_aceite_id: number;
    sistema: { id: number; nombre: string };
    aceite: { id: number; nombre: string };
  }[];
}
export interface ObtenerAuxiliaresEdicionDto {
  ok: boolean;
  codigo?: string;
  mensaje?: string;
  tipos_equipo?: { id: number; nombre: string; subtipos_sugeridos: string[] }[];
  etapas?: { id: number; nombre: string }[];
  tipos_filtro?: {
    id: number;
    nombre: string;
    tipos_equipo_que_lo_usan: string[];
  }[];
  sistemas_aceite?: { id: number; nombre: string }[];
  aceites?: { id: number; nombre: string }[];
}
export interface BuscarFiltroOriginalDto {
  ok: boolean;
  encontrado: boolean;
  codigo: string;
  mensaje?: string;
  codigo_buscado?: string;
  puede_crearse?: boolean;
  filtro?: { id: number; codigo: string; esta_en_lista_compras: boolean };
  requiere_seleccionar_tipo?: boolean;
  sin_tipos_registrados?: boolean;
  tipos_posibles?: {
    tipo_filtro: { id: number; nombre: string };
    tipos_equipo_que_lo_usan: string[];
    ya_asignado_al_equipo: boolean;
    equipo_filtro_actual: {
      equipo_filtro_id: number;
      codigo: string;
      cantidad: number;
    } | null;
  }[];
}
export interface ActualizarEquipoCompletoDto {
  ok: boolean;
  codigo: string;
  mensaje: string;
  equipo_lista?: {
    id: number;
    codigo: string;
    tipo_equipo_id: number;
    tipo_equipo: string;
    subtipo: string | null;
    estado: EquipoEstado;
    main_storage_path: string | null;
    tiene_imagen_main: boolean;
    imagen_actualizada_en: string | null;
    etapas: { id: number; nombre: string }[];
  };
  cambios_detalle?: {
    datos_equipo_cambiaron: boolean;
    etapas_cambiaron: boolean;
    filtros_cambiaron: boolean;
    aceites_cambiaron: boolean;
  };
  resumen_operaciones?: {
    etapas_agregadas: number;
    etapas_eliminadas: number;
    filtros_agregados: number;
    filtros_actualizados: number;
    filtros_eliminados: number;
    historiales_filtro_creados: number;
    aceites_agregados: number;
    aceites_actualizados: number;
    aceites_eliminados: number;
  };
}
export interface AdministrarImagenEquipoDto {
  ok: boolean;
  codigo: string;
  mensaje?: string;
  equipo_id?: number;
  operacion?: OperacionImagenEquipo;
  imagen?: {
    main_storage_path: string | null;
    tiene_imagen_main: boolean;
    imagen_actualizada_en: string | null;
  };
  storage_path_anterior?: string | null;
}
