export type ActivityTeamsSummaryTab = "general" | "desglose";

export interface ActivityTeamsFilters {
  startDate: string;
  endDate: string;
}

export interface ActivityTeamsRange {
  startDate: string;
  endDate: string;
  timezone: string;
}

export interface ActivityTeamsTotals {
  equipment: number;
  journeys: number;
  totalSeconds: number;
  totalTime: string;
  effectiveSeconds: number;
  effectiveTime: string;
  effectiveness: number;
  stoppedSeconds: number;
  stoppedTime: string;
  stoppedPercentage: number;
}

export interface ActivityTeamsDay {
  date: string;
  weekday: string;
  effectiveness: number;
  stoppedPercentage: number;
  effectiveTime: string;
  stoppedTime: string;
  equipment: number;
  journeys: number;
}

export interface ActivityTeamsRankingItem {
  label: string;
  value: string;
  percentage: number;
  secondary: string | null;
}

export interface ActivityTeamsEquipmentPerformance {
  code: string;
  type: string | null;
  effectiveSeconds: number;
  stoppedSeconds: number;
  totalSeconds: number;
}

export interface ActivityTeamsEquipmentType {
  code: string;
  type: string | null;
}

export interface ActivityTeamsTypePerformance {
  label: string;
  value: string;
  percentage: number;
  secondary: string | null;
}

export interface ActivityTeamsReport {
  range: ActivityTeamsRange;
  totals: ActivityTeamsTotals;
  bestDay: ActivityTeamsDay | null;
  worstDay: ActivityTeamsDay | null;
  topJobs: ActivityTeamsRankingItem[];
  topStopReasons: ActivityTeamsRankingItem[];
  equipmentPerformance: ActivityTeamsEquipmentPerformance[];
  dailyActivity: ActivityTeamsDay[];
  bestEquipment: ActivityTeamsRankingItem[];
  worstEquipment: ActivityTeamsRankingItem[];
  topOperators: ActivityTeamsRankingItem[];
}

export type ActivityTeamsLoadState =
  "idle" | "loading" | "ready" | "empty" | "error";
