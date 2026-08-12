export type CatalogoEngraseSection =
  | "tipos-filtro"
  | "filtros"
  | "aceites"
  | "sistemas";

export type CatalogoEngraseRouteName =
  | "CatalogoEngraseTiposFiltro"
  | "CatalogoEngraseFiltros"
  | "CatalogoEngraseAceites"
  | "CatalogoEngraseSistemas";

export interface CatalogoEngraseNavigationItem {
  id: CatalogoEngraseSection;
  label: string;
  routeName: CatalogoEngraseRouteName;
}
