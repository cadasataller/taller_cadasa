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
import { Megaphone, MessageSquareText, Paperclip } from 'lucide-vue-next';

import CrearSolicitudCompraAdjuntosSection from './CrearSolicitudCompraAdjuntosSection.vue';
import CrearSolicitudObservacionChip from './CrearSolicitudObservacionChip.vue';
import type {
  CrearSolicitudAdjuntoDraftInput,
  CrearSolicitudAdjuntoLocalItem,
  CrearSolicitudAdjuntoValidationIssue,
  DestinoSeleccionado,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

interface EquipoObservacionChip {
  codigo: string;
  present: boolean;
}

interface DesktopScrollState {
  hasOverflow: boolean;
  reachedBottom: boolean;
}

const DESKTOP_BREAKPOINT = 1024;
const SCROLL_BOTTOM_TOLERANCE_PX = 2;

const props = defineProps<{
  observacion: string;
  solicitarUrgente: boolean;
  motivoUrgencia: string;
  destinos: DestinoSeleccionado[];
  adjuntos: CrearSolicitudAdjuntoLocalItem[];
  observacionError?: string;
  adjuntosError?: string;
  adjuntosErroresRecientes: CrearSolicitudAdjuntoValidationIssue[];
  motivoUrgenciaError?: string;
}>();

const emit = defineEmits<{
  (e: 'update:observacion', value: string): void;
  (e: 'update:solicitarUrgente', value: boolean): void;
  (e: 'update:motivoUrgencia', value: string): void;
  (e: 'add:adjuntos', value: CrearSolicitudAdjuntoDraftInput[]): void;
  (e: 'remove:adjunto', value: string): void;
  (e: 'clear:adjuntos-errors'): void;
  (e: 'desktop-scroll-state-change', value: DesktopScrollState): void;
}>();

const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');
const urgentSection = useTemplateRef<HTMLElement>('urgentSection');
const hasReachedBottom = shallowRef(false);

const equipmentChips = computed<EquipoObservacionChip[]>(() => props.destinos
  .filter((item) => item.tipoOrigen === 'equipo')
  .map((item) => ({
    codigo: item.codigo,
    present: props.observacion.includes(item.codigo),
  })));

const serviceContextChips = computed(() => props.destinos
  .filter((item) => item.tipoOrigen !== 'equipo')
  .map((item) => ({
    codigo: item.codigo,
    nombre: item.label,
  })));

const handleObservacionInput = (event: Event): void => {
  const textarea = event.target as HTMLTextAreaElement;
  emit('update:observacion', textarea.value.toUpperCase());
};

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

const revealUrgentSection = (): void => {
  const container = scrollContainer.value;
  const section = urgentSection.value;

  if (!container || !section || !isDesktopViewport()) {
    return;
  }

  const sectionTop = section.offsetTop;
  const sectionBottom = sectionTop + section.offsetHeight;
  const visibleTop = container.scrollTop;
  const visibleBottom = visibleTop + container.clientHeight;

  if (sectionTop >= visibleTop && sectionBottom <= visibleBottom) {
    return;
  }

  container.scrollTo({
    top: Math.max(sectionBottom - container.clientHeight, 0),
    behavior: 'smooth',
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
    props.destinos.length,
    props.adjuntos.length,
    props.adjuntosErroresRecientes.length,
    props.solicitarUrgente,
    props.observacionError,
    props.adjuntosError,
    props.motivoUrgenciaError,
  ],
  () => {
    syncDesktopScrollState();
  }
);

watch(
  () => props.solicitarUrgente,
  (isUrgent, wasUrgent) => {
    if (!isUrgent || wasUrgent) {
      return;
    }

    void nextTick(() => {
      revealUrgentSection();
      emitDesktopScrollState();
    });
  }
);
</script>

<template>
  <section class="flex h-full min-h-0 flex-col rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm lg:px-4">
    <div
      ref="scrollContainer"
      class="space-y-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
      @scroll="handleContainerScroll"
    >
      <div class="space-y-1 rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-4">
        <label class="flex items-center gap-2 text-sm font-semibold text-stone-800">
          <MessageSquareText class="h-4 w-4 text-main-light" />
          <span>Observación <span class="text-danger">*</span></span>
        </label>

        <div
          v-if="equipmentChips.length > 0 || serviceContextChips.length > 0"
          class=" px-1 py-1"
        >
          <div class="flex flex-wrap gap-2">
            <CrearSolicitudObservacionChip
              v-for="chip in equipmentChips"
              :key="chip.codigo"
              :label="chip.codigo"
              :tone="chip.present ? 'success' : 'danger'"
            />
            <CrearSolicitudObservacionChip
              v-for="chip in serviceContextChips"
              :key="chip.codigo"
              :label="chip.nombre"
              tone="muted"
            />
          </div>
        </div>

        <textarea
          :value="observacion"
          rows="3"
          class="w-full rounded-xl border px-3 py-2 text-sm text-stone-900 outline-none"
          :class="observacionError ? 'border-danger bg-danger-bg/30' : 'border-stone-300'"
          placeholder="Describe el contexto de la solicitud"
          @input="handleObservacionInput"
        />

        <p
          v-if="observacionError"
          class="text-sm font-medium text-danger"
        >
          {{ observacionError }}
        </p>
      </div>

      <div class="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-4">
        <div class="flex items-center gap-2 text-sm font-semibold text-stone-800">
          <Paperclip class="h-4 w-4 text-main-light" />
          <span>Adjuntos</span>
        </div>

        <CrearSolicitudCompraAdjuntosSection
          :adjuntos="adjuntos"
          :adjuntos-error="adjuntosError"
          :adjuntos-errores-recientes="adjuntosErroresRecientes"
          @add:adjuntos="emit('add:adjuntos', $event)"
          @remove:adjunto="emit('remove:adjunto', $event)"
          @clear:adjuntos-errors="emit('clear:adjuntos-errors')"
        />
      </div>

      <div class="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/70 px-2 py-1">
        <label class="flex items-center justify-between gap-4  py-3">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full  text-main-light ">
              <Megaphone class="h-4 w-4" />
            </div>
            <div>
              <p class="font-semibold text-stone-800">
                Solicitar prioridad urgente
              </p>
              <p class="text-sm text-stone-500">
                La urgencia solo aplica cuando se envía la solicitud.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            :aria-checked="solicitarUrgente"
            class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-main/30"
            :class="solicitarUrgente
              ? 'border-main bg-main'
              : 'border-stone-300 bg-stone-200'"
            @click="$emit('update:solicitarUrgente', !solicitarUrgente)"
          >
            <span
              class="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition"
              :class="solicitarUrgente ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </label>

        <div
          v-if="solicitarUrgente"
          ref="urgentSection"
          class="space-y-2"
        >
          <p class="rounded-xl border border-warning/30 bg-warning-bg px-3 py-2 text-xs text-warning lg:text-sm">
            La solicitud se creará con prioridad normal. La urgencia quedará pendiente de aprobación de administrador solo al enviar.
          </p>

          <label class="block text-sm font-semibold text-stone-800">
            Motivo de urgencia
          </label>
          <textarea
            :value="motivoUrgencia"
            rows="3"
            class="w-full rounded-xl border px-3 py-2 text-sm text-stone-900 outline-none"
            :class="motivoUrgenciaError ? 'border-danger bg-danger-bg/30' : 'border-stone-300 bg-white'"
            placeholder="Describe el riesgo operativo o la razón de urgencia"
            @input="$emit('update:motivoUrgencia', ($event.target as HTMLTextAreaElement).value)"
          />
          <p
            v-if="motivoUrgenciaError"
            class="text-sm font-medium text-danger"
          >
            {{ motivoUrgenciaError }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
