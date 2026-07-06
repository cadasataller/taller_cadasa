<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { computed } from 'vue';
import { es } from 'date-fns/locale';

const model = defineModel<string | null>();

const props = defineProps<{
  error?: string;
  showReviewWarning?: boolean;
  minDate?: Date | null;
  isZafraActiva?: boolean;
  disabledDate?: (date: Date) => boolean;
}>();
const inputFormats = {
  input: (value: Date | Date[]): string => {
    const date = Array.isArray(value) ? value[0] : value;

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
      .format(date)
      .toLowerCase();
  },
};

const toDateValue = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const displayValue = computed<Date | null>({
  get: () => toDateValue(model.value ?? null),
  set: (value) => {
    if (!value) {
      model.value = null;
      return;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    model.value = `${year}-${month}-${day}`;
  },
});
</script>

<template>
  <div class="space-y-1">
    <label class="block text-xs font-semibold text-stone-800">
      Fecha de entrega <span class="text-danger">*</span>
    </label>

    <div
      class="rounded-lg border bg-white px-2 py-1 transition "
      :class="error ? 'border-danger bg-danger-bg/30' : 'border-stone-300'"
    >
      <VueDatePicker
        v-model="displayValue"
        :min-date="props.isZafraActiva ? undefined : (props.minDate ?? undefined)"
        :disabled-dates="props.disabledDate"
        :enable-time-picker="false"
        :locale="es"
        :formats="inputFormats"
        auto-apply
        placeholder="Selecciona la fecha de entrega"
        class="crear-solicitud-datepicker "
        input-class-name="crear-solicitud-datepicker-input"
      />
    </div>

    
    <p
      v-if="error"
      class="text-sm font-medium text-danger"
    >
      {{ error }}
    </p>

    <p
      v-if="showReviewWarning"
      class="text-sm font-medium text-danger"
    >
      Actualice la fecha de entrega.
    </p>
  </div>
</template>
