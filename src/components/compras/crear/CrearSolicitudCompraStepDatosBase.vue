<script setup lang="ts">
import { computed } from 'vue';

import { useCatalogoContextoDestinoOptions } from '@/composables/compras/useCatalogoContextoDestinoOptions';
import { useCalendarioFeriadosStore } from '@/stores/db_compras/calendario_feriados/calendarioFeriados.store';
import type { CatalogoContextoDestinoOption } from '@/stores/db_compras/catalogo_contexto_destino/catalogoContextoDestino.types';
import {
  isAllowedDeliveryDateInNormalMode,
  parseIsoDate,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/fechaEntregaRules';

import CrearSolicitudContextosServicioSelector from './CrearSolicitudContextosServicioSelector.vue';
import CrearSolicitudFechaField from './CrearSolicitudFechaField.vue';
import CrearSolicitudTipoField from './CrearSolicitudTipoField.vue';
import type { EquipoOption } from '@/stores/dbequipos/equipos/equipos.types';
import type {
  CrearSolicitudFieldErrors,
  DestinoSeleccionado,
  SolicitudCompraTipoSolicitud,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
  fechaEntrega: string | null;
  fechaEntregaRequiresReview: boolean;
  fechaEntregaMinima: string | null;
  isZafraActiva: boolean;
  destinos: DestinoSeleccionado[];
  validationErrors: CrearSolicitudFieldErrors;
  searchResults: EquipoOption[];
  isSearching: boolean;
  searchError: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:tipoSolicitud', value: SolicitudCompraTipoSolicitud | null): void;
  (e: 'update:fechaEntrega', value: string | null): void;
  (e: 'search:equipos', value: string): void;
  (e: 'add:equipo', item: EquipoOption): void;
  (e: 'remove:destino', payload: { codigo: string; tipoOrigen?: string }): void;
  (e: 'add:destino-contexto', item: CatalogoContextoDestinoOption): void;
}>();

const emitTipoSolicitud = (
  value: SolicitudCompraTipoSolicitud | null | undefined
): void => {
  emit('update:tipoSolicitud', value ?? null);
};

const emitFechaEntrega = (value: string | null | undefined): void => {
  emit('update:fechaEntrega', value ?? null);
};

const {
  options: serviceContextOptions,
  loading: serviceContextLoading,
  error: serviceContextError,
} = useCatalogoContextoDestinoOptions(computed(() => props.tipoSolicitud));
const calendarioFeriadosStore = useCalendarioFeriadosStore();

const minimumDate = computed(() => parseIsoDate(props.fechaEntregaMinima));
const disabledDate = (date: Date): boolean => {
  if (props.isZafraActiva) {
    return false;
  }

  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  if (minimumDate.value && normalized < minimumDate.value) {
    return true;
  }

  return !isAllowedDeliveryDateInNormalMode(normalized, calendarioFeriadosStore.holidaysByYear).isValid;
};
</script>

<template>
  <section class="flex h-full min-h-0 flex-col overflow-y-auto rounded-lg border border-stone-200 bg-white px-3 py-1 shadow-sm lg:overflow-hidden lg:px-4">
    <div class="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <div class="grid gap-4 lg:grid-cols-2">
        <CrearSolicitudTipoField
          :model-value="tipoSolicitud"
          :error="validationErrors.tipoSolicitud"
          @update:model-value="emitTipoSolicitud"
        />

        <CrearSolicitudFechaField
          :model-value="fechaEntrega"
          :error="validationErrors.fechaEntrega"
          :show-review-warning="fechaEntregaRequiresReview"
          :min-date="minimumDate"
          :is-zafra-activa="isZafraActiva"
          :disabled-date="disabledDate"
          @update:model-value="emitFechaEntrega"
        />
      </div>

      <CrearSolicitudContextosServicioSelector
        class="min-h-0 flex-1"
        :selected-items="destinos"
        :context-options="serviceContextOptions"
        :equipment-search-results="searchResults"
        :is-loading="serviceContextLoading"
        :is-searching-equipment="isSearching"
        :load-error="serviceContextError"
        :search-error="searchError"
        :field-error="validationErrors.destinos"
        @search:equipos="emit('search:equipos', $event)"
        @add:equipo="emit('add:equipo', $event)"
        @add="emit('add:destino-contexto', $event)"
        @remove="emit('remove:destino', $event)"
      />
    </div>
  </section>
</template>
