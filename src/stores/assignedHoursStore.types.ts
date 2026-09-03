export interface AssignedHoursMechanic {
  id: number | null;
  NOMBRE: string | null;
  AREA: string | null;
  "EQUIPO DE TRABAJO": string | null;
}

export interface AssignedHoursMaintenanceOrder {
  Área: string | null;
  Descripcion: string | null;
}

export interface AssignedHoursGeneralServiceOrder {
  id_sg: string | null;
  tipo_trabajo: string | null;
  ORDEN_MANTENIMIENTO: AssignedHoursMaintenanceOrder | null;
}

export interface AssignedHoursWorkOrder {
  ID_OT: string;
  id_om: string | null;
  id_sg: string | null;
  created: string | null;
  Fecha: string;
  "Duración (horas)": number | string | null;
  Estatus: string | null;
  "Retraso (horas)": number | string | null;
  Semana: number | string | null;
  MECANICOS: AssignedHoursMechanic | AssignedHoursMechanic[] | null;
  ORDEN_MANTENIMIENTO: AssignedHoursMaintenanceOrder | null;
  OM_SG: AssignedHoursGeneralServiceOrder | null;
}

export interface AssignedHoursWorkerGroup {
  name: string;
  totalHours: number;
  orders: AssignedHoursWorkOrder[];
}

export type AssignedHoursGroup =
  | {
      kind: "mechanic";
      name: string;
      totalHours: number;
      orders: AssignedHoursWorkOrder[];
    }
  | {
      kind: "team";
      name: string;
      totalHours: number;
      workers: AssignedHoursWorkerGroup[];
    };
