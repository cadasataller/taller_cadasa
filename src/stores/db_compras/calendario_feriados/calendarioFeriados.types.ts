export interface CalendarioFeriadosResponse {
  year: number;
  holidays: string[];
}

export interface CalendarioFeriadosState {
  holidaysByYear: Record<string, string[]>;
  loadingYears: string[];
  errorByYear: Record<string, string | null>;
}
