<script setup lang="ts">
import { Plus, TriangleAlert } from 'lucide-vue-next';
import { computed } from 'vue';
import { shallowRef } from 'vue';

import type {
  ServicioSolicitudItem,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

import CrearSolicitudCompraServiciosList from './CrearSolicitudCompraServiciosList.vue';

const props = defineProps<{
  servicios: ServicioSolicitudItem[];
  serviciosError?: string;
}>();

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'edit', item: ServicioSolicitudItem): void;
  (e: 'remove', localId: string): void;
}>();

const pendingDelete = shallowRef<ServicioSolicitudItem | null>(null);
const hasServicios = computed(() => props.servicios.length > 0);

const requestDelete = (item: ServicioSolicitudItem): void => {
  pendingDelete.value = item;
};

const confirmDelete = (): void => {
  if (!pendingDelete.value) {
    return;
  }

  emit('remove', pendingDelete.value.localId);
  pendingDelete.value = null;
};
</script>

<template>
  <section class="flex h-full flex-col rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm lg:px-4">
    <div class=" flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      

      <button
        type="button"
        class="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-main px-4 text-sm font-semibold text-white transition hover:bg-main-dark"
        @click="emit('add')"
      >
        <Plus class="h-4 w-4" />
        Agregar servicio
      </button>
    </div>

    <div class="mt-4 flex-1 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-4">
      <CrearSolicitudCompraServiciosList
        v-if="hasServicios"
        :servicios="servicios"
        @edit="emit('edit', $event)"
        @remove="requestDelete"
      />

      <div
        v-else
        class="flex min-h-32 items-center justify-center rounded-lg bg-stone-100 px-4 text-center text-sm text-stone-500"
      >
        No hay servicios agregados. Debe agregar al menos 1 servicio.
      </div>

      <p
        v-if="serviciosError"
        class="mt-3 text-sm font-medium text-danger"
      >
        {{ serviciosError }}
      </p>
    </div>

    <Teleport to="body">
      <div
        v-if="pendingDelete"
        class="fixed inset-0 z-[95] flex items-center justify-center bg-stone-950/30 px-4"
      >
        <div class="w-full max-w-md rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-2xl">
          <div class="flex items-start gap-3">
            <div class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
              <TriangleAlert class="h-5 w-5" />
            </div>

            <div class="min-w-0">
              <p class="text-base font-semibold text-stone-900">
                Eliminar servicio
              </p>
              <p class="mt-2 text-sm text-stone-600">
                Se eliminará el servicio
                <span class="font-semibold text-stone-900">
                  {{ pendingDelete.descripcion }}
                </span>.
              </p>
            </div>
          </div>

          <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              @click="pendingDelete = null"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center rounded-xl bg-danger px-4 text-sm font-semibold text-white transition hover:opacity-90"
              @click="confirmDelete"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
