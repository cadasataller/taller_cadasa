<script setup lang="ts">
import { computed } from "vue";
import type { TareaSeguimientoListItem } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";
const props = defineProps<{
  tasks: TareaSeguimientoListItem[];
  selectedTaskId: string | null;
  loading: boolean;
  error: string | null;
  search: string;
}>();
const emit = defineEmits<{
  select: [taskId: string];
  retry: [];
  updateSearch: [value: string];
}>();
const taskCount = computed(() => props.tasks.length);
const statusLabel: Record<TareaSeguimientoListItem["status"], string> = {
  pendiente: "Pendiente",
  en_ruta: "En ruta",
  activa: "Activa",
  visitada: "Visitada",
  cancelada: "Cancelada",
  duda_detectada: "Duda detectada",
};
const typeLabel: Record<TareaSeguimientoListItem["type"], string> = {
  finca: "Finca",
  zona: "Zona",
  duda: "Duda",
};
</script>
<template>
  <aside class="task-list-panel" aria-label="Listado de tareas">
    <header class="panel-header">
      <p class="eyebrow">Seguimiento</p>
      <div class="heading-row">
        <h1>Tareas</h1>
        <strong>{{ taskCount }}</strong>
      </div>
      <p>Selecciona una tarea para ver su contexto operativo.</p>
      <label class="search"
        ><span class="sr-only">Buscar tareas</span
        ><input
          :value="search"
          placeholder="Buscar en tareas"
          @input="
            emit('updateSearch', ($event.target as HTMLInputElement).value)
          "
      /></label>
    </header>
    <div class="panel-content">
      <p v-if="loading" class="state">Cargando tareas…</p>
      <div v-else-if="error" class="state error">
        <span>{{ error }}</span
        ><button type="button" @click="emit('retry')">Reintentar</button>
      </div>
      <p v-else-if="!tasks.length" class="state">
        No hay tareas para este contexto.
      </p>
      <ul v-else class="task-cards">
        <li v-for="task in tasks" :key="task.id">
          <button
            :class="['task-card', { selected: task.id === selectedTaskId }]"
            type="button"
            @click="emit('select', task.id)"
          >
            <span class="task-top"
              ><small>{{ typeLabel[task.type] }}</small
              ><small :class="['status', task.status]">{{
                statusLabel[task.status]
              }}</small></span
            ><strong>{{ task.instructions || "Sin indicaciones" }}</strong
            ><span>{{ task.trackerLabel || "Sin tracker asignado" }}</span
            ><span class="task-bottom"
              ><span>{{ task.scheduledDate }}</span
              ><span v-if="task.estimatedMinutes"
                >{{ task.estimatedMinutes }} min</span
              ></span
            >
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>
<style scoped>
.task-list-panel {
  background: #f8f7f4;
  box-shadow: 4px 0 16px rgb(0 0 0 / 16%);
  display: flex;
  flex-direction: column;
}
.panel-header {
  border-bottom: 1px solid #ded9ce;
  padding: 1rem;
}
.eyebrow {
  color: #b8892f;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 0.2rem;
  text-transform: uppercase;
}
.heading-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}
.heading-row h1 {
  color: #003f3b;
  font-size: 1.25rem;
  margin: 0;
}
.heading-row strong {
  background: #dce9e5;
  border-radius: 999px;
  color: #004643;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}
.panel-header p:not(.eyebrow) {
  color: #68716c;
  font-size: 0.75rem;
  line-height: 1.35;
  margin: 0.35rem 0 0.65rem;
}
.search input {
  border: 1px solid #cfcabe;
  border-radius: 0.4rem;
  box-sizing: border-box;
  font-size: 0.8rem;
  height: 2.35rem;
  padding: 0 0.65rem;
  width: 100%;
}
.panel-content {
  min-height: 0;
  overflow: auto;
  padding: 0.65rem;
}
.task-cards {
  display: grid;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.task-card {
  background: white;
  border: 1px solid #dfdbd1;
  border-left: 3px solid #b8892f;
  border-radius: 0.45rem;
  color: #2d3a35;
  display: grid;
  font-size: 0.73rem;
  gap: 0.35rem;
  padding: 0.7rem;
  text-align: left;
  width: 100%;
}
.task-card:hover,
.task-card.selected {
  border-color: #006b65;
  box-shadow: 0 2px 8px rgb(0 70 67 / 15%);
}
.task-card strong {
  font-size: 0.8rem;
  line-height: 1.25;
}
.task-top,
.task-bottom {
  color: #68716c;
  display: flex;
  justify-content: space-between;
}
.status {
  border-radius: 999px;
  font-weight: 700;
}
.activa {
  color: #237a43;
}
.duda_detectada {
  color: #a75b12;
}
.cancelada {
  color: #ae3d35;
}
.state {
  color: #65716b;
  font-size: 0.8rem;
  padding: 1rem 0.4rem;
  text-align: center;
}
.state.error {
  color: #9a3931;
  display: grid;
  gap: 0.5rem;
}
.state button {
  background: #004643;
  border: 0;
  border-radius: 0.35rem;
  color: #fff;
  padding: 0.45rem;
}
.sr-only {
  height: 1px;
  overflow: hidden;
  position: absolute;
  width: 1px;
}
</style>
