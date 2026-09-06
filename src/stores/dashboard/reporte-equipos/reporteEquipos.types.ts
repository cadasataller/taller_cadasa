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
  recentLocation: EquipmentRecentLocation | null;
  totalSeconds: number;
  totalTime: string;
  workingSeconds: number;
  workingTime: string;
  stoppedSeconds: number;
  stoppedTime: string;
  effectiveness: number;
  classifications: SummaryClassificationRow[];
  mainStops: SummaryStopReasonRow[];
  operators: SummaryOperatorUsageRow[];
  implements: SummaryImplementRow[];
  history: SummaryHistoryRow[];
}
export interface EquipmentRecentLocation {
  latitude: number;
  longitude: number;
  occurredAt: string;
  occurredAtLocal: string;
  registeredAt: string;
  eventType: string;
  farmName: string | null;
}
export interface StopMetrics {
  stoppedSeconds: number;
  stoppedTime: string;
  stoppedPercentage: number;
  stopCount: number;
  averageDurationSeconds: number;
  averageDuration: string;
}
export interface StopClassificationRow {
  classification: string;
  seconds: number;
  time: string;
  count: number;
  percentage: number;
}
export interface StopOriginRow {
  origin: "equipo" | "implemento" | "otro";
  seconds: number;
  time: string;
  count: number;
  percentage: number;
}
export interface StopReasonRow {
  reason: string;
  occurrences: number;
  seconds: number;
  time: string;
  percentage: number;
}
export interface StopImplement {
  id: string;
  number: string;
  name: string;
}
export interface StopDetailRow {
  startAt: string;
  endAt: string;
  startLocal: string;
  endLocal: string;
  duration: string;
  reason: string;
  origin: "equipo" | "implemento" | "otro";
  classification: string;
  engineOn: boolean;
  engine: string;
  implement: StopImplement | null;
}
export interface EquipmentStops {
  code: string;
  metrics: StopMetrics;
  classifications: StopClassificationRow[];
  origins: StopOriginRow[];
  mainReasons: StopReasonRow[];
  details: StopDetailRow[];
}
export interface OperatorMetrics {
  uniqueOperators: number;
  totalSeconds: number;
  totalTime: string;
  journeys: number;
  topParticipation: {
    operatorId: string;
    operator: string;
    percentage: number;
  } | null;
}
export interface OperatorUsageRow {
  operatorId: string;
  operator: string;
  journeys: number | null;
  totalSeconds: number;
  totalTime: string;
  workingSeconds: number | null;
  workingTime: string | null;
  stoppedSeconds: number | null;
  stoppedTime: string | null;
  percentage: number;
  firstActivity: string | null;
  lastActivity: string | null;
}
export interface EquipmentOperators {
  code: string;
  metrics: OperatorMetrics;
  operators: OperatorUsageRow[];
}
export interface OperatorStateDistributionRow {
  state: "trabajando" | "parado";
  seconds: number;
  time: string;
  percentage: number;
}
export interface OperatorClassificationDistributionRow {
  classification: string;
  seconds: number;
  time: string;
  percentage: number;
}
export interface OperatorStopReasonRow {
  reason: string;
  seconds: number;
  time: string;
  percentage: number;
}
export interface OperatorEngineUsageRow {
  engineOn: boolean;
  state: string;
  seconds: number;
  time: string;
  percentage: number;
  periods: number;
}
export interface OperatorImplementRow {
  implementId: string;
  number: string;
  description: string;
  journeys: number;
  seconds: number;
  time: string;
}
export interface OperatorHistoryRow {
  startAt: string;
  endAt: string;
  startLocal: string;
  endLocal: string;
  kind: "trabajando" | "parado";
  detail: string;
  seconds: number;
  time: string;
}
export interface OperatorDetail {
  code: string;
  operatorId: string;
  operatorLabel: string;
  journeys: number;
  totalSeconds: number;
  totalTime: string;
  workingSeconds: number;
  workingTime: string;
  stoppedSeconds: number;
  stoppedTime: string;
  stateDistribution: OperatorStateDistributionRow[];
  classificationDistribution: OperatorClassificationDistributionRow[];
  mainStops: OperatorStopReasonRow[];
  engine: OperatorEngineUsageRow[];
  implements: OperatorImplementRow[];
  history: OperatorHistoryRow[];
}
export interface SummaryClassificationRow {
  classification: string;
  seconds: number;
  time: string;
  percentage: number;
}
export interface SummaryStopReasonRow {
  reason: string;
  occurrences: number;
  seconds: number;
  time: string;
  percentage: number;
}
export interface SummaryOperatorUsageRow {
  operatorId: string;
  operator: string;
  journeys: number;
  seconds: number;
  time: string;
  percentage: number;
}
export interface SummaryImplementRow {
  implementId: string;
  number: string;
  description: string;
  journeys: number;
  seconds: number;
  time: string;
  percentage: number;
}
export interface SummaryHistoryRow {
  startAt: string;
  endAt: string;
  startLocal: string;
  endLocal: string;
  kind: "trabajando" | "parado";
  detail: string;
  seconds: number;
  time: string;
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
