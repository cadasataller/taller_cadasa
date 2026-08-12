<script setup lang="ts">
import { AlertCircle, Construction, RotateCw } from "lucide-vue-next";

type SectionState = "content" | "pending" | "loading" | "error";

withDefaults(
  defineProps<{
    state?: SectionState;
    title: string;
    description?: string;
    errorTitle?: string;
    errorDescription?: string;
  }>(),
  {
    state: "pending",
    description: "Esta sección se implementará en una entrega posterior.",
    errorTitle: "No se pudo cargar esta sección",
    errorDescription: "Ocurrió un problema al obtener la información.",
  },
);

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <section
    class="flex min-h-64 min-w-0 flex-1 rounded-lg border border-gray-200 bg-[#FAF9F5] shadow-sm sm:min-h-80"
    :aria-busy="state === 'loading' ? 'true' : undefined"
    :aria-labelledby="
      state === 'content' ? undefined : 'catalogo-section-title'
    "
  >
    <slot v-if="state === 'content'" />

    <div
      v-else-if="state === 'loading'"
      class="flex min-h-64 w-full flex-col justify-center gap-3 p-5 sm:min-h-80 sm:p-8"
    >
      <h2 id="catalogo-section-title" class="sr-only">Cargando {{ title }}</h2>
      <slot name="loading">
        <div
          class="h-8 w-44 animate-pulse rounded-md bg-gray-200 motion-reduce:animate-none"
        />
        <div
          class="h-24 w-full animate-pulse rounded-md bg-gray-100 motion-reduce:animate-none"
        />
      </slot>
    </div>

    <div
      v-else-if="state === 'error'"
      class="m-auto flex max-w-md flex-col items-center px-5 py-12 text-center"
    >
      <AlertCircle class="mb-3 h-8 w-8 text-danger" aria-hidden="true" />
      <h2 id="catalogo-section-title" class="text-sm font-bold text-gray-900">
        {{ errorTitle }}
      </h2>
      <p class="mt-1 text-xs leading-5 text-gray-500">{{ errorDescription }}</p>
      <button
        type="button"
        class="mt-4 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-main transition-colors duration-150 hover:border-main/40 hover:bg-main/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
        @click="emit('retry')"
      >
        <RotateCw class="h-3.5 w-3.5" aria-hidden="true" />
        Reintentar
      </button>
    </div>

    <div
      v-else
      class="m-auto flex max-w-md flex-col items-center px-5 py-12 text-center"
    >
      <span
        class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-main/10 bg-main/5 text-main"
      >
        <Construction class="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 id="catalogo-section-title" class="text-base font-bold text-main">
        {{ title }}
      </h2>
      <p class="mt-1.5 text-sm leading-5 text-gray-500">{{ description }}</p>
    </div>
  </section>
</template>
