import { describe, expect, it } from "vitest";
import { mapearErrorRpcEquipo, validarEquipoEngrase } from "./equipoEngraseEdicion.validation";
import type { EquipoEdicionDraft } from "./equipoEngraseEdicion.types";

const draftValido = (): EquipoEdicionDraft => ({
  equipo: { id: 1, codigo: "410002", tipoEquipoId: 1, tipoEquipo: "Bus", subtipo: "Urbano", estado: "activo" },
  etapas: [{ id: 1, nombre: "Cultivo" }],
  imagen: { mainStoragePath: null, tieneImagenMain: false, imagenActualizadaEn: null },
  tipoEquipoReferencia: { estado: "existente", id: 1, tempId: null, nombre: "Bus" },
  filtros: [{ id: 1, equipoId: 1, tipoFiltro: { id: 1, nombre: "Aceite" }, filtro: { id: 1, codigo: "OF-1", estaEnListaCompras: true }, cantidad: 1, cantidadEquivalencias: 0, draftId: "filtro_1", estadoOperacion: "existente", estadoAntesDeEliminar: null, tipoFiltroReferencia: { estado: "existente", id: 1, tempId: null, nombre: "Aceite" }, filtroReferencia: { estado: "existente", id: 1, tempId: null, codigo: "OF-1", estaEnListaCompras: true } }],
  aceites: [{ equipoAceiteId: 1, sistema: { id: 1, nombre: "Motor" }, aceite: { id: 1, nombre: "15W-40" }, draftId: "aceite_1", estadoOperacion: "existente", estadoAntesDeEliminar: null, sistemaReferencia: { estado: "existente", id: 1, tempId: null, nombre: "Motor" }, aceiteReferencia: { estado: "existente", id: 1, tempId: null, nombre: "15W-40" } }],
  operaciones: { datos: "existente", etapas: "existente", filtros: "existente", aceites: "existente" },
});

describe("validación integral del equipo", () => {
  it("acepta un estado final válido", () => expect(validarEquipoEngrase(draftValido())).toEqual({ valido: true, errores: [] }));

  it("reporta datos requeridos, mínimos y cantidades inválidas", () => {
    const draft = draftValido();
    draft.equipo.codigo = " ";
    draft.equipo.subtipo = "";
    draft.etapas = [];
    draft.filtros[0]!.cantidad = 1.5;
    const resultado = validarEquipoEngrase(draft);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.map((error) => error.codigo)).toEqual(expect.arrayContaining(["CODIGO_EQUIPO_REQUERIDO", "SUBTIPO_EQUIPO_REQUERIDO", "ETAPA_MINIMA_REQUERIDA", "CANTIDAD_FILTRO_INVALIDA"]));
    expect(resultado.errores[0]?.fieldId).toBe("equipo-codigo");
  });

  it("valida filtro mínimo y unicidad por tipo", () => {
    const sinFiltros = draftValido();
    sinFiltros.filtros[0]!.estadoOperacion = "pendiente_eliminacion";
    expect(validarEquipoEngrase(sinFiltros).errores[0]?.codigo).toBe("FILTRO_MINIMO_REQUERIDO");
    const duplicado = draftValido();
    duplicado.filtros.push({ ...structuredClone(duplicado.filtros[0]!), id: 2, draftId: "filtro_2" });
    expect(validarEquipoEngrase(duplicado).errores.some((error) => error.seccion === "filtros" && error.codigo === "CONFLICTO_DATOS_DUPLICADOS")).toBe(true);
  });

  it("valida un aceite activo por sistema incluso para nombres nuevos normalizados", () => {
    const draft = draftValido();
    draft.aceites.push({ ...structuredClone(draft.aceites[0]!), equipoAceiteId: 0, draftId: "aceite_2", estadoOperacion: "nuevo", sistema: { id: 0, nombre: " Hidráulico " }, sistemaReferencia: { estado: "nuevo", id: null, tempId: "sistema_1", nombre: " Hidráulico " } });
    draft.aceites.push({ ...structuredClone(draft.aceites[0]!), equipoAceiteId: 0, draftId: "aceite_3", estadoOperacion: "nuevo", sistema: { id: 0, nombre: "hidraulico" }, sistemaReferencia: { estado: "nuevo", id: null, tempId: "sistema_2", nombre: "hidraulico" } });
    expect(validarEquipoEngrase(draft).errores.some((error) => error.seccion === "aceites")).toBe(true);
  });

  it("mapea errores RPC a explicaciones recuperables y campos", () => {
    expect(mapearErrorRpcEquipo("CODIGO_EQUIPO_YA_EXISTE")).toMatchObject({ seccion: "datos", fieldId: "equipo-codigo" });
    expect(mapearErrorRpcEquipo("FILTRO_ASIGNADO_NO_EXISTE")).toMatchObject({ seccion: "filtros" });
    expect(mapearErrorRpcEquipo("ERROR_TECNICO").mensaje).toBe("No se pudieron guardar los cambios. Intenta nuevamente.");
  });
});
