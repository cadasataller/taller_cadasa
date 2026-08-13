import { describe, expect, it } from "vitest";
import { crearEquipoDraftInicial } from "./equipoEngraseCreacion.draft";
import {
  puedeSolicitarValidacionCodigo,
  validarCreacionEquipoCompleta,
  validarPasoAceitesEquipo,
  validarPasoDatosEquipo,
  validarPasoFiltrosEquipo,
} from "./equipoEngraseCreacion.validation";

const crearBorradorValido = () => {
  const draft = crearEquipoDraftInicial();
  draft.datos.codigo = " 410003 ";
  draft.datos.tipoEquipo = { estado: "existente", id: 1, tempId: null, nombre: "Buses", subtiposSugeridos: ["Urbano"] };
  draft.datos.subtipo = "Bus urbano";
  draft.datos.etapas = [{ id: 2, nombre: "Taller" }];
  draft.validacionCodigo = { estado: "valido", codigo: "410003" };
  draft.filtros = [{
    draftId: "tmp_equipo_filtro_1",
    tipoFiltro: { estado: "existente", id: 3, tempId: null, nombre: "Aceite" },
    filtro: { estado: "existente", id: 5, tempId: null, codigo: "B7577", estaEnListaCompras: true },
    cantidad: 1,
  }];
  return draft;
};

describe("validaciones de creación de equipos", () => {
  it("sólo permite solicitar validación para códigos de más de cuatro caracteres", () => {
    expect(puedeSolicitarValidacionCodigo("4100")).toBe(false);
    expect(puedeSolicitarValidacionCodigo(" 41000 ")).toBe(true);
  });

  it("distingue estados de validación de código y respuestas obsoletas", () => {
    const draft = crearBorradorValido();
    draft.validacionCodigo = { estado: "idle" };
    expect(validarPasoDatosEquipo(draft).errores.map((error) => error.codigo)).toContain("CODIGO_EQUIPO_PENDIENTE_VALIDACION");
    draft.validacionCodigo = { estado: "loading", codigo: "410003" };
    expect(validarPasoDatosEquipo(draft).errores.map((error) => error.codigo)).toContain("CODIGO_EQUIPO_VALIDANDO");
    draft.validacionCodigo = { estado: "error", codigo: "410003", mensaje: "Red" };
    expect(validarPasoDatosEquipo(draft).errores.map((error) => error.codigo)).toContain("VALIDACION_CODIGO_FALLIDA");
    draft.validacionCodigo = { estado: "invalido", codigo: "410003", modeloExistente: null, activoExistente: null };
    expect(validarPasoDatosEquipo(draft).errores.map((error) => error.codigo)).toContain("EQUIPO_YA_EXISTE_EN_ENGRASE");
    draft.validacionCodigo = { estado: "valido", codigo: "410002" };
    expect(validarPasoDatosEquipo(draft).errores.map((error) => error.codigo)).toContain("VALIDACION_CODIGO_OBSOLETA");
  });

  it("valida requisitos y etapas del paso de datos", () => {
    const draft = crearEquipoDraftInicial();
    const codigos = validarPasoDatosEquipo(draft).errores.map((error) => error.codigo);
    expect(codigos).toEqual(expect.arrayContaining([
      "CODIGO_EQUIPO_REQUERIDO", "TIPO_EQUIPO_REQUERIDO", "SUBTIPO_EQUIPO_REQUERIDO", "ETAPA_MINIMA_REQUERIDA",
    ]));
  });

  it("permite códigos de filtro repetidos si sus tipos son distintos", () => {
    const draft = crearBorradorValido();
    draft.filtros.push({
      draftId: "tmp_equipo_filtro_2",
      tipoFiltro: { estado: "nuevo", id: null, tempId: "tmp_tipo_filtro_2", nombre: "Hidráulico" },
      filtro: { estado: "existente", id: 5, tempId: null, codigo: "B7577", estaEnListaCompras: true },
      cantidad: 1,
    });
    expect(validarPasoFiltrosEquipo(draft)).toEqual({ valido: true, errores: [] });
  });

  it("rechaza tipos y sistemas duplicados por identidad conceptual", () => {
    const draft = crearBorradorValido();
    draft.filtros.push({
      draftId: "tmp_equipo_filtro_2",
      tipoFiltro: { estado: "nuevo", id: null, tempId: "tmp_tipo_filtro_2", nombre: " filtro hidráulico " },
      filtro: { estado: "nuevo", id: null, tempId: "tmp_filtro_2", codigo: "P55042", estaEnListaCompras: false },
      cantidad: 1,
    }, {
      draftId: "tmp_equipo_filtro_3",
      tipoFiltro: { estado: "nuevo", id: null, tempId: "tmp_tipo_filtro_3", nombre: "FILTRO HIDRÁULICO" },
      filtro: { estado: "nuevo", id: null, tempId: "tmp_filtro_3", codigo: "P55043", estaEnListaCompras: false },
      cantidad: 1,
    });
    expect(validarPasoFiltrosEquipo(draft).errores.map((error) => error.codigo)).toContain("TIPO_FILTRO_DUPLICADO");
    draft.aceites = [
      { draftId: "tmp_equipo_aceite_1", sistema: { estado: "nuevo", id: null, tempId: "tmp_sistema_aceite_1", nombre: "Motor" }, aceite: { estado: "nuevo", id: null, tempId: "tmp_aceite_1", nombre: "15W-40" } },
      { draftId: "tmp_equipo_aceite_2", sistema: { estado: "nuevo", id: null, tempId: "tmp_sistema_aceite_2", nombre: " MÓTOR " }, aceite: { estado: "nuevo", id: null, tempId: "tmp_aceite_2", nombre: "10W-30" } },
    ];
    expect(validarPasoAceitesEquipo(draft).errores.map((error) => error.codigo)).toContain("SISTEMA_ACEITE_DUPLICADO");
  });

  it("mantiene orden por paso y bloquea un segundo intento tras crear", () => {
    const draft = crearBorradorValido();
    draft.equipoCreado = { id: 1, codigo: "410003", tipo_equipo_id: 1, tipo_equipo: "Buses", subtipo: null, estado: "activo", main_storage_path: null, tiene_imagen_main: false, imagen_actualizada_en: null, etapas: [] };
    draft.filtros = [];
    const errores = validarCreacionEquipoCompleta(draft).errores;
    expect(errores.map((error) => error.paso)).toEqual([2, 4]);
    expect(errores[1].codigo).toBe("EQUIPO_YA_CREADO");
  });
});
