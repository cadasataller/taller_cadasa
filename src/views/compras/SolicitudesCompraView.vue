<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { useRoute, useRouter } from 'vue-router';

import SolicitudesCompraDraftsEntryModal from '@/components/compras/list/SolicitudesCompraDraftsEntryModal.vue';
import SolicitudesDesktopTable from '@/components/compras/list/desktop/SolicitudesDesktopTable.vue';
import SolicitudesListEmptyState from '@/components/compras/list/SolicitudesListEmptyState.vue';
import SolicitudesListErrorState from '@/components/compras/list/SolicitudesListErrorState.vue';
import SolicitudesListLoadMoreTrigger from '@/components/compras/list/SolicitudesListLoadMoreTrigger.vue';
import SolicitudesListSkeleton from '@/components/compras/list/SolicitudesListSkeleton.vue';
import SolicitudesListToolbar from '@/components/compras/list/SolicitudesListToolbar.vue';
import SolicitudesMobileList from '@/components/compras/list/mobile/SolicitudesMobileList.vue';
import { useSolicitudesCompraList } from '@/components/compras/list/useSolicitudesCompraList';
import { getSolicitudCompraGroupOptions } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.config.helpers';
import { solicitudesCompraBorradoresService } from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.service';
import type { SolicitudCompraBorradorListadoItem } from '@/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.types';
import { useSolicitudesCompraCrearStore } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.store';
import { useFeatureAccessStore } from '@/stores/db_mantenimiento/app_feature_access/featureAccess.store';
import type {
  SolicitudCompraGrupoListado,
  SolicitudCompraRoleCodigo,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const {
  items,
  baseItems,
  loading,
  loadingMore,
  searching,
  error,
  filters,
  activeGrupo,
  baseEmpty,
  hasMore,
  initialized,
  configAvailable,
  visibleGroups,
  seguimientoOptions,
  canUseCreatedByMeFilter,
  uiMessage,
  configWarningToken,
  loadInitial,
  loadMore,
  onSearchChange,
  onGrupoChange,
  onFilterChange,
  onRetry,
  onRowClick,
  onCardClick,
} = useSolicitudesCompraList();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const createStore = useSolicitudesCompraCrearStore();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const isTransitioningToCreate = ref(false);
const isCheckingDrafts = ref(false);
const isCreateButtonLoading = ref(false);
const showDraftsModal = ref(false);
const availableDrafts = ref<SolicitudCompraBorradorListadoItem[]>([]);
const lastCreateTriggerElement = ref<HTMLElement | null>(null);
const CREATE_VIEW_NAVIGATION_DELAY_MS = 320;
const CREATE_SOLICITUD_FEATURE = 'crear_solicitud_compra';
const VIEW_DRAFTS_FEATURE = 'ver_borradores_solicitud_compra';

const roleCodigo = computed<SolicitudCompraRoleCodigo>(
  () => items.value[0]?.viewerRoleCodigo ?? baseItems.value[0]?.viewerRoleCodigo ?? 'operativo'
);
const groupOptions = computed(() => getSolicitudCompraGroupOptions(visibleGroups.value));
const isCreateOverlayOpen = computed(() => route.name === 'SolicitudCompraCrear');
const createOverlayLabel = computed(() => isCheckingDrafts.value
  ? 'Buscando borradores...'
  : 'Cargando formulario...');

const searchActive = computed(() =>
  filters.value.busqueda.trim().length > 0
  || Boolean(filters.value.seguimientoCodigo)
  || Boolean(filters.value.prioridadCodigo)
  || filters.value.soloBloqueadas
  || filters.value.soloCreadasPorMi
  || filters.value.soloDiferenciaOc
  || Boolean(filters.value.badgeDelegacionCodigo)
);

const isListRefreshing = computed(() =>
  initialized.value
  && items.value.length > 0
  && (loading.value || searching.value)
);

const listRefreshingLabel = computed(() =>
  searching.value ? 'Buscando...' : 'Actualizando...'
);
const canCreateSolicitud = computed(() =>
  isFeatureAccessLoaded.value
  && featureAccessStore.tieneFuncionalidad(CREATE_SOLICITUD_FEATURE)
);
const canViewDrafts = computed(() =>
  isFeatureAccessLoaded.value
  && featureAccessStore.tieneFuncionalidad(VIEW_DRAFTS_FEATURE)
);

const showFeatureDeniedToast = (featureName: string): void => {
  window.dispatchEvent(new CustomEvent('cancel-open-solicitud-compra'));
  toast.add({
    severity: 'warn',
    summary: 'Acceso restringido',
    detail: `No tienes permiso para ${featureName}.`,
    life: 3000,
  });
};

const handleGrupoChange = async (
  grupo: SolicitudCompraGrupoListado
): Promise<void> => {
  await onGrupoChange(grupo);
};

const closeDraftsModal = (): void => {
  showDraftsModal.value = false;
  availableDrafts.value = [];
  lastCreateTriggerElement.value?.focus();
};

const navigateToCreate = async (): Promise<void> => {
  isTransitioningToCreate.value = true;
  window.dispatchEvent(new CustomEvent('prepare-open-solicitud-compra'));
  void import('@/views/compras/SolicitudCompraCrearView.vue');

  window.setTimeout(() => {
    void router.push({ name: 'SolicitudCompraCrear' });
  }, CREATE_VIEW_NAVIGATION_DELAY_MS);
};

const openDraftsOverlay = async (): Promise<void> => {
  if (!canCreateSolicitud.value || !canViewDrafts.value) {
    showFeatureDeniedToast('ver borradores de solicitudes de compra');
    return;
  }

  if (
    isTransitioningToCreate.value
    || isCreateOverlayOpen.value
    || isCheckingDrafts.value
  ) {
    return;
  }

  lastCreateTriggerElement.value = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  isCheckingDrafts.value = true;

  try {
    const drafts = await solicitudesCompraBorradoresService.obtenerMisBorradores();

    if (drafts.length === 0) {
      await createStore.prepareNewEntry();
      await navigateToCreate();
      return;
    }

    availableDrafts.value = drafts;
    showDraftsModal.value = true;
  } catch (error) {
    toast.add({
      severity: 'warn',
      summary: 'No pudimos cargar tus borradores',
      detail: 'Abriremos una solicitud nueva para que puedas continuar.',
      life: 3500,
    });

    await createStore.prepareNewEntry();
    await navigateToCreate();
  } finally {
    isCheckingDrafts.value = false;
  }
};

const handleOpenNewSolicitudCompra = (): void => {
  void handleCreateDirect();
};

const handleCreateDirect = async (): Promise<void> => {
  isCreateButtonLoading.value = true;

  if (!canCreateSolicitud.value) {
    isCreateButtonLoading.value = false;
    showFeatureDeniedToast('crear solicitudes de compra');
    return;
  }

  if (isTransitioningToCreate.value || isCreateOverlayOpen.value) {
    window.dispatchEvent(new CustomEvent('cancel-open-solicitud-compra'));
    isCreateButtonLoading.value = false;
    return;
  }

  try {
    await createStore.prepareNewEntry();
    await navigateToCreate();
  } catch (error) {
    window.dispatchEvent(new CustomEvent('cancel-open-solicitud-compra'));
    isCreateButtonLoading.value = false;
    throw error;
  }
};

const handleCreateNewSolicitud = async (): Promise<void> => {
  if (!canCreateSolicitud.value || !canViewDrafts.value) {
    showFeatureDeniedToast('continuar con borradores de solicitudes de compra');
    return;
  }

  showDraftsModal.value = false;
  await createStore.prepareNewEntry();
  await navigateToCreate();
};

const handleContinueDraft = async (draft: SolicitudCompraBorradorListadoItem): Promise<void> => {
  if (!canCreateSolicitud.value || !canViewDrafts.value) {
    showFeatureDeniedToast('continuar con borradores de solicitudes de compra');
    return;
  }

  try {
    showDraftsModal.value = false;
    await createStore.prepareDraftEntry(draft);
    await navigateToCreate();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'No pudimos abrir ese borrador',
      detail: 'Puedes intentar con otro borrador o empezar una solicitud nueva.',
      life: 3500,
    });
    showDraftsModal.value = true;
  }
};

onMounted(() => {
  window.addEventListener('open-new-solicitud-compra', handleOpenNewSolicitudCompra);
  void loadInitial();
});

watch(
  () => route.name,
  (name) => {
    if (name === 'Compras') {
      isTransitioningToCreate.value = false;
      isCheckingDrafts.value = false;
      isCreateButtonLoading.value = false;
    }
  }
);

watch(
  configWarningToken,
  (token) => {
    if (token <= 0) {
      return;
    }

    toast.add({
      severity: 'info',
      summary: 'Vista reducida',
      detail: 'No pudimos cargar la configuracion del listado. Mostraremos una vista reducida.',
      life: 4200,
    });
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('open-new-solicitud-compra', handleOpenNewSolicitudCompra);
});
</script>

<template>
  <section class="relative min-h-screen bg-[#EEECE4]">
    <Toast />
    <div
      class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 transition-all duration-300 md:px-6 md:py-6"
      :class="[
        (isCreateOverlayOpen || showDraftsModal) ? 'pointer-events-none select-none' : '',
        isTransitioningToCreate ? '-translate-x-8 opacity-0' : 'translate-x-0 opacity-100'
      ]"
      :aria-hidden="isCreateOverlayOpen || showDraftsModal"
    >
      <div class="hidden lg:block">
        <SolicitudesListToolbar
          :filters="filters"
          :loading="loading"
          :searching="searching"
          :active-grupo="activeGrupo"
          :group-options="groupOptions"
          :seguimiento-options="seguimientoOptions"
          :can-use-created-by-me-filter="canUseCreatedByMeFilter"
          :is-mobile="false"
          :can-create="canCreateSolicitud"
          :create-loading="isCreateButtonLoading"
          :can-view-drafts="canViewDrafts"
          @update:search="onSearchChange"
          @update:grupo="handleGrupoChange"
          @update:seguimiento="onFilterChange({ seguimientoCodigo: $event })"
          @update:prioridad="onFilterChange({ prioridadCodigo: $event })"
          @update:fecha-desde="onFilterChange({ fechaDesde: $event })"
          @update:fecha-hasta="onFilterChange({ fechaHasta: $event })"
          @update:solo-bloqueadas="onFilterChange({ soloBloqueadas: $event })"
          @update:solo-creadas-por-mi="onFilterChange({ soloCreadasPorMi: $event })"
          @update:solo-diferencia-oc="onFilterChange({ soloDiferenciaOc: $event })"
          @create="void handleCreateDirect()"
          @view-drafts="void openDraftsOverlay()"
        />
      </div>

      <div class="lg:hidden">
        <SolicitudesListToolbar
          :filters="filters"
          :loading="loading"
          :searching="searching"
          :active-grupo="activeGrupo"
          :group-options="groupOptions"
          :seguimiento-options="seguimientoOptions"
          :can-use-created-by-me-filter="canUseCreatedByMeFilter"
          :is-mobile="true"
          :can-create="canCreateSolicitud"
          :create-loading="isCreateButtonLoading"
          :can-view-drafts="canViewDrafts"
          @update:search="onSearchChange"
          @update:grupo="handleGrupoChange"
          @update:seguimiento="onFilterChange({ seguimientoCodigo: $event })"
          @update:prioridad="onFilterChange({ prioridadCodigo: $event })"
          @update:fecha-desde="onFilterChange({ fechaDesde: $event })"
          @update:fecha-hasta="onFilterChange({ fechaHasta: $event })"
          @update:solo-bloqueadas="onFilterChange({ soloBloqueadas: $event })"
          @update:solo-creadas-por-mi="onFilterChange({ soloCreadasPorMi: $event })"
          @update:solo-diferencia-oc="onFilterChange({ soloDiferenciaOc: $event })"
          @create="void handleCreateDirect()"
          @view-drafts="void openDraftsOverlay()"
        />
      </div>

      <div
        v-if="loading && !initialized"
        class="space-y-3"
      >
        <div class="hidden md:block">
          <SolicitudesListSkeleton variant="desktop" :rows="5" />
        </div>

        <div class="md:hidden">
          <SolicitudesListSkeleton variant="mobile" :rows="4" />
        </div>
      </div>

      <SolicitudesListErrorState
        v-else-if="error"
        :message="error"
        @retry="onRetry"
      />

      <section
        v-else-if="configAvailable && visibleGroups.length === 0"
        class="rounded-2xl border border-dashed border-stone-300 bg-white/75 px-5 py-10 text-center shadow-sm"
      >
        <p class="text-sm font-medium text-stone-700">
          Usuario no tiene permitido ver solicitudes
        </p>
      </section>

      <SolicitudesListEmptyState
        v-else-if="items.length === 0"
        :search-active="searchActive"
        :suggest-date-range="baseEmpty"
      />

      <template v-else>
        <div
          v-if="uiMessage && !error"
          class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800"
        >
          {{ uiMessage }}
        </div>

        <div
          v-if="isListRefreshing"
          class="flex items-center justify-end"
        >
          <span class="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-600">
            {{ listRefreshingLabel }}
          </span>
        </div>

        <div class="hidden md:block">
          <SolicitudesDesktopTable
            :items="items"
            :role-codigo="roleCodigo"
            :loading="loading"
            :loading-more="loadingMore"
            @row-click="onRowClick"
          />
        </div>

        <SolicitudesMobileList
          class="md:hidden"
          :items="items"
          :role-codigo="roleCodigo"
          :loading="loading"
          :loading-more="loadingMore"
          @card-click="onCardClick"
        />

        <SolicitudesListLoadMoreTrigger
          :loading-more="loadingMore"
          :has-more="hasMore"
          @load-more="loadMore"
        />
      </template>
    </div>

    <SolicitudesCompraDraftsEntryModal
      v-if="showDraftsModal"
      :drafts="availableDrafts"
      @close="closeDraftsModal"
      @new="void handleCreateNewSolicitud()"
      @continue="void handleContinueDraft($event)"
    />

    <router-view v-slot="{ Component, route: childRoute }">
      <transition name="overlay-slide">
        <div
          v-if="Component"
          class="fixed inset-0 z-[70] overflow-y-auto bg-[#EEECE4]"
        >
          <component :is="Component" :key="childRoute.fullPath" />
        </div>
      </transition>

      <transition name="overlay-fade">
        <div
          v-if="!Component && (isTransitioningToCreate || isCreateOverlayOpen || isCheckingDrafts)"
          class="fixed inset-0 z-[65] flex items-center justify-center bg-[#EEECE4]/96 backdrop-blur-[1px]"
        >
          <div class="flex flex-col items-center gap-4 text-main">
            <div class="create-loader h-10 w-10 rounded-full border-4 border-main/15 border-t-main"></div>
            <p class="text-sm font-semibold tracking-wide uppercase">{{ createOverlayLabel }}</p>
          </div>
        </div>
      </transition>
    </router-view>
  </section>
</template>

<style scoped>
.overlay-slide-enter-active,
.overlay-slide-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.overlay-slide-enter-from,
.overlay-slide-leave-to {
  opacity: 0;
  transform: translateX(3rem);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.18s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.create-loader {
  animation: create-loader-spin 0.8s linear infinite;
}

@keyframes create-loader-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
