<script setup lang="ts">
import { computed } from "vue";
import {
  TIPO_FILTRO_NOMBRE_MAX,
  type CatalogoTipoFiltroFieldErrors,
  type CatalogoTipoFiltroGuardarInput,
} from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

const props = defineProps<{
  draft: CatalogoTipoFiltroGuardarInput;
  errors: CatalogoTipoFiltroFieldErrors;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  updateDraft: [draft: CatalogoTipoFiltroGuardarInput];
  blurName: [];
}>();

const nameLength = computed(() => props.draft.nombre.length);

function updateName(event: Event): void {
  emit("updateDraft", {
    ...props.draft,
    nombre: (event.target as HTMLInputElement).value,
  });
}

function updateActive(activo: boolean): void {
  emit("updateDraft", { ...props.draft, activo });
}
</script>

<template>
  <form class="space-y-5" @submit.prevent>
    <div>
      <label for="tipo-filtro-name" class="mb-1.5 block text-xs font-semibold text-gray-800">
        Nombre para mostrar <span class="text-danger" aria-hidden="true">*</span>
      </label>
      <input
        id="tipo-filtro-name"
        :value="draft.nombre"
        type="text"
        required
        :maxlength="TIPO_FILTRO_NOMBRE_MAX + 1"
        autocomplete="off"
        class="min-h-11 w-full rounded-md border bg-white px-3 text-base text-gray-800 outline-none transition-colors focus:ring-2 md:min-h-9 md:text-sm"
        :class="errors.nombre ? 'border-danger focus:border-danger focus:ring-danger/15' : 'border-gray-300 focus:border-main focus:ring-main/15'"
        :disabled="disabled"
        :aria-invalid="Boolean(errors.nombre)"
        :aria-describedby="errors.nombre ? 'tipo-filtro-name-error tipo-filtro-name-count' : 'tipo-filtro-name-count'"
        @input="updateName"
        @blur="emit('blurName')"
      />
      <div class="mt-1 flex min-h-5 items-start justify-between gap-2 text-xs">
        <p v-if="errors.nombre" id="tipo-filtro-name-error" class="text-danger" role="alert">
          {{ errors.nombre }}
        </p>
        <span v-else />
        <span id="tipo-filtro-name-count" class="shrink-0 tabular-nums text-gray-500">
          {{ nameLength }}/{{ TIPO_FILTRO_NOMBRE_MAX }}
        </span>
      </div>
    </div>

    <fieldset :disabled="disabled">
      <legend class="mb-1.5 text-xs font-semibold text-gray-800">
        Estado <span class="text-danger" aria-hidden="true">*</span>
      </legend>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors md:min-h-9 md:text-xs"
          :class="[
            draft.activo ? 'border-main bg-main text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          ]"
          role="radio"
          :aria-checked="draft.activo"
          @click="updateActive(true)"
        >Activo</button>
        <button
          type="button"
          class="min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors md:min-h-9 md:text-xs"
          :class="[
            !draft.activo ? 'border-main bg-main text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          ]"
          role="radio"
          :aria-checked="!draft.activo"
          @click="updateActive(false)"
        >Desactivado</button>
      </div>
    </fieldset>
  </form>
</template>
