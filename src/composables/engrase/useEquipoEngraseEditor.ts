import { onBeforeUnmount, watch } from "vue";
import { storeToRefs } from "pinia";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { useEquipoEngraseEdicionStore } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store";

export function useEquipoEngraseEditor() {
  const route = useRoute();
  const router = useRouter();
  const store = useEquipoEngraseEdicionStore();
  const state = storeToRefs(store);
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
  onBeforeRouteLeave(() => store.solicitarSalida());
  onBeforeUnmount(() => store.continuarEditando());
  return {
    ...state,
    volver,
    descartarYVolver,
    continuarEditando: store.continuarEditando,
    reintentar: cargarRuta,
    actualizarCodigo: store.actualizarCodigo,
    seleccionarTipoEquipo: store.seleccionarTipoEquipo,
    actualizarSubtipo: store.actualizarSubtipo,
    actualizarEstado: store.actualizarEstado,
    agregarEtapa: store.agregarEtapa,
    quitarEtapa: store.quitarEtapa,
    crearYSeleccionarTipoEquipo: store.crearYSeleccionarTipoEquipo,
    esTipoEquipoDuplicado: store.esTipoEquipoDuplicado,
    abrirNuevoTipoEquipo: store.abrirNuevoTipoEquipo,
  };
}
