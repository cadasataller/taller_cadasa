import { describe, expect, it } from "vitest";
import {
  actualizarFiltroLocal,
  agregarFiltroLocal,
  buscarReferenciaFiltroTemporalPorCodigo,
  combinarSugerenciasFiltroCreacion,
  crearOpcionesTipoFiltroCreacion,
  crearTipoFiltroTemporal,
  obtenerEstadoCodigoFiltro,
} from "./equipoEngraseCreacion.filtros";
import type { CrearEquipoFiltroDraft } from "./equipoEngraseCreacion.types";

const tipoAceite = { estado: "existente" as const, id: 1, tempId: null, nombre: "Aceite" };
const tipoHidraulico = { estado: "existente" as const, id: 2, tempId: null, nombre: "Hidráulico" };
const filtro = { estado: "existente" as const, id: 4, tempId: null, codigo: "B7577", estaEnListaCompras: true };

const asignacion = (draftId: string, tipo = tipoAceite): CrearEquipoFiltroDraft => ({
  draftId,
  tipoFiltro: { ...tipo },
  filtro: { ...filtro },
  cantidad: 1,
});

describe("lógica local de filtros para creación", () => {
  it("permite repetir código e id de filtro cuando el tipo es distinto", () => {
    const primero = agregarFiltroLocal({ filtro, tipoFiltro: tipoAceite, cantidad: 1 }, []);
    const segundo = agregarFiltroLocal({ filtro, tipoFiltro: tipoHidraulico, cantidad: 2 }, primero.filtros);
    expect(primero.resultado.ok).toBe(true);
    expect(segundo.resultado.ok).toBe(true);
    expect(segundo.filtros).toHaveLength(2);
  });

  it("bloquea el tipo ocupado, lo mantiene visible y permite el tipo actual al editar", () => {
    const filtros = [asignacion("tmp_equipo_filtro_1")];
    expect(crearOpcionesTipoFiltroCreacion([tipoAceite, tipoHidraulico], filtros)).toEqual([
      expect.objectContaining({ asignado: true, disabled: true, badge: "Asignado" }),
      expect.objectContaining({ asignado: false, disabled: false, badge: null }),
    ]);
    expect(crearOpcionesTipoFiltroCreacion([tipoAceite], filtros, "tmp_equipo_filtro_1")[0]).toMatchObject({ disabled: false, badge: null });
  });

  it("deriva el badge del código sin bloquearlo y conserva los tipos usados", () => {
    const estado = obtenerEstadoCodigoFiltro(" b7577 ", [asignacion("uno"), asignacion("dos", tipoHidraulico)]);
    expect(estado).toMatchObject({ codigo: "B7577", asignado: true, cantidadAsignaciones: 2 });
    expect(estado.tiposAsignados.map((tipo) => tipo.nombre)).toEqual(["Aceite", "Hidráulico"]);
  });

  it("reutiliza tipos temporales equivalentes y conserva referencia de código temporal", () => {
    const temporal = { estado: "nuevo" as const, id: null, tempId: "tmp_filtro_1", codigo: "nuevo123", estaEnListaCompras: false };
    const filtros: CrearEquipoFiltroDraft[] = [{ draftId: "uno", filtro: temporal, tipoFiltro: { estado: "nuevo", id: null, tempId: "tmp_tipo_filtro_1", nombre: "Filtro hidráulico" }, cantidad: 1 }];
    expect(crearTipoFiltroTemporal(" FÍLTRO HIDRAULICO ", [], filtros)).toEqual(filtros[0].tipoFiltro);
    expect(buscarReferenciaFiltroTemporalPorCodigo(" NUEVO123 ", filtros)).toEqual(temporal);
  });

  it("no permite cambiar una fila a un tipo ocupado por otra", () => {
    const filtros = [asignacion("uno", tipoAceite), asignacion("dos", tipoHidraulico)];
    const resultado = actualizarFiltroLocal({ draftId: "dos", tipoFiltro: tipoAceite, cantidad: 1 }, filtros);
    expect(resultado.resultado).toMatchObject({ ok: false, codigo: "TIPO_FILTRO_DUPLICADO" });
    expect(resultado.filtros).toHaveLength(2);
  });

  it("combina sugerencias remotas y locales, prefiriendo la remota", () => {
    const sugerencias = combinarSugerenciasFiltroCreacion(
      [{ id: 4, codigo: "B7577", estaEnListaCompras: true }],
      [asignacion("uno"), { ...asignacion("dos", tipoHidraulico), filtro: { estado: "nuevo", id: null, tempId: "tmp_filtro_2", codigo: "NUEVO123", estaEnListaCompras: false } }],
      "B",
    );
    expect(sugerencias).toEqual(expect.arrayContaining([
      expect.objectContaining({ origen: "rpc", codigo: "B7577", asignado: true }),
    ]));
  });
});
