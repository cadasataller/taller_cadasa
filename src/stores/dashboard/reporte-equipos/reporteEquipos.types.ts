export type ReportTab = "resumen" | "paradas" | "operadores";
export type ReportLoadState = "idle" | "loading" | "ready" | "empty" | "error";

export interface ReportFilters {
  startDate: string;
  endDate: string;
  search: string;
}
export interface EquipmentListItem {
  code: string;
  type: string;
  journeys: number | null;
  totalTime: string | null;
  totalSeconds: number | null;
}
export interface EngineUsage {
  engineOn: boolean;
  state: string;
  seconds: number;
  time: string;
  percentage: number;
  periods: number;
}
export interface EquipmentContext {
  code: string;
  journeys: number;
  firstActivity: string | null;
  lastActivity: string | null;
  totalSeconds: number;
  totalTime: string;
  engine: EngineUsage[];
}
export interface EquipmentMasterDetail {
  code: string;
  type: string | null;
  model: string | null;
  brand: string | null;
  active: boolean;
  imagePath: string | null;
  imageUrl: string | null;
}
export interface EquipmentSummary {
  code: string;
  totalSeconds: number;
  totalTime: string;
  workingSeconds: number;
  workingTime: string;
  stoppedSeconds: number;
  stoppedTime: string;
  effectiveness: number;
}
export interface ReportLoadStates {
  equipmentList: ReportLoadState;
  equipmentDetail: ReportLoadState;
  context: ReportLoadState;
  summary: ReportLoadState;
  stops: ReportLoadState;
  operators: ReportLoadState;
  operatorDetail: ReportLoadState;
}
