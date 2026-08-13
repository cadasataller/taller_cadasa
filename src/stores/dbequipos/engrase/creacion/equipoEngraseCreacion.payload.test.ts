import { describe, expect, it } from "vitest";
import { mapearErrorRpcCreacionEquipo } from "./equipoEngraseCreacion.errors";
import { crearEquipoDraftInicial } from "./equipoEngraseCreacion.draft";
import { construirPayloadCrearEquipo } from "./equipoEngraseCreacion.payload";

const crearBorradorValido = () => {
  const draft = crearEquipoDraftInicial();
  draft.datos.codigo = " b7577 ";
  draft.datos.tipoEquipo = { estado: "nuevo", id: null, tempId: "tmp_tipo_equipo_1", nombre: " Bús   urbano ", subtiposSugeridos: [] };
  draft.datos.subtipo = " Modelo   X ";
  draft.datos.etapas = [{ id: 4, nombre: "Taller" }];
  draft.validacionCodigo = { estado: "valido", codigo: "B7577" };
  draft.filtros = [
    { draftId: "tmp_equipo_filtro_1", tipoFiltro: { estado: "existente", id: 1, tempId: null, nombre: "Aceite" }, filtro: { estado: "existente", id: 35, tempId: null, codigo: " b7577 ", estaEnListaCompras: true }, cantidad: 1 },
    { draftId: "tmp_equipo_filtro_2", tipoFiltro: { estado: "nuevo", id: null, tempId: "tmp_tipo_filtro_2", nombre: "Hidráulico" }, filtro: { estado: "nuevo", id: null, tempId: "tmp_filtro_2", codigo: " b7577 ", estaEnListaCompras: false }, cantidad: 2 },
  ];
  return draft;
};

describe("payload de creación de equipos", () => {
  it("traduce el borrador completo sin perder filas con códigos repetidos", () => {
    const draft = crearBorradorValido();
    const resultado = construirPayloadCrearEquipo(draft);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.argumento).toEqual({ datos: {
      datos_equipo: { codigo: "B7577", subtipo: "Modelo X", estado: "activo", tipo_equipo: { estado: "nuevo", id: null, temp_id: "tmp_tipo_equipo_1", nombre: "Bús urbano" } },
      etapas: { agregadas: [{ estado_operacion: "nuevo", etapa_id: 4 }] },
      filtros: { nuevos: [
        { estado_operacion: "nuevo", temp_id: "tmp_equipo_filtro_1", tipo_filtro: { estado: "existente", id: 1, nombre: "Aceite" }, filtro: { estado: "existente", id: 35, codigo: "B7577", esta_en_lista_compras: true }, cantidad: 1 },
        { estado_operacion: "nuevo", temp_id: "tmp_equipo_filtro_2", tipo_filtro: { estado: "nuevo", id: null, temp_id: "tmp_tipo_filtro_2", nombre: "Hidráulico" }, filtro: { estado: "nuevo", id: null, temp_id: "tmp_filtro_2", codigo: "B7577", esta_en_lista_compras: false }, cantidad: 2 },
      ] },
      aceites: { nuevos: [] },
    } });
    resultado.argumento.datos.datos_equipo.codigo = "OTRO";
    expect(draft.datos.codigo).toBe(" b7577 ");
  });

  it("no construye un payload parcial cuando el borrador es inválido", () => {
    const resultado = construirPayloadCrearEquipo(crearEquipoDraftInicial());
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores.map((error) => error.codigo)).toContain("CODIGO_EQUIPO_REQUERIDO");
  });

  it("mapea errores RPC a su paso y sección de origen", () => {
    expect(mapearErrorRpcCreacionEquipo("EQUIPO_YA_EXISTE_EN_ENGRASE")).toMatchObject({ paso: 1, seccion: "datos", fieldId: "equipo-creacion-codigo" });
    expect(mapearErrorRpcCreacionEquipo("DESCONOCIDO")).toMatchObject({ paso: 4, seccion: "general" });
  });
});
