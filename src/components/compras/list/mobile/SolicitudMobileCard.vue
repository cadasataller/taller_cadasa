<script setup lang="ts">
import { computed } from 'vue';

import { getSolicitudListRoleConfig } from '@/components/compras/list/solicitudListRoleConfig';
import SolicitudAreaCell from '@/components/compras/list/cells/SolicitudAreaCell.vue';
import SolicitudBloqueadoCell from '@/components/compras/list/cells/SolicitudBloqueadoCell.vue';
import SolicitudEquiposCell from '@/components/compras/list/cells/SolicitudEquiposCell.vue';
import SolicitudEstadoBadge from '@/components/compras/list/cells/SolicitudEstadoBadge.vue';
import SolicitudFechaEntregaCell from '@/components/compras/list/cells/SolicitudFechaEntregaCell.vue';
import SolicitudIndicadoresCell from '@/components/compras/list/cells/SolicitudIndicadoresCell.vue';
import SolicitudPrioridadBadge from '@/components/compras/list/cells/SolicitudPrioridadBadge.vue';
import SolicitudSolicitanteCell from '@/components/compras/list/cells/SolicitudSolicitanteCell.vue';
import type {
  SolicitudCompraAreaUi,
  SolicitudCompraIndicadores,
  SolicitudCompraListItem,
  SolicitudCompraRoleCodigo,
  SolicitudCompraSolicitanteUi,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = defineProps<{
  item: SolicitudCompraListItem;
  roleCodigo: SolicitudCompraRoleCodigo;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const roleConfig = computed(() => getSolicitudListRoleConfig(props.roleCodigo));

const displayFolio = computed(() => {
  if (!roleConfig.value.canSeeFolio) {
    return '';
  }

  const rawFolio = props.item.folio.folioSol?.trim();

  if (rawFolio) {
    return rawFolio.startsWith('#') ? rawFolio : `#${rawFolio}`;
  }

  const label = props.item.folio.folioSolLabel?.trim();

  return label && label.length > 0 ? label : 'SIN NUM REQ';
});

const displayOc = computed(() => {
  if (!roleConfig.value.canSeeFolioOc) {
    return '';
  }

  const hasFolio = Boolean(
    props.item.folio.folioSol?.trim() || props.item.folio.folioSolLabel?.trim()
  );

  if (!hasFolio) {
    return '';
  }

  return props.item.folio.folioOcPrincipal?.trim() || 'SIN OC';
});

const isMissingFolio = computed(() => displayFolio.value === 'SIN NUM REQ');
const isMissingOc = computed(() => displayOc.value === 'SIN OC');

const displayObservacion = computed(() => {
  const observacion = props.item.observacion?.trim();

  return observacion && observacion.length > 0
    ? observacion
    : 'Sin observación registrada.';
});

const sanitizedArea = computed<SolicitudCompraAreaUi | null>(() => {
  if (!roleConfig.value.canSeeArea) {
    return null;
  }

  const nombre = props.item.area.nombre?.trim();
  const codigo = props.item.area.codigo?.trim();

  if (!nombre && !codigo) {
    return null;
  }

  return {
    codigo: codigo || null,
    nombre: nombre || null,
  };
});

const sanitizedSolicitante = computed<SolicitudCompraSolicitanteUi | null>(() => {
  if (!roleConfig.value.canSeeSolicitante) {
    return null;
  }

  const nombre = props.item.solicitante.nombre?.trim();

  if (!nombre) {
    return null;
  }

  return { nombre };
});

const hasFechaEntrega = computed(
  () => roleConfig.value.canSeeFechaEntrega && Boolean(props.item.fechaEntrega.fecha)
);

const hasDestinos = computed(() => {
  if (!roleConfig.value.canSeeDestinos) {
    return false;
  }

  return props.item.destinos.loading
    || props.item.destinos.items.length > 0
    || Boolean(props.item.destinos.error);
});

const visibleIndicadores = computed<SolicitudCompraIndicadores>(() => ({
  bloqueado: {
    ...props.item.indicadores.bloqueado,
    visible: roleConfig.value.canSeeBloqueado && props.item.indicadores.bloqueado.visible,
  },
  adjuntos: {
    ...props.item.indicadores.adjuntos,
    visible: roleConfig.value.canSeeAdjuntos
      && props.item.indicadores.adjuntos.visible
      && props.item.indicadores.adjuntos.cantidad > 0,
  },
  diferenciaOc: {
    ...props.item.indicadores.diferenciaOc,
    visible: roleConfig.value.canSeeDiferenciaOc
      && props.item.indicadores.diferenciaOc.visible
      && props.item.indicadores.diferenciaOc.cantidad > 0,
  },
}));

const hasIndicadores = computed(() => {
  const indicadores = visibleIndicadores.value;

  return indicadores.bloqueado.visible
    || indicadores.adjuntos.visible
    || indicadores.diferenciaOc.visible;
});

const isAlmacen = computed(() => props.roleCodigo === 'almacen');
const isSecretaria = computed(() => props.roleCodigo === 'secretaria');
const isOperacionFamily = computed(
  () => !isAlmacen.value && !isSecretaria.value
);

const onClick = (): void => {
  emit('click');
};
</script>

<template>
  <button
    type="button"
    class="w-full rounded-[1.35rem] border border-stone-200 bg-white p-4 text-left shadow-[0_10px_30px_rgba(41,37,36,0.08)] transition hover:border-stone-300 hover:shadow-[0_14px_34px_rgba(41,37,36,0.12)]"
    @click="onClick"
  >
    <div v-if="isOperacionFamily" class="flex items-start justify-between gap-3">
      <div v-if="displayFolio || displayOc" class="min-w-0">
        <p
          v-if="displayFolio"
          class="truncate text-base font-semibold tracking-[-0.02em]"
          :class="isMissingFolio ? 'text-stone-400' : 'text-stone-900'"
        >
          {{ displayFolio }}
        </p>
        <p
          v-if="displayOc"
          class="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.12em]"
          :class="isMissingOc ? 'text-stone-400' : 'text-stone-500'"
        >
          {{ isMissingOc ? displayOc : `OC ${displayOc}` }}
        </p>
      </div>

      <SolicitudEstadoBadge :estado="props.item.estado" compact />
    </div>

    <div v-else-if="isSecretaria" class="flex items-start justify-between gap-3">
      <p
        v-if="displayFolio"
        class="min-w-0 truncate text-base font-semibold tracking-[-0.02em]"
        :class="isMissingFolio ? 'text-stone-400' : 'text-stone-900'"
      >
        {{ displayFolio }}
      </p>

      <SolicitudEstadoBadge :estado="props.item.estado" compact />
    </div>

    <div v-else class="flex items-start justify-between gap-3">
      <SolicitudEstadoBadge :estado="props.item.estado" compact />

      <SolicitudBloqueadoCell
        v-if="visibleIndicadores.bloqueado.visible"
        :bloqueado="visibleIndicadores.bloqueado"
        compact
      />
    </div>

    <p class="mt-3 line-clamp-3 text-sm leading-5 text-stone-800">
      {{ displayObservacion }}
    </p>

    <div
      v-if="isOperacionFamily && (sanitizedArea || sanitizedSolicitante)"
      class="mt-3 flex flex-wrap gap-2"
    >
      <div
        v-if="sanitizedArea"
        class="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1"
      >
        <SolicitudAreaCell :area="sanitizedArea" compact />
      </div>

      <div
        v-if="sanitizedSolicitante"
        class="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1"
      >
        <SolicitudSolicitanteCell :solicitante="sanitizedSolicitante" compact />
      </div>
    </div>

    <div v-if="isSecretaria && sanitizedArea" class="mt-3">
      <div class="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
        <SolicitudAreaCell :area="sanitizedArea" compact />
      </div>
    </div>

    <div v-if="isSecretaria && sanitizedSolicitante" class="mt-2">
      <div class="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
        <SolicitudSolicitanteCell :solicitante="sanitizedSolicitante" compact />
      </div>
    </div>

    <div
      v-if="isOperacionFamily && (hasDestinos || hasFechaEntrega)"
      class="mt-3 flex flex-wrap gap-2"
    >
      <div v-if="hasFechaEntrega" class="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
        <SolicitudFechaEntregaCell :fecha-entrega="props.item.fechaEntrega" compact :show-label="false" />
      </div>

      <div v-if="hasDestinos" class="rounded-2xl border border-stone-200 bg-stone-50 px-2.5 py-1">
        <SolicitudEquiposCell :destinos="props.item.destinos" compact />
      </div>
    </div>

    <div
      v-if="isOperacionFamily"
      class="mt-3 flex flex-wrap items-start gap-2"
    >
      <SolicitudPrioridadBadge :prioridad="props.item.prioridad" compact />

      <div v-if="hasIndicadores" class="min-w-0">
        <SolicitudIndicadoresCell
          :indicadores="visibleIndicadores"
          :role-config="roleConfig"
          compact
        />
      </div>
    </div>

    <div v-else-if="isSecretaria" class="mt-3 flex flex-wrap items-start gap-2">
      <SolicitudPrioridadBadge :prioridad="props.item.prioridad" compact />

      <div v-if="hasFechaEntrega" class="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
        <SolicitudFechaEntregaCell :fecha-entrega="props.item.fechaEntrega" compact :show-label="false" />
      </div>

      <SolicitudBloqueadoCell
        v-if="visibleIndicadores.bloqueado.visible"
        :bloqueado="visibleIndicadores.bloqueado"
        compact
      />
    </div>

    <div v-else class="mt-3 flex flex-wrap items-start gap-2">
      <div v-if="sanitizedArea" class="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
        <SolicitudAreaCell :area="sanitizedArea" compact />
      </div>

      <SolicitudPrioridadBadge :prioridad="props.item.prioridad" compact />
    </div>
  </button>
</template>
