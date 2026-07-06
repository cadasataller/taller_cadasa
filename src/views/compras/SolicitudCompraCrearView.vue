<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { shallowRef } from 'vue';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

import { useCrearSolicitudCompraWizard } from '@/composables/compras/useCrearSolicitudCompraWizard';
import type { CatalogoContextoDestinoOption } from '@/stores/db_compras/catalogo_contexto_destino/catalogoContextoDestino.types';
import { useSolicitudesCompraCrearStore } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.store';
import { useFeatureAccessStore } from '@/stores/db_mantenimiento/app_feature_access/featureAccess.store';
import type {
  CrearSolicitudAdjuntoDraftInput,
  ProductoSolicitudTemporalItem,
  ProductoTemporalDraft,
  ServicioSolicitudDraft,
  ServicioSolicitudItem,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

import CrearSolicitudCompraServicioBottomSheet from '@/components/compras/crear/CrearSolicitudCompraServicioBottomSheet.vue';
import CrearSolicitudCompraActionConfirmModal from '@/components/compras/crear/CrearSolicitudCompraActionConfirmModal.vue';
import CrearSolicitudCompraServicioDrawer from '@/components/compras/crear/CrearSolicitudCompraServicioDrawer.vue';
import CrearSolicitudCompraFooterActions from '@/components/compras/crear/CrearSolicitudCompraFooterActions.vue';
import CrearSolicitudCompraHeader from '@/components/compras/crear/CrearSolicitudCompraHeader.vue';
import CrearSolicitudCompraProductoTemporalOverlay from '@/components/compras/crear/CrearSolicitudCompraProductoTemporalOverlay.vue';
import CrearSolicitudCompraStepDatosBase from '@/components/compras/crear/CrearSolicitudCompraStepDatosBase.vue';
import CrearSolicitudCompraStepObservaciones from '@/components/compras/crear/CrearSolicitudCompraStepObservaciones.vue';
import CrearSolicitudCompraStepProductos from '@/components/compras/crear/CrearSolicitudCompraStepProductos.vue';
import CrearSolicitudCompraStepResumen from '@/components/compras/crear/CrearSolicitudCompraStepResumen.vue';
import CrearSolicitudCompraStepServicios from '@/components/compras/crear/CrearSolicitudCompraStepServicios.vue';
import CrearSolicitudCompraStepper from '@/components/compras/crear/CrearSolicitudCompraStepper.vue';

const router = useRouter();
const toast = useToast();
const createStore = useSolicitudesCompraCrearStore();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const AUTO_SAVE_INTERVAL_MS = 5 * 60 * 1000;
const VIEW_DRAFTS_FEATURE = 'ver_borradores_solicitud_compra';

const {
  currentStep,
  continuedFromDraft,
  fechaEntregaRequiresReview,
  fechaEntregaAutoAdjustedMessage,
  fechaEntregaMinima,
  fechaEntregaRulesLoading,
  isZafraActiva,
  tipoSolicitud,
  fechaEntrega,
  destinos,
  productos,
  servicios,
  observacion,
  solicitarUrgente,
  motivoUrgencia,
  adjuntosLocales,
  adjuntosErroresRecientes,
  productSearchQuery,
  productSearchResults,
  productSearchLoading,
  productSearchError,
  loading,
  createError,
  validationErrors,
  searchResults,
  isSearching,
  equiposSearchError,
  headerContext,
  isCurrentStepValid,
  maxUnlockedStep,
  canSaveDraft,
  onNext,
  onBack,
  onSubmit,
  onSaveDraft,
  goToStep,
  setTipoSolicitud,
  setFechaEntrega,
  setObservacion,
  setSolicitarUrgente,
  setMotivoUrgencia,
  agregarAdjuntos,
  removerAdjunto,
  limpiarErroresAdjuntos,
  setProductSearchQuery,
  buscarEquipos,
  buscarProductos,
  agregarEquipo,
  agregarDestinoContexto,
  removerDestino,
  agregarProductoExistente,
  agregarProductoTemporal,
  actualizarProductoTemporal,
  agregarServicio,
  actualizarServicio,
  removerProducto,
  removerServicio,
} = useCrearSolicitudCompraWizard();

const createEmptyTemporalDraft = (nombre = ''): ProductoTemporalDraft => ({
  nombre,
  descripcion: null,
  unidadCodigo: '',
  unidadLabel: '',
});

const createEmptyServicioDraft = (): ServicioSolicitudDraft => ({
  cantidad: 1,
  descripcion: '',
  unidadCodigo: '',
  unidadLabel: '',
});

const isProductoTemporalOverlayOpen = shallowRef(false);
const productoTemporalOverlayMode = shallowRef<'create' | 'edit'>('create');
const editingTemporalLocalId = shallowRef<string | null>(null);
const productoTemporalDraft = ref<ProductoTemporalDraft>(createEmptyTemporalDraft());
const isServicioOverlayOpen = shallowRef(false);
const servicioOverlayMode = shallowRef<'create' | 'edit'>('create');
const editingServicioLocalId = shallowRef<string | null>(null);
const servicioDraft = ref<ServicioSolicitudDraft>(createEmptyServicioDraft());
const viewportWidth = shallowRef(typeof window === 'undefined' ? 1280 : window.innerWidth);
const isDesktop = computed(() => viewportWidth.value >= 1024);
const resumenHasDesktopOverflow = shallowRef(false);
const resumenDesktopReachedBottom = shallowRef(false);
const pendingAction = shallowRef<'send' | 'draft' | 'cancel' | null>(null);
const postDraftAction = shallowRef<'stay' | 'leave' | null>(null);
const lastAutoSavedAt = shallowRef<Date | null>(null);
let autoSaveIntervalId: number | null = null;

const shouldDisableNext = computed(() => !isCurrentStepValid.value);

const shouldDisableSend = computed(() =>
  currentStep.value === 4
  && isDesktop.value
  && resumenHasDesktopOverflow.value
  && !resumenDesktopReachedBottom.value
);
const canUseDrafts = computed(() =>
  isFeatureAccessLoaded.value
  && featureAccessStore.tieneFuncionalidad(VIEW_DRAFTS_FEATURE)
);

const autoSaveStatusLabel = computed(() => {
  if (!canUseDrafts.value || !lastAutoSavedAt.value) {
    return '';
  }

  const formattedTime = new Intl.DateTimeFormat('es-HN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(lastAutoSavedAt.value);

  return `Ultima vez autoguardado borrador: ${formattedTime}`;
});

const pendingActionConfig = computed(() => {
  if (pendingAction.value === 'send') {
    return {
      title: 'Enviar solicitud',
      description: 'La solicitud quedara registrada y se enviara para continuar con el flujo correspondiente.',
      confirmLabel: 'Si, enviar solicitud',
      closeLabel: 'No, volver',
      palette: {
        badgeClass: 'bg-main/10 text-main',
        borderClass: 'border-main/20',
        confirmButtonClass: 'bg-main',
        confirmButtonHoverClass: 'hover:bg-main-light',
        confirmButtonTextClass: 'text-white',
      },
    };
  }

  if (pendingAction.value === 'draft') {
    const draftDescription = adjuntosLocales.value.length > 0
      ? 'Se conservara el avance actual para que puedas retomarlo mas tarde desde compras. Los adjuntos no se incluyen en el borrador.'
      : 'Se conservara el avance actual para que puedas retomarlo mas tarde desde compras.';

    return {
      title: 'Guardar borrador',
      description: draftDescription,
      confirmLabel: 'Si, guardar borrador',
      closeLabel: 'No, seguir editando',
      palette: {
        badgeClass: 'bg-accent/25 text-main',
        borderClass: 'border-white',
        confirmButtonClass: 'bg-accent',
        confirmButtonHoverClass: 'hover:bg-accent-light',
        confirmButtonTextClass: 'text-main',
      },
    };
  }

  if (pendingAction.value === 'cancel') {
    return {
      title: 'Cancelar creacion',
      description: 'Se cerrara este flujo y perderas los cambios que no hayas enviado o guardado como borrador.',
      confirmLabel: 'Si, cancelar',
      closeLabel: 'No, continuar',
      palette: {
        badgeClass: 'bg-danger-bg text-danger',
        borderClass: 'border-danger/20',
        confirmButtonClass: 'bg-danger',
        confirmButtonHoverClass: 'hover:bg-danger-light',
        confirmButtonTextClass: 'text-white',
      },
    };
  }

  return null;
});

const postDraftActionConfig = computed(() => {
  if (!postDraftAction.value) {
    return null;
  }

  return {
    title: 'Borrador guardado',
    description: 'Tu borrador se guardo correctamente. Puedes seguir editando este formulario o salir para volver mas tarde.',
    confirmLabel: 'Salir del formulario',
    closeLabel: 'Seguir editando',
    palette: {
      badgeClass: 'bg-success/10 text-success',
      borderClass: 'border-success/20',
      confirmButtonClass: 'bg-main',
      confirmButtonHoverClass: 'hover:bg-main-light',
      confirmButtonTextClass: 'text-white',
    },
  };
});

const closeView = (): void => {
  void router.push({ name: 'Compras' });
};

const openActionConfirmModal = (action: 'send' | 'draft' | 'cancel'): void => {
  pendingAction.value = action;
};

const closeActionConfirmModal = (): void => {
  pendingAction.value = null;
};

const closePostDraftActionModal = (): void => {
  postDraftAction.value = null;
};

const handleNext = (): void => {
  onNext();
};

const handleConfirmedAction = async (): Promise<void> => {
  const action = pendingAction.value;

  closeActionConfirmModal();

  if (action === 'cancel') {
    closeView();
    return;
  }

  if (action === 'draft' || action === 'send') {
    if (action === 'draft') {
      await handleSaveDraft();
      return;
    }

    await handleSubmit();
  }
};

const handleSubmit = async (): Promise<void> => {
  await onSubmit();
  void router.push({ name: 'Compras' });
};

const handleSaveDraft = async (): Promise<void> => {
  if (!canUseDrafts.value) {
    toast.add({
      severity: 'warn',
      summary: 'Acceso restringido',
      detail: 'No tienes permiso para guardar borradores.',
      life: 3000,
    });
    return;
  }

  await onSaveDraft();
  postDraftAction.value = 'stay';
};

const handleConfirmedPostDraftAction = (): void => {
  closePostDraftActionModal();
  void router.push({ name: 'Compras' });
};

const runAutoSave = async (): Promise<void> => {
  if (!canUseDrafts.value) {
    return;
  }

  const saved = await createStore.autoSaveDraft();

  if (!saved) {
    return;
  }

  toast.add({
    severity: 'success',
    summary: 'Borrador guardado correctamente',
    life: 2500,
  });
  lastAutoSavedAt.value = new Date();
};

const startAutoSave = (): void => {
  if (autoSaveIntervalId !== null) {
    window.clearInterval(autoSaveIntervalId);
  }

  autoSaveIntervalId = window.setInterval(() => {
    void runAutoSave();
  }, AUTO_SAVE_INTERVAL_MS);
};

const closeProductoTemporalOverlay = (): void => {
  isProductoTemporalOverlayOpen.value = false;
  productoTemporalOverlayMode.value = 'create';
  editingTemporalLocalId.value = null;
  productoTemporalDraft.value = createEmptyTemporalDraft();
};

const closeServicioOverlay = (): void => {
  isServicioOverlayOpen.value = false;
  servicioOverlayMode.value = 'create';
  editingServicioLocalId.value = null;
  servicioDraft.value = createEmptyServicioDraft();
};

const handleManualRequest = (initialNombre: string): void => {
  productoTemporalOverlayMode.value = 'create';
  editingTemporalLocalId.value = null;
  productoTemporalDraft.value = createEmptyTemporalDraft(initialNombre);
  isProductoTemporalOverlayOpen.value = true;
};

const handleEditProductoTemporal = (item: ProductoSolicitudTemporalItem): void => {
  productoTemporalOverlayMode.value = 'edit';
  editingTemporalLocalId.value = item.localId;
  productoTemporalDraft.value = {
    nombre: item.nombre,
    descripcion: item.descripcion,
    unidadCodigo: item.unidadCodigo,
    unidadLabel: item.unidadLabel,
  };
  isProductoTemporalOverlayOpen.value = true;
};

const handleSubmitProductoTemporal = (draft: ProductoTemporalDraft): void => {
  if (productoTemporalOverlayMode.value === 'edit' && editingTemporalLocalId.value) {
    actualizarProductoTemporal(editingTemporalLocalId.value, draft);
  } else {
    agregarProductoTemporal(draft);
  }

  closeProductoTemporalOverlay();
};

const handleAddServicio = (): void => {
  servicioOverlayMode.value = 'create';
  editingServicioLocalId.value = null;
  servicioDraft.value = createEmptyServicioDraft();
  isServicioOverlayOpen.value = true;
};

const handleEditServicio = (item: ServicioSolicitudItem): void => {
  servicioOverlayMode.value = 'edit';
  editingServicioLocalId.value = item.localId;
  servicioDraft.value = {
    cantidad: item.cantidad,
    descripcion: item.descripcion,
    unidadCodigo: item.unidadCodigo,
    unidadLabel: item.unidadLabel,
  };
  isServicioOverlayOpen.value = true;
};

const handleSubmitServicio = (draft: ServicioSolicitudDraft): void => {
  if (servicioOverlayMode.value === 'edit' && editingServicioLocalId.value) {
    actualizarServicio(editingServicioLocalId.value, draft);
  } else {
    agregarServicio(draft);
  }

  closeServicioOverlay();
};

const handleAddDestinoContexto = (item: CatalogoContextoDestinoOption): void => {
  agregarDestinoContexto(item);
};

const handleResumenDesktopScrollStateChange = ({
  hasOverflow,
  reachedBottom,
}: {
  hasOverflow: boolean;
  reachedBottom: boolean;
}): void => {
  resumenHasDesktopOverflow.value = hasOverflow;
  resumenDesktopReachedBottom.value = reachedBottom;
};

const handleAddAdjuntos = (items: CrearSolicitudAdjuntoDraftInput[]): void => {
  agregarAdjuntos(items);
};

const handleRemoveAdjunto = (localId: string): void => {
  removerAdjunto(localId);
};

const handleClearAdjuntosErrors = (): void => {
  limpiarErroresAdjuntos();
};

const syncViewportWidth = (): void => {
  viewportWidth.value = window.innerWidth;
};

onMounted(() => {
  if (!createStore.entryMode) {
    void createStore.prepareNewEntry();
  }
  startAutoSave();
  window.addEventListener('resize', syncViewportWidth);
});

onBeforeUnmount(() => {
  createStore.reset();
  if (autoSaveIntervalId !== null) {
    window.clearInterval(autoSaveIntervalId);
    autoSaveIntervalId = null;
  }
  window.removeEventListener('resize', syncViewportWidth);
});
</script>

<template>
  <section class="min-h-screen overflow-y-auto bg-[#EEECE4] lg:h-screen lg:overflow-hidden">
    <Toast />
    <div class="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-4 grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] gap-1 px-3 py-1 lg:h-full lg:min-h-0 lg:px-4 lg:py-1">
      <div class="col-span-4 row-start-1">
        <CrearSolicitudCompraHeader
          :solicitante-nombre="headerContext.solicitanteNombre"
          :area-nombre="headerContext.areaNombre"
          :fecha-creacion-local="headerContext.fechaCreacionLocal"
        />
      </div>

      <div class="col-span-4 row-start-2">
        <CrearSolicitudCompraStepper
          :current-step="currentStep"
          :max-unlocked-step="maxUnlockedStep"
          :tipo-solicitud="tipoSolicitud"
          @navigate="goToStep"
        />
      </div>

      <div
        v-if="createError || continuedFromDraft"
        class="col-span-4 row-start-3 space-y-2"
      >
        <p
          v-if="createError"
          class="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-xs font-medium text-danger lg:text-sm"
        >
          {{ createError }}
        </p>

        <p
          v-if="continuedFromDraft"
          class="rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-xs font-medium text-stone-600"
        >
          Los archivos adjuntos no se restauran al continuar un borrador.
        </p>

        <p
          v-if="fechaEntregaAutoAdjustedMessage"
          class="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-xs font-medium text-danger lg:text-sm"
        >
          {{ fechaEntregaAutoAdjustedMessage }}
        </p>
      </div>

      <div
        class="col-span-4 row-start-4 flex min-h-0 flex-col overflow-visible lg:overflow-hidden"
      >
        <CrearSolicitudCompraStepDatosBase
          v-if="currentStep === 1"
          :tipo-solicitud="tipoSolicitud"
          :fecha-entrega="fechaEntrega"
          :fecha-entrega-requires-review="fechaEntregaRequiresReview"
          :fecha-entrega-minima="fechaEntregaMinima"
          :is-zafra-activa="isZafraActiva"
          :destinos="destinos"
          :validation-errors="validationErrors"
          :search-results="searchResults"
          :is-searching="isSearching"
          :search-error="equiposSearchError"
          @update:tipo-solicitud="setTipoSolicitud"
          @update:fecha-entrega="setFechaEntrega"
          @search:equipos="buscarEquipos"
          @add:equipo="agregarEquipo"
          @add:destino-contexto="handleAddDestinoContexto"
          @remove:destino="removerDestino"
        />

        <CrearSolicitudCompraStepProductos
          v-else-if="currentStep === 2 && tipoSolicitud !== 'servicio'"
          :tipo-solicitud="tipoSolicitud"
          :search-query="productSearchQuery"
          :search-results="productSearchResults"
          :is-searching="productSearchLoading"
          :search-error="productSearchError"
          :productos="productos"
          :servicios="servicios"
          :productos-error="validationErrors.productos"
          :servicios-error="validationErrors.servicios"
          @update:search-query="setProductSearchQuery"
          @search:productos="buscarProductos"
          @add-producto-existente="agregarProductoExistente"
          @remove-producto="removerProducto"
          @remove-servicio="removerServicio"
          @manual-request="handleManualRequest"
          @edit-producto-temporal="handleEditProductoTemporal"
        />

        <CrearSolicitudCompraStepServicios
          v-else-if="currentStep === 2"
          :servicios="servicios"
          :servicios-error="validationErrors.servicios"
          @add="handleAddServicio"
          @edit="handleEditServicio"
          @remove="removerServicio"
        />

        <CrearSolicitudCompraStepObservaciones
          v-else-if="currentStep === 3"
          :observacion="observacion"
          :destinos="destinos"
          :adjuntos="adjuntosLocales"
          :solicitar-urgente="solicitarUrgente"
          :motivo-urgencia="motivoUrgencia"
          :observacion-error="validationErrors.observacion"
          :adjuntos-error="validationErrors.adjuntos"
          :adjuntos-errores-recientes="adjuntosErroresRecientes"
          :motivo-urgencia-error="validationErrors.motivoUrgencia"
          @update:observacion="setObservacion"
          @add:adjuntos="handleAddAdjuntos"
          @remove:adjunto="handleRemoveAdjunto"
          @clear:adjuntos-errors="handleClearAdjuntosErrors"
          @update:solicitar-urgente="setSolicitarUrgente"
          @update:motivo-urgencia="setMotivoUrgencia"
        />

        <CrearSolicitudCompraStepResumen
          v-else
          :tipo-solicitud="tipoSolicitud"
          :fecha-entrega="fechaEntrega"
          :destinos="destinos"
          :productos="productos"
          :servicios="servicios"
          :observacion="observacion"
          :adjuntos="adjuntosLocales"
          :solicitar-urgente="solicitarUrgente"
          :motivo-urgencia="motivoUrgencia"
          @desktop-scroll-state-change="handleResumenDesktopScrollStateChange"
        />
      </div>

      <div class="col-span-4 row-start-5 shrink-0 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm lg:px-4">
        <CrearSolicitudCompraFooterActions
          :current-step="currentStep"
          :loading="loading || fechaEntregaRulesLoading"
          :disable-next="shouldDisableNext"
          :disable-send="shouldDisableSend"
          :show-draft-button="canSaveDraft && canUseDrafts"
          :auto-save-status-label="autoSaveStatusLabel"
          @cancel="openActionConfirmModal('cancel')"
          @back="onBack"
          @next="handleNext"
          @draft="openActionConfirmModal('draft')"
          @send="openActionConfirmModal('send')"
        />
      </div>
    </div>

    <CrearSolicitudCompraActionConfirmModal
      v-if="pendingActionConfig"
      :title="pendingActionConfig.title"
      :description="pendingActionConfig.description"
      :confirm-label="pendingActionConfig.confirmLabel"
      :close-label="pendingActionConfig.closeLabel"
      :palette="pendingActionConfig.palette"
      :loading="loading"
      @close="closeActionConfirmModal"
      @confirm="handleConfirmedAction"
    />

    <CrearSolicitudCompraActionConfirmModal
      v-if="postDraftActionConfig"
      :title="postDraftActionConfig.title"
      :description="postDraftActionConfig.description"
      :confirm-label="postDraftActionConfig.confirmLabel"
      :close-label="postDraftActionConfig.closeLabel"
      :palette="postDraftActionConfig.palette"
      @close="closePostDraftActionModal"
      @confirm="handleConfirmedPostDraftAction"
    />

    <CrearSolicitudCompraProductoTemporalOverlay
      v-if="isProductoTemporalOverlayOpen"
      :mode="productoTemporalOverlayMode"
      :initial-draft="productoTemporalDraft"
      @cancel="closeProductoTemporalOverlay"
      @submit="handleSubmitProductoTemporal"
    />

    <CrearSolicitudCompraServicioDrawer
      v-if="isServicioOverlayOpen && isDesktop"
      :mode="servicioOverlayMode"
      :initial-draft="servicioDraft"
      @cancel="closeServicioOverlay"
      @submit="handleSubmitServicio"
    />

    <CrearSolicitudCompraServicioBottomSheet
      v-else-if="isServicioOverlayOpen"
      :mode="servicioOverlayMode"
      :initial-draft="servicioDraft"
      @cancel="closeServicioOverlay"
      @submit="handleSubmitServicio"
    />
  </section>
</template>
