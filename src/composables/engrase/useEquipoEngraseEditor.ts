import { computed, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { useEquipoEngraseEdicionStore } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store";
import { useFiltrosEngraseStore } from "@/stores/dbequipos/engrase/filtrosEngrase.store";
import { crearOpcionesModelo } from "@/stores/dbequipos/engrase/edicion/equipoEngraseModelos";
import type { MoverImagenEquipo } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store";

export function useEquipoEngraseEditor() {
  const route = useRoute();
  const router = useRouter();
  const store = useEquipoEngraseEdicionStore();
  const listadoStore = useFiltrosEngraseStore();
  const state = storeToRefs(store);
  const { equipos } = storeToRefs(listadoStore);
  const modelOptions = computed(() =>
    crearOpcionesModelo({
      equipos: equipos.value,
      modeloActual: state.draft.value?.equipo.subtipo ?? "",
      tipoEquipoId: state.draft.value?.equipo.tipoEquipoId ?? 0,
      tipoEquipo: state.draft.value?.equipo.tipoEquipo ?? "",
    }),
  );
  void listadoStore.asegurarEquiposCargados();
  const codigoRuta = (): string =>
    typeof route.params.codigo === "string" ? route.params.codigo : "";
  const cargarRuta = (): Promise<void> => store.cargar(codigoRuta());
  watch(
    () => route.params.codigo,
    () => {
      cargarRuta();
    },
    { immediate: true },
  );
  const volver = (): void => {
    if (store.solicitarSalida()) router.push({ name: "FiltrosEngrase" });
  };
  const descartarYVolver = (): void => {
    store.descartarCambios();
    router.push({ name: "FiltrosEngrase" });
  };
  const enfocarPrimerError = async (): Promise<void> => {
    await nextTick();
    const error = store.validationErrors[0];
    const objetivo = error?.fieldId
      ? document.getElementById(error.fieldId)
      : error
        ? document.querySelector<HTMLElement>(`[data-validation-section="${error.seccion === "etapas" ? "datos" : error.seccion}"]`)
        : null;
    objetivo?.focus();
  };
  const guardar = async (moverImagen: MoverImagenEquipo): Promise<void> => {
    const resultado = await store.guardar(moverImagen);
    if (resultado.kind === "invalid" || resultado.kind === "error") await enfocarPrimerError();
    if (resultado.kind === "success") await router.push({ name: "FiltrosEngrase" });
  };
  const prevenirCierre = (event: BeforeUnloadEvent): void => {
    if (!store.isDirty && !store.saving) return;
    event.preventDefault();
  };
  onMounted(() => window.addEventListener("beforeunload", prevenirCierre));
  onBeforeRouteLeave(() => store.solicitarSalida());
  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", prevenirCierre);
    store.continuarEditando();
  });
  return {
    ...state,
    modelOptions,
    volver,
    descartarYVolver,
    continuarEditando: store.continuarEditando,
    reintentar: cargarRuta,
    guardar,
    actualizarCodigo: store.actualizarCodigo,
    seleccionarTipoEquipo: store.seleccionarTipoEquipo,
    actualizarSubtipo: store.actualizarSubtipo,
    actualizarEstado: store.actualizarEstado,
    agregarEtapa: store.agregarEtapa,
    quitarEtapa: store.quitarEtapa,
    crearYSeleccionarTipoEquipo: store.crearYSeleccionarTipoEquipo,
    esTipoEquipoDuplicado: store.esTipoEquipoDuplicado,
    abrirNuevoTipoEquipo: store.abrirNuevoTipoEquipo,
    buscarFiltroOriginalParaAsignar: store.buscarFiltroOriginalParaAsignar,
    agregarFiltroExistente: store.agregarFiltroExistente,
    agregarFiltroTemporal: store.agregarFiltroTemporal,
    actualizarAsignacionFiltro: store.actualizarAsignacionFiltro,
    marcarFiltroParaEliminar: store.marcarFiltroParaEliminar,
    deshacerEliminacionFiltro: store.deshacerEliminacionFiltro,
    agregarAceite: store.agregarAceite,
    actualizarAceite: store.actualizarAceite,
    marcarAceiteParaEliminar: store.marcarAceiteParaEliminar,
    deshacerEliminacionAceite: store.deshacerEliminacionAceite,
  };
}
