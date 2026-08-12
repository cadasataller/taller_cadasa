export type TempIdTipo =
  | "equipo_filtro"
  | "tipo_filtro"
  | "filtro"
  | "equipo_aceite"
  | "sistema_aceite"
  | "aceite"
  | "tipo_equipo";
let secuencia = 0;
export const crearTempId = (tipo: TempIdTipo): string => {
  secuencia += 1;
  return `tmp_${tipo}_${secuencia}`;
};
