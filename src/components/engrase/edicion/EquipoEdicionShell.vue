<script setup lang="ts">
import EquipoEdicionFooter from "./EquipoEdicionFooter.vue";
import EquipoEdicionHeader from "./EquipoEdicionHeader.vue";
import type { EquipoEdicionDraft } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
type PestañaEdicion = "datos" | "filtros" | "aceites";
defineProps<{
  draft: EquipoEdicionDraft;
  activeTab: PestañaEdicion;
  filtersCount: number;
  oilsCount: number;
  hasDataChanges: boolean;
  hasFilterChanges: boolean;
  hasOilChanges: boolean;
  canSave: boolean;
  saving: boolean;
  message: string | null;
  messageKind: "error" | "success" | "partial" | null;
  validationCount: number;
  movePending: boolean;
}>();
const emit = defineEmits<{
  back: [];
  cancel: [];
  save: [];
  retryImage: [];
  updateActiveTab: [PestañaEdicion];
}>();
</script>
<template>
  <section class="flex min-h-full flex-col bg-second text-sm">
    <EquipoEdicionHeader
      :draft="draft"
      @back="emit('back')"
    />
    <nav
      class="mx-auto mt-2 flex w-full max-w-[1600px] border-b border-gray-200 px-2 sm:mt-2.5 sm:px-3 lg:w-[70%]"
      role="tablist"
      aria-label="Secciones de edición del equipo"
    >
      <button
        id="tab-datos"
        type="button"
        role="tab"
        aria-controls="panel-datos"
        :aria-selected="activeTab === 'datos'"
        class="relative inline-flex min-h-10 items-center gap-1.5 border-b-2 px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
        :class="activeTab === 'datos' ? 'border-main text-main' : 'border-transparent text-gray-500 hover:text-main'"
        @click="emit('updateActiveTab', 'datos')"
      >
        Datos del equipo
        <span v-if="hasDataChanges" class="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        <span v-if="hasDataChanges" class="sr-only">Cambios pendientes</span>
      </button>
      <button
        id="tab-filtros"
        type="button"
        role="tab"
        aria-controls="panel-filtros"
        :aria-selected="activeTab === 'filtros'"
        class="relative inline-flex min-h-10 items-center gap-1.5 border-b-2 px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
        :class="activeTab === 'filtros' ? 'border-main text-main' : 'border-transparent text-gray-500 hover:text-main'"
        @click="emit('updateActiveTab', 'filtros')"
      >
        Filtros ({{ filtersCount }})
        <span v-if="hasFilterChanges" class="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        <span v-if="hasFilterChanges" class="sr-only">Cambios pendientes</span>
      </button>
      <button
        id="tab-aceites"
        type="button"
        role="tab"
        aria-controls="panel-aceites"
        :aria-selected="activeTab === 'aceites'"
        class="relative inline-flex min-h-10 items-center gap-1.5 border-b-2 px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main"
        :class="activeTab === 'aceites' ? 'border-main text-main' : 'border-transparent text-gray-500 hover:text-main'"
        @click="emit('updateActiveTab', 'aceites')"
      >
        Aceites ({{ oilsCount }})
        <span v-if="hasOilChanges" class="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        <span v-if="hasOilChanges" class="sr-only">Cambios pendientes</span>
      </button>
    </nav>
    <main
      class="mx-auto grid w-full max-w-[1600px] flex-1 content-start gap-2 p-2 sm:gap-2.5 sm:p-3 sm:pb-20 lg:w-[70%]"
    >
      <div
        id="panel-datos"
        role="tabpanel"
        aria-labelledby="tab-datos"
        :aria-hidden="activeTab !== 'datos'"
        v-show="activeTab === 'datos'"
      >
        <slot name="datos" />
      </div>
      <div
        id="panel-filtros"
        role="tabpanel"
        aria-labelledby="tab-filtros"
        :aria-hidden="activeTab !== 'filtros'"
        v-show="activeTab === 'filtros'"
      >
        <slot name="filtros" />
      </div>
      <div
        id="panel-aceites"
        role="tabpanel"
        aria-labelledby="tab-aceites"
        :aria-hidden="activeTab !== 'aceites'"
        v-show="activeTab === 'aceites'"
      >
        <slot name="aceites" />
      </div>
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
