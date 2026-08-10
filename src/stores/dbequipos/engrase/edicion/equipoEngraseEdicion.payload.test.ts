import { describe, expect, it } from "vitest";
import { construirCambiosEquipo, hayCambiosEquipo } from "./equipoEngraseEdicion.payload";
import type { EquipoEdicionDraft, EquipoEdicionSnapshot } from "./equipoEngraseEdicion.types";

const snapshotBase = (): EquipoEdicionSnapshot => ({
  equipo: { id: 6, codigo: "410002", tipoEquipoId: 1, tipoEquipo: "Buses", subtipo: "Bus", estado: "activo" },
  etapas: [{ id: 1, nombre: "Cultivo" }, { id: 2, nombre: "Zafra" }],
  filtros: [
    { id: 10, equipoId: 6, tipoFiltro: { id: 1, nombre: "Filtro de aceite" }, filtro: { id: 20, codigo: "OF-1", estaEnListaCompras: true }, cantidad: 1, cantidadEquivalencias: 0 },
    { id: 11, equipoId: 6, tipoFiltro: { id: 2, nombre: "Filtro de aire" }, filtro: { id: 21, codigo: "AF-1", estaEnListaCompras: false }, cantidad: 1, cantidadEquivalencias: 0 },
  ],
  aceites: [{ equipoAceiteId: 30, sistema: { id: 1, nombre: "Motor" }, aceite: { id: 2, nombre: "15W-40" } }],
  imagen: { mainStoragePath: null, tieneImagenMain: false, imagenActualizadaEn: null },
});

const draftBase = (snapshot = snapshotBase()): EquipoEdicionDraft => ({
  ...structuredClone(snapshot),
  filtros: snapshot.filtros.map((filtro) => ({
    ...structuredClone(filtro), draftId: `equipo_filtro_${filtro.id}`, estadoOperacion: "existente", estadoAntesDeEliminar: null,
    filtroReferencia: { estado: "existente", id: filtro.filtro.id, tempId: null, codigo: filtro.filtro.codigo, estaEnListaCompras: filtro.filtro.estaEnListaCompras },
    tipoFiltroReferencia: { estado: "existente", id: filtro.tipoFiltro.id, tempId: null, nombre: filtro.tipoFiltro.nombre },
  })),
  aceites: snapshot.aceites.map((aceite) => ({
    ...structuredClone(aceite), draftId: `equipo_aceite_${aceite.equipoAceiteId}`, estadoOperacion: "existente", estadoAntesDeEliminar: null,
    sistemaReferencia: { estado: "existente", id: aceite.sistema.id, tempId: null, nombre: aceite.sistema.nombre },
    aceiteReferencia: { estado: "existente", id: aceite.aceite.id, tempId: null, nombre: aceite.aceite.nombre },
  })),
  tipoEquipoReferencia: { estado: "existente", id: snapshot.equipo.tipoEquipoId, tempId: null, nombre: snapshot.equipo.tipoEquipo },
  operaciones: { datos: "existente", etapas: "existente", filtros: "existente", aceites: "existente" },
});

describe("payload diferencial de edición", () => {
  it.each([
    ["código", (draft: EquipoEdicionDraft) => { draft.equipo.codigo = "410003"; }, { codigo_nuevo: "410003" }],
    ["subtipo normalizado", (draft: EquipoEdicionDraft) => { draft.equipo.subtipo = "  Bus   urbano "; }, { subtipo: "Bus urbano" }],
    ["estado", (draft: EquipoEdicionDraft) => { draft.equipo.estado = "descartado"; }, { estado: "descartado" }],
  ])("envía sólo %s", (_nombre, cambiar, esperado) => {
    const original = snapshotBase();
    const draft = draftBase(original);
    cambiar(draft);
    expect(construirCambiosEquipo(original, draft)).toEqual({ datos_equipo: { estado_operacion: "actualizado", ...esperado } });
  });

  it("distingue tipo existente y tipo nuevo", () => {
    const original = snapshotBase();
    const existente = draftBase(original);
    existente.tipoEquipoReferencia = { estado: "existente", id: 2, tempId: null, nombre: "Tractores" };
    expect(construirCambiosEquipo(original, existente).datos_equipo?.tipo_equipo).toEqual({ estado: "existente", id: 2, nombre: "Tractores" });
    const nuevo = draftBase(original);
    nuevo.tipoEquipoReferencia = { estado: "nuevo", id: null, tempId: "tmp_tipo_1", nombre: " Tractores ", subtiposSugeridos: [] };
    expect(construirCambiosEquipo(original, nuevo).datos_equipo?.tipo_equipo).toEqual({ estado: "nuevo", id: null, temp_id: "tmp_tipo_1", nombre: "Tractores" });
  });

  it("compara etapas como conjuntos y omite arreglos vacíos", () => {
    const original = snapshotBase();
    const draft = draftBase(original);
    draft.etapas = [{ id: 2, nombre: "Zafra" }, { id: 3, nombre: "Taller" }];
    expect(construirCambiosEquipo(original, draft).etapas).toEqual({
      agregadas: [{ estado_operacion: "nuevo", etapa_id: 3 }],
      eliminadas: [{ estado_operacion: "eliminado", etapa_id: 1 }],
    });
  });

  it("construye filtros nuevos con cada combinación de referencias", () => {
    const original = snapshotBase();
    const draft = draftBase(original);
    draft.filtros.push(
      { id: 0, equipoId: 6, tipoFiltro: { id: 3, nombre: "Combustible" }, filtro: { id: 22, codigo: "FF-1", estaEnListaCompras: true }, cantidad: 2, cantidadEquivalencias: 0, draftId: "tmp_asig_1", estadoOperacion: "nuevo", estadoAntesDeEliminar: null, tipoFiltroReferencia: { estado: "existente", id: 3, tempId: null, nombre: "Combustible" }, filtroReferencia: { estado: "existente", id: 22, tempId: null, codigo: "FF-1", estaEnListaCompras: true } },
      { id: 0, equipoId: 6, tipoFiltro: { id: 0, nombre: "Respiradero" }, filtro: { id: 0, codigo: "BR-1", estaEnListaCompras: false }, cantidad: 1, cantidadEquivalencias: 0, draftId: "tmp_asig_2", estadoOperacion: "nuevo", estadoAntesDeEliminar: null, tipoFiltroReferencia: { estado: "nuevo", id: null, tempId: "tmp_tipo_2", nombre: "Respiradero" }, filtroReferencia: { estado: "nuevo", id: null, tempId: "tmp_filtro_2", codigo: "BR-1", estaEnListaCompras: false } },
    );
    const nuevos = construirCambiosEquipo(original, draft).filtros?.nuevos;
    expect(nuevos).toHaveLength(2);
    expect(nuevos?.[0]).toMatchObject({ temp_id: "tmp_asig_1", tipo_filtro: { estado: "existente", id: 3 }, filtro: { estado: "existente", id: 22 }, cantidad: 2 });
    expect(nuevos?.[1]).toMatchObject({ temp_id: "tmp_asig_2", tipo_filtro: { estado: "nuevo", temp_id: "tmp_tipo_2" }, filtro: { estado: "nuevo", temp_id: "tmp_filtro_2" } });
  });

  it("envía actualizaciones de filtro mínimas con motivo humano concatenado", () => {
    const original = snapshotBase();
    const draft = draftBase(original);
    const filtro = draft.filtros[0];
    if (!filtro) throw new Error("Falta el filtro de prueba.");
    filtro.tipoFiltro = { id: 3, nombre: "Filtro hidráulico" };
    filtro.tipoFiltroReferencia = { estado: "existente", id: 3, tempId: null, nombre: "Filtro hidráulico" };
    filtro.cantidad = 2;
    const actualizado = construirCambiosEquipo(original, draft).filtros?.actualizados?.[0];
    expect(actualizado).toMatchObject({ equipo_filtro_id: 10, filtro: { id: 20, codigo: "OF-1" }, cantidad: 2 });
    expect(actualizado?.motivo_cambio).toBe("Tipo de filtro: Filtro de aceite → Filtro hidráulico; Cantidad: 1 → 2");
  });

  it.each([
    ["tipo", 3, "Filtro hidráulico", 1, "Tipo de filtro: Filtro de aceite → Filtro hidráulico"],
    ["cantidad", 1, "Filtro de aceite", 2, "Cantidad: 1 → 2"],
  ])("detecta cambio de filtro sólo en %s", (_caso, tipoId, tipoNombre, cantidad, motivo) => {
    const original = snapshotBase();
    const draft = draftBase(original);
    const filtro = draft.filtros[0];
    if (!filtro) throw new Error("Falta el filtro de prueba.");
    filtro.tipoFiltro = { id: tipoId, nombre: tipoNombre };
    filtro.tipoFiltroReferencia = { estado: "existente", id: tipoId, tempId: null, nombre: tipoNombre };
    filtro.cantidad = cantidad;
    expect(construirCambiosEquipo(original, draft).filtros?.actualizados?.[0]?.motivo_cambio).toBe(motivo);
  });

  it("separa eliminados y cancela altas eliminadas localmente", () => {
    const original = snapshotBase();
    const draft = draftBase(original);
    const existente = draft.filtros[0];
    if (!existente) throw new Error("Falta el filtro de prueba.");
    existente.estadoOperacion = "pendiente_eliminacion";
    draft.filtros.push({ ...structuredClone(draft.filtros[1]!), id: 0, draftId: "tmp_cancelado", estadoOperacion: "pendiente_eliminacion", estadoAntesDeEliminar: "nuevo" });
    expect(construirCambiosEquipo(original, draft).filtros).toEqual({ eliminados: [{ estado_operacion: "eliminado", equipo_filtro_id: 10 }] });
  });

  it("construye altas, cambios y bajas de aceites con referencias nuevas y existentes", () => {
    const original = snapshotBase();
    const draft = draftBase(original);
    const actual = draft.aceites[0];
    if (!actual) throw new Error("Falta el aceite de prueba.");
    actual.aceite = { id: 3, nombre: "5W-30" };
    actual.aceiteReferencia = { estado: "existente", id: 3, tempId: null, nombre: "5W-30" };
    draft.aceites.push({ equipoAceiteId: 0, sistema: { id: 0, nombre: "Hidráulico" }, aceite: { id: 0, nombre: "ISO 46" }, draftId: "tmp_aceite_asig", estadoOperacion: "nuevo", estadoAntesDeEliminar: null, sistemaReferencia: { estado: "nuevo", id: null, tempId: "tmp_sistema", nombre: "Hidráulico" }, aceiteReferencia: { estado: "nuevo", id: null, tempId: "tmp_aceite", nombre: "ISO 46" } });
    const cambios = construirCambiosEquipo(original, draft).aceites;
    expect(cambios?.actualizados?.[0]).toMatchObject({ equipo_aceite_id: 30, aceite: { estado: "existente", id: 3 } });
    expect(cambios?.nuevos?.[0]).toMatchObject({ temp_id: "tmp_aceite_asig", sistema: { temp_id: "tmp_sistema" }, aceite: { temp_id: "tmp_aceite" } });
    actual.estadoOperacion = "pendiente_eliminacion";
    expect(construirCambiosEquipo(original, draft).aceites?.eliminados).toEqual([{ estado_operacion: "eliminado", equipo_aceite_id: 30 }]);
  });

  it("combina secciones y produce un objeto vacío al revertir todo", () => {
    const original = snapshotBase();
    const draft = draftBase(original);
    expect(construirCambiosEquipo(original, draft)).toEqual({});
    expect(hayCambiosEquipo(construirCambiosEquipo(original, draft))).toBe(false);
    draft.equipo.subtipo = "Bus urbano";
    draft.etapas.push({ id: 3, nombre: "Taller" });
    expect(Object.keys(construirCambiosEquipo(original, draft))).toEqual(["datos_equipo", "etapas"]);
  });
});
