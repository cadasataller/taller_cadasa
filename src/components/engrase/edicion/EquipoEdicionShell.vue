<script setup lang="ts">
import EquipoEdicionFooter from "./EquipoEdicionFooter.vue";
import EquipoEdicionHeader from "./EquipoEdicionHeader.vue";
import type { EquipoEdicionDraft } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
defineProps<{
  draft: EquipoEdicionDraft;
  stagesCount: number;
  filtersCount: number;
  oilsCount: number;
  canSave: boolean;
  saving: boolean;
  message: string | null;
  messageKind: "error" | "success" | "partial" | null;
  validationCount: number;
  movePending: boolean;
}>();
const emit = defineEmits<{ back: []; cancel: []; save: []; retryImage: [] }>();
</script>
<template>
  <section class="flex min-h-full flex-col bg-second text-sm">
    <EquipoEdicionHeader
      :draft="draft"
      :stages-count="stagesCount"
      @back="emit('back')"
    />
    <main
      class="mx-auto grid w-full max-w-5xl flex-1 gap-2.5 p-2.5 sm:gap-3 sm:p-3 sm:pb-20"
    >
      <slot name="datos" />
      <slot name="filtros" />
      <slot name="aceites" />
    </main>
    <EquipoEdicionFooter
      :can-save="canSave"
      :saving="saving"
      :message="message"
      :message-kind="messageKind"
      :validation-count="validationCount"
      :move-pending="movePending"
      @cancel="emit('cancel')"
      @save="emit('save')"
      @retry-image="emit('retryImage')"
    />
    <slot name="overlay" />
  </section>
</template>
