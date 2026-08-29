<script setup lang="ts">
import { computed } from "vue";
import type { SeguimientoCoordinates } from "@/seguimiento/shared/seguimiento.types";
import type {
  TareaSeguimientoDetail,
  TareaSeguimientoListItem,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";
const props = defineProps<{
  task: TareaSeguimientoDetail | TareaSeguimientoListItem | null;
  loading: boolean;
  error: string | null;
}>();
const emit = defineEmits<{
  close: [];
  focus: [coordinates: SeguimientoCoordinates | null];
}>();
const taskType = computed(() =>
  props.task?.type === "duda"
    ? "Duda detectada"
    : props.task?.type === "zona"
      ? "Zona"
      : "Finca",
);
const geometryLabel = computed(() => {
  if (!props.task) return "Sin tarea seleccionada";
  if (props.task.type === "duda")
    return "Las dudas no habilitan edición ni geometría en esta fase.";
  return props.task.routePoint
    ? `${props.task.routePoint.latitude.toFixed(5)}, ${props.task.routePoint.longitude.toFixed(5)}`
    : "Sin punto de enrutado";
});
</script>
<template>
  <aside class="detail-panel" aria-label="Detalle de tarea">
    <header>
      <div>
        <p class="eyebrow">Detalle de tarea</p>
        <h2>{{ task?.instructions || "Cargando tarea" }}</h2>
      </div>
      <button aria-label="Cerrar detalle" type="button" @click="emit('close')">
        ×
      </button>
    </header>
    <div class="content">
      <p v-if="loading" class="state">Cargando detalle…</p>
      <p v-else-if="error" class="state error">{{ error }}</p>
      <template v-else-if="task"
        ><section>
          <h3>Tipo y estado</h3>
          <div class="badges">
            <span>{{ taskType }}</span
            ><span>{{ task.status }}</span>
          </div>
        </section>
        <section>
          <h3>Asignación</h3>
          <dl>
            <div>
              <dt>Tracker</dt>
              <dd>{{ task.trackerLabel || "Sin asignar" }}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{{ task.scheduledDate }}</dd>
            </div>
            <div v-if="task.estimatedMinutes">
              <dt>Duración</dt>
              <dd>{{ task.estimatedMinutes }} min</dd>
            </div>
          </dl>
        </section>
        <section>
          <h3>Ubicación y geometría</h3>
          <p>{{ geometryLabel }}</p>
          <button
            v-if="task.routePoint"
            class="focus"
            type="button"
            @click="emit('focus', task.routePoint)"
          >
            Enfocar en mapa
          </button>
        </section>
        <section v-if="task.type === 'duda'" class="notice">
          <h3>Capacidad restringida</h3>
          <p>Esta tarea automática es sólo de lectura en fase 1.</p>
        </section>
        <section v-else>
          <h3>Ruta</h3>
          <p>Posición {{ task.routeOrder ?? "sin definir" }}</p>
        </section></template
      >
    </div>
  </aside>
</template>
<style scoped>
.detail-panel {
  background: #fff;
  box-shadow: -4px 0 16px rgb(0 0 0 / 16%);
  display: flex;
  flex-direction: column;
}
.detail-panel header {
  align-items: start;
  border-bottom: 1px solid #e1ddd4;
  display: flex;
  justify-content: space-between;
  padding: 1rem;
}
.eyebrow {
  color: #b8892f;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 0.25rem;
  text-transform: uppercase;
}
.detail-panel h2 {
  color: #003f3b;
  font-size: 1rem;
  line-height: 1.25;
  margin: 0;
  max-width: 17rem;
}
.detail-panel header button {
  background: transparent;
  border: 0;
  color: #49605b;
  font-size: 1.5rem;
  line-height: 1;
}
.content {
  overflow: auto;
  padding: 1rem;
}
.content section {
  border-bottom: 1px solid #eeeae2;
  padding: 0 0 0.85rem;
  margin-bottom: 0.85rem;
}
.content h3 {
  color: #38514b;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  margin: 0 0 0.55rem;
  text-transform: uppercase;
}
.content p {
  color: #5e6863;
  font-size: 0.8rem;
  line-height: 1.45;
  margin: 0;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.badges span {
  background: #e7f0ed;
  border-radius: 999px;
  color: #00534e;
  font-size: 0.72rem;
  padding: 0.25rem 0.5rem;
}
dl {
  display: grid;
  gap: 0.55rem;
  margin: 0;
}
dl div {
  display: flex;
  font-size: 0.8rem;
  justify-content: space-between;
  gap: 1rem;
}
dt {
  color: #6b746e;
}
dd {
  color: #283c36;
  font-weight: 600;
  margin: 0;
  text-align: right;
}
.focus {
  background: #edf3f0;
  border: 1px solid #b9d1c9;
  border-radius: 0.35rem;
  color: #004643;
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 0.65rem;
  padding: 0.45rem 0.6rem;
}
.notice {
  background: #fdf3e3;
  border: 0 !important;
  border-radius: 0.4rem;
  padding: 0.65rem !important;
}
.notice h3 {
  color: #9b621c;
}
.state {
  color: #65716b;
  font-size: 0.82rem;
  text-align: center;
}
.state.error {
  color: #a73c33;
}
</style>
