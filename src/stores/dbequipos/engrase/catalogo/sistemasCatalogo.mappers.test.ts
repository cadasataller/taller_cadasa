import { describe, expect, it } from "vitest";
import { mapCatalogoSistemaGuardarResponse, mapCatalogoSistemasListarResponse } from "./sistemasCatalogo.mappers";
const rpcItem={id:7,nombre:" MOTOR ",activo:true,creado_en:"2026-08-01T14:00:00Z",actualizado_en:"inválida",aceites:[{id:2,nombre:" SAE 40 ",cantidad_equipos:3}],impacto:{total_equipos:3,total_asignaciones:5,tipos_equipo:[{id:1,nombre:" TRACTORES ",cantidad_equipos:3}]}};
describe("mapper del catálogo de sistemas",()=>{
  it("mapea aceites e impacto sin mezclar métricas",()=>{const result=mapCatalogoSistemasListarResponse({ok:true,items:[rpcItem],resumen:{total:1,activos:1,desactivados:0}});expect(result.items[0]).toMatchObject({nombre:"MOTOR",actualizadoEn:null,aceites:[{id:2,nombre:"SAE 40",cantidadEquipos:3}],impacto:{totalEquipos:3,totalAsignaciones:5}})});
  it("conserva ceros y rechaza payload esencial inválido",()=>{expect(mapCatalogoSistemasListarResponse({ok:true,items:[{...rpcItem,aceites:[],impacto:{total_equipos:0,total_asignaciones:0,tipos_equipo:[]}}],resumen:{total:1,activos:1,desactivados:0}}).items[0]?.impacto.totalEquipos).toBe(0);expect(()=>mapCatalogoSistemasListarResponse({ok:true,items:[{...rpcItem,id:0}],resumen:{total:1,activos:1,desactivados:0}})).toThrow(/ID positivo/)});
  it("reutiliza el mapper para el guardado",()=>{expect(mapCatalogoSistemaGuardarResponse({ok:true,operacion:"actualizado",codigo:"SISTEMA_ACTUALIZADO",mensaje:" Listo ",afecta_equipos:3,item:rpcItem})).toMatchObject({mensaje:"Listo",afectaEquipos:3,item:{id:7}})});
});
