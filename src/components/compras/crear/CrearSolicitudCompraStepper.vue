<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { computed } from 'vue';

import type {
  SolicitudCompraCreateStep,
  SolicitudCompraTipoSolicitud,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const props = defineProps<{
  currentStep: SolicitudCompraCreateStep;
  maxUnlockedStep: SolicitudCompraCreateStep;
  tipoSolicitud: SolicitudCompraTipoSolicitud | null;
}>();

const emit = defineEmits<{
  (e: 'navigate', step: SolicitudCompraCreateStep): void;
}>();

const steps = computed(() => [
  {
    id: 1,
    label: 'Datos base',
    shortLabel: 'Datos',
  },
  {
    id: 2,
    label: props.tipoSolicitud === 'servicio' ? 'Servicios' : 'Productos',
    shortLabel: props.tipoSolicitud === 'servicio' ? 'Servicios' : 'Productos',
  },
  {
    id: 3,
    label: 'Observaciones',
    shortLabel: 'Observ.',
  },
  {
    id: 4,
    label: 'Resumen',
    shortLabel: 'Resumen',
  },
] as const);

const isStepNavigable = (step: SolicitudCompraCreateStep): boolean => step <= props.maxUnlockedStep;
const getDesktopStepStateClasses = (step: SolicitudCompraCreateStep): string => {
  if (step < props.currentStep) {
    return 'border-success bg-success text-white';
  }

  if (step === props.currentStep) {
    return 'border-main bg-main text-white';
  }

  return 'border-stone-300 bg-white text-stone-500';
};
const getCompactStepStateClasses = (step: SolicitudCompraCreateStep): string => {
  if (!isStepNavigable(step)) {
    return 'border-stone-200 bg-stone-100 text-stone-400';
  }

  if (step < props.currentStep) {
    return 'border-success bg-success text-white';
  }

  if (step === props.currentStep) {
    return 'border-main bg-main text-white shadow-[0_12px_30px_rgba(22,101,52,0.18)]';
  }

  return 'border-stone-300 bg-white text-stone-500';
};
const getCompactCircleClasses = (step: SolicitudCompraCreateStep): string => {
  if (!isStepNavigable(step)) {
    return 'border-stone-300 bg-white text-stone-400';
  }

  if (step < props.currentStep) {
    return 'border-white/40 bg-white/15 text-white';
  }

  if (step === props.currentStep) {
    return 'border-white/50 bg-white/15 text-white';
  }

  return 'border-main/30 bg-white text-main';
};

const navigateToStep = (step: SolicitudCompraCreateStep): void => {
  if (!isStepNavigable(step)) {
    return;
  }

  emit('navigate', step);
};
</script>

<template>
  <div class="rounded-md border border-stone-200 bg-white px-2 py-2 shadow-sm">
    <div class="hidden lg:grid lg:grid-cols-4 lg:gap-2">
      <button
        v-for="step in steps"
        :key="step.id"
        type="button"
        class="relative flex flex-col items-center gap-1 text-center"
        :class="isStepNavigable(step.id) ? 'cursor-pointer' : 'cursor-not-allowed'"
        :aria-disabled="isStepNavigable(step.id) ? undefined : 'true'"
        @click="navigateToStep(step.id)"
      >
        <div
          v-if="step.id < steps.length"
          class="absolute left-[calc(50%+0.8rem)] top-3.5 h-0.5 w-[calc(100%-1.6rem)]"
          :class="step.id < currentStep ? 'bg-main' : 'bg-stone-200'"
        />

        <span
          class="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold transition"
          :class="getDesktopStepStateClasses(step.id)"
        >
          <Check
            v-if="step.id < currentStep"
            class="h-3 w-3"
          />
          <template v-else>
            {{ step.id }}
          </template>
        </span>

        <span
          class="text-[10px] font-semibold"
          :class="step.id === currentStep ? 'text-main' : 'text-stone-500'"
        >
          {{ step.label }}
        </span>
      </button>
    </div>

    <div class="space-y-3 lg:hidden">
      <div class="hidden items-center justify-between gap-3 sm:flex">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            Paso {{ currentStep }} de 4
          </p>
          <p class="mt-1 text-sm font-semibold text-main">
            {{ steps[currentStep - 1]?.label }}
          </p>
        </div>

        <div class="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          {{ maxUnlockedStep }}/4 desbloqueados
        </div>
      </div>

      <div class="overflow-x-auto pb-1 sm:hidden">
        <div class="flex min-w-max gap-2">
          <button
            v-for="step in steps"
            :key="`compact-${step.id}`"
            type="button"
            class="flex min-w-[4.5rem] flex-col items-center gap-1.5 rounded-2xl border px-2 py-2 text-center transition"
            :class="[
              getCompactStepStateClasses(step.id),
              isStepNavigable(step.id) ? 'cursor-pointer' : 'cursor-not-allowed',
            ]"
            :aria-disabled="isStepNavigable(step.id) ? undefined : 'true'"
            @click="navigateToStep(step.id)"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition"
              :class="getCompactCircleClasses(step.id)"
            >
              <Check
                v-if="step.id < currentStep"
                class="h-3.5 w-3.5"
              />
              <template v-else>
                {{ step.id }}
              </template>
            </span>

            <span
              class="block max-w-full truncate text-[10px] font-semibold leading-tight"
              :class="step.id === currentStep ? 'text-white/85' : 'text-current/75'"
            >
              {{ step.shortLabel }}
            </span>
          </button>
        </div>
      </div>

      <div class="hidden grid-cols-4 gap-2 sm:grid lg:hidden">
        <button
          v-for="step in steps"
          :key="`tablet-${step.id}`"
          type="button"
          class="flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition"
          :class="[
            getCompactStepStateClasses(step.id),
            isStepNavigable(step.id) ? 'cursor-pointer' : 'cursor-not-allowed',
          ]"
          :aria-disabled="isStepNavigable(step.id) ? undefined : 'true'"
          @click="navigateToStep(step.id)"
        >
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition"
            :class="getCompactCircleClasses(step.id)"
          >
            <Check
              v-if="step.id < currentStep"
              class="h-3.5 w-3.5"
            />
            <template v-else>
              {{ step.id }}
            </template>
          </span>

          <span class="min-w-0">
            <span
              class="block text-[10px] font-semibold uppercase tracking-[0.18em]"
              :class="step.id === currentStep ? 'text-white/80' : 'text-current/70'"
            >
              Paso {{ step.id }}
            </span>
            <span class="mt-0.5 block truncate text-xs font-semibold">
              {{ step.shortLabel }}
            </span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
