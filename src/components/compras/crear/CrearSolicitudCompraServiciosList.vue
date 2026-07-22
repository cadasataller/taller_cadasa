<script setup lang="ts">
import { SquarePen, Trash2 } from 'lucide-vue-next';

import type { ServicioSolicitudItem } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

defineProps<{
  servicios: ServicioSolicitudItem[];
}>();

const emit = defineEmits<{
  (e: 'edit', item: ServicioSolicitudItem): void;
  (e: 'remove', item: ServicioSolicitudItem): void;
}>();
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="item in servicios"
      :key="item.localId"
      class="rounded-lg border border-stone-200 bg-white px-3 py-3"
    >
      <div class="hidden grid-cols-[8rem_8rem_minmax(0,1fr)_5.5rem] items-center gap-4 text-center text-sm md:grid">
        <p class="break-words font-semibold text-stone-900">
          {{ item.cantidad }}
        </p>
        <p class="break-words pl-4 text-xs text-stone-500">
          {{ item.unidadLabel }}
        </p>
        <p class="break-words text-stone-700">
          {{ item.descripcion }}
        </p>
        <div class="flex justify-center gap-1">
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-main/25 text-main transition hover:bg-main/5"
            @click="emit('edit', item)"
          >
            <SquarePen class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:border-danger/40 hover:bg-danger-bg hover:text-danger"
            @click="emit('remove', item)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 md:hidden">
        <p class="min-w-0 flex-1 break-words text-sm text-stone-700">
          <span class="font-semibold text-stone-900">{{ item.cantidad }}</span>
          {{ ' ' }}·{{ ' ' }}
          <span class="text-xs text-stone-500">{{ item.unidadLabel }}</span>
          {{ ' ' }}·{{ ' ' }}{{ item.descripcion }}
        </p>

        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-main/25 text-main transition hover:bg-main/5"
            @click="emit('edit', item)"
          >
            <SquarePen class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:border-danger/40 hover:bg-danger-bg hover:text-danger"
            @click="emit('remove', item)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
