<script setup lang="ts">
import { Check, UsersRound, X } from "lucide-vue-next";
import AutoComplete from "primevue/autocomplete";
import { computed, shallowRef, watch } from "vue";
import type { SeguimientoTracker } from "@/seguimiento/shared/trackers/tracker.types";
import type { SeguimientoTaskWorkerOption } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const props = defineProps<{
  workers: SeguimientoTaskWorkerOption[];
  trackers: SeguimientoTracker[];
  companions: string[];
  workerId: string | null;
  trackerSourceId: number | null;
  companionNames: string[];
  workerError?: string | null;
  trackerError?: string | null;
  lockWorker?: boolean;
  lockTracker?: boolean;
}>();
const emit = defineEmits<{
  "update:worker": [value: string];
  "update:tracker": [value: number];
  "update:companions": [value: string[]];
}>();
type Option = { id: string | number; label: string };
const workerSelection = shallowRef<Option | null>(null);
const trackerSelection = shallowRef<Option | null>(null);
const companionSelection = shallowRef<string | null>(null);
const workerOptions = computed<Option[]>(() => props.workers);
const trackerOptions = computed<Option[]>(() =>
  props.trackers.map((tracker) => ({
    id: tracker.sourceId,
    label: tracker.label,
  })),
);
const workerSuggestions = shallowRef<Option[]>([]);
const trackerSuggestions = shallowRef<Option[]>([]);
const companionSuggestions = shallowRef<string[]>([]);
const filterOptions = <T extends Option | string>(
  options: T[],
  query: string,
) => {
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  if (!normalizedQuery) return [...options];
  return options.filter((option) => {
    const label = typeof option === "string" ? option : option.label;
    return label.toLocaleLowerCase("es").includes(normalizedQuery);
  });
};
function completeWorkers(event: { query: string }): void {
  workerSuggestions.value = filterOptions(workerOptions.value, event.query);
}
function completeTrackers(event: { query: string }): void {
  trackerSuggestions.value = filterOptions(trackerOptions.value, event.query);
}
function completeCompanions(event: { query: string }): void {
  const name = event.query.trim();
  const suggestions = filterOptions(props.companions, name);
  const matchesAvailableCompanion = props.companions.some(
    (companion) => companionKey(companion) === companionKey(name),
  );

  companionSuggestions.value =
    name && !matchesAvailableCompanion ? [name, ...suggestions] : suggestions;
}
const companionNamesByKey = computed(
  () =>
    new Set(
      props.companionNames.map((name) => name.trim().toLocaleLowerCase("es")),
    ),
);
function companionKey(name: string): string {
  return name.trim().toLocaleLowerCase("es");
}
function isCompanionSelected(name: string): boolean {
  return companionNamesByKey.value.has(companionKey(name));
}
function isOption(value: unknown): value is Option {
  return Boolean(value && typeof value === "object" && "id" in value);
}
function selectWorker(value: Option | string | null): void {
  if (isOption(value)) emit("update:worker", String(value.id));
}
function selectTracker(value: Option | string | null): void {
  if (isOption(value)) emit("update:tracker", Number(value.id));
}
function selectCompanion(value: string): void {
  const name = value.trim();
  if (!name) return;

  const nextNames = isCompanionSelected(name)
    ? props.companionNames.filter(
        (companion) => companionKey(companion) !== companionKey(name),
      )
    : [...props.companionNames, name];
  emit("update:companions", nextNames);
  companionSelection.value = null;
}
function removeCompanion(name: string): void {
  emit(
    "update:companions",
    props.companionNames.filter(
      (companion) => companionKey(companion) !== companionKey(name),
    ),
  );
}
watch(
  workerOptions,
  (options) => {
    workerSuggestions.value = [...options];
  },
  { immediate: true },
);
watch(
  trackerOptions,
  (options) => {
    trackerSuggestions.value = [...options];
  },
  { immediate: true },
);
watch(
  () => props.companions,
  (companions) => {
    companionSuggestions.value = [...companions];
  },
  { immediate: true },
);
watch(
  [() => props.workerId, () => props.workers],
  ([id]) => {
    workerSelection.value =
      props.workers.find((worker) => worker.id === id) ?? null;
  },
  { immediate: true },
);
watch(
  [() => props.trackerSourceId, () => props.trackers],
  ([id]) => {
    trackerSelection.value =
      trackerOptions.value.find((tracker) => tracker.id === id) ?? null;
  },
  { immediate: true },
);
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
      ><AutoComplete
        v-model="workerSelection"
        :disabled="lockWorker"
        :suggestions="workerSuggestions"
        option-label="label"
        force-selection
        complete-on-focus
        dropdown
        class="mt-1.5 w-full"
        input-class="task-assignment-autocomplete"
        placeholder="Selecciona un trabajador"
        @complete="completeWorkers"
        :invalid="Boolean(workerError)"
        @update:model-value="selectWorker($event)"
      />
    </label>
    <p
      v-if="workerError"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ workerError }}
    </p>
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Equipo / tracker <span class="text-danger">*</span
      ><AutoComplete
        v-model="trackerSelection"
        :disabled="lockTracker"
        :suggestions="trackerSuggestions"
        option-label="label"
        force-selection
        complete-on-focus
        dropdown
        class="mt-1.5 w-full"
        input-class="task-assignment-autocomplete"
        placeholder="Selecciona un equipo"
        @complete="completeTrackers"
        :invalid="Boolean(trackerError)"
        @update:model-value="selectTracker($event)"
      />
    </label>
    <p
      v-if="trackerError"
      class="mt-2 text-[11px] font-medium text-danger"
      role="alert"
    >
      {{ trackerError }}
    </p>
    <label class="mt-3 block text-xs font-bold text-slate-700"
      >Acompañante<AutoComplete
        v-model="companionSelection"
        :suggestions="companionSuggestions"
        force-selection
        complete-on-focus
        dropdown
        class="mt-1.5 w-full"
        input-class="task-assignment-autocomplete"
        maxlength="160"
        placeholder="Selecciona o escribe un acompañante"
        @complete="completeCompanions"
        @option-select="selectCompanion($event.value)"
      >
        <template #option="{ option }">
          <div class="flex w-full items-center justify-between gap-3">
            <span>{{ option }}</span>
            <Check
              v-if="isCompanionSelected(option)"
              class="size-4 shrink-0 text-main"
              aria-label="Seleccionado"
            />
          </div>
        </template> </AutoComplete
    ></label>
    <div
      v-if="companionNames.length"
      class="mt-2 flex flex-wrap gap-1.5"
      aria-label="Acompañantes seleccionados"
    >
      <span
        v-for="name in companionNames"
        :key="companionKey(name)"
        class="inline-flex min-h-7 items-center gap-1 rounded-full border border-main/20 bg-second px-2 py-1 text-[11px] font-semibold text-main"
      >
        {{ name }}
        <button
          class="grid size-4 place-items-center rounded-full text-main transition hover:bg-main/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
          type="button"
          :aria-label="`Eliminar a ${name}`"
          @click="removeCompanion(name)"
        >
          <X class="size-3" aria-hidden="true" />
        </button>
      </span>
    </div>
  </section>
</template>

<style scoped>
:deep(.task-assignment-autocomplete) {
  min-height: 2.75rem;
  width: 100%;
  border-radius: 0.5rem;
  border-color: rgb(203 213 225);
  font-size: 0.75rem;
}
</style>
