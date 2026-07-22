<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';

import type { ServicioSolicitudDraft } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

import CrearSolicitudCompraServicioForm from './CrearSolicitudCompraServicioForm.vue';

defineProps<{
  mode: 'create' | 'edit';
  initialDraft: ServicioSolicitudDraft;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submit', value: ServicioSolicitudDraft): void;
}>();

const blockEscapeClose = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
};

onMounted(() => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', blockEscapeClose, true);
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', blockEscapeClose, true);
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[90] bg-[#EEECE4]/45 backdrop-blur-[3px]">
      <div class="flex h-full w-full items-end">
        <div class="flex max-h-[92vh] w-full flex-col overflow-visible rounded-t-[2rem] border border-b-0 border-stone-200 bg-white shadow-2xl">
          <CrearSolicitudCompraServicioForm
            :mode="mode"
            :initial-draft="initialDraft"
            @cancel="emit('cancel')"
            @submit="emit('submit', $event)"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>
