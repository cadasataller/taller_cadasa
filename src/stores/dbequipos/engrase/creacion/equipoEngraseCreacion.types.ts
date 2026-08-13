import type { EquipoEngraseListItem } from "../filtrosEngrase.types";
import type {
  AuxiliaresEdicionEquipo,
  ResultadoBusquedaFiltroOriginal as ResultadoBusquedaFiltroOriginalEdicion,
} from "../edicion/equipoEngraseEdicion.types";
import type {
  CatalogoDraftReference,
  CatalogoExistenteReference,
  CatalogoIdNombre,
  CatalogoTemporalReference,
  EquipoEstado,
} from "../shared/equipoEngraseDraft.types";

export type {
  CatalogoDraftReference,
  CatalogoExistenteReference,
  CatalogoIdNombre,
  CatalogoTemporalReference,
  EquipoEstado,
} from "../shared/equipoEngraseDraft.types";

export type AuxiliaresEquipoEngrase = AuxiliaresEdicionEquipo;
export type ResultadoBusquedaFiltroOriginal =
  ResultadoBusquedaFiltroOriginalEdicion;

export type ValidacionCodigoEquipoRespuesta =
  | { puedeCrearse: true }
  | {
      puedeCrearse: false;
      modeloExistente: string | null;
      activoExistente: boolean | null;
    };

export interface ResumenOperacionesCreacionEquipo {
  etapasAgregadas: number;
  filtrosAgregados: number;
  aceitesAgregados: number;
}

export interface CrearEquipoCompletoRespuesta {
  codigo: string;
  mensaje: string;
  equipoLista: EquipoEngraseListItem;
  resumenOperaciones: ResumenOperacionesCreacionEquipo;
}

export type CrearEquipoPaso = 1 | 2 | 3 | 4 | 5;

export const CREAR_EQUIPO_PASOS = [
  { numero: 1, clave: "datos", titulo: "Datos del equipo" },
  { numero: 2, clave: "filtros", titulo: "Filtros" },
  { numero: 3, clave: "aceites", titulo: "Aceites" },
  { numero: 4, clave: "revisar", titulo: "Revisar" },
  { numero: 5, clave: "imagen", titulo: "Imagen" },
] as const;

export interface CrearEquipoError {
  codigo: string;
  mensaje: string;
}

export type CrearEquipoOverlay =
  | "confirmar_salida"
  | "nuevo_tipo_equipo"
  | "agregar_filtro"
  | "editar_filtro"
  | "agregar_aceite"
  | "editar_aceite";

export type CrearEquipoOverlayState =
  | { kind: "confirmar_salida" }
  | { kind: "nuevo_tipo_equipo" }
  | { kind: "agregar_filtro" }
  | { kind: "editar_filtro"; draftId: string }
  | { kind: "agregar_aceite" }
  | { kind: "editar_aceite"; draftId: string };

export interface TipoEquipoExistenteCreacionReference
  extends CatalogoExistenteReference {
  subtiposSugeridos: string[];
}

export interface TipoEquipoNuevoCreacionReference
  extends CatalogoTemporalReference {
  subtiposSugeridos: string[];
}

export type TipoEquipoCreacionReference =
  | TipoEquipoExistenteCreacionReference
  | TipoEquipoNuevoCreacionReference;

export interface FiltroExistenteCreacionReference {
  estado: "existente";
  id: number;
  tempId: null;
  codigo: string;
  estaEnListaCompras: boolean;
}

export interface FiltroNuevoCreacionReference {
  estado: "nuevo";
  id: null;
  tempId: string;
  codigo: string;
  estaEnListaCompras: boolean;
}

export type FiltroCreacionReference =
  | FiltroExistenteCreacionReference
  | FiltroNuevoCreacionReference;

export type TipoFiltroCreacionReference = CatalogoDraftReference;

export interface CrearEquipoDatosDraft {
  codigo: string;
  tipoEquipo: TipoEquipoCreacionReference | null;
  subtipo: string;
  etapas: CatalogoIdNombre[];
  estado: EquipoEstado;
}

export interface CrearEquipoFiltroDraft {
  draftId: string;
  tipoFiltro: TipoFiltroCreacionReference;
  filtro: FiltroCreacionReference;
  cantidad: number;
}

export interface CrearEquipoAceiteDraft {
  draftId: string;
  sistema: CatalogoDraftReference;
  aceite: CatalogoDraftReference;
}

export type ValidacionCodigoEquipoCreacion =
  | { estado: "idle" }
  | { estado: "loading"; codigo: string }
  | { estado: "valido"; codigo: string }
  | {
      estado: "invalido";
      codigo: string;
      modeloExistente: string | null;
      activoExistente: boolean | null;
    }
  | { estado: "error"; codigo: string; mensaje: string };

export interface CrearEquipoDraft {
  datos: CrearEquipoDatosDraft;
  filtros: CrearEquipoFiltroDraft[];
  aceites: CrearEquipoAceiteDraft[];
  validacionCodigo: ValidacionCodigoEquipoCreacion;
  equipoCreado: EquipoEngraseListItem | null;
}

export type CrearEquipoPasoValidable = 1 | 2 | 3 | 4;

export type CrearEquipoSeccionError =
  | "datos"
  | "etapas"
  | "filtros"
  | "aceites"
  | "general";

export interface CrearEquipoValidationIssue {
  codigo: string;
  mensaje: string;
  paso: CrearEquipoPasoValidable;
  seccion: CrearEquipoSeccionError;
  fieldId?: string;
}

export interface CrearEquipoValidationResult {
  valido: boolean;
  errores: CrearEquipoValidationIssue[];
}

export interface EntidadExistenteCreacionPayload {
  estado: "existente";
  id: number;
  nombre: string;
}

export interface EntidadNuevaCreacionPayload {
  estado: "nuevo";
  id: null;
  temp_id: string;
  nombre: string;
}

export type EntidadCreacionPayload =
  | EntidadExistenteCreacionPayload
  | EntidadNuevaCreacionPayload;

export interface FiltroExistenteCreacionPayload {
  estado: "existente";
  id: number;
  codigo: string;
  esta_en_lista_compras: boolean;
}

export interface FiltroNuevoCreacionPayload {
  estado: "nuevo";
  id: null;
  temp_id: string;
  codigo: string;
  esta_en_lista_compras: boolean;
}

export type FiltroCreacionPayload =
  | FiltroExistenteCreacionPayload
  | FiltroNuevoCreacionPayload;

export interface DatosEquipoCreacionPayload {
  codigo: string;
  subtipo: string;
  estado: EquipoEstado;
  tipo_equipo: EntidadCreacionPayload;
}

export interface EtapaAgregadaCreacionPayload {
  estado_operacion: "nuevo";
  etapa_id: number;
}

export interface EtapasCreacionPayload {
  agregadas: EtapaAgregadaCreacionPayload[];
}

export interface FiltroEquipoNuevoCreacionPayload {
  estado_operacion: "nuevo";
  temp_id: string;
  tipo_filtro: EntidadCreacionPayload;
  filtro: FiltroCreacionPayload;
  cantidad: number;
}

export interface FiltrosCreacionPayload {
  nuevos: FiltroEquipoNuevoCreacionPayload[];
}

export interface AceiteEquipoNuevoCreacionPayload {
  estado_operacion: "nuevo";
  temp_id: string;
  sistema: EntidadCreacionPayload;
  aceite: EntidadCreacionPayload;
}

export interface AceitesCreacionPayload {
  nuevos: AceiteEquipoNuevoCreacionPayload[];
}

export interface CrearEquipoCompletoDatosPayload {
  datos_equipo: DatosEquipoCreacionPayload;
  etapas: EtapasCreacionPayload;
  filtros: FiltrosCreacionPayload;
  aceites: AceitesCreacionPayload;
}

export interface CrearEquipoCompletoArgumento {
  datos: CrearEquipoCompletoDatosPayload;
}

export type ConstruirPayloadCreacionResultado =
  | { ok: true; argumento: CrearEquipoCompletoArgumento }
  | { ok: false; errores: CrearEquipoValidationIssue[] };
