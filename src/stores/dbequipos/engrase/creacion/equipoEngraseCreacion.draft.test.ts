import { describe, expect, it } from "vitest";
import {
  clonarCrearEquipoDraft,
  crearClaveNombreCreacion,
  crearEquipoDraftInicial,
  crearTempId,
  normalizarCodigoCreacion,
  normalizarTextoCreacion,
} from "./equipoEngraseCreacion.draft";
import type {
  CrearEquipoDraft,
  ValidacionCodigoEquipoCreacion,
} from "./equipoEngraseCreacion.types";

const crearBorradorCompleto = (): CrearEquipoDraft => ({
  datos: {
    codigo: " b7577 ",
    tipoEquipo: {
      estado: "nuevo",
      id: null,
      tempId: "tmp_tipo_equipo_1",
      nombre: "Bus",
      subtiposSugeridos: ["Urbano"],
    },
    subtipo: "Urbano",
    etapas: [{ id: 3, nombre: "Taller" }],
    estado: "activo",
  },
  filtros: [
    {
      draftId: "tmp_equipo_filtro_1",
      tipoFiltro: { estado: "existente", id: 8, tempId: null, nombre: "Aceite" },
      filtro: {
        estado: "nuevo",
        id: null,
        tempId: "tmp_filtro_1",
        codigo: "B7577",
        estaEnListaCompras: true,
      },
      cantidad: 2,
    },
  ],
  aceites: [
    {
      draftId: "tmp_equipo_aceite_1",
      sistema: { estado: "existente", id: 4, tempId: null, nombre: "Motor" },
      aceite: { estado: "nuevo", id: null, tempId: "tmp_aceite_1", nombre: "15W-40" },
    },
  ],
  validacionCodigo: { estado: "invalido", codigo: "B7577", modeloExistente: "Bus", activoExistente: true },
  equipoCreado: {
    id: 20,
    codigo: "B7577",
    tipo_equipo_id: 1,
    tipo_equipo: "Bus",
    subtipo: "Urbano",
    estado: "activo",
    main_storage_path: null,
    tiene_imagen_main: false,
    imagen_actualizada_en: null,
    etapas: [{ id: 3, nombre: "Taller" }],
  },
});

describe("borrador de creación de equipo de engrase", () => {
  it("crea el estado inicial limpio y sin referencias mutables compartidas", () => {
    const primero = crearEquipoDraftInicial();
    const segundo = crearEquipoDraftInicial();

    expect(primero).toEqual({
      datos: { codigo: "", tipoEquipo: null, subtipo: "", etapas: [], estado: "activo" },
      filtros: [],
      aceites: [],
      validacionCodigo: { estado: "idle" },
      equipoCreado: null,
    });
    expect(primero.datos).not.toBe(segundo.datos);
    expect(primero.datos.etapas).not.toBe(segundo.datos.etapas);
    expect(primero.filtros).not.toBe(segundo.filtros);
    expect(primero.aceites).not.toBe(segundo.aceites);
  });

  it("clona todas las fronteras mutables del borrador", () => {
    const original = crearBorradorCompleto();
    const clon = clonarCrearEquipoDraft(original);

    clon.datos.etapas[0].nombre = "Campo";
    clon.datos.tipoEquipo!.subtiposSugeridos[0] = "Escolar";
    clon.filtros[0].filtro.codigo = "P55042";
    clon.aceites[0].sistema.nombre = "Hidráulico";
    clon.equipoCreado!.etapas[0].nombre = "Patio";

    expect(original.datos.etapas[0].nombre).toBe("Taller");
    expect(original.datos.tipoEquipo!.subtiposSugeridos[0]).toBe("Urbano");
    expect(original.filtros[0].filtro.codigo).toBe("B7577");
    expect(original.aceites[0].sistema.nombre).toBe("Motor");
    expect(original.equipoCreado!.etapas[0].nombre).toBe("Taller");
  });

  it("normaliza texto, códigos y claves de nombre sin mutar el valor origen", () => {
    expect(normalizarTextoCreacion("  Bus   Blue Bird ")).toBe("Bus Blue Bird");
    expect(normalizarCodigoCreacion(" b7577 ")).toBe("B7577");
    expect(crearClaveNombreCreacion("HIDRÁULICO")).toBe(
      crearClaveNombreCreacion(" hidraulico "),
    );
  });

  it("representa referencias existentes y temporales sin IDs ficticios", () => {
    const filtros = [
      {
        draftId: "tmp_equipo_filtro_2",
        tipoFiltro: { estado: "nuevo" as const, id: null, tempId: "tmp_tipo_filtro_2", nombre: "Hidráulico" },
        filtro: { estado: "existente" as const, id: 9, tempId: null, codigo: "B7577", estaEnListaCompras: false },
        cantidad: 1,
      },
      {
        draftId: "tmp_equipo_filtro_3",
        tipoFiltro: { estado: "existente" as const, id: 10, tempId: null, nombre: "Aceite" },
        filtro: { estado: "nuevo" as const, id: null, tempId: "tmp_filtro_3", codigo: "B7577", estaEnListaCompras: true },
        cantidad: 1,
      },
    ];

    expect(filtros).toHaveLength(2);
    expect(filtros[0].filtro.id).toBe(9);
    expect(filtros[1].filtro.id).toBeNull();
    expect(filtros[0]).not.toHaveProperty("estadoOperacion");
    expect(filtros[0]).not.toHaveProperty("equipoId");
  });

  it("mantiene los códigos normalizados en todos los estados de validación no idle", () => {
    const estados: ValidacionCodigoEquipoCreacion[] = [
      { estado: "loading", codigo: "B7577" },
      { estado: "valido", codigo: "B7577" },
      { estado: "invalido", codigo: "B7577", modeloExistente: null, activoExistente: null },
      { estado: "error", codigo: "B7577", mensaje: "Sin conexión" },
    ];

    expect(crearEquipoDraftInicial().validacionCodigo).toEqual({ estado: "idle" });
    expect(
      estados.every(
        (estado) => estado.estado !== "idle" && estado.codigo === "B7577",
      ),
    ).toBe(true);
  });

  it("crea IDs temporales únicos con los prefijos documentados", () => {
    const tipos = ["tipo_equipo", "equipo_filtro", "tipo_filtro", "filtro", "equipo_aceite", "sistema_aceite", "aceite"] as const;
    const ids = tipos.map((tipo) => crearTempId(tipo));

    expect(new Set(ids).size).toBe(ids.length);
    tipos.forEach((tipo, indice) => {
      expect(ids[indice]).toMatch(new RegExp(`^tmp_${tipo}_`));
    });
  });
});
