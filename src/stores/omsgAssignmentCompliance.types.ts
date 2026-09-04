export interface OmsgAssignmentComplianceItem {
  semana: string | null;
  fecha_trabajo: string | null;
  dia: string | null;
  area_objetivo: string | null;
  email_supervisor: string | null;
  id_sg: string | null;
  id_orden_base: string | null;
  equipo: string | null;
  trabajo_realizar: string | null;
  fecha_creacion: string | null;
  creado_por: string | null;
  nombre_creador: string | null;
  area_creador: string | null;
  mecanicos: string | null;
  cantidad_ot: number | null;
  horas_trabajadas: number | null;
  creador_correcto: boolean | null;
  creada_antes: boolean | null;
  creada_mismo_dia: boolean | null;
  creada_despues: boolean | null;
  motivo_incumplimiento: string | null;
}

export interface OmsgAssignmentComplianceParams {
  fecha: string;
  email: string;
}
