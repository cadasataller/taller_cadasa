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
}>();
const emit = defineEmits<{ back: []; cancel: []; save: [] }>();
</script>
<template>
  <section class="flex min-h-full flex-col bg-second text-sm">
    <EquipoEdicionHeader
      :draft="draft"
      :stages-count="stagesCount"
      @back="emit('back')"
    />
    <main
      class="mx-auto grid w-full max-w-5xl flex-1 gap-2.5 p-2.5 pb-20 sm:gap-3 sm:p-3 sm:pb-20"
    >
      <slot name="datos" />
      <slot name="filtros" />
      <section class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div class="flex justify-between gap-2">
          <h2 class="text-sm font-bold text-gray-900">Aceites</h2>
          <span
            class="rounded-full bg-main/10 px-2 py-0.5 text-[11px] font-bold text-main"
            >{{ oilsCount }}</span
          >
        </div>
        <p class="mt-1 text-xs leading-5 text-gray-600">
          La administración de aceites estará disponible próximamente.
        </p>
      </section>
    </main>
    <EquipoEdicionFooter
      :can-save="canSave"
      :saving="saving"
      @cancel="emit('cancel')"
      @save="emit('save')"
    />
    <slot name="overlay" />
  </section>
</template>
