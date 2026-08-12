import { describe, expect, it } from "vitest";
import { filtrarCatalogoFiltros, normalizarBusquedaCodigo, obtenerOpcionesTiposFiltro, ordenarCatalogoFiltros, resumirCatalogoFiltros } from "./filtrosCatalogo.helpers";
import type { CatalogoFiltroItem } from "./filtrosCatalogo.types";
const item = (id:number,codigo:string,compras:boolean,activo:boolean,equipos:number,asignaciones:number,tipoId:number): CatalogoFiltroItem => ({ id,codigo,estaEnListaCompras:compras,activo,creadoEn:null,actualizadoEn:null,tiposFiltro:[{id:tipoId,nombre:tipoId===1?"Aire":"Aceite",cantidadEquipos:equipos}],impacto:{totalEquipos:equipos,totalAsignaciones:asignaciones,tiposEquipo:[]} });
const items = [item(1,"B-10",true,true,2,5,1),item(2,"B-2",false,false,10,11,2),item(3," A 7 ",true,true,0,0,1)];
describe("helpers del catálogo de filtros",()=>{
  it("normaliza extremos y mayúsculas sin destruir caracteres internos",()=>{ expect(normalizarBusquedaCodigo("  B- 10 ")).toBe("b- 10"); });
  it("filtra localmente por los cuatro criterios",()=>{ expect(filtrarCatalogoFiltros(items,{busqueda:"b-",tipoFiltroId:1,compras:"en-compras",estado:"activos"}).map(x=>x.id)).toEqual([1]); expect(filtrarCatalogoFiltros(items,{busqueda:"",tipoFiltroId:null,compras:"fuera-compras",estado:"todos"}).map(x=>x.id)).toEqual([2]); });
  it("ordena las cinco métricas en ambas direcciones",()=>{ expect(ordenarCatalogoFiltros(items,"codigo","asc").map(x=>x.id)).toEqual([3,2,1]); expect(ordenarCatalogoFiltros(items,"equipos","desc").map(x=>x.id)).toEqual([2,1,3]); expect(ordenarCatalogoFiltros(items,"asignaciones","asc").map(x=>x.id)).toEqual([3,1,2]); expect(ordenarCatalogoFiltros(items,"compras","asc")[0]?.id).toBe(2); expect(ordenarCatalogoFiltros(items,"estado","asc")[0]?.id).toBe(2); });
  it("deduplica tipos y calcula los cinco conteos",()=>{ expect(obtenerOpcionesTiposFiltro(items).map(x=>x.id)).toEqual([2,1]); expect(resumirCatalogoFiltros(items)).toEqual({total:3,activos:2,desactivados:1,enCompras:2,fueraCompras:1}); });
});
