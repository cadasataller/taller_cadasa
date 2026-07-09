<script setup lang="ts">
import { computed } from 'vue';

import type { SolicitudCompraSeguimientoUi } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';
import { formatLongSpanishDate } from '@/utils/formatterDateHelper';

const props = withDefaults(defineProps<{
  seguimiento: SolicitudCompraSeguimientoUi;
  compact?: boolean;
}>(), {
  compact: false,
});

const label = computed(() => props.seguimiento.label);
const dateLabel = computed(() => {
  const formattedDate = formatLongSpanishDate(props.seguimiento.fecha);
  const parts = [
    props.seguimiento.fechaLabel,
    formattedDate || props.seguimiento.fecha,
  ].filter((item): item is string => Boolean(item));

  return parts.length > 0 ? parts.join(': ') : null;
});

const badgeClass = computed(() => {
  switch (props.seguimiento.codigo) {
    case 'oc_recibido_completo_almacen':
    case 'completado':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'rechazado':
    case 'descartado_por_supervisor':
    case 'cancelado':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'en_revision_almacen':
    case 'en_revision_supervisor':
    case 'en_revision_gerencia':
    case 'accion_rol':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    default:
      return 'border-teal-200 bg-teal-50 text-teal-700';
  }
});
</script>

<template>
  <span
    class="inline-flex max-w-full flex-col items-center rounded-full border text-center font-semibold leading-tight"
    :class="[badgeClass, compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]']"
  >
    <span class="max-w-full truncate">{{ label }}</span>
    <span
      v-if="dateLabel"
      class="mt-0.5 max-w-full truncate text-[0.9em] font-medium opacity-75"
    >
      {{ dateLabel }}
    </span>
  </span>
</template>
