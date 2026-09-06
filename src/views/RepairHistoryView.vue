<script setup lang="ts">
import { Wrench } from "lucide-vue-next";
</script>

<template>
  <div
    class="p-8 pb-32 md:pb-8 flex flex-col items-center justify-center min-h-[60vh] text-center"
  >
    <div class="bg-blue-50 p-6 rounded-full mb-6 relative">
      <Wrench class="w-12 h-12 text-info" />
    </div>
    <h1 class="font-display text-3xl text-gray-900 mb-2">
      Historial de Reparaciones
    </h1>
    <p class="text-gray-400 max-w-md mb-8">
      Contenido en desarrollo. Aquí podrá visualizar el histórico de
      intervenciones mecánicas.
    </p>
  </div>
</template>
