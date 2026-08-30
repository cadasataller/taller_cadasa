<script setup lang="ts">
import { UsersRound } from "lucide-vue-next";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import type { SeguimientoTaskWorkerOption } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

defineProps<{
  workers: SeguimientoTaskWorkerOption[];
  trackers: SeguimientoTracker[];
  workerId: string | null;
  trackerSourceId: number | null;
  companionName: string | null;
  error?: string | null;
}>();
const emit = defineEmits<{
  "update:worker": [value: string];
  "update:tracker": [value: number];
  "update:companion": [value: string | null];
}>();
</script>

<template>
  <section
    aria-labelledby="create-task-assignment"
    class="border-b border-slate-100 py-4"
  >
    <div class="flex items-center gap-2">
      <UsersRound class="size-4 text-main" aria-hidden="true" />
      <h3
        id="create-task-assignment"
        class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600"
      >
        Asignación
      </h3>
    </div>
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Trabajador <span class="text-danger">*</span
      ><select
        class="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-main focus:ring-2 focus:ring-main/15"
        :value="workerId ?? ''"
        @change="
          emit('update:worker', ($event.target as HTMLSelectElement).value)
        "
      >
        <option disabled value="">Selecciona un trabajador</option>
        <option v-for="worker in workers" :key="worker.id" :value="worker.id">
          {{ worker.label }}
        </option>
      </select></label
    >
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Equipo / tracker <span class="text-danger">*</span
      ><select
        class="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-main focus:ring-2 focus:ring-main/15"
        :value="trackerSourceId ?? ''"
        @change="
          emit(
            'update:tracker',
            Number(($event.target as HTMLSelectElement).value),
          )
        "
      >
        <option disabled value="">Selecciona un tracker</option>
        <option
          v-for="tracker in trackers"
          :key="tracker.sourceId"
          :value="tracker.sourceId"
        >
          {{ tracker.label }}
        </option>
      </select></label
    >
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Acompañante<select
        class="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-main focus:ring-2 focus:ring-main/15"
        :value="companionName ?? ''"
        @change="
          emit(
            'update:companion',
            ($event.target as HTMLSelectElement).value || null,
          )
        "
      >
        <option value="">Sin acompañante</option>
      </select></label
    >
    <p
      v-if="error"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ error }}
    </p>
  </section>
</template>
