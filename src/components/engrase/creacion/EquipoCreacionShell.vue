<script setup lang="ts">
import EquipoCreacionHeader from "./EquipoCreacionHeader.vue";
import EquipoCreacionStepper from "./EquipoCreacionStepper.vue";
import EquipoCreacionFooter from "./EquipoCreacionFooter.vue";
import type { CrearEquipoPaso } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
defineProps<{
  step: CrearEquipoPaso;
  completed: number[];
  created: boolean;
  creating: boolean;
  canOpen: (p: CrearEquipoPaso) => boolean;
  nextDisabled: boolean;
  imageSaving: boolean;
  canSaveImage: boolean;
  canFinish: boolean;
}>();
const emit = defineEmits<{
  back: [];
  go: [CrearEquipoPaso];
  cancel: [];
  previous: [];
  next: [];
  create: [];
  saveImage: [];
  skip: [];
  finish: [];
}>();
</script>
<template>
  <section class="flex min-h-full flex-col bg-second text-sm">
    <EquipoCreacionHeader
      :created="created"
      :creating="creating"
      @back="emit('back')"
    /><EquipoCreacionStepper
      :current="step"
      :completed="completed"
      :can-open="canOpen"
      @go="emit('go', $event)"
    />
    <main class="mx-auto w-full max-w-6xl flex-1 px-3 pb-24 sm:px-5">
      <slot />
    </main>
    <EquipoCreacionFooter
      :step="step"
      :next-disabled="nextDisabled"
      :creating="creating"
      :image-saving="imageSaving"
      :can-save-image="canSaveImage"
      :can-finish="canFinish"
      @cancel="emit('cancel')"
      @back="emit('previous')"
      @next="emit('next')"
      @create="emit('create')"
      @save-image="emit('saveImage')"
      @skip="emit('skip')"
      @finish="emit('finish')"
    />
  </section>
</template>
