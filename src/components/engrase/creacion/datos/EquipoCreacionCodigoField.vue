<script setup lang="ts">
import { CheckCircle2, Loader2 } from "lucide-vue-next";
import type { ValidacionCodigoEquipoCreacion } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
defineProps<{
  modelValue: string;
  canValidate: boolean;
  validating: boolean;
  validation: ValidacionCodigoEquipoCreacion;
  disabled: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [string]; validate: [] }>();
function actualizar(event: Event): void {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>
<template>
  <label class="grid gap-1 text-xs font-bold text-gray-700"
    >Número de equipo<input
      id="equipo-creacion-codigo"
      class="min-h-10 rounded-md border px-2"
      :disabled="disabled"
      :value="modelValue"
      @input="actualizar"
    /><button
      v-if="canValidate || validating"
      type="button"
      class="min-h-9 rounded-md border border-main text-main disabled:opacity-50"
      :disabled="validating || disabled"
      @click="emit('validate')"
    >
      <Loader2
        v-if="validating"
        class="mr-1 inline h-3.5 w-3.5 animate-spin"
      />{{ validating ? "Validando…" : "Validar código" }}
    </button>
    <p
      v-else-if="modelValue.trim().length <= 4"
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
      class="text-danger"
    >
      {{
        validation.estado === "invalido"
          ? "Este código ya existe en Engrase."
          : validation.mensaje
      }}
    </p></label
  >
</template>
