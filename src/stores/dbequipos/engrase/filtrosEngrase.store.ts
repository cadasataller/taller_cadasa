import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  filtrarEquipos,
  initialFiltrosEngraseQuery,
} from "./filtrosEngrase.helpers";
import { filtrosEngraseService } from "./filtrosEngrase.service";
import type {
  EquipoEngraseListItem,
  EquipoAceiteDetalle,
  EquipoFiltroDetalle,
  FiltroCodigoSugerencia,
  FiltroEquivalenciaRow,
  FiltrosEngraseQuery,
  TipoEquipoEngrase,
  TipoFiltroEngrase,
  EtapaEngrase,
} from "./filtrosEngrase.types";
import type { EquipoImagenPersistida } from "./edicion/equipoEngraseEdicion.types";

export type ResultadoAplicarEquipoCreado =
  | { kind: "applied" }
  | { kind: "code_conflict"; mensaje: string };

const copiarEquipoLista = (equipo: EquipoEngraseListItem): EquipoEngraseListItem => ({
  ...equipo,
  etapas: equipo.etapas.map((etapa) => ({ ...etapa })),
});

const normalizarCodigo = (codigo: string): string => codigo.trim().toLocaleLowerCase();
const normalizarNombre = (nombre: string): string => nombre.trim().toLocaleLowerCase();
export const useFiltrosEngraseStore = defineStore(
  "dbequipos_engrase_filtros",
  () => {
    const equipos = ref<EquipoEngraseListItem[]>([]),
      tiposEquipo = ref<TipoEquipoEngrase[]>([]),
      tiposFiltro = ref<TipoFiltroEngrase[]>([]),
      etapas = ref<EtapaEngrase[]>([]),
      filtrosEquipo = ref<EquipoFiltroDetalle[]>([]),
      aceitesEquipo = ref<EquipoAceiteDetalle[]>([]),
      equivalenciasPorFiltroId = ref<Record<number, FiltroEquivalenciaRow[]>>(
        {},
      ),
      sugerenciasCodigo = ref<FiltroCodigoSugerencia[]>([]),
      equipoSeleccionadoId = ref<number | null>(null),
      filtroSeleccionadoId = ref<number | null>(null),
      detalleEquipoPendienteRecargaId = ref<number | null>(null),
      filtrosAplicados = ref<FiltrosEngraseQuery>(initialFiltrosEngraseQuery()),
      loadingInicial = ref(false),
      loadingEquipos = ref(false),
      loadingDetalleEquipo = ref(false),
      loadingCambioEstado = ref(false),
      loadingSugerencias = ref(false),
      errorInicial = ref<string | null>(null),
      errorEquipos = ref<string | null>(null),
      errorDetalle = ref<string | null>(null),
      errorCambioEstado = ref<string | null>(null),
      errorIntegracionCreacion = ref<string | null>(null);
    let catalogosCargados = false,
      idsCodigo = ref<Set<number> | null>(null),
      filtrosCache = new Map<number, EquipoFiltroDetalle[]>(),
      aceitesCache = new Map<number, EquipoAceiteDetalle[]>(),
      imagenesRequest = new Map<string, Promise<void>>(),
      equiposRequest: Promise<void> | null = null,
      request: Promise<void> | null = null,
      sugerenciasRequest = 0;
    const equiposVisibles = computed(() =>
      filtrarEquipos(
        equipos.value,
        filtrosAplicados.value,
        idsCodigo.value,
        filtrosAplicados.value.tipoFiltroId
          ? new Set(
              filtrosEquipo.value
                .filter(
                  (x) =>
                    x.tipo_filtro_id === filtrosAplicados.value.tipoFiltroId,
                )
                .map((x) => x.equipo_id),
            )
          : null,
      ),
    );
    const equipoSeleccionado = computed(
        () =>
          equipos.value.find((x) => x.id === equipoSeleccionadoId.value) ??
          null,
      ),
      filtroSeleccionado = computed(
        () =>
          filtrosEquipo.value.find(
            (x) => x.id === filtroSeleccionadoId.value,
          ) ?? null,
      ),
      conteoPorTipoEquipo = computed(() =>
        Object.entries(
          equiposVisibles.value.reduce<Record<string, number>>((a, x) => {
            a[x.tipo_equipo] = (a[x.tipo_equipo] ?? 0) + 1;
            return a;
          }, {}),
        ),
      ),
      totalFiltrosEquipo = computed(() => filtrosEquipo.value.length),
      totalConEquivalencias = computed(
        () =>
          filtrosEquipo.value.filter(
            (x) => (equivalenciasPorFiltroId.value[x.filtro_id] ?? []).length,
          ).length,
      ),
      totalEnListaCompras = computed(
        () =>
          filtrosEquipo.value.filter((x) => x.filtro.esta_en_lista_compras)
            .length,
      ),
      hayFiltrosActivos = computed(() =>
        Object.values(filtrosAplicados.value).some(
          (x) => x !== null && x !== "" && x !== "activo",
        ),
      );
    async function cargarCatalogos(force = false) {
      if (catalogosCargados && !force) return;
      [tiposEquipo.value, tiposFiltro.value, etapas.value] = await Promise.all([
        filtrosEngraseService.obtenerTiposEquipo(),
        filtrosEngraseService.obtenerTiposFiltro(),
        filtrosEngraseService.obtenerEtapas(),
      ]);
      catalogosCargados = true;
    }
    async function solicitarEquipos() {
      if (equiposRequest) return equiposRequest;
      equiposRequest = (async () => {
        loadingEquipos.value = true;
        errorEquipos.value = null;
        try {
          equipos.value = await filtrosEngraseService.obtenerEquipos();
        } catch (e) {
          errorEquipos.value =
            e instanceof Error ? e.message : "No se pudieron cargar equipos";
        } finally {
          loadingEquipos.value = false;
          equiposRequest = null;
        }
      })();
      return equiposRequest;
    }
    async function cargarEquipos() {
      await solicitarEquipos();
      await asegurarSeleccion();
    }
    async function asegurarEquiposCargados() {
      if (equipos.value.length > 0) return;
      await solicitarEquipos();
    }
    async function cargarImagenEquipo(equipoId: number): Promise<void> {
      const equipo = equipos.value.find((item) => item.id === equipoId);
      if (
        !equipo ||
        !equipo.tiene_imagen_main ||
        !equipo.main_storage_path ||
        equipo.imageUrl
      ) return;
      const pathSolicitado = equipo.main_storage_path;
      const requestKey = `${equipoId}:${pathSolicitado}`;
      const pendiente = imagenesRequest.get(requestKey);
      if (pendiente) return pendiente;
      const solicitud = (async () => {
        try {
          const imageUrl = await filtrosEngraseService.crearUrlFirmadaImagen(
            pathSolicitado,
          );
          const indice = equipos.value.findIndex((item) => item.id === equipoId);
          if (
            indice < 0 ||
            equipos.value[indice]?.main_storage_path !== pathSolicitado
          ) return;
          equipos.value[indice] = { ...equipos.value[indice], imageUrl };
        } catch {
          // La imagen es complementaria: un fallo no debe romper el listado.
        } finally {
          imagenesRequest.delete(requestKey);
        }
      })();
      imagenesRequest.set(requestKey, solicitud);
      return solicitud;
    }
    async function asegurarSeleccion() {
      if (
        !equiposVisibles.value.some((x) => x.id === equipoSeleccionadoId.value)
      ) {
        equipoSeleccionadoId.value = equiposVisibles.value[0]?.id ?? null;
        filtroSeleccionadoId.value = null;
        if (equipoSeleccionadoId.value)
          await cargarFiltrosEquipo(equipoSeleccionadoId.value);
      }
    }
    async function cargarFiltrosEquipo(id: number, force = false) {
      loadingDetalleEquipo.value = true;
      errorDetalle.value = null;
      try {
        const [filtros, aceites] = await Promise.all([
          !force && filtrosCache.has(id)
            ? Promise.resolve(filtrosCache.get(id)!)
            : filtrosEngraseService.obtenerFiltrosDeEquipo(id),
          !force && aceitesCache.has(id)
            ? Promise.resolve(aceitesCache.get(id)!)
            : filtrosEngraseService.obtenerAceitesDeEquipo(id),
        ]);
        filtrosCache.set(id, filtros);
        aceitesCache.set(id, aceites);
        if (equipoSeleccionadoId.value === id) {
          filtrosEquipo.value = filtros;
          aceitesEquipo.value = aceites;
          const eq = await filtrosEngraseService.obtenerEquivalenciasActivas(
            filtros.map((x) => x.filtro_id),
          );
          equivalenciasPorFiltroId.value = eq.reduce<
            Record<number, FiltroEquivalenciaRow[]>
          >((a, x) => {
            (a[x.filtro_original_id] ??= []).push(x);
            return a;
          }, {});
          detalleEquipoPendienteRecargaId.value = null;
        }
      } catch (e) {
        errorDetalle.value =
          e instanceof Error ? e.message : "No se pudieron cargar los filtros";
      } finally {
        loadingDetalleEquipo.value = false;
      }
    }
    async function inicializar() {
      if (request) return request;
      request = (async () => {
        loadingInicial.value = true;
        errorInicial.value = null;
        try {
          await Promise.all([cargarCatalogos(), cargarEquipos()]);
          if (
            detalleEquipoPendienteRecargaId.value !== null &&
            detalleEquipoPendienteRecargaId.value === equipoSeleccionadoId.value
          ) {
            await cargarFiltrosEquipo(equipoSeleccionadoId.value, true);
          }
        } catch (e) {
          errorInicial.value =
            e instanceof Error ? e.message : "No se pudo iniciar la vista";
        } finally {
          loadingInicial.value = false;
          request = null;
        }
      })();
      return request;
    }
    async function buscarSugerencias(texto: string) {
      const requestId = ++sugerenciasRequest;
      loadingSugerencias.value = true;
      try {
        const sugerencias =
          await filtrosEngraseService.buscarSugerenciasCodigo(texto);
        if (requestId === sugerenciasRequest)
          sugerenciasCodigo.value = sugerencias;
      } finally {
        if (requestId === sugerenciasRequest) loadingSugerencias.value = false;
      }
    }
    function limpiarSugerencias() {
      sugerenciasRequest++;
      sugerenciasCodigo.value = [];
      loadingSugerencias.value = false;
    }
    async function seleccionarCodigoExacto(s: FiltroCodigoSugerencia) {
      filtrosAplicados.value = {
        ...filtrosAplicados.value,
        codigoExactoSeleccionado: s.codigo,
      };
      idsCodigo.value = new Set(
        await filtrosEngraseService.resolverEquiposPorCodigoExacto(s.codigo),
      );
      await asegurarSeleccion();
    }
    async function limpiarCodigoSeleccionado() {
      filtrosAplicados.value = {
        ...filtrosAplicados.value,
        codigoExactoSeleccionado: null,
      };
      idsCodigo.value = null;
      await asegurarSeleccion();
    }
    async function actualizarFiltros(partial: Partial<FiltrosEngraseQuery>) {
      filtrosAplicados.value = { ...filtrosAplicados.value, ...partial };
      if (
        "codigoExactoSeleccionado" in partial &&
        partial.codigoExactoSeleccionado === null
      )
        idsCodigo.value = null;
      await asegurarSeleccion();
    }
    async function limpiarFiltros() {
      filtrosAplicados.value = initialFiltrosEngraseQuery();
      idsCodigo.value = null;
      limpiarSugerencias();
      await asegurarSeleccion();
    }
    async function seleccionarEquipo(id: number) {
      equipoSeleccionadoId.value = id;
      filtroSeleccionadoId.value = null;
      await Promise.all([cargarFiltrosEquipo(id), cargarImagenEquipo(id)]);
    }
    function seleccionarFiltro(id: number | null) {
      filtroSeleccionadoId.value = id;
    }
    async function cambiarEstadoEquipo(
      codigo: string,
      estado: "activo" | "descartado",
    ): Promise<void> {
      if (loadingCambioEstado.value) return;
      const indice = equipos.value.findIndex((equipo) => equipo.codigo === codigo);
      if (indice < 0) {
        errorCambioEstado.value = "No se encontró el equipo para actualizar.";
        return;
      }
      loadingCambioEstado.value = true;
      errorCambioEstado.value = null;
      try {
        const estadoConfirmado = await filtrosEngraseService.cambiarEstadoEquipo(
          codigo,
          estado,
        );
        equipos.value[indice] = {
          ...equipos.value[indice],
          estado: estadoConfirmado,
        };
      } catch (e) {
        errorCambioEstado.value =
          e instanceof Error
            ? e.message
            : "No se pudo cambiar el estado del equipo.";
      } finally {
        loadingCambioEstado.value = false;
      }
    }
    function aplicarEquipoActualizado(equipo: EquipoEngraseListItem): void {
      const indice = equipos.value.findIndex((item) => item.id === equipo.id);
      if (indice < 0) equipos.value.push(equipo);
      else equipos.value[indice] = equipo;
      if (equipoSeleccionadoId.value !== null && !equiposVisibles.value.some((item) => item.id === equipoSeleccionadoId.value)) {
        equipoSeleccionadoId.value = equiposVisibles.value[0]?.id ?? null;
        filtroSeleccionadoId.value = null;
        filtrosEquipo.value = [];
        aceitesEquipo.value = [];
        equivalenciasPorFiltroId.value = {};
      }
    }
    function aplicarEquipoCreado(equipo: EquipoEngraseListItem): ResultadoAplicarEquipoCreado {
      const copia = copiarEquipoLista(equipo);
      const mismoId = equipos.value.findIndex((item) => item.id === copia.id);
      const conflictoCodigo = equipos.value.find((item) =>
        item.id !== copia.id && normalizarCodigo(item.codigo) === normalizarCodigo(copia.codigo),
      );
      if (conflictoCodigo) {
        const mensaje = "La lista local ya contiene otro equipo con este código; se sincronizará al recargar.";
        errorIntegracionCreacion.value = mensaje;
        return { kind: "code_conflict", mensaje };
      }
      errorIntegracionCreacion.value = null;
      if (mismoId < 0) equipos.value.push(copia);
      else equipos.value[mismoId] = copia;

      if (!tiposEquipo.value.some((tipo) => tipo.id === copia.tipo_equipo_id) &&
          !tiposEquipo.value.some((tipo) => normalizarNombre(tipo.nombre) === normalizarNombre(copia.tipo_equipo))) {
        tiposEquipo.value.push({ id: copia.tipo_equipo_id, nombre: copia.tipo_equipo });
      }
      copia.etapas.forEach((etapa) => {
        if (!etapas.value.some((item) => item.id === etapa.id) &&
            !etapas.value.some((item) => normalizarNombre(item.nombre) === normalizarNombre(etapa.nombre))) {
          etapas.value.push({ ...etapa });
        }
      });
      filtrosCache.delete(copia.id);
      aceitesCache.delete(copia.id);
      return { kind: "applied" };
    }
    function invalidarDetalleEquipo(equipoId: number): void {
      filtrosCache.delete(equipoId);
      aceitesCache.delete(equipoId);
      if (equipoSeleccionadoId.value !== equipoId) return;
      filtrosEquipo.value = [];
      aceitesEquipo.value = [];
      filtroSeleccionadoId.value = null;
      equivalenciasPorFiltroId.value = {};
      detalleEquipoPendienteRecargaId.value = equipoId;
    }
    function actualizarImagenEquipo(equipoId: number, imagen: EquipoImagenPersistida): void {
      const indice = equipos.value.findIndex((equipo) => equipo.id === equipoId);
      if (indice < 0) return;
      equipos.value[indice] = {
        ...equipos.value[indice],
        main_storage_path: imagen.mainStoragePath,
        tiene_imagen_main: imagen.tieneImagenMain,
        imagen_actualizada_en: imagen.imagenActualizadaEn,
        imageUrl: null,
      };
    }
    async function reintentarCarga() {
      await inicializar();
    }
    function reset() {
      equipos.value = [];
      tiposEquipo.value = [];
      tiposFiltro.value = [];
      etapas.value = [];
      filtrosEquipo.value = [];
      aceitesEquipo.value = [];
      equivalenciasPorFiltroId.value = {};
      limpiarSugerencias();
      equipoSeleccionadoId.value = null;
      filtroSeleccionadoId.value = null;
      detalleEquipoPendienteRecargaId.value = null;
      filtrosAplicados.value = initialFiltrosEngraseQuery();
      catalogosCargados = false;
      filtrosCache.clear();
      aceitesCache.clear();
      imagenesRequest.clear();
      idsCodigo.value = null;
    }
    return {
      equipos,
      tiposEquipo,
      tiposFiltro,
      etapas,
      filtrosEquipo,
      aceitesEquipo,
      equivalenciasPorFiltroId,
      sugerenciasCodigo,
      equipoSeleccionadoId,
      filtroSeleccionadoId,
      filtrosAplicados,
      loadingInicial,
      loadingEquipos,
      loadingDetalleEquipo,
      loadingCambioEstado,
      loadingSugerencias,
      errorInicial,
      errorEquipos,
      errorDetalle,
      errorCambioEstado,
      errorIntegracionCreacion,
      equiposVisibles,
      equipoSeleccionado,
      filtroSeleccionado,
      conteoPorTipoEquipo,
      totalFiltrosEquipo,
      totalConEquivalencias,
      totalEnListaCompras,
      hayFiltrosActivos,
      inicializar,
      cargarCatalogos,
      cargarEquipos,
      asegurarEquiposCargados,
      cargarImagenEquipo,
      cargarFiltrosEquipo,
      buscarSugerencias,
      limpiarSugerencias,
      seleccionarCodigoExacto,
      limpiarCodigoSeleccionado,
      actualizarFiltros,
      limpiarFiltros,
      seleccionarEquipo,
      seleccionarFiltro,
      cambiarEstadoEquipo,
      aplicarEquipoActualizado,
      aplicarEquipoCreado,
      invalidarDetalleEquipo,
      actualizarImagenEquipo,
      reintentarCarga,
      reset,
    };
  },
);
