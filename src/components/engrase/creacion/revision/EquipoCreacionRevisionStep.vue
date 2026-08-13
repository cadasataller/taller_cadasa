<script setup lang="ts">
import { Info } from "lucide-vue-next";
import type { CrearEquipoDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
import EquipoCreacionRevisionDataCard from "./EquipoCreacionRevisionDataCard.vue";
import EquipoCreacionRevisionSummary from "./EquipoCreacionRevisionSummary.vue";
import EquipoCreacionRevisionAssignments from "./EquipoCreacionRevisionAssignments.vue";

defineProps<{
  draft: CrearEquipoDraft;
  errors: string[];
  creating: boolean;
}>();

const emit = defineEmits<{ edit: [1 | 2 | 3] }>();
</script>

<template>
  <section class="rounded-xl border border-second-deep bg-white p-3 text-xs shadow-sm">
    <header>
      <h2 tabindex="-1" class="text-sm font-bold text-main">Revisar creación</h2>
    </header>

    <div
      v-if="errors.length"
      class="mt-3 rounded-lg border border-danger/30 bg-danger-bg p-2.5 text-xs text-danger"
      role="alert"
    >
      <p class="font-bold">Hay errores por corregir</p>
      <ul class="mt-1 list-disc pl-4">
        <li v-for="error in errors" :key="error">{{ error }}</li>
      </ul>
    </div>

    <template v-else>

      <div class="mt-3 grid gap-2.5">
        <EquipoCreacionRevisionDataCard
          :datos="draft.datos"
          :disabled="creating"
          @edit="emit('edit', 1)"
        />
        <EquipoCreacionRevisionAssignments
          :filtros="draft.filtros"
          :aceites="draft.aceites"
          :disabled="creating"
          @edit-filters="emit('edit', 2)"
          @edit-oils="emit('edit', 3)"
        />
      </div>

    </template>
  </section>
</template>
