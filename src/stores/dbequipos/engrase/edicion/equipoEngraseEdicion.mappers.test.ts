import { describe, expect, it } from "vitest";
import {
  ErrorEdicionEquipo,
  crearErrorEdicionEquipo,
} from "./equipoEngraseEdicion.errors";
import {
  mapActualizarEquipoCompleto,
  mapAdministrarImagenEquipo,
  mapAuxiliaresEdicionEquipo,
  mapBusquedaFiltroOriginal,
  mapEquipoParaEdicion,
} from "./equipoEngraseEdicion.mappers";
import type {
  ActualizarEquipoCompletoDto,
  AdministrarImagenEquipoDto,
  BuscarFiltroOriginalDto,
  ObtenerAuxiliaresEdicionDto,
  ObtenerEquipoParaEdicionDto,
} from "./equipoEngraseEdicion.types";

const equipoDto: ObtenerEquipoParaEdicionDto = {
  ok: true,
  equipo: {
    id: 6,
    codigo: "410002",
    tipo_equipo_id: 1,
    tipo_equipo: "Buses",
    subtipo: "Bus",
    estado: "activo",
  },
  etapas: [{ id: 1, nombre: "Cultivo" }],
  filtros: [
    {
      id: 101,
      equipo_id: 6,
      tipo_filtro_id: 1,
      filtro_id: 35,
      cantidad: 1,
      tipoFiltro: { id: 1, nombre: "Aceite" },
      filtro: { id: 35, codigo: "B7030", esta_en_lista_compras: true },
      cantidad_equivalencias: 0,
    },
  ],
  aceites: [
    {
      equipo_aceite_id: 10,
      sistema: { id: 1, nombre: "Motor" },
      aceite: { id: 1, nombre: "15W-40" },
    },
  ],
};
const auxiliaresDto: ObtenerAuxiliaresEdicionDto = {
  ok: true,
  tipos_equipo: [{ id: 1, nombre: "Buses", subtipos_sugeridos: ["Bus"] }],
  etapas: [{ id: 1, nombre: "Cultivo" }],
  tipos_filtro: [
    { id: 1, nombre: "Aceite", tipos_equipo_que_lo_usan: ["Buses"] },
  ],
  sistemas_aceite: [{ id: 1, nombre: "Motor" }],
  aceites: [{ id: 1, nombre: "15W-40" }],
};
const actualizacionDto: ActualizarEquipoCompletoDto = {
  ok: true,
  codigo: "EQUIPO_ACTUALIZADO",
  mensaje: "Actualizado",
  equipo_lista: {
    id: 6,
    codigo: "410002",
    tipo_equipo_id: 1,
    tipo_equipo: "Buses",
    subtipo: "Bus urbano",
    estado: "activo",
    main_storage_path: null,
    tiene_imagen_main: false,
    imagen_actualizada_en: null,
    etapas: [{ id: 2, nombre: "Zafra" }],
  },
  cambios_detalle: {
    datos_equipo_cambiaron: true,
    etapas_cambiaron: true,
    filtros_cambiaron: true,
    aceites_cambiaron: true,
  },
  resumen_operaciones: {
    etapas_agregadas: 1,
    etapas_eliminadas: 1,
    filtros_agregados: 2,
    filtros_actualizados: 1,
    filtros_eliminados: 1,
    historiales_filtro_creados: 1,
    aceites_agregados: 1,
    aceites_actualizados: 1,
    aceites_eliminados: 1,
  },
};

describe("mappers de edición de equipos", () => {
  it("mapea la carga completa y conserva arreglos vacíos", () => {
    expect(mapEquipoParaEdicion(equipoDto).filtros[0]).toMatchObject({
      equipoId: 6,
      cantidadEquivalencias: 0,
    });
    const vacio = mapEquipoParaEdicion({ ok: true, equipo: equipoDto.equipo });
    expect(vacio).toMatchObject({ etapas: [], filtros: [], aceites: [] });
  });
  it("mapea auxiliares sin convertir colecciones vacías a null", () => {
    expect(
      mapAuxiliaresEdicionEquipo(auxiliaresDto).tiposEquipo[0]
        .subtiposSugeridos,
    ).toEqual(["Bus"]);
    expect(mapAuxiliaresEdicionEquipo({ ok: true })).toEqual({
      tiposEquipo: [],
      etapas: [],
      tiposFiltro: [],
      sistemasAceite: [],
      aceites: [],
    });
  });
  it("mapea búsqueda encontrada con uno o varios tipos, y sin tipos", () => {
    const uno: BuscarFiltroOriginalDto = {
      ok: true,
      encontrado: true,
      codigo: "FILTRO_ENCONTRADO",
      filtro: { id: 35, codigo: "LFP3191", esta_en_lista_compras: true },
      requiere_seleccionar_tipo: false,
      sin_tipos_registrados: false,
      tipos_posibles: [
        {
          tipo_filtro: { id: 1, nombre: "Aceite" },
          tipos_equipo_que_lo_usan: ["Buses"],
          ya_asignado_al_equipo: false,
          equipo_filtro_actual: null,
        },
      ],
    };
    const varios: BuscarFiltroOriginalDto = {
      ...uno,
      codigo: "FILTRO_CON_TIPOS_MULTIPLES",
      requiere_seleccionar_tipo: true,
      tipos_posibles: [
        uno.tipos_posibles![0],
        {
          tipo_filtro: { id: 5, nombre: "Diésel" },
          tipos_equipo_que_lo_usan: ["Camecos"],
          ya_asignado_al_equipo: true,
          equipo_filtro_actual: {
            equipo_filtro_id: 105,
            codigo: "LFF3349",
            cantidad: 1,
          },
        },
      ],
    };
    expect(mapBusquedaFiltroOriginal(uno)).toMatchObject({
      encontrado: true,
      tiposPosibles: [{ tipoFiltro: { id: 1 } }],
    });
    expect(mapBusquedaFiltroOriginal(varios)).toMatchObject({
      requiereSeleccionarTipo: true,
      tiposPosibles: [{}, { equipoFiltroActual: { equipoFiltroId: 105 } }],
    });
    expect(
      mapBusquedaFiltroOriginal({
        ...uno,
        sin_tipos_registrados: true,
        tipos_posibles: [],
      }),
    ).toMatchObject({ sinTiposRegistrados: true, tiposPosibles: [] });
  });
  it("mapea filtro no encontrado", () => {
    expect(
      mapBusquedaFiltroOriginal({
        ok: true,
        encontrado: false,
        codigo: "FILTRO_NO_ENCONTRADO",
      codigo_buscado: "XYZ123",
      puede_crearse: true,
      sugerencias: [
        { id: 35, codigo: "LFP3191", esta_en_lista_compras: true },
      ],
      }),
    ).toEqual({
      encontrado: false,
      coincidenciaExacta: false,
      codigo: "FILTRO_NO_ENCONTRADO",
      codigoBuscado: "XYZ123",
      puedeCrearse: true,
      sugerencias: [
        { id: 35, codigo: "LFP3191", estaEnListaCompras: true },
      ],
    });
  });
  it("mapea una actualización al contrato del listado existente", () => {
    expect(
      mapActualizarEquipoCompleto(actualizacionDto).equipoLista,
    ).toMatchObject({ id: 6, etapas: [{ nombre: "Zafra" }] });
  });
  it("mapea la respuesta de imagen y conserva código de error funcional", () => {
    const imagen: AdministrarImagenEquipoDto = {
      ok: true,
      codigo: "410002",
      equipo_id: 6,
      operacion: "agregar",
      imagen: {
        main_storage_path: "equipos/410002/main.webp",
        tiene_imagen_main: true,
        imagen_actualizada_en: "2026-08-06",
      },
      storage_path_anterior: null,
    };
    expect(mapAdministrarImagenEquipo(imagen).imagen.tieneImagenMain).toBe(
      true,
    );
    expect(() =>
      mapEquipoParaEdicion({
        ok: false,
        codigo: "EQUIPO_NO_ENCONTRADO",
        mensaje: "EQUIPO_NO_ENCONTRADO: 410002",
      }),
    ).toThrow(ErrorEdicionEquipo);
    expect(crearErrorEdicionEquipo("EQUIPO_NO_ENCONTRADO: 410002").codigo).toBe(
      "EQUIPO_NO_ENCONTRADO",
    );
  });
});
