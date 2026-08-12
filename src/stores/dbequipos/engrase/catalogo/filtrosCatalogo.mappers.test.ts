import { describe, expect, it } from "vitest";
import { mapCatalogoFiltroGuardarResponse, mapCatalogoFiltrosListarResponse } from "./filtrosCatalogo.mappers";
const rpcItem = { id:7,codigo:" B7030 ",esta_en_lista_compras:true,activo:true,creado_en:"2026-08-01T14:00:00Z",actualizado_en:"inválida",tipos_filtro:[{id:2,nombre:" Aire ",cantidad_equipos:3}],impacto:{total_equipos:3,total_asignaciones:5,tipos_equipo:[{id:1,nombre:" TRACTORES ",cantidad_equipos:3}]} };
describe("mapper del catálogo de filtros",()=>{
  it("mapea relaciones, impacto y resumen conservando métricas separadas",()=>{ const result=mapCatalogoFiltrosListarResponse({ok:true,items:[rpcItem],resumen:{total:1,activos:1,desactivados:0,en_compras:1,fuera_compras:0}}); expect(result.items[0]).toMatchObject({codigo:"B7030",estaEnListaCompras:true,actualizadoEn:null,tiposFiltro:[{id:2,nombre:"Aire",cantidadEquipos:3}],impacto:{totalEquipos:3,totalAsignaciones:5}}); });
  it("rechaza IDs y estructuras esenciales inválidos",()=>{ expect(()=>mapCatalogoFiltrosListarResponse({ok:true,items:[{...rpcItem,id:0}],resumen:{total:1,activos:1,desactivados:0,en_compras:1,fuera_compras:0}})).toThrow(/ID positivo/); expect(()=>mapCatalogoFiltrosListarResponse({ok:true,items:[{...rpcItem,tipos_filtro:null}],resumen:{}})).toThrow(); });
  it("mapea guardado con el mismo item",()=>{ expect(mapCatalogoFiltroGuardarResponse({ok:true,operacion:"actualizado",codigo:"FILTRO_ACTUALIZADO",mensaje:" Listo ",afecta_equipos:3,item:rpcItem})).toMatchObject({mensaje:"Listo",afectaEquipos:3,item:{id:7}}); });
});
