import { describe, expect, it } from "vitest";
import {
  actualizarAceiteLocal,
  agregarAceiteLocal,
  crearAceiteTemporal,
  crearOpcionesSistemaAceiteCreacion,
  crearResumenAceitesCreacion,
  crearSistemaTemporal,
  estaSistemaOcupado,
  obtenerAceitesTemporales,
  obtenerSistemasTemporales,
} from "./equipoEngraseCreacion.aceites";
import type { CatalogoDraftReference, CrearEquipoAceiteDraft } from "./equipoEngraseCreacion.types";

const motor = { estado: "existente" as const, id: 1, tempId: null, nombre: "Motor" };
const hidraulico = { estado: "existente" as const, id: 2, tempId: null, nombre: "Hidráulico" };
const aceite = { estado: "existente" as const, id: 10, tempId: null, nombre: "15W40" };

const asociacion = (
  draftId: string,
  sistema: CatalogoDraftReference = motor,
  referenciaAceite: CatalogoDraftReference = aceite,
): CrearEquipoAceiteDraft => ({
  draftId,
  sistema: { ...sistema },
  aceite: { ...referenciaAceite },
});

describe("lógica local de aceites para creación", () => {
  it("bloquea el sistema ocupado, lo mantiene visible y permite conservarlo al editar", () => {
    const asociaciones = [asociacion("tmp_equipo_aceite_1")];
    expect(estaSistemaOcupado(motor, asociaciones)).toBe(true);
    expect(estaSistemaOcupado(motor, asociaciones, "tmp_equipo_aceite_1")).toBe(false);
    expect(crearOpcionesSistemaAceiteCreacion([motor, hidraulico], asociaciones)).toEqual([
      expect.objectContaining({ asignado: true, disabled: true, badge: "Asignado" }),
      expect.objectContaining({ asignado: false, disabled: false, badge: null }),
    ]);
  });

  it("permite repetir el mismo aceite en sistemas distintos", () => {
    const primero = agregarAceiteLocal({ sistema: motor, aceite }, []);
    const segundo = agregarAceiteLocal({ sistema: hidraulico, aceite }, primero.asociaciones);
    expect(primero.resultado.ok).toBe(true);
    expect(segundo.resultado.ok).toBe(true);
    expect(segundo.asociaciones).toHaveLength(2);
  });

  it("rechaza sistemas equivalentes sin mutación parcial", () => {
    const sistemaTemporal = { estado: "nuevo" as const, id: null, tempId: "tmp_sistema_aceite_1", nombre: "Mandos finales" };
    const asociaciones = [asociacion("uno", sistemaTemporal)];
    const resultado = agregarAceiteLocal({ sistema: { ...sistemaTemporal, tempId: "otro", nombre: " MÁNDOS   FINALES " }, aceite }, asociaciones);
    expect(resultado.resultado).toMatchObject({ ok: false, codigo: "SISTEMA_ACEITE_DUPLICADO" });
    expect(resultado.asociaciones).toHaveLength(1);
  });

  it("reutiliza catálogo y temporales, devolviendo copias", () => {
    const temporalSistema = { estado: "nuevo" as const, id: null, tempId: "tmp_sistema_aceite_1", nombre: "Mandos finales" };
    const temporalAceite = { estado: "nuevo" as const, id: null, tempId: "tmp_aceite_1", nombre: "ISO 46" };
    const asociaciones = [asociacion("uno", temporalSistema, temporalAceite)];
    expect(crearSistemaTemporal(" MOTOR ", [motor], asociaciones)).toEqual(motor);
    expect(crearSistemaTemporal(" MÁNDOS FINALES ", [motor], asociaciones)).toEqual(temporalSistema);
    expect(crearAceiteTemporal(" iso 46 ", [aceite], asociaciones)).toEqual(temporalAceite);
    expect(crearSistemaTemporal("", [motor], asociaciones)).toBeNull();
    expect(crearAceiteTemporal("SAE 50", [aceite], asociaciones)?.tempId).toMatch(/^tmp_aceite_/u);
    expect(obtenerSistemasTemporales([...asociaciones, asociacion("dos", temporalSistema)]).map((item) => item.tempId)).toEqual([temporalSistema.tempId]);
    expect(obtenerAceitesTemporales([...asociaciones, asociacion("dos", hidraulico, temporalAceite)]).map((item) => item.tempId)).toEqual([temporalAceite.tempId]);
  });

  it("edita sin reordenar y rechaza mover una fila a sistema de otra", () => {
    const asociaciones = [asociacion("uno", motor), asociacion("dos", hidraulico)];
    const cambioAceite = actualizarAceiteLocal({ draftId: "uno", sistema: motor, aceite: { estado: "nuevo", id: null, tempId: "tmp_aceite_2", nombre: "SAE 50" } }, asociaciones);
    expect(cambioAceite.resultado.ok).toBe(true);
    expect(cambioAceite.asociaciones.map((item) => item.draftId)).toEqual(["uno", "dos"]);
    const conflicto = actualizarAceiteLocal({ draftId: "dos", sistema: motor, aceite }, asociaciones);
    expect(conflicto.resultado).toMatchObject({ ok: false, codigo: "SISTEMA_ACEITE_DUPLICADO" });
  });

  it("crea resumen estable y admite colección vacía", () => {
    expect(crearResumenAceitesCreacion([])).toEqual([]);
    expect(crearResumenAceitesCreacion([asociacion("uno", { estado: "nuevo", id: null, tempId: "tmp_sistema_aceite_1", nombre: " Motor " }, { estado: "nuevo", id: null, tempId: "tmp_aceite_1", nombre: " 15W40 " })])).toEqual([
      { draftId: "uno", sistema: "Motor", aceite: "15W40", sistemaNuevo: true, aceiteNuevo: true },
    ]);
  });
});
