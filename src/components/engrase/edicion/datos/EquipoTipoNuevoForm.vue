<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { Check } from "lucide-vue-next";
const props = defineProps<{ duplicate: (nombre: string) => boolean }>();
const emit = defineEmits<{ cancel: []; createAndSelect: [string] }>();
const nombre = shallowRef("");
const tocado = shallowRef(false);
const normalizado = computed(() => nombre.value.trim().replace(/\s+/g, " "));
const error = computed(() =>
  !tocado.value
    ? ""
    : !normalizado.value
      ? "El nombre es obligatorio."
      : props.duplicate(normalizado.value)
        ? "Ya existe un tipo de equipo con este nombre."
        : "",
);
function confirmar(): void {
  tocado.value = true;
  if (!error.value) emit("createAndSelect", normalizado.value);
}
</script>
<template>
  <form class="grid gap-3" @submit.prevent="confirmar">
    <div class="grid gap-1.5">
      <label for="tipo-nuevo-nombre" class="text-xs font-semibold text-gray-700"
        >Nombre del tipo</label
      ><input
        id="tipo-nuevo-nombre"
        v-model="nombre"
        class="min-h-11 rounded-md border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none focus:border-main focus:ring-2 focus:ring-main/20 sm:min-h-9 sm:text-sm"
        :aria-describedby="error ? 'tipo-nuevo-error' : undefined"
        @blur="tocado = true"
      />
      <p
        v-if="error"
        id="tipo-nuevo-error"
        class="text-xs text-danger"
        role="alert"
      >
        {{ error }}
      </p>
    </div>
    <p class="rounded-md bg-warning-bg px-3 py-2 text-xs text-warning">
      Se creará al guardar todos los cambios del equipo.
    </p>
    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="min-h-11 cursor-pointer rounded-md border border-gray-300 px-3 text-xs font-semibold"
        @click="emit('cancel')"
      >
        Cancelar</button
      ><button
        type="submit"
        class="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md bg-main px-3 text-xs font-semibold text-white"
      >
        <Check class="h-4 w-4" aria-hidden="true" />Crear y seleccionar
      </button>
    </div>
  </form>
</template>
