<script setup lang="ts">
import { computed } from 'vue';

import type { SolicitudCompraFolioUi } from '@/stores/db_compras/solicitudes_compra/solicitudesCompra.types';

const props = withDefaults(defineProps<{
  folio: SolicitudCompraFolioUi;
  canSeeFolio?: boolean;
  canSeeOc?: boolean;
  compact?: boolean;
}>(), {
  canSeeFolio: true,
  canSeeOc: false,
  compact: false,
});

const displayFolio = computed(() => {
  if (!props.canSeeFolio) {
    return '';
  }

  const rawFolio = props.folio.folioSol?.trim();

  if (rawFolio) {
    return rawFolio.startsWith('#') ? rawFolio : `#${rawFolio}`;
  }

  const formattedFolio = props.folio.folioSolLabel?.trim();
  return formattedFolio || 'SIN NUM REQ';
});

const isMissingFolio = computed(() => displayFolio.value === 'SIN NUM REQ');

const displayOc = computed(() => {
  if (!props.canSeeOc) {
    return '';
  }

  const hasFolio = Boolean(props.folio.folioSol?.trim() || props.folio.folioSolLabel?.trim());

  if (!hasFolio) {
    return '';
  }

  return props.folio.folioOcPrincipal?.trim() || 'SIN OC';
});

const isMissingOc = computed(() => displayOc.value === 'SIN OC');
</script>

<template>
  <div class="flex min-h-full flex-col justify-center">
    <span
      class="font-semibold"
      :class="[
        isMissingFolio ? 'text-stone-400' : 'text-stone-900',
        compact ? 'text-xs' : 'text-[13px]',
      ]"
    >
      {{ displayFolio }}
    </span>

    <span
      v-if="displayOc"
      class="mt-1"
      :class="[
        isMissingOc ? 'text-stone-400' : 'text-stone-500',
        compact ? 'text-[10px]' : 'text-[11px]',
      ]"
    >
      {{ isMissingOc ? displayOc : `OC ${displayOc}` }}
    </span>
  </div>
</template>
