<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue';
import { BadgeInfo, CalendarArrowDown, FileText, Hash, Megaphone, MessageSquareText, PackageCheck, Paperclip, Tractor } from 'lucide-vue-next';

import { formatAdjuntoSize, getAdjuntoExtension } from './crearSolicitudAdjuntos.utils';

import type {
  CrearSolicitudAdjuntoLocalItem,
  DestinoSeleccionado,
  ProductoSolicitudItem,
  ServicioSolicitudItem,
  SolicitudCompraTipoSolicitud,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
  fechaEntrega: string | null;
  destinos: DestinoSeleccionado[];
  productos: ProductoSolicitudItem[];
  servicios: ServicioSolicitudItem[];
  observacion: string;
  adjuntos: CrearSolicitudAdjuntoLocalItem[];
  solicitarUrgente: boolean;
  motivoUrgencia: string;
}>();

const emit = defineEmits<{
  (e: 'desktop-scroll-state-change', value: { hasOverflow: boolean; reachedBottom: boolean }): void;
}>();

const DESKTOP_BREAKPOINT = 1024;
const SCROLL_BOTTOM_TOLERANCE_PX = 2;

const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');
const hasReachedBottom = shallowRef(false);

const fechaEntregaFormateada = computed(() => {
  if (!props.fechaEntrega) {
    return 'Sin definir';
  }

  const [year, month, day] = props.fechaEntrega.split('-').map(Number);

  if (!year || !month || !day) {
    return props.fechaEntrega;
  }

  const fecha = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(fecha).replace('.', '').toLowerCase();
});

const isDesktopViewport = (): boolean => window.innerWidth >= DESKTOP_BREAKPOINT;

const emitDesktopScrollState = (): void => {
  const container = scrollContainer.value;

  if (!container || !isDesktopViewport()) {
    hasReachedBottom.value = false;
    emit('desktop-scroll-state-change', {
      hasOverflow: false,
      reachedBottom: false,
    });
    return;
  }

  const hasOverflow = container.scrollHeight > container.clientHeight;
  const reachedBottom = hasOverflow
    ? container.scrollTop + container.clientHeight >= container.scrollHeight - SCROLL_BOTTOM_TOLERANCE_PX
    : false;

  hasReachedBottom.value = reachedBottom;
  emit('desktop-scroll-state-change', {
    hasOverflow,
    reachedBottom,
  });
};

const syncDesktopScrollState = (): void => {
  void nextTick(() => {
    emitDesktopScrollState();
  });
};

const handleContainerScroll = (): void => {
  if (hasReachedBottom.value) {
    return;
  }

  emitDesktopScrollState();
};

onMounted(() => {
  syncDesktopScrollState();
  window.addEventListener('resize', syncDesktopScrollState);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncDesktopScrollState);
});

watch(
  () => [
    props.tipoSolicitud,
    props.fechaEntrega,
    props.destinos.length,
    props.productos.length,
    props.servicios.length,
    props.observacion,
    props.adjuntos.length,
    props.solicitarUrgente,
    props.motivoUrgencia,
  ],
  () => {
    syncDesktopScrollState();
  }
);
</script>

<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm lg:px-4">
    <div
      ref="scrollContainer"
      class="min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1"
      @scroll="handleContainerScroll"
    >
      <dl class="grid gap-3 lg:grid-cols-2">
      <div class="rounded-lg bg-stone-50 px-3 py-3 lg:col-span-2">
        <div
          class="grid gap-4"
          :class="
            solicitarUrgente
              ? 'lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,auto)] lg:items-center'
              : 'lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center'
          "
        >
          <div class="flex items-center gap-3">
            <Hash class="h-5 w-5 shrink-0 text-main-light" />
            <div class="min-w-0">
              <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Tipo de solicitud</dt>
              <dd class="mt-1 text-base font-medium text-stone-900">{{ tipoSolicitud ?? 'Sin definir' }}</dd>
            </div>
          </div>

          <div class="hidden lg:block" aria-hidden="true">
            <div class="flex h-8 items-center">
              <div class="h-[80%] w-px bg-stone-200" />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <CalendarArrowDown class="h-5 w-5 shrink-0 text-main-light" />
            <div class="min-w-0">
              <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500">Fecha de entrega</dt>
              <dd class="mt-1 text-base font-medium text-stone-900">{{ fechaEntregaFormateada }}</dd>
            </div>
          </div>

          <div v-if="solicitarUrgente" class="hidden lg:block" aria-hidden="true">
            <div class="flex h-8 items-center">
              <div class="h-[80%] w-px bg-stone-200" />
            </div>
          </div>

          <div
            v-if="solicitarUrgente"
            class="flex items-center gap-3"
          >
            <Megaphone class="h-5 w-5 shrink-0 text-danger" />
            <span class="text-sm font-semibold uppercase tracking-wide text-danger">Urgente</span>
          </div>
        </div>
      </div>
      <div class="overflow-hidden rounded-lg bg-stone-50 lg:col-span-2">
        <div class="flex items-center gap-3 bg-[#e7e4da] px-3 py-2">
          <Tractor class="h-5 w-5 shrink-0 text-main-light" />
          <div class="flex h-8 items-center" aria-hidden="true">
            <div class="h-[80%] w-px bg-stone-300" />
          </div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-stone-600">Destino</dt>
        </div>
        <dd class="flex flex-wrap gap-2 px-3 py-3">
          <template v-if="destinos.length > 0">
            <span
              v-for="item in destinos"
              :key="item.id"
              class="rounded-full bg-main/10 px-3 py-1 text-sm font-medium text-main"
            >
              {{ item.label }}
            </span>
          </template>
          <span v-else class="text-base font-medium text-stone-900">
            Sin destinos
          </span>
        </dd>
      </div>
      <div v-if="tipoSolicitud === 'servicio'" class="overflow-hidden rounded-lg bg-stone-50 lg:col-span-2">
        <div class="flex items-center gap-3 bg-[#e7e4da] px-3 py-2">
          <PackageCheck class="h-5 w-5 shrink-0 text-main-light" />
          <div class="flex h-8 items-center" aria-hidden="true">
            <div class="h-[80%] w-px bg-stone-300" />
          </div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-stone-600">Servicios seleccionados</dt>
        </div>
        <dd class="px-3 py-3">
          <div v-if="servicios.length > 0" class="divide-y divide-stone-200">
            <div class="hidden gap-3 pb-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Cantidad</p>
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Unidad</p>
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Descripcion</p>
            </div>
            <div
              v-for="item in servicios"
              :key="item.localId"
              class="py-3 first:pt-0 last:pb-0"
            >
              <div class="lg:hidden">
                <p class="whitespace-normal break-words text-sm font-medium text-stone-900">
                  <span>{{ item.cantidad }}</span>
                  <span class="px-1 text-stone-400">·</span>
                  <span>{{ item.unidadLabel }}</span>
                  <span class="px-1 text-stone-400">·</span>
                  <span>{{ item.descripcion }}</span>
                </p>
              </div>
              <div class="hidden gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
                <div class="min-w-0">
                  <p class="mt-1 text-sm font-medium text-stone-900">{{ item.cantidad }}</p>
                </div>
                <div class="min-w-0">
                  <p class="mt-1 text-sm font-medium text-stone-900">{{ item.unidadLabel }}</p>
                </div>
                <div class="min-w-0">
                  <p class="mt-1 whitespace-normal break-words text-sm font-medium text-stone-900">{{ item.descripcion }}</p>
                </div>
              </div>
            </div>
          </div>
          <span v-else class="text-base font-medium text-stone-900">Sin servicios</span>
        </dd>
      </div>
      <div v-else class="overflow-hidden rounded-lg bg-stone-50 lg:col-span-2">
        <div class="flex items-center gap-3 bg-[#e7e4da] px-3 py-2">
          <PackageCheck class="h-5 w-5 shrink-0 text-main-light" />
          <div class="flex h-8 items-center" aria-hidden="true">
            <div class="h-[80%] w-px bg-stone-300" />
          </div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-stone-600">Productos Seleccionados</dt>
        </div>
        <dd class="px-3 py-3">
          <div v-if="productos.length > 0" class="divide-y divide-stone-200">
            <div class="hidden gap-3 pb-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
              <div class="flex items-center gap-2">
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Cod Almacen</p>
              </div>
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Unidad</p>
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Nombre</p>
            </div>
            <div
              v-for="item in productos"
              :key="item.localId"
              class="py-3 first:pt-0 last:pb-0"
            >
              <div class="lg:hidden">
                <p class="whitespace-normal break-words text-sm font-medium text-stone-900">
                  <span>{{ item.tipo === 'existente' ? item.codProducto : 'MANUAL' }}</span>
                  <span class="px-1 text-stone-400">·</span>
                  <span>{{ item.unidadLabel }}</span>
                  <span class="px-1 text-stone-400">·</span>
                  <span>{{ item.nombre }}</span>
                </p>
              </div>
              <div class="hidden gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
                <div class="min-w-0">
                  <p class="mt-1 text-sm font-medium text-stone-900">
                    {{ item.tipo === 'existente' ? item.codProducto : 'MANUAL' }}
                  </p>
                </div>
                <div class="min-w-0">
                  <p class="mt-1 text-sm font-medium text-stone-900">{{ item.unidadLabel }}</p>
                </div>
                <div class="min-w-0">
                  <p class="mt-1 whitespace-normal break-words text-sm font-medium text-stone-900">{{ item.nombre }}</p>
                </div>
              </div>
            </div>
          </div>
          <span v-else class="text-base font-medium text-stone-900">Sin productos</span>
        </dd>
      </div>
      <div class="overflow-hidden rounded-lg bg-stone-50 lg:col-span-2">
        <div class="flex items-center gap-3 bg-[#e7e4da] px-3 py-2">
          <BadgeInfo class="h-5 w-5 shrink-0 text-main-light" />
          <div class="flex h-8 items-center" aria-hidden="true">
            <div class="h-[80%] w-px bg-stone-300" />
          </div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-stone-600">Informacion Adicional</dt>
        </div>
        <dd class="px-3 py-3">
          <div class="divide-y divide-stone-200">
            <div class="grid gap-3 py-3 first:pt-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
              <div class="flex min-w-0 items-center gap-3">
                <MessageSquareText class="mt-0.5 h-4 w-4 shrink-0 text-main-light" />
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Observacion</p>
              </div>
              <p class="whitespace-normal break-words text-sm font-medium text-stone-900">
                {{ observacion || 'Sin observación' }}
              </p>
            </div>
            <div class="grid gap-3 py-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
              <div class="flex min-w-0 items-center gap-3">
                <Megaphone class="mt-0.5 h-4 w-4 shrink-0 text-main-light" />
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Urgencia</p>
              </div>
              <p class="whitespace-normal break-words text-sm font-medium text-stone-900">
                {{ solicitarUrgente ? 'Sí' : 'No' }}
              </p>
            </div>
            <div class="grid gap-3 py-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
              <div class="flex min-w-0 items-center gap-3">
                <Paperclip class="mt-0.5 h-4 w-4 shrink-0 text-main-light" />
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Adjuntos</p>
              </div>
              <div class="space-y-2">
                <p class="text-sm font-medium text-stone-900">
                  {{ adjuntos.length > 0 ? `${adjuntos.length} archivo(s)` : 'Sin adjuntos' }}
                </p>
                <div
                  v-if="adjuntos.length > 0"
                  class="space-y-2"
                >
                  <div
                    v-for="item in adjuntos"
                    :key="item.localId"
                    class="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2"
                  >
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100">
                      <FileText class="h-4 w-4 text-stone-500" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-stone-900">
                        {{ item.displayName }}
                      </p>
                      <p class="text-xs text-stone-500">
                        {{ getAdjuntoExtension(item.displayName).toUpperCase() }} · {{ formatAdjuntoSize(item.file.size) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="solicitarUrgente"
              class="grid gap-3 py-3 last:pb-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start"
            >
              <div class="flex min-w-0 items-center gap-3">
                <Megaphone class="mt-0.5 h-4 w-4 shrink-0 text-main-light" />
                <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">Motivo</p>
              </div>
              <p class="whitespace-normal break-words text-sm font-medium text-stone-900">
                {{ motivoUrgencia || 'Sin motivo' }}
              </p>
            </div>
          </div>
        </dd>
      </div>
      </dl>
    </div>
  </section>
</template>
