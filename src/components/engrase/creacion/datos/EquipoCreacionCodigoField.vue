<script setup lang="ts">
import { CheckCircle2, Loader2, XCircle } from "lucide-vue-next";
import type { ValidacionCodigoEquipoCreacion } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
defineProps<{
  modelValue: string;
  canValidate: boolean;
  validating: boolean;
  validation: ValidacionCodigoEquipoCreacion;
  disabled: boolean;
}>();
const emit = defineEmits<{
  "update:modelValue": [string];
  validate: [];
  blur: [];
}>();
function actualizar(event: Event): void {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>
<template>
  <div class="grid content-start gap-1.5">
    <label for="equipo-creacion-codigo" class="text-xs font-semibold text-gray-700">
      Número de equipo <span class="text-danger" aria-hidden="true">*</span>
    </label>
    <span class="flex min-w-0 gap-2">
      <input
        id="equipo-creacion-codigo"
        class="min-h-10 min-w-0 flex-1 rounded-md border border-gray-300 px-2.5 text-xs outline-none focus:border-main focus:ring-2 focus:ring-main/20 sm:min-h-9 sm:text-sm"
        :disabled="disabled"
        :value="modelValue"
        @input="actualizar"
        @blur="emit('blur')"
      />
      <button
        v-if="validation.estado === 'idle' || validating"
        type="button"
        class="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md border border-main px-3 text-xs font-semibold text-main transition hover:bg-main/10 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9"
        :disabled="!canValidate || validating || disabled"
        @click="emit('validate')"
      >
        <Loader2
          v-if="validating"
          class="h-3.5 w-3.5 animate-spin"
          aria-hidden="true"
        />{{ validating ? "Validando…" : "Validar" }}
      </button>
    </span>
    <p
      v-if="validation.estado === 'idle' && modelValue.trim().length <= 4"
      class="font-normal text-gray-500"
    >
      Escribe al menos 5 caracteres para validar.
    </p>
    <p
      v-if="validation.estado === 'valido'"
      class="inline-flex items-center gap-1 text-success"
    >
      <CheckCircle2 class="h-3.5 w-3.5" />Código disponible
    </p>
    <p
      v-if="validation.estado === 'invalido' || validation.estado === 'error'"
      class="inline-flex items-center gap-1 text-danger"
    >
      <XCircle class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {{
        validation.estado === "invalido"
          ? "Este código ya existe en Engrase."
          : validation.mensaje
      }}
    </p>
  </div>
</template>
