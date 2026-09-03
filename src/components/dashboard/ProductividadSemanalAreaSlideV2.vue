<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRef, useTemplateRef } from 'vue';
import {
  CalendarDays,
  Check,
  ChevronDown,
  CircleGauge,
  Clock3,
  FileText,
  Hourglass,
  MapPin,
  Settings2,
  UserRound,
  UsersRound,
} from 'lucide-vue-next';
import { useSlideProductividadViewModel } from '@/composables/useSlideProductividadViewModel';
import { useLivePanamaCaptureTime } from '@/composables/useLivePanamaCaptureTime';
import type { ProductividadSemanalArea } from '@/stores/horasTrabajo.types';
import type { ProductividadDashboardTableItem } from '@/stores/productividadSemanalDashboard.types';
import { useUsageOrdenesActividadUsuariosStore } from '@/stores/db_mantenimiento/usage_ordenes_actividad_usuarios/usageOrdenesActividadUsuarios.store';
import type {
  ProductividadSlideHeroMetric,
  ProductividadSlideOperationalCause,
  ProductividadSlidePersonalCause,
} from '@/components/dashboard/productividadSlide.types';
import { formatPanamaDateTime } from '@/utils/dateUtils';

const props = defineProps<{
  area: ProductividadSemanalArea;
  semana: string;
  dashboardTables?: ProductividadDashboardTableItem[];
  availableAreas?: ProductividadSemanalArea[];
}>();
const emit = defineEmits<{
  selectArea: [area: ProductividadSemanalArea];
}>();

const usageOrdenesActividadUsuariosStore = useUsageOrdenesActividadUsuariosStore();
const { captureTimestampLabel } = useLivePanamaCaptureTime();
const viewModel = useSlideProductividadViewModel({
  area: toRef(props, 'area'),
  dashboardTables: toRef(props, 'dashboardTables'),
  semana: toRef(props, 'semana'),
});

const heroMetrics = computed(() => viewModel.value.heroMetrics);
const idealMetric = computed(() => heroMetrics.value[0] as ProductividadSlideHeroMetric | undefined);
const delayFreeMetric = computed(() => heroMetrics.value[1] as ProductividadSlideHeroMetric | undefined);
const equivalentMetric = computed(() => heroMetrics.value[2] as ProductividadSlideHeroMetric | undefined);

const personalCauses = computed(() => (
  viewModel.value.personalDelay.causes as ProductividadSlidePersonalCause[]
));

const operationalCauses = computed(() => (
  viewModel.value.operationalDelay.causes as ProductividadSlideOperationalCause[]
));

const topTeams = computed(() => viewModel.value.topTeams.slice(0, 3));

const summaryIcons = [Clock3, Clock3, UsersRound, FileText];
const rankClasses = [
  'bg-[#003a24] text-white',
  'bg-[#8a724d] text-white',
  'bg-[#ff6b00] text-white',
];

const formatPercent = (value: number, withSign = false) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const prefix = withSign && safeValue > 0 ? '+' : '';
  return `${prefix}${safeValue.toFixed(1)}%`;
};

const formatHours = (value: number) => `${(Number.isFinite(value) ? value : 0).toFixed(0)} h`;

const formatDelayDuration = (value: number) => {
  const safeValue = Math.max(0, Number.isFinite(value) ? value : 0);
  const totalHours = Math.round(safeValue);
  const days = Math.floor(totalHours / 8);
  const hours = totalHours % 8;

  if (days <= 0) {
    return `${hours} h`;
  }

  if (hours === 0) {
    return `${days} d`;
  }

  return `${days} d ${hours} h`;
};

const totalDelayLabel = computed(() => (
  formatDelayDuration(viewModel.value.totalDelayHours)
));

const operationalPairs = computed(() => {
  const filled = operationalCauses.value.slice(0, 2);
  while (filled.length < 2) {
    filled.push({
      cause: '-----',
      hours: 0,
      equipments: ['-----'],
    });
  }

  return filled;
});

const personalCauseRows = computed(() => {
  const causes = personalCauses.value.slice(0, 4);

  if (causes.length <= 1) return [causes];
  if (causes.length === 2) return [causes];
  if (causes.length === 3) return [[causes[0]], [causes[1], causes[2]]];
  return [causes.slice(0, 2), causes.slice(2, 4)];
});

const summaryItemClass = (index: number) => {
  if (index === 1) return 'text-[#ff2d20]';
  return 'text-main';
};

const summaryHaloClass = (index: number) => {
  if (index === 1) return 'bg-[#fff1f0] text-[#ff2d20]';
  return 'bg-[#edf6e8] text-main';
};

const weeklyToneClass = (index: number) => {
  if (index === 1) return 'border-[#3654ff] text-[#3654ff]';
  return 'border-[#2c8e36] text-main';
};

const helperToneClass = (tone?: ProductividadSlideHeroMetric['helperTone']) => {
  if (tone === 'success') return 'text-green-600';
  if (tone === 'danger') return 'text-red-600';
  if (tone === 'info') return 'text-blue-600';
  if (tone === 'warning') return 'text-amber-600';
  return 'text-gray-500';
};

const metricToneClass = (tone?: ProductividadSlideHeroMetric['primaryTone']) => {
  if (tone === 'success') return 'border-green-600 text-green-600';
  if (tone === 'danger') return 'border-red-600 text-red-600';
  if (tone === 'info') return 'border-blue-600 text-blue-600';
  if (tone === 'warning') return 'border-amber-600 text-amber-600';
  return 'border-gray-400 text-gray-500';
};

const normalizeAreaKey = (value: string) => String(value || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const formatAreaName = (value: string) => String(value || '')
  .trim()
  .toLowerCase()
  .split(/\s+/)
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const displayAreaName = computed(() => formatAreaName(viewModel.value.areaName));
const isAreaMenuOpen = ref(false);
const areaSelectorRef = useTemplateRef<HTMLElement>('areaSelectorRef');
const availableAreaOptions = computed(() => (
  props.availableAreas?.length ? props.availableAreas : [props.area]
));
const canChooseArea = computed(() => availableAreaOptions.value.length > 1);

const isCurrentArea = (candidateArea: ProductividadSemanalArea) => (
  normalizeAreaKey(candidateArea.area) === normalizeAreaKey(props.area.area)
);

const areaUsageActivity = computed(() => (
  usageOrdenesActividadUsuariosStore.obtenerPorArea(props.area.area)[0] ?? null
));

const formatUsageDateTime = (value: string | null) => (
  value ? formatPanamaDateTime(value) : 'Sin registro'
);

const formatUsageText = (value: string | null | undefined, fallback = 'Sin registro') => {
  const normalized = String(value || '').trim();
  return normalized || fallback;
};

const formatOmStatusLabel = (value: string | null | undefined) => {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return 'Sin registro';
  }

  return normalized.toUpperCase() === 'NR' ? 'Buen Estado' : normalized;
};

const latestUpdatedOrderLabel = computed(() => {
  const activity = areaUsageActivity.value;

  if (!activity) {
    return 'Sin registro';
  }

  const equipo = formatUsageText(activity.equipo_actualizado, '');
  const descripcion = formatUsageText(activity.descripcion_actualizada, '');
  const estadoAnterior = formatOmStatusLabel(activity.estado_anterior);
  const estadoNuevo = formatOmStatusLabel(activity.estado_nuevo);
  const orderParts = [equipo, descripcion].filter(Boolean);
  const orderLabel = orderParts.length > 0 ? orderParts.join(' ') : formatUsageText(activity.id_orden_actualizada);

  return `${orderLabel}: ${estadoAnterior} -> ${estadoNuevo}`;
});

const toggleAreaMenu = () => {
  if (!canChooseArea.value) return;
  isAreaMenuOpen.value = !isAreaMenuOpen.value;
};

const closeAreaMenu = () => {
  isAreaMenuOpen.value = false;
};

const handleAreaSelect = (selectedArea: ProductividadSemanalArea) => {
  emit('selectArea', selectedArea);
  closeAreaMenu();
};

const handlePointerDownOutside = (event: MouseEvent) => {
  if (!isAreaMenuOpen.value) return;
  if (!(event.target instanceof Node)) return;
  if (areaSelectorRef.value?.contains(event.target)) return;
  closeAreaMenu();
};

onMounted(() => {
  if (!usageOrdenesActividadUsuariosStore.isLoaded && !usageOrdenesActividadUsuariosStore.isLoading) {
    void usageOrdenesActividadUsuariosStore.cargarActividad().catch(() => null);
  }
  document.addEventListener('mousedown', handlePointerDownOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handlePointerDownOutside);
});
</script>

<template>
  <article class="flex min-h-full w-full rounded-[18px] bg-[#fbfaf7] px-2 py-2 text-[#101010]">
    <div class="grid w-full grid-cols-12 grid-rows-[auto_auto_auto_1fr] gap-2">
      <header class="col-span-12 flex flex-col items-stretch gap-3 px-1 pt-1 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div class="min-w-0">
          <h1 class="font-display text-[2.7rem] leading-[0.95] tracking-[-0.03em] text-main">
            Productividad semanal por equipo
          </h1>
        </div>

        <div class="grid shrink-0 grid-cols-1 gap-2 lg:grid-cols-3">
          <div class="flex min-w-[170px] items-center gap-2 rounded-[16px] border border-[#ece9e1] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,20,20,0.05)]">
            <CalendarDays class="h-4 w-4 text-main" />
            <div>
              <p class="text-xs font-semibold text-gray-500">Semana</p>
              <p class="text-base font-semibold text-gray-900">{{ viewModel.weekLabel }}</p>
            </div>
          </div>

          <div class="flex min-w-[195px] items-center gap-2 rounded-[16px] border border-[#ece9e1] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,20,20,0.05)]">
            <UserRound class="h-4 w-4 text-main" />
            <div class="min-w-0">
              <p class="text-xs font-semibold text-gray-500">Supervisor</p>
              <p class="line-clamp-1 text-base font-semibold text-gray-900">{{ viewModel.supervisorName }}</p>
            </div>
          </div>

          <div ref="areaSelectorRef" class="relative min-w-[180px]">
            <div
              class="flex items-center gap-2 rounded-[16px] border border-[#ece9e1] bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,20,20,0.05)]"
              :class="canChooseArea ? 'cursor-pointer transition hover:border-main/30 hover:bg-[#f8faf5]' : ''"
              role="button"
              :tabindex="canChooseArea ? 0 : -1"
              :aria-expanded="isAreaMenuOpen"
              aria-haspopup="listbox"
              @click="toggleAreaMenu"
              @keydown.enter.prevent="toggleAreaMenu"
              @keydown.space.prevent="toggleAreaMenu"
              @keydown.esc.prevent="closeAreaMenu"
            >
              <MapPin class="h-4 w-4 text-main" />
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-gray-500">Area</p>
                <p class="line-clamp-1 text-base font-semibold text-gray-900">{{ displayAreaName }}</p>
              </div>
              <ChevronDown
                v-if="canChooseArea"
                class="h-4 w-4 shrink-0 text-gray-400 transition"
                :class="isAreaMenuOpen ? 'rotate-180' : ''"
              />
            </div>

            <div
              v-if="isAreaMenuOpen"
              class="absolute right-0 top-[calc(100%+0.45rem)] z-[120] w-full min-w-[220px] overflow-hidden rounded-[16px] border border-[#ece9e1] bg-white p-1 shadow-[0_14px_30px_rgba(20,20,20,0.12)]"
              role="listbox"
              aria-label="Areas disponibles"
            >
              <div
                v-for="availableArea in availableAreaOptions"
                :key="availableArea.area"
                class="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] px-3 py-2 transition"
                :class="isCurrentArea(availableArea) ? 'bg-[#edf6e8] text-main' : 'text-gray-700 hover:bg-[#f6f5f1]'"
                role="option"
                :aria-selected="isCurrentArea(availableArea)"
                @click.stop="handleAreaSelect(availableArea)"
              >
                <div class="min-w-0">
                  <p class="line-clamp-1 text-sm font-semibold">
                    {{ formatAreaName(availableArea.area) }}
                  </p>
                  <p class="line-clamp-1 text-xs text-gray-500">
                    {{ availableArea.supervisor.nombre || 'Sin supervisor' }}
                  </p>
                </div>
                <Check
                  v-if="isCurrentArea(availableArea)"
                  class="h-4 w-4 shrink-0 text-main"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section class="col-span-12 grid grid-cols-1 gap-2 lg:grid-cols-[1.15fr_1fr_1fr]">
        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-center text-[0.95rem] font-semibold text-[#1d1d1d]">Avance ideal vs real</h2>
          <div class="mt-2 grid grid-cols-2 items-center gap-3">
            <div class="flex flex-col items-center">
              <div class="flex h-[98px] w-[98px] items-center justify-center rounded-full border-[3px] border-[#102018] text-main">
                <span class="text-[1rem] font-bold">{{ formatPercent(idealMetric?.primaryValue ?? 0) }}</span>
              </div>
              <p class="mt-1 text-[0.95rem] font-medium text-[#242424]">{{ idealMetric?.primaryLabel }}</p>
            </div>

            <div class="flex flex-col items-center">
              <div class="flex h-[98px] w-[98px] items-center justify-center rounded-full border-[3px] border-[#198a27] text-[#198a27]">
                <span class="text-[1rem] font-bold">{{ formatPercent(idealMetric?.secondaryValue ?? 0) }}</span>
              </div>
              <p class="mt-1 text-[0.95rem] font-medium text-[#242424]">{{ idealMetric?.secondaryLabel }}</p>
            </div>
          </div>
          <p
            class="mt-1 text-center text-[1rem] font-semibold"
            :class="helperToneClass(idealMetric?.helperTone)"
          >
            {{ idealMetric?.helper }}
          </p>
        </article>

        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-center text-[0.95rem] font-semibold text-[#1d1d1d]">Avance sin retraso</h2>
          <div class="mt-2 grid grid-cols-2 items-center gap-3">
            <div class="flex flex-col items-center">
              <div class="flex h-[98px] w-[98px] flex-col items-center justify-center rounded-full border-[3px] border-[#ff2d20] px-2 text-[#ff2d20]">
                <span class="text-[1rem] font-bold">{{ formatPercent(delayFreeMetric?.secondaryValue ?? 0) }}</span>
                <span class="mt-1 text-center text-[0.78rem] leading-3 text-[#202020]">Pérdida de avance</span>
              </div>
              <p class="mt-1 text-[0.82rem] font-medium text-[#242424]">{{ delayFreeMetric?.helper?.replace('Operativo ', 'op. ').replace('Personal ', 'per. ') }}</p>
            </div>

            <div class="flex flex-col items-center">
              <div class="flex h-[98px] w-[98px] items-center justify-center rounded-full border-[3px] border-[#102018] text-main">
                <span class="text-[1rem] font-bold">{{ formatPercent(delayFreeMetric?.primaryValue ?? 0) }}</span>
              </div>
              <p class="mt-1 text-[0.95rem] font-medium text-[#242424]">{{ delayFreeMetric?.primaryLabel }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-center text-[0.95rem] font-semibold text-[#1d1d1d]">Avance equivalente</h2>
          <div class="mt-2 flex flex-col items-center">
            <div
              class="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full border-[3px]"
              :class="metricToneClass(equivalentMetric?.primaryTone)"
            >
              <span class="text-[1rem] font-bold">{{ formatPercent(equivalentMetric?.primaryValue ?? 0, true) }}</span>
              <span class="text-[0.9rem] font-medium text-[#202020]">Equivalente</span>
            </div>
            <p class="mt-2 text-[0.9rem] font-medium text-[#1a1a1a]">
              2026:
              <span class="ml-1 text-[#198a27]">{{ formatPercent(equivalentMetric?.secondaryValue ?? 0) }}</span>
              <span class="mx-2">•</span>
              2025:
              <span class="ml-1 text-[#3654ff]">{{ equivalentMetric?.helper?.split('2025: ')[1] }}</span>
            </p>
          </div>
        </article>
      </section>

      <section class="col-span-12 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_0.98fr]">
        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-[1rem] font-semibold text-[#1d1d1d]">Productividad semanal</h2>
          <div class="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-4">
            <div
              v-for="(item, index) in viewModel.summaryItems"
              :key="item.label"
              class="flex min-h-[118px] flex-col items-center justify-start px-2 text-center"
              :class="index < viewModel.summaryItems.length - 1 ? 'border-b border-[#ece8df] pb-2 lg:border-b-0 lg:border-r lg:pb-0' : ''"
            >
              <div class="flex h-14 w-14 items-center justify-center rounded-full" :class="summaryHaloClass(index)">
                <component :is="summaryIcons[index]" class="h-6 w-6" />
              </div>
              <p class="mt-3 text-[1rem] font-bold" :class="summaryItemClass(index)">
                {{ item.label === 'Retrasos' ? formatDelayDuration(viewModel.totalDelayHours) : item.value }}
              </p>
              <p class="mt-1 text-[0.9rem] leading-5 text-[#252525]">{{ item.label }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-[1rem] font-semibold text-[#1d1d1d]">Equipos con mas horas trabajadas</h2>
          <div v-if="topTeams.length > 0" class="mt-2 divide-y divide-[#efebe2]">
            <div
              v-for="(team, index) in topTeams"
              :key="`${team.team}-${team.rank}`"
              class="grid grid-cols-[3.3rem_1fr_4.5rem] items-center gap-3 py-2.5"
            >
              <div class="flex h-[46px] w-[46px] items-center justify-center rounded-full text-[0.95rem] font-bold" :class="rankClasses[index] || rankClasses[2]">
                #{{ team.rank }}
              </div>
              <div class="min-w-0">
                <p class="font-mono text-[0.95rem] font-bold text-main">{{ team.team }}</p>
                <p class="line-clamp-2 text-[0.82rem] leading-4 text-[#242424]">{{ team.description }}</p>
              </div>
              <p class="text-right text-[1rem] font-bold text-[#101010]">{{ formatHours(team.hours) }}</p>
            </div>
          </div>
          <div
            v-else
            class="mt-3 flex min-h-[118px] items-center justify-center rounded-[14px] border border-dashed border-[#d8d5cd] bg-[#faf8f3] px-4 text-center"
          >
            <p class="text-[0.92rem] font-medium text-gray-500">
              No se trabajó ningún equipo.
            </p>
          </div>
        </article>
      </section>

      <section class="col-span-12 rounded-[18px] border border-[#ece9e1] bg-white px-4 py-2 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
        <h2 class="text-center text-[0.95rem] font-semibold text-[#1d1d1d]">Resumen semanal</h2>
        <div class="mt-1 grid grid-cols-1 items-center lg:grid-cols-3">
          <div
            v-for="(value, index) in [viewModel.weeklyProgress.currentWeek, viewModel.weeklyProgress.previousWeek, viewModel.weeklyProgress.currentTotal]"
            :key="index"
            class="flex flex-col items-center py-1.5"
            :class="index < 2 ? 'border-b border-[#ece8df] lg:border-b-0 lg:border-r' : ''"
          >
            <div class="flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] text-[0.9rem] font-semibold" :class="weeklyToneClass(index)">
              {{ formatPercent(value) }}
            </div>
            <p class="mt-1 text-[0.84rem] text-[#202020]">
              {{ index === 0 ? 'Esta semana' : index === 1 ? 'Semana anterior' : 'Avance actual' }}
            </p>
          </div>
        </div>
      </section>

      <section class="col-span-12 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_11rem]">
        <article class="rounded-[18px] border border-[#ece9e1] bg-white px-4 py-2 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
          <h2 class="text-[1rem] font-semibold text-[#1d1d1d]">Retrasos</h2>

          <div class=" divide-y divide-[#ece8df]">
            <div class="grid grid-cols-1 items-center gap-3 pb-3 lg:grid-cols-[12rem_6rem_8rem_8rem_1fr] lg:pb-1">
              <div class="flex items-center gap-3 border-b border-[#ece8df] pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#fff2f1_0%,#fde9e7_100%)] text-[#ff453d]">
                  <UsersRound class="h-6 w-6" />
                </div>
                <div>
                  <p class="text-[0.95rem] leading-5 text-[#202020]">Retraso<br>Personal</p>
                </div>
              </div>

              <div class="text-center">
                <p class="text-[0.84rem] text-[#202020]">Tiempo</p>
                <p class="mt-1 text-[1rem] font-bold text-[#ff2d20]">{{ formatDelayDuration(viewModel.personalDelay.hours) }}</p>
              </div>

              <div class="text-center">
                <p class="text-[0.84rem] text-[#202020]">Personal faltante</p>
                <p class="mt-1 text-[1rem] font-bold text-[#ff2d20]">{{ viewModel.personalDelay.missingPeople ?? 0 }}</p>
              </div>

              <div class="text-center">
                <p class="text-[0.84rem] text-[#202020]">Personal activo</p>
                <p class="mt-1 text-[1rem] font-bold text-main">{{ viewModel.personalDelay.activePeople ?? 0 }}</p>
              </div>

              <div class="text-center">
                <p class="mb-1 text-[0.84rem] text-[#202020]">Causas principales</p>
                <div
                  v-if="personalCauseRows.some((row) => row.length > 0)"
                  class="flex flex-col gap-2"
                >
                  <div
                    v-for="(row, rowIndex) in personalCauseRows"
                    :key="`personal-row-${rowIndex}`"
                    class="flex w-full items-center justify-center gap-2"
                  >
                    <div
                      v-for="cause in row"
                      :key="cause.label"
                      class="min-w-[150px] rounded-[10px] border border-[#ffb3ad] bg-[#fffafb] px-2 py-1.5 text-center text-[0.8rem] font-medium text-[#2d2d2d]"
                    >
                      {{ cause.label }}
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="flex items-center justify-center rounded-[10px] border border-dashed border-[#d8d5cd] bg-white px-2 py-1.5 text-center text-[0.8rem] text-gray-400"
                >
                  -----
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 items-center gap-3 py-2.5 lg:grid-cols-[12rem_6rem_1fr]">
              <div class="flex items-center gap-3 border-b border-[#ece8df] pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#fff4ec_0%,#feecdf_100%)] text-[#ff6b00]">
                  <Settings2 class="h-6 w-6" />
                </div>
                <div>
                  <p class="text-[0.95rem] leading-5 text-[#202020]">Retraso<br>Operativo</p>
                </div>
              </div>

              <div class="text-center">
                <p class="text-[0.84rem] text-[#202020]">Tiempo</p>
                <p class="mt-1 text-[1rem] font-bold text-[#ff6b00]">{{ formatDelayDuration(viewModel.operationalDelay.hours) }}</p>
              </div>

              <div>
                <p class="mb-1 text-[0.84rem] text-[#202020]">Causas y equipos asociados</p>
                <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  <div
                    v-for="cause in operationalPairs"
                    :key="cause.cause"
                    class="space-y-1.5 rounded-[12px] border border-[#ffc7a2] bg-[#fffaf5] px-2 py-2"
                  >
                    <div class="rounded-[10px] px-2 py-1 text-center text-[0.82rem] font-semibold text-[#ff6b00]">
                      {{ cause.cause }}
                    </div>
                    <div class="flex flex-wrap items-center justify-center gap-1.5">
                      <span
                        v-for="equipment in cause.equipments.slice(0, 3)"
                        :key="`${cause.cause}-${equipment}`"
                        class="rounded-[8px] bg-[#f7e7dc] px-2 py-1 text-[0.78rem] font-medium text-[#3a3a3a]"
                      >
                        {{ equipment }}
                      </span>
                      <span
                        v-if="cause.equipments.length === 0 || cause.equipments[0] === '-----'"
                        class="rounded-[8px] border border-dashed border-[#d8d5cd] px-2 py-1 text-[0.78rem] text-gray-400"
                      >
                        -----
                      </span>
                      <span
                        v-if="cause.equipments.length > 3"
                        class="rounded-[8px] bg-[#f7e7dc] px-2 py-1 text-[0.78rem] font-medium text-[#3a3a3a]"
                      >
                        +{{ cause.equipments.length - 3 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside class="flex flex-col items-center justify-center rounded-[16px] border border-[#ffd8d4] bg-[linear-gradient(180deg,#fff4f3_0%,#ffe9e6_100%)] px-3 py-4 text-center text-[#ff2d20] shadow-[0_10px_28px_rgba(255,45,32,0.08)]">
          <Hourglass class="h-9 w-9" />
          <p class="mt-4 text-[2.8rem] font-bold leading-none">{{ totalDelayLabel }}</p>
          <p class="mt-1 text-[0.84rem] leading-5">tiempo<br>retrasado</p>
        </aside>
      </section>

      <section class="col-span-12 rounded-[18px] border border-[#ece9e1] bg-white px-4 py-2 shadow-[0_10px_28px_rgba(20,20,20,0.04)]">
        <h2 class="text-center text-[0.95rem] font-semibold text-[#1d1d1d]">Avance sin retraso semanal</h2>
        <div class="mt-1 grid grid-cols-1 items-center lg:grid-cols-3">
          <div class="flex flex-col items-center border-b border-[#ece8df] py-1.5 lg:border-b-0 lg:border-r">
            <div class="flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-[#ff2d20] text-[0.9rem] font-semibold text-[#ff2d20]">
              {{ formatPercent(viewModel.weeklyDelayProgress.lost) }}
            </div>
            <p class="mt-1 text-[0.84rem] text-[#202020]">Retraso semanal</p>
            <p class="mt-0.5 text-[0.76rem] font-medium text-[#5b5b5b]">
              Op. {{ formatPercent(viewModel.weeklyDelayProgress.operational) }} · Per. {{ formatPercent(viewModel.weeklyDelayProgress.personal) }}
            </p>
          </div>

          <div class="flex flex-col items-center border-b border-[#ece8df] py-1.5 lg:border-b-0 lg:border-r">
            <div class="flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-[#2c8e36] text-[0.9rem] font-semibold text-main">
              {{ formatPercent(viewModel.weeklyDelayProgress.real) }}
            </div>
            <p class="mt-1 text-[0.84rem] text-[#202020]">Avance real</p>
          </div>

          <div class="flex flex-col items-center py-1.5">
            <div class="flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-[#3654ff] text-[0.9rem] font-semibold text-[#3654ff]">
              {{ formatPercent(viewModel.weeklyDelayProgress.approximated) }}
            </div>
            <p class="mt-1 text-[0.84rem] text-[#202020]">Avance aproximado</p>
          </div>
        </div>
      </section>

      <section class="col-span-12">
        <div class="flex flex-col gap-1.5 rounded-[14px] border border-[#f0ede6] bg-white/70 px-3 py-1.5 text-[0.7rem] text-[#7a7a7a] shadow-[0_4px_14px_rgba(20,20,20,0.03)] lg:flex-row lg:items-center lg:justify-between lg:gap-3">
          <p class="min-w-0">
            <span class="font-medium text-[#6c6c6c]">Momen. capt:</span>
            <span class="ml-1 break-words">{{ captureTimestampLabel }}</span>
          </p>
          <p class="min-w-0">
            <span class="font-medium text-[#6c6c6c]">Ult. vista ords.:</span>
            <span class="ml-1 break-words">{{ formatUsageDateTime(areaUsageActivity?.ultima_entrada_ordenes_at ?? null) }}</span>
          </p>
          <p class="min-w-0">
            <span class="font-medium text-[#6c6c6c]">Ult. cambio estado:</span>
            <span class="ml-1 break-words">{{ formatUsageDateTime(areaUsageActivity?.ultima_actualizacion_om_at ?? null) }}</span>
          </p>
          <p class="min-w-0 lg:max-w-[42%]">
            <span class="font-medium text-[#6c6c6c]">OM actualizada:</span>
            <span class="ml-1 break-words">{{ latestUpdatedOrderLabel }}</span>
          </p>
        </div>
      </section>
    </div>
  </article>
</template>
