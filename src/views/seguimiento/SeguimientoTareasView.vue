<script setup lang="ts">
// Intentionally thin: the task workspace is delivered in the following phases.
</script>

<template>
  <section class="seguimiento-tareas-view" aria-labelledby="seguimiento-tareas-title">
    <p class="eyebrow">Seguimiento</p>
    <h1 id="seguimiento-tareas-title" class="title">Tareas</h1>
    <p class="description">El workspace de tareas se habilitará en la fase de visualización.</p>
  </section>
</template>

<style scoped>
.seguimiento-tareas-view { min-height: 100%; padding: 2rem; }
.eyebrow { margin: 0 0 .4rem; color: #b8860b; font-size: .75rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
.title { margin: 0; color: #18332d; font-size: 2rem; }
.description { max-width: 34rem; color: #5f6f6b; line-height: 1.6; }
</style>
