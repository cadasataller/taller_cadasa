<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Save, X } from "lucide-vue-next";
defineProps<{
  canSave: boolean;
  saving: boolean;
  message: string | null;
  messageKind: "error" | "success" | "partial" | null;
  validationCount: number;
  movePending: boolean;
}>();
const emit = defineEmits<{ cancel: []; save: []; retryImage: [] }>();
</script>
<template>
  <footer
    class="editor-footer sticky bottom-0 z-10 flex flex-col gap-2 border-t border-gray-200 bg-white/95 px-3 py-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-4"
  >
    <div class="min-h-5 text-xs" aria-live="polite" aria-atomic="true">
      <p v-if="message" class="inline-flex items-start gap-1.5" :class="messageKind === 'success' ? 'text-success' : messageKind === 'partial' ? 'text-warning' : 'text-danger'">
        <CheckCircle2 v-if="messageKind === 'success'" class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <AlertTriangle v-else class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{{ message }}<span v-if="validationCount > 1"> Revisa los {{ validationCount }} errores indicados.</span></span>
      </p>
      <p v-else-if="saving" class="inline-flex items-center gap-1.5 font-semibold text-main" role="status">
        <Loader2 class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Guardando cambios…
      </p>
    </div>
    <div class="flex flex-col gap-2 sm:flex-row">
      <button v-if="movePending" type="button" class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-warning px-3 text-xs font-semibold text-warning focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main" @click="emit('retryImage')">
        <RefreshCw class="h-3.5 w-3.5" aria-hidden="true" />Reintentar mover imagen
      </button>
      <button type="button" :disabled="saving" class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-not-allowed disabled:opacity-50" :class="saving ? 'cursor-not-allowed' : 'cursor-pointer'" @click="emit('cancel')">
        <X class="h-3.5 w-3.5" aria-hidden="true" /> Cancelar
      </button>
      <button type="button" :disabled="!canSave || saving" class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-main px-3 text-xs font-semibold text-white transition hover:bg-main-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-not-allowed disabled:opacity-50" :class="canSave && !saving ? 'cursor-pointer' : 'cursor-not-allowed'" @click="emit('save')">
        <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" /><Save v-else class="h-3.5 w-3.5" aria-hidden="true" />{{ saving ? "Guardando…" : "Guardar cambios" }}
      </button>
    </div>
  </footer>
</template>
<style scoped>
.editor-footer { padding-bottom: max(0.5rem, env(safe-area-inset-bottom)); }
@media (prefers-reduced-motion: reduce) { .animate-spin { animation: none; } }
</style>
