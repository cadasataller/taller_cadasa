import type { EquipoEngraseListItem } from "../filtrosEngrase.types";
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
