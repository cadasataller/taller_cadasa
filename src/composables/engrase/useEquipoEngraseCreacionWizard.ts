import { onBeforeUnmount, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { useEquipoEngraseCreacionStore } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.store";

export function useEquipoEngraseCreacionWizard() {
  const router = useRouter();
  const store = useEquipoEngraseCreacionStore();
  const state = storeToRefs(store);

  const prevenirRecarga = (event: BeforeUnloadEvent): void => {
    if (!store.hasDraftContent || store.isCreated) return;
    event.preventDefault();
    event.returnValue = "";
  };

  const volverAlListado = async (): Promise<void> => {
    if (!store.solicitarSalida()) return;
    await router.push({ name: "FiltrosEngrase" });
  };

  const confirmarDescarteYVolver = async (): Promise<void> => {
    store.confirmarDescarte();
    await router.push({ name: "FiltrosEngrase" });
  };

  onMounted(() => {
    window.addEventListener("beforeunload", prevenirRecarga);
    void store.cargarInicial();
  });
  onBeforeRouteLeave(() => store.solicitarSalida());
  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", prevenirRecarga);
    store.continuarCreando();
  });

  return {
    ...state,
    volverAlListado,
    confirmarDescarteYVolver,
    reintentarCargaInicial: store.reintentarCargaInicial,
    continuarCreando: store.continuarCreando,
    actualizarCodigo: store.actualizarCodigo,
    seleccionarTipoEquipo: store.seleccionarTipoEquipo,
    limpiarTipoEquipo: store.limpiarTipoEquipo,
    actualizarSubtipo: store.actualizarSubtipo,
    actualizarEstado: store.actualizarEstado,
    agregarEtapa: store.agregarEtapa,
    quitarEtapa: store.quitarEtapa,
    crearYSeleccionarTipoEquipo: store.crearYSeleccionarTipoEquipo,
    validarCodigoActual: store.validarCodigoActual,
    avanzar: store.avanzar,
    retroceder: store.retroceder,
    irAPaso: store.irAPaso,
    abrirOverlay: store.abrirOverlay,
    cerrarOverlay: store.cerrarOverlay,
  };
}
