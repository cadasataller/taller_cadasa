<script setup lang="ts">
import { computed } from 'vue';

import type { SolicitudCompraEstadoUi } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = withDefaults(defineProps<{
  estado: SolicitudCompraEstadoUi;
  compact?: boolean;
}>(), {
  compact: false,
});

const label = computed(() =>  props.estado.nombre || props.estado.badgeLabel);

const badgeClass = computed(() => {
  switch (props.estado.codigo) {
    case 'aprobado_gerencia':
    case 'orden_compra':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'rechazado':
    case 'descartado_por_supervisor':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'en_revision_almacen':
    case 'en_revision_supervisor':
    case 'en_revision_gerencia':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    default:
      return 'border-teal-200 bg-teal-50 text-teal-700';
  }
});
</script>

<template>
  <span
    class="inline-flex  text-center items-center rounded-full border font-semibold"
    :class="[badgeClass, compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]']"
  >
    {{ label }}
  </span>
</template>
