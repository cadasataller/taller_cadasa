<script setup lang="ts">
import { AlertCircle, FilterX, Inbox, Plus, RefreshCw } from "lucide-vue-next";

defineProps<{
  kind: "loading" | "error" | "empty" | "no-results";
  message?: string | null;
}>();

const emit = defineEmits<{
  retry: [];
  clear: [];
  create: [];
}>();
</script>

<template>
  <div v-if="kind === 'loading'" class="space-y-2" role="status" aria-label="Cargando tipos de filtro">
    <div v-for="index in 6" :key="index" class="h-14 animate-pulse rounded-lg border border-gray-100 bg-gray-100 motion-reduce:animate-none" />
  </div>
  <div v-else class="grid min-h-56 place-items-center rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center">
    <div class="max-w-sm">
      <AlertCircle v-if="kind === 'error'" class="mx-auto h-7 w-7 text-danger" aria-hidden="true" />
      <FilterX v-else-if="kind === 'no-results'" class="mx-auto h-7 w-7 text-main" aria-hidden="true" />
      <Inbox v-else class="mx-auto h-7 w-7 text-main" aria-hidden="true" />
      <h3 class="mt-2 text-sm font-bold text-gray-800">
        {{ kind === 'error' ? 'No se pudieron cargar los tipos de filtro' : kind === 'no-results' ? 'Sin coincidencias' : 'Catálogo vacío' }}
      </h3>
      <p class="mt-1 text-xs leading-5 text-gray-500">
        {{ kind === 'error' ? message : kind === 'no-results' ? 'No encontramos tipos de filtro con los filtros actuales.' : 'No hay tipos de filtro registrados.' }}
      </p>
      <button
        v-if="kind === 'error'"
        type="button"
        class="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-main hover:bg-main/5 md:min-h-9"
        @click="emit('retry')"
      ><RefreshCw class="h-4 w-4" aria-hidden="true" />Reintentar</button>
      <button
        v-else-if="kind === 'no-results'"
        type="button"
        class="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-main hover:bg-main/5 md:min-h-9"
        @click="emit('clear')"
      ><FilterX class="h-4 w-4" aria-hidden="true" />Limpiar filtros</button>
      <button
        v-else
        type="button"
        class="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-main px-3 text-xs font-semibold text-white hover:bg-main-light md:min-h-9"
        @click="emit('create')"
      ><Plus class="h-4 w-4" aria-hidden="true" />Nuevo tipo de filtro</button>
    </div>
  </div>
</template>
