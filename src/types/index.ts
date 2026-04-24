export interface BadgeItem {
  id?: string | number;
  label: string;
}

export type BadgeInput = string[] | BadgeItem[];

export interface KPI {
  name: string;
  value: string | number;
  callback?: () => void;
}

export interface RowAction {
  label: string;
  icon?: any;
  callback: (data: any) => void;
}
