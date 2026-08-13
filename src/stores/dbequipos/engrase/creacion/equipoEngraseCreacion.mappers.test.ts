import { describe, expect, it } from "vitest";
import type {
  BuscarFiltroOriginalDto,
  CrearEquipoCompletoDto,
  ObtenerAuxiliaresEquipoDto,
} from "./equipoEngraseCreacion.dto";
import {
  mapAuxiliaresEquipo,
  mapBusquedaFiltroOriginalParaCreacion,
  mapCrearEquipoCompleto,
  mapValidacionCodigoEquipo,
} from "./equipoEngraseCreacion.mappers";
import { ErrorCreacionEquipo } from "./equipoEngraseCreacion.remote-errors";

describe("mappers de creación de equipos", () => {
  it("mapea auxiliares, conserva el orden y vacía colecciones ausentes", () => {
    const dto: ObtenerAuxiliaresEquipoDto = {
      ok: true,
      tipos_equipo: [
        { id: 2, nombre: "Cosechadoras", subtipos_sugeridos: ["X"] },
        { id: 1, nombre: "Buses", subtipos_sugeridos: [] },
      ],
      tipos_filtro: [
        { id: 1, nombre: "Aceite", tipos_equipo_que_lo_usan: ["Buses"] },
      ],
    };
    expect(mapAuxiliaresEquipo(dto)).toEqual({
      tiposEquipo: [
        { id: 2, nombre: "Cosechadoras", subtiposSugeridos: ["X"] },
        { id: 1, nombre: "Buses", subtiposSugeridos: [] },
      ],
      etapas: [],
      tiposFiltro: [
        { id: 1, nombre: "Aceite", tiposEquipoQueLoUsan: ["Buses"] },
      ],
      sistemasAceite: [],
      aceites: [],
    });
    expect(() => mapAuxiliaresEquipo({ ok: false, codigo: "SIN_ACCESO" })).toThrow(
      ErrorCreacionEquipo,
    );
  });

  it("distingue un código disponible de uno ya ocupado sin inventar datos", () => {
    expect(mapValidacionCodigoEquipo({ puede_crearse: true })).toEqual({
      puedeCrearse: true,
    });
    expect(
      mapValidacionCodigoEquipo({
        puede_crearse: false,
        modelo: null,
        activo: null,
      }),
    ).toEqual({
      puedeCrearse: false,
      modeloExistente: null,
      activoExistente: null,
    });
  });

  it("mapea la búsqueda encontrada y conserva sus flags remotos", () => {
    const dto: BuscarFiltroOriginalDto = {
      ok: true,
      encontrado: true,
      codigo: "FILTRO_ENCONTRADO",
      filtro: { id: 5, codigo: "LF-123", esta_en_lista_compras: true },
      requiere_seleccionar_tipo: true,
      sin_tipos_registrados: false,
      tipos_posibles: [
        {
          tipo_filtro: { id: 3, nombre: "Combustible" },
          tipos_equipo_que_lo_usan: ["Buses"],
          ya_asignado_al_equipo: true,
          equipo_filtro_actual: { equipo_filtro_id: 20, codigo: "LF-123", cantidad: 2 },
        },
      ],
    };
    expect(mapBusquedaFiltroOriginalParaCreacion(dto)).toEqual({
      encontrado: true,
      coincidenciaExacta: true,
      codigo: "FILTRO_ENCONTRADO",
      filtro: { id: 5, codigo: "LF-123", estaEnListaCompras: true },
      requiereSeleccionarTipo: true,
      sinTiposRegistrados: false,
      tiposPosibles: [{
        tipoFiltro: { id: 3, nombre: "Combustible" },
        tiposEquipoQueLoUsan: ["Buses"],
        yaAsignadoAlEquipo: true,
        equipoFiltroActual: { equipoFiltroId: 20, codigo: "LF-123", cantidad: 2 },
      }],
    });
    expect(
      mapBusquedaFiltroOriginalParaCreacion({
        ok: true,
        encontrado: false,
        codigo: "FILTRO_NO_ENCONTRADO",
        codigo_buscado: "LF-999",
        puede_crearse: true,
        sugerencias: [{ id: 7, codigo: "LF-998", esta_en_lista_compras: false }],
      }),
    ).toMatchObject({ puedeCrearse: true, sugerencias: [{ estaEnListaCompras: false }] });
    expect(() => mapBusquedaFiltroOriginalParaCreacion({
      ok: true,
      encontrado: true,
      codigo: "FILTRO_ENCONTRADO",
    })).toThrow(ErrorCreacionEquipo);
  });

  it("mapea la creación completa y rechaza respuestas incompletas", () => {
    const dto: CrearEquipoCompletoDto = {
      ok: true,
      codigo: "EQUIPO_CREADO",
      mensaje: "Equipo creado.",
      equipo_lista: {
        id: 9,
        codigo: "410003",
        tipo_equipo_id: 2,
        tipo_equipo: "Bus",
        subtipo: null,
        estado: "activo",
        main_storage_path: null,
        tiene_imagen_main: false,
        imagen_actualizada_en: null,
        etapas: [{ id: 1, nombre: "Cultivo" }],
      },
      resumen_operaciones: {
        etapas_agregadas: 1,
        filtros_agregados: 2,
        aceites_agregados: 3,
      },
    };
    expect(mapCrearEquipoCompleto(dto)).toEqual({
      codigo: "EQUIPO_CREADO",
      mensaje: "Equipo creado.",
      equipoLista: { ...dto.equipo_lista, etapas: [{ id: 1, nombre: "Cultivo" }] },
      resumenOperaciones: { etapasAgregadas: 1, filtrosAgregados: 2, aceitesAgregados: 3 },
    });
    expect(() => mapCrearEquipoCompleto({ ...dto, equipo_lista: undefined })).toThrow(
      "Respuesta de creación incompleta.",
    );
    try {
      mapCrearEquipoCompleto({ ...dto, resumen_operaciones: undefined });
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorCreacionEquipo);
      expect((error as ErrorCreacionEquipo).codigo).toBe("RESPUESTA_CREACION_INCOMPLETA");
    }
  });
});
