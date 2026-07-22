<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';

interface ActionPalette {
  badgeClass: string;
  borderClass: string;
  confirmButtonClass: string;
  confirmButtonHoverClass: string;
  confirmButtonTextClass: string;
}

const props = defineProps<{
  title: string;
  description: string;
  confirmLabel: string;
  closeLabel?: string;
  palette: ActionPalette;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

const resolvedCloseLabel = computed(() => props.closeLabel ?? 'Volver');

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
    <div class="fixed inset-0 z-[100] bg-[#EEECE4]/45 backdrop-blur-[3px]">
      <div class="flex min-h-full items-center justify-center px-4 py-6">
        <div class="w-full max-w-xl rounded-[2rem] border border-stone-200 bg-white p-5 shadow-2xl lg:p-6">
          <div class="space-y-5">
            <div class="space-y-3">
              <span
                class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                :class="[palette.badgeClass, palette.borderClass]"
              >
                Confirmacion
              </span>

              <div class="space-y-2">
                <h2 class="text-xl font-semibold text-stone-900">
                  {{ title }}
                </h2>
                <p class="text-sm leading-6 text-stone-600 lg:text-base">
                  {{ description }}
                </p>
              </div>
            </div>

            <div class="flex flex-col-reverse gap-3 pt-2 lg:flex-row lg:justify-end">
              <button
                type="button"
                class="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-60"
                :disabled="loading"
                @click="emit('close')"
              >
                {{ resolvedCloseLabel }}
              </button>

              <button
                type="button"
                class="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition disabled:opacity-60"
                :class="[palette.confirmButtonClass, palette.confirmButtonHoverClass, palette.confirmButtonTextClass]"
                :disabled="loading"
                @click="emit('confirm')"
              >
                {{ confirmLabel }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
