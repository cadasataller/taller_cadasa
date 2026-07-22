<script setup lang="ts">
const SEND_TOOLTIP_MESSAGE = 'Debe ver la informacion completa antes de poder enviar.';

import { computed } from 'vue';

import type { SolicitudCompraCreateStep } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  currentStep: SolicitudCompraCreateStep;
  loading: boolean;
  disableNext: boolean;
  disableSend?: boolean;
  showDraftButton?: boolean;
  autoSaveStatusLabel?: string | null;
}>();

defineEmits<{
  (e: 'cancel'): void;
  (e: 'back'): void;
  (e: 'next'): void;
  (e: 'draft'): void;
  (e: 'send'): void;
}>();

const shouldShowDraftButton = computed(() => props.showDraftButton ?? false);
const autoSaveStatusLabel = computed(() => props.autoSaveStatusLabel?.trim() || '');
</script>

<template>
  <footer class="pt-1">
    <div
      v-if="currentStep < 4"
      class="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <p
        v-if="autoSaveStatusLabel"
        class="order-3 text-center text-xs font-medium text-stone-500/80 lg:order-2 lg:flex-1"
      >
        {{ autoSaveStatusLabel }}
      </p>

      <div class="flex flex-col gap-3 lg:order-2 lg:flex-row">
        <button
          type="button"
          class="inline-flex cursor-pointer min-h-10 items-center justify-center rounded-lg bg-main px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-55 lg:order-2"
          :disabled="disableNext || loading"
          @click="$emit('next')"
        >
          Siguiente
        </button>

        <button
          v-if="currentStep > 1"
          type="button"
          class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-main px-4 text-sm font-semibold text-main transition hover:bg-main/5 disabled:opacity-60 lg:order-1"
          :disabled="loading"
          @click="$emit('back')"
        >
          Atrás
        </button>
      </div>

      <div class="flex flex-col gap-3 lg:order-1 lg:flex-row">
        <button
          v-if="shouldShowDraftButton"
          type="button"
          class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-white bg-accent px-4 text-sm font-semibold text-main transition hover:bg-accent-light disabled:opacity-60 lg:order-2"
          :disabled="loading"
          @click="$emit('draft')"
        >
          Guardar borrador
        </button>

        <button
          type="button"
          class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-danger-light bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger-light lg:order-1"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
      </div>
    </div>

    <template v-else>
      <div class="flex shrink-0 flex-col gap-3 lg:hidden">
        <p
          v-if="autoSaveStatusLabel"
          class="text-center text-xs font-medium text-stone-500/80"
        >
          {{ autoSaveStatusLabel }}
        </p>

        <div class="group relative flex w-full flex-col items-center">
          <button
            type="button"
            class="inline-flex w-full cursor-pointer min-h-10 items-center justify-center rounded-lg bg-main px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-main-light disabled:opacity-60"
            :class="disableSend && !loading ? 'pointer-events-none' : ''"
            :disabled="loading || disableSend"
            @click="$emit('send')"
          >
            Enviar solicitud
          </button>

          <span
            v-if="disableSend && !loading"
            class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[18rem] -translate-x-1/2 rounded-lg bg-stone-900 px-3 py-2 text-center text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100"
          >
            {{ SEND_TOOLTIP_MESSAGE }}
          </span>
        </div>

        <button
          type="button"
          class="inline-flex cursor-pointer min-h-10 items-center justify-center rounded-lg border border-main px-4 text-sm font-semibold text-main transition hover:bg-main/5 disabled:opacity-60"
          :disabled="loading"
          @click="$emit('back')"
        >
          Atrás
        </button>

        <button
          v-if="shouldShowDraftButton"
          type="button"
          class="inline-flex cursor-pointer min-h-10 items-center justify-center rounded-lg border border-white bg-accent px-4 text-sm font-semibold text-main transition hover:bg-accent-light disabled:opacity-60"
          :disabled="loading"
          @click="$emit('draft')"
        >
          Guardar borrador
        </button>

        <button
          type="button"
            class="inline-flex cursor-pointer min-h-10 items-center justify-center rounded-lg border border-danger-light bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger-light"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>
      </div>

      <div class="hidden shrink-0 lg:flex lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-col gap-3 lg:flex-row">
          <button
            type="button"
            class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-danger-light bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger-light"
            @click="$emit('cancel')"
          >
            Cancelar
          </button>

          <button
            v-if="shouldShowDraftButton"
            type="button"
            class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-white bg-accent px-4 text-sm font-semibold text-main transition hover:bg-accent-light disabled:opacity-60"
            :disabled="loading"
            @click="$emit('draft')"
          >
            Guardar borrador
          </button>
        </div>

        <p
          v-if="autoSaveStatusLabel"
          class="px-4 text-center text-xs font-medium text-stone-500/80"
        >
          {{ autoSaveStatusLabel }}
        </p>

        <div class="flex flex-col gap-3 lg:flex-row">
          <button
            type="button"
            class="inline-flex cursor-pointer min-h-10 items-center justify-center rounded-lg border border-main px-4 text-sm font-semibold text-main transition hover:bg-main/5 disabled:opacity-60"
            :disabled="loading"
            @click="$emit('back')"
          >
            Atrás
          </button>

          <div class="group relative inline-flex">
            <button
              type="button"
              class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-main px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-main-light disabled:opacity-60"
              :class="disableSend && !loading ? 'pointer-events-none' : ''"
              :disabled="loading || disableSend"
              @click="$emit('send')"
            >
              Enviar solicitud
            </button>

            <span
              v-if="disableSend && !loading"
              class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[18rem] -translate-x-1/2 rounded-lg bg-stone-900 px-3 py-2 text-center text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100"
            >
              {{ SEND_TOOLTIP_MESSAGE }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </footer>
</template>
