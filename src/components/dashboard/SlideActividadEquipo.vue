<script setup lang="ts">
import { Activity } from "lucide-vue-next";
</script>

<template>
  <section
    class="flex min-h-80 flex-col items-center justify-center px-6 text-center"
  >
    <div
      class="mb-5 grid size-16 place-items-center rounded-2xl border border-main/10 bg-main/5 text-main"
    >
      <Activity class="size-8" aria-hidden="true" />
    </div>
    <p class="text-xs font-bold uppercase tracking-[0.2em] text-main">
      Próximamente
    </p>
    <h2 class="mt-2 text-xl font-bold text-gray-800">Actividad de equipo</h2>
    <p class="mt-2 max-w-sm text-sm leading-6 text-gray-500">
      Este reporte estará disponible cuando se conecten sus métricas operativas.
    </p>
  </section>
</template>
