<script setup lang="ts">
import { computed } from 'vue';

import {
  canShowSolicitudListField,
  getSolicitudDesktopColumnsByRole,
} from '@/components/compras/list/solicitudListRoleConfig';
import type {
  SolicitudCompraAreaUi,
  SolicitudCompraColumnKey,
  SolicitudCompraFolioUi,
  SolicitudCompraIndicadores,
  SolicitudCompraListItem,
  SolicitudCompraRoleCodigo,
  SolicitudCompraSolicitanteUi,
} from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';
import SolicitudAreaCell from '@/components/compras/list/cells/SolicitudAreaCell.vue';
import SolicitudBloqueadoCell from '@/components/compras/list/cells/SolicitudBloqueadoCell.vue';
import SolicitudEquiposCell from '@/components/compras/list/cells/SolicitudEquiposCell.vue';
import SolicitudEstadoBadge from '@/components/compras/list/cells/SolicitudEstadoBadge.vue';
import SolicitudFechaEntregaCell from '@/components/compras/list/cells/SolicitudFechaEntregaCell.vue';
import SolicitudFolioCell from '@/components/compras/list/cells/SolicitudFolioCell.vue';
import SolicitudIndicadoresCell from '@/components/compras/list/cells/SolicitudIndicadoresCell.vue';
import SolicitudObservacionCell from '@/components/compras/list/cells/SolicitudObservacionCell.vue';
import SolicitudPrioridadBadge from '@/components/compras/list/cells/SolicitudPrioridadBadge.vue';
import SolicitudSolicitanteCell from '@/components/compras/list/cells/SolicitudSolicitanteCell.vue';

const props = defineProps<{
  items: SolicitudCompraListItem[];
  roleCodigo: SolicitudCompraRoleCodigo;
  loading: boolean;
  loadingMore: boolean;
}>();

const emit = defineEmits<{
  (e: 'row-click', item: SolicitudCompraListItem): void;
}>();

const columnLabels: Record<SolicitudCompraColumnKey, string> = {
  folio: 'Folio',
  observacion: 'Observación',
  estado: 'Estado',
  prioridad: 'Prioridad',
  destinos: 'Destino',
  area: 'Área',
  solicitante: 'Solicitante',
  fechaEntrega: 'Fecha Entrega',
  indicadores: 'Indicadores',
  bloqueado: 'Bloqueado',
};

const columns = computed(() => getSolicitudDesktopColumnsByRole(props.roleCodigo));
const roleVisibility = computed(() => ({
  canSeeFolio: canShowSolicitudListField(props.roleCodigo, 'canSeeFolio'),
  canSeeFolioOc: canShowSolicitudListField(props.roleCodigo, 'canSeeFolioOc'),
  canSeeArea: canShowSolicitudListField(props.roleCodigo, 'canSeeArea'),
  canSeeSolicitante: canShowSolicitudListField(props.roleCodigo, 'canSeeSolicitante'),
  canSeeAdjuntos: canShowSolicitudListField(props.roleCodigo, 'canSeeAdjuntos'),
  canSeeDiferenciaOc: canShowSolicitudListField(props.roleCodigo, 'canSeeDiferenciaOc'),
  canSeeBloqueado: canShowSolicitudListField(props.roleCodigo, 'canSeeBloqueado'),
}));

const tableGridClass = computed(() => {
  const widthMap: Record<SolicitudCompraColumnKey, string> = {
    folio: 'minmax(10rem,1fr)',
    observacion: 'minmax(20rem,2.3fr)',
    estado: 'minmax(8rem,0.9fr)',
    prioridad: 'minmax(7rem,0.8fr)',
    destinos: 'minmax(10rem,1fr)',
    area: 'minmax(9rem,0.95fr)',
    solicitante: 'minmax(9rem,0.95fr)',
    fechaEntrega: 'minmax(9rem,0.9fr)',
    indicadores: 'minmax(10rem,1fr)',
    bloqueado: 'minmax(7rem,0.8fr)',
  };

  return {
    gridTemplateColumns: columns.value.map((column) => widthMap[column]).join(' '),
  };
});

const getColumnCellClass = (column: SolicitudCompraColumnKey): string => {
  if (column === 'observacion') {
    return 'min-w-0';
  }

  return 'min-w-0';
};

const getSanitizedFolio = (item: SolicitudCompraListItem): SolicitudCompraFolioUi => {
  const folioValue = roleVisibility.value.canSeeFolio
    ? item.folio.folioSol?.trim() || item.folio.folioSolLabel?.trim() || null
    : '—';

  return {
    ...item.folio,
    folioSol: folioValue,
    folioSolLabel: folioValue,
    folioOcPrincipal: roleVisibility.value.canSeeFolioOc ? item.folio.folioOcPrincipal : null,
  };
};

const getSanitizedObservacion = (item: SolicitudCompraListItem): string => {
  const normalizedValue = item.observacion?.trim();

  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : '—';
};

const getSanitizedArea = (item: SolicitudCompraListItem): SolicitudCompraAreaUi => {
  if (!roleVisibility.value.canSeeArea) {
    return { codigo: null, nombre: '—' };
  }

  const normalizedName = item.area.nombre?.trim();

  return {
    codigo: null,
    nombre: normalizedName && normalizedName.length > 0 ? normalizedName : '—',
  };
};

const getSanitizedSolicitante = (item: SolicitudCompraListItem): SolicitudCompraSolicitanteUi => {
  if (!roleVisibility.value.canSeeSolicitante) {
    return { nombre: '—' };
  }

  const normalizedName = item.solicitante.nombre?.trim();

  return {
    nombre: normalizedName && normalizedName.length > 0 ? normalizedName : '—',
  };
};

const getVisibleIndicadores = (item: SolicitudCompraListItem): SolicitudCompraIndicadores => ({
  bloqueado: {
    ...item.indicadores.bloqueado,
    visible: roleVisibility.value.canSeeBloqueado && item.indicadores.bloqueado.visible,
  },
  adjuntos: {
    ...item.indicadores.adjuntos,
    visible: roleVisibility.value.canSeeAdjuntos
      && item.indicadores.adjuntos.visible
      && item.indicadores.adjuntos.cantidad > 0,
  },
  diferenciaOc: {
    ...item.indicadores.diferenciaOc,
    visible: roleVisibility.value.canSeeDiferenciaOc
      && item.indicadores.diferenciaOc.visible
      && item.indicadores.diferenciaOc.cantidad > 0,
  },
});

const hasVisibleIndicadores = (item: SolicitudCompraListItem): boolean => {
  const indicadores = getVisibleIndicadores(item);

  return indicadores.bloqueado.visible
    || indicadores.adjuntos.visible
    || indicadores.diferenciaOc.visible;
};

const onRowClick = (item: SolicitudCompraListItem): void => {
  emit('row-click', item);
};
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm">
    <div
      class="grid gap-2 border-b border-stone-200 bg-stone-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500"
      :style="tableGridClass"
    >
      <div
        v-for="column in columns"
        :key="`header-${column}`"
        class="min-w-0"
      >
        {{ columnLabels[column] }}
      </div>
    </div>

    <div v-if="loading && items.length === 0" class="px-4 py-10 text-center text-sm text-stone-500">
      Cargando solicitudes...
    </div>

    <div v-else-if="items.length === 0" class="px-4 py-10 text-center text-sm text-stone-500">
      No hay solicitudes para mostrar.
    </div>

    <div v-else>
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="grid min-h-[76px] w-full gap-2 border-b border-stone-100 px-3 py-2 text-left transition hover:bg-stone-50 last:border-b-0"
        :style="tableGridClass"
        @click="onRowClick(item)"
      >
        <div
          v-for="column in columns"
          :key="`${item.id}-${column}`"
          :class="getColumnCellClass(column)"
        >
          <template v-if="column === 'folio'">
            <SolicitudFolioCell
              :folio="getSanitizedFolio(item)"
              :can-see-folio="roleVisibility.canSeeFolio"
              :can-see-oc="roleVisibility.canSeeFolioOc"
              compact
            />
          </template>

          <template v-else-if="column === 'observacion'">
            <SolicitudObservacionCell :observacion="getSanitizedObservacion(item)" compact />
          </template>

          <template v-else-if="column === 'estado'">
            <div class="flex min-h-full items-center justify-center">
              <SolicitudEstadoBadge :estado="item.estado" compact />
            </div>
          </template>

          <template v-else-if="column === 'prioridad'">
            <div class="flex min-h-full items-center">
              <SolicitudPrioridadBadge :prioridad="item.prioridad" compact />
            </div>
          </template>

          <template v-else-if="column === 'destinos'">
            <SolicitudEquiposCell :destinos="item.destinos" compact />
          </template>

          <template v-else-if="column === 'area'">
            <SolicitudAreaCell :area="getSanitizedArea(item)" compact />
          </template>

          <template v-else-if="column === 'solicitante'">
            <SolicitudSolicitanteCell :solicitante="getSanitizedSolicitante(item)" compact />
          </template>

          <template v-else-if="column === 'fechaEntrega'">
            <SolicitudFechaEntregaCell :fecha-entrega="item.fechaEntrega" compact />
          </template>

          <template v-else-if="column === 'indicadores'">
            <div class="flex min-h-full items-center">
              <SolicitudIndicadoresCell
                :indicadores="getVisibleIndicadores(item)"
                :role-config="roleVisibility"
                compact
              />
              <span
                v-if="!hasVisibleIndicadores(item)"
                class="text-[11px] text-stone-400"
              >
                —
              </span>
            </div>
          </template>

          <template v-else-if="column === 'bloqueado'">
            <div class="flex min-h-full items-center">
              <SolicitudBloqueadoCell
                v-if="getVisibleIndicadores(item).bloqueado.visible"
                :bloqueado="getVisibleIndicadores(item).bloqueado"
                compact
              />
              <span v-else class="text-[11px] text-stone-400">
                —
              </span>
            </div>
          </template>
        </div>
      </button>

      <div
        v-if="loadingMore"
        class="border-t border-stone-100 px-4 py-3 text-center text-[12px] text-stone-500"
      >
        Cargando más solicitudes...
      </div>
    </div>
  </section>
</template>
