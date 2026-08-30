<script setup lang="ts">
import { AlertTriangle, MapPin, Save, X } from "lucide-vue-next";
import TaskAssignmentSection from "./TaskAssignmentSection.vue";
import TaskDetailsSection from "./TaskDetailsSection.vue";
import TaskTypeSelector from "./TaskTypeSelector.vue";
import TaskGeometrySection from "./TaskGeometrySection.vue";
import TaskRoutePosition from "./TaskRoutePosition.vue";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import type {
  SeguimientoOperationalGeography,
  SeguimientoTaskWorkerOption,
} from "@/stores/seguimiento/tareas/tareasSeguimiento.types";
import type {
  TareaCreacionBorrador,
  TareaCreacionErrorValidacion,
  TareaCreacionTipo,
  TareaCreacionModoGeometria,
} from "@/stores/seguimiento/tareas/creacion/tareaCreacion.types";
const props = defineProps<{
  draft: TareaCreacionBorrador;
  workers: SeguimientoTaskWorkerOption[];
  trackers: SeguimientoTracker[];
  companions: string[];
  totalTasks: number;
  errors: TareaCreacionErrorValidacion[];
  showDiscardConfirmation: boolean;
  geography: SeguimientoOperationalGeography[];
  geometryMode: TareaCreacionModoGeometria;
  remoteError: string | null;
  submitting: boolean;
  canSubmit: boolean;
  lockWorker: boolean;
  lockTracker: boolean;
}>();
const emit = defineEmits<{
  close: [];
  continueEditing: [];
  discard: [];
  "update:type": [value: TareaCreacionTipo];
  "update:worker": [value: string];
  "update:tracker": [value: number];
  "update:companions": [value: string[]];
  "update:details": [value: Partial<TareaCreacionBorrador["details"]>];
  "update:geometry": [value: Partial<TareaCreacionBorrador["geometry"]>];
  "update:route": [value: number | null];
  "edit:geometry": [value: Exclude<TareaCreacionModoGeometria, null>];
  "finish:geometry": [];
  submit: [];
}>();
const errorFor = (field: TareaCreacionErrorValidacion["field"]) =>
  props.errors.find((error) => error.field === field)?.message ?? null;
</script>

<template>
  <aside
    class="flex h-full min-h-0 flex-col bg-white shadow-[-4px_0_16px_rgb(0_0_0_/_16%)]"
    aria-label="Crear tarea"
  >
    <header class="border-b border-slate-200 p-4">
      <div class="flex items-start gap-3">
        <div
          class="grid size-9 place-items-center rounded-lg bg-second text-main"
        >
          <MapPin class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="text-[10px] font-extrabold uppercase tracking-[0.14em] text-warning"
          >
            Nueva tarea
          </p>
          <h2 class="mt-1 text-sm font-bold text-slate-800">
            Crear tarea operativa
          </h2>
          <p class="mt-1 text-[11px] text-slate-500">
            Completa la asignación y los detalles base.
          </p>
        </div>
        <button
          class="grid size-11 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
          type="button"
          aria-label="Cerrar creación"
          @click="emit('close')"
        >
          <X class="size-5" />
        </button>
      </div>
    </header>
    <div class="min-h-0 flex-1 overflow-y-auto px-4">
      <TaskTypeSelector
        :model-value="draft.type"
        :error="errorFor('type')"
        @update:model-value="emit('update:type', $event)"
      /><TaskAssignmentSection
        :workers="workers"
        :trackers="trackers"
        :companions="companions"
        :worker-id="draft.worker?.id ?? null"
        :tracker-source-id="draft.tracker?.sourceId ?? null"
        :companion-names="draft.companions.map((companion) => companion.name)"
        :worker-error="errorFor('worker')"
        :tracker-error="errorFor('tracker')"
        :lock-worker="lockWorker"
        :lock-tracker="lockTracker"
        @update:worker="emit('update:worker', $event)"
        @update:tracker="emit('update:tracker', $event)"
        @update:companions="emit('update:companions', $event)"
      /><TaskDetailsSection
        :details="draft.details"
        :instructions-error="errorFor('instructions')"
        :estimated-minutes-error="errorFor('estimatedMinutes')"
        @update:details="emit('update:details', $event)"
      />
      <TaskGeometrySection
        :type="draft.type"
        :geometry="draft.geometry"
        :geography="geography"
        :area-id="draft.areaId"
        :mode="geometryMode"
        :location-error="errorFor('location')"
        :route-point-error="errorFor('routePoint')"
        :control-line-error="errorFor('controlLine')"
        :control-zone-error="errorFor('controlZone')"
        @update:location="emit('update:geometry', { locationId: $event })"
        @edit="emit('edit:geometry', $event)"
        @finish="emit('finish:geometry')"
      />
      <TaskRoutePosition
        :order="draft.route.order"
        :total-tasks="totalTasks"
        :error="errorFor('route')"
      />
      <p
        v-if="remoteError"
        class="mb-3 rounded-lg border border-danger/30 bg-danger-bg p-3 text-[11px] leading-5 text-danger"
        role="alert"
      >
        {{ remoteError }}
      </p>
    </div>
    <footer class="border-t border-slate-200 bg-white p-3">
      <button
        class="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-main px-3 text-xs font-extrabold text-white transition hover:bg-main-light disabled:cursor-not-allowed disabled:opacity-55"
        :disabled="!canSubmit"
        type="button"
        @click="emit('submit')"
      >
        <Save class="size-4" />{{ submitting ? "Guardando…" : "Guardar tarea" }}
      </button>
    </footer>
    <div
      v-if="showDiscardConfirmation"
      class="border-t border-warning/30 bg-warning-bg p-3"
    >
      <div class="flex gap-2">
        <AlertTriangle class="mt-0.5 size-4 shrink-0 text-warning" />
        <p class="text-xs leading-5 text-slate-700">
          Hay cambios sin guardar. ¿Deseas descartarlos?
        </p>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-2">
        <button
          class="min-h-11 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-600"
          type="button"
          @click="emit('continueEditing')"
        >
          Seguir editando</button
        ><button
          class="min-h-11 rounded-lg bg-danger text-xs font-bold text-white"
          type="button"
          @click="emit('discard')"
        >
          Descartar
        </button>
      </div>
    </div>
  </aside>
</template>
