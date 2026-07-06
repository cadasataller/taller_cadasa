import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useEquiposStore } from '@/stores/dbequipos/equipos/equipos.store';
import { useSolicitudesCompraCrearStore } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.store';
import type {
  ProductoTemporalDraft,
  ServicioSolicitudDraft,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

export const useCrearSolicitudCompraWizard = () => {
  const store = useSolicitudesCompraCrearStore();
  const equiposStore = useEquiposStore();

  const storeRefs = storeToRefs(store);
  const equiposRefs = storeToRefs(equiposStore);

  const stepTitle = computed(() => {
    switch (storeRefs.currentStep.value) {
      case 1:
        return 'Datos base';
      case 2:
        return storeRefs.tipoSolicitud.value === 'servicio'
          ? 'Servicios'
          : 'Productos';
      case 3:
        return 'Observaciones';
      default:
        return 'Resumen';
    }
  });

  const headerContext = computed(() => ({
    solicitanteNombre: storeRefs.solicitanteNombre.value,
    solicitanteEmail: storeRefs.solicitanteEmail.value,
    areaNombre: storeRefs.areaNombre.value,
    fechaCreacionLocal: storeRefs.fechaCreacionLocal.value,
  }));

  const onNext = (): boolean => store.goToNextStep();
  const onBack = (): void => store.goToPreviousStep();
  const goToStep = (step: 1 | 2 | 3 | 4): boolean => store.goToStep(step);

  const onSubmit = async (): Promise<void> => {
    await store.submit('send');
  };

  const onSaveDraft = async (): Promise<void> => {
    await store.saveDraft();
  };

  return {
    currentStep: storeRefs.currentStep,
    continuedFromDraft: storeRefs.continuedFromDraft,
    fechaEntregaRequiresReview: storeRefs.fechaEntregaRequiresReview,
    fechaEntregaAutoAdjustedMessage: storeRefs.fechaEntregaAutoAdjustedMessage,
    fechaEntregaMinima: storeRefs.fechaEntregaMinima,
    fechaEntregaRulesLoading: storeRefs.fechaEntregaRulesLoading,
    isZafraActiva: storeRefs.isZafraActiva,
    tipoSolicitud: storeRefs.tipoSolicitud,
    fechaEntrega: storeRefs.fechaEntrega,
    destinos: storeRefs.destinos,
    productos: storeRefs.productos,
    servicios: storeRefs.servicios,
    observacion: storeRefs.observacion,
    solicitarUrgente: storeRefs.solicitarUrgente,
    motivoUrgencia: storeRefs.motivoUrgencia,
    adjuntosLocales: storeRefs.adjuntosLocales,
    adjuntosErroresRecientes: storeRefs.adjuntosErroresRecientes,
    productSearchQuery: storeRefs.productSearchQuery,
    productSearchResults: storeRefs.productSearchResults,
    productSearchLoading: storeRefs.productSearchLoading,
    productSearchError: storeRefs.productSearchError,
    validationErrors: storeRefs.validationErrors,
    loading: storeRefs.loading,
    createError: storeRefs.error,
    searchResults: equiposRefs.searchResults,
    isSearching: equiposRefs.isSearching,
    equiposSearchError: equiposRefs.error,
    stepTitle,
    headerContext,
    isCurrentStepValid: computed(() => store.isCurrentStepValid),
    maxUnlockedStep: computed(() => store.maxUnlockedStep),
    canSaveDraft: computed(() => store.canSaveDraft),
    goToStep,
    onNext,
    onBack,
    onSubmit,
    onSaveDraft,
    setTipoSolicitud: store.setTipoSolicitud,
    setFechaEntrega: store.setFechaEntrega,
    setObservacion: store.setObservacion,
    setSolicitarUrgente: store.setSolicitarUrgente,
    setMotivoUrgencia: store.setMotivoUrgencia,
    agregarAdjuntos: store.agregarAdjuntos,
    removerAdjunto: store.removerAdjunto,
    limpiarErroresAdjuntos: store.limpiarErroresAdjuntos,
    setProductSearchQuery: store.setProductSearchQuery,
    buscarEquipos: store.buscarEquipos,
    agregarEquipo: store.agregarEquipo,
    agregarDestinoContexto: store.agregarDestinoContexto,
    removerDestino: store.removerDestino,
    buscarProductos: store.buscarProductos,
    agregarProductoExistente: store.agregarProductoExistente,
    agregarProductoTemporal: (item: ProductoTemporalDraft) => store.agregarProductoTemporal(item),
    actualizarProductoTemporal: (localId: string, item: ProductoTemporalDraft) =>
      store.actualizarProductoTemporal(localId, item),
    removerProducto: store.removerProducto,
    agregarServicio: (item: ServicioSolicitudDraft) => store.agregarServicio(item),
    actualizarServicio: (localId: string, item: ServicioSolicitudDraft) =>
      store.actualizarServicio(localId, item),
    removerServicio: store.removerServicio,
  };
};
