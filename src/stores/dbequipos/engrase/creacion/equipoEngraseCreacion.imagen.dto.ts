export interface AgregarImagenEquipoCreadoDto {
  ok: boolean;
  codigo: string;
  mensaje?: string;
  equipo_id?: number;
  operacion?: "agregar";
  imagen?: {
    main_storage_path: string | null;
    tiene_imagen_main: boolean;
    imagen_actualizada_en: string | null;
  };
  storage_path_anterior?: string | null;
}
