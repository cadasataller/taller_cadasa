import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  filtrarEquipos,
  initialFiltrosEngraseQuery,
} from "./filtrosEngrase.helpers";
import { filtrosEngraseService } from "./filtrosEngrase.service";
import type {
  EquipoEngraseListItem,
  EquipoFiltroDetalle,
  FiltroCodigoSugerencia,
  FiltroEquivalenciaRow,
  FiltrosEngraseQuery,
  TipoEquipoEngrase,
  TipoFiltroEngrase,
  EtapaEngrase,
} from "./filtrosEngrase.types";
export const useFiltrosEngraseStore = defineStore(
  "dbequipos_engrase_filtros",
  () => {
    const equipos = ref<EquipoEngraseListItem[]>([]),
      tiposEquipo = ref<TipoEquipoEngrase[]>([]),
      tiposFiltro = ref<TipoFiltroEngrase[]>([]),
      etapas = ref<EtapaEngrase[]>([]),
      filtrosEquipo = ref<EquipoFiltroDetalle[]>([]),
      equivalenciasPorFiltroId = ref<Record<number, FiltroEquivalenciaRow[]>>(
        {},
      ),
      sugerenciasCodigo = ref<FiltroCodigoSugerencia[]>([]),
      equipoSeleccionadoId = ref<number | null>(null),
      filtroSeleccionadoId = ref<number | null>(null),
      filtrosAplicados = ref<FiltrosEngraseQuery>(initialFiltrosEngraseQuery()),
      loadingInicial = ref(false),
      loadingEquipos = ref(false),
      loadingDetalleEquipo = ref(false),
      loadingSugerencias = ref(false),
      errorInicial = ref<string | null>(null),
      errorEquipos = ref<string | null>(null),
      errorDetalle = ref<string | null>(null);
    let catalogosCargados = false,
      idsCodigo = ref<Set<number> | null>(null),
      filtrosCache = new Map<number, EquipoFiltroDetalle[]>(),
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
    async function cargarEquipos() {
      loadingEquipos.value = true;
      errorEquipos.value = null;
      try {
        equipos.value = await filtrosEngraseService.obtenerEquipos();
        await asegurarSeleccion();
      } catch (e) {
        errorEquipos.value =
          e instanceof Error ? e.message : "No se pudieron cargar equipos";
      } finally {
        loadingEquipos.value = false;
      }
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
        const data =
          !force && filtrosCache.has(id)
            ? filtrosCache.get(id)!
            : await filtrosEngraseService.obtenerFiltrosDeEquipo(id);
        filtrosCache.set(id, data);
        if (equipoSeleccionadoId.value === id) {
          filtrosEquipo.value = data;
          const eq = await filtrosEngraseService.obtenerEquivalenciasActivas(
            data.map((x) => x.filtro_id),
          );
          equivalenciasPorFiltroId.value = eq.reduce<
            Record<number, FiltroEquivalenciaRow[]>
          >((a, x) => {
            (a[x.filtro_original_id] ??= []).push(x);
            return a;
          }, {});
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
      await cargarFiltrosEquipo(id);
    }
    function seleccionarFiltro(id: number | null) {
      filtroSeleccionadoId.value = id;
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
      equivalenciasPorFiltroId.value = {};
      limpiarSugerencias();
      equipoSeleccionadoId.value = null;
      filtroSeleccionadoId.value = null;
      filtrosAplicados.value = initialFiltrosEngraseQuery();
      catalogosCargados = false;
      filtrosCache.clear();
      idsCodigo.value = null;
    }
    return {
      equipos,
      tiposEquipo,
      tiposFiltro,
      etapas,
      filtrosEquipo,
      equivalenciasPorFiltroId,
      sugerenciasCodigo,
      equipoSeleccionadoId,
      filtroSeleccionadoId,
      filtrosAplicados,
      loadingInicial,
      loadingEquipos,
      loadingDetalleEquipo,
      loadingSugerencias,
      errorInicial,
      errorEquipos,
      errorDetalle,
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
      cargarFiltrosEquipo,
      buscarSugerencias,
      limpiarSugerencias,
      seleccionarCodigoExacto,
      limpiarCodigoSeleccionado,
      actualizarFiltros,
      limpiarFiltros,
      seleccionarEquipo,
      seleccionarFiltro,
      reintentarCarga,
      reset,
    };
  },
);
