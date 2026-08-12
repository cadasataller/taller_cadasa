import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({rpc:vi.fn(),schema:vi.fn()}));
vi.mock("@/lib/supabase",()=>({supabaseEquipos:{schema:mocks.schema}}));
import { filtrosCatalogoService } from "./filtrosCatalogo.service";
const row={id:4,codigo:" AF-1 ",esta_en_lista_compras:true,activo:true,creado_en:null,actualizado_en:null,tipos_filtro:[],impacto:{total_equipos:0,total_asignaciones:0,tipos_equipo:[]}};
describe("filtrosCatalogoService",()=>{ beforeEach(()=>{mocks.rpc.mockReset();mocks.schema.mockReset();mocks.schema.mockReturnValue({rpc:mocks.rpc});});
  it("lista una vez sin filtros remotos",async()=>{mocks.rpc.mockResolvedValue({data:{ok:true,items:[row],resumen:{total:1,activos:1,desactivados:0,en_compras:1,fuera_compras:0}},error:null});await filtrosCatalogoService.listar();expect(mocks.schema).toHaveBeenCalledWith("engrase");expect(mocks.rpc).toHaveBeenCalledWith("rpc_catalogo_filtros_listar");});
  it("guarda exclusivamente los cuatro campos editables",async()=>{mocks.rpc.mockResolvedValue({data:{ok:true,operacion:"actualizado",codigo:"FILTRO_ACTUALIZADO",mensaje:"Listo",afecta_equipos:0,item:row},error:null});await filtrosCatalogoService.guardar({id:4,codigo:" AF-1 ",esta_en_lista_compras:true,activo:true});expect(mocks.rpc).toHaveBeenCalledWith("rpc_catalogo_filtro_guardar",{p_data:{id:4,codigo:"AF-1",esta_en_lista_compras:true,activo:true}});});
});
