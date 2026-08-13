<script setup lang="ts">
import { Check } from "lucide-vue-next";
import type { CrearEquipoPaso } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";
const props = defineProps<{
  current: CrearEquipoPaso;
  completed: number[];
  canOpen: (paso: CrearEquipoPaso) => boolean;
}>();
const emit = defineEmits<{ go: [CrearEquipoPaso] }>();
const pasos: Array<{ numero: CrearEquipoPaso; titulo: string }> = [
  { numero: 1, titulo: "Datos" },
  { numero: 2, titulo: "Filtros" },
  { numero: 3, titulo: "Aceites" },
  { numero: 4, titulo: "Revisar" },
  { numero: 5, titulo: "Imagen" },
];
</script>
<template>
  <nav
    class="mx-auto w-full max-w-6xl overflow-x-auto px-3 py-3 sm:px-5"
    aria-label="Progreso de creación del equipo"
  >
    <ol class="flex min-w-[580px] items-start justify-between gap-1">
      <li
        v-for="paso in pasos"
        :key="paso.numero"
        class="flex flex-1 items-center last:flex-none"
      >
        <button
          v-if="canOpen(paso.numero)"
          type="button"
          class="grid cursor-pointer justify-items-center gap-1 text-xs font-semibold"
          :aria-current="current === paso.numero ? 'step' : undefined"
          @click="emit('go', paso.numero)"
        >
          <span
            class="grid h-7 w-7 place-items-center rounded-full"
            :class="
              current === paso.numero || completed.includes(paso.numero)
                ? 'bg-main text-white'
                : 'bg-gray-200 text-gray-600'
            "
            ><Check
              v-if="completed.includes(paso.numero) && current !== paso.numero"
              class="h-4 w-4"
            /><span v-else>{{ paso.numero }}</span></span
          ><span>{{ paso.titulo }}</span></button
        ><span
          v-else
          class="grid justify-items-center gap-1 text-xs font-semibold text-gray-400"
          :aria-current="current === paso.numero ? 'step' : undefined"
          ><span
            class="grid h-7 w-7 place-items-center rounded-full"
            :class="
              current === paso.numero ? 'bg-main text-white' : 'bg-gray-200'
            "
            ><span>{{ paso.numero }}</span></span
          ><span
            >{{ paso.titulo }}<span class="sr-only"> no disponible</span></span
          ></span
        ><span
          v-if="paso.numero < 5"
          class="mx-1 mt-[-18px] h-px flex-1 bg-gray-200"
          :class="completed.includes(paso.numero) ? 'bg-main' : ''"
        />
      </li>
    </ol>
  </nav>
</template>
