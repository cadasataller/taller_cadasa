<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { supabase } from '@/lib/supabase';
import { useMaintenanceStore, type OrdenMantenimiento } from '@/stores/maintenanceStore';
import { useHorasTrabajoStore, type HorasPerdidasPersonalRow } from '@/stores/horasTrabajoStore';
import { storeToRefs } from 'pinia';
import EChart from '@/components/ui/EChart.vue';
import TablaHorasPerdidasMotivo from '@/components/dashboard/horasPerdidasAreaMotivo/TablaHorasPerdidasMotivo.vue';
import { formatWorkDaysFromHours } from '@/utils/dashboardFormatters';
import {
  Search,
  RefreshCw,
  X,
  Loader2,
  ChevronRight,
  ChevronDown,
  Check,
  ClipboardList,
  Eye,
  EyeOff,
} from 'lucide-vue-next';

const maintenanceStore = useMaintenanceStore();
const horasTrabajoStore = useHorasTrabajoStore();
const {
  allOrders,
  isLoading: isStoreLoading,
  loadingProgress,
  activeFilters,
  zafraOrderTotalsByArea,
  zafraOrderTotalsGeneral
} = storeToRefs(maintenanceStore);
const { data: horasTrabajoData, horasPerdidasPersonal } = storeToRefs(horasTrabajoStore);
const { setStatusFilter, setWeekFilter } = maintenanceStore;

const isRefreshing = ref(false);
const userArea = ref('');
const targetLabel = "META 2.94% MIN";
const defaultEtapa = 'Zafra';

const windowWidth = ref(window.innerWidth);
const handleWindowResize = () => {
  windowWidth.value = window.innerWidth;
};
const MAX_VISIBLE_BARS = computed(() => {
  return windowWidth.value < 768 ? 6 : 7;
});

const isLoading = computed(() => isStoreLoading.value || !userArea.value);

// Filters
const filters = ref({
  etapa: defaultEtapa,
  area: '',
  item: '',
  idEquipo: ''
});

const activeDropdown = ref<string | null>(null);
const searchQueries = ref({
  etapa: '',
  area: '',
  item: '',
  idEquipo: ''
});

const selectedEquipmentId = ref<string | null>(null);
const showScrollButton = ref(false);
const weeklyLossVisible = ref(false);
const weeklyAreaCurrentWeekOnly = ref(false);
const weeklyAreaDetailMode = ref<'general' | 'detailed'>('general');
const showWeeklyAreaLostTime = ref(false);
const lostProgressCurrentWeekOnly = ref(false);
const showStatusCharts = ref(false);
const showLostProgressPercent = ref(false);
const showLostProgressTime = ref(true);
const weeklyLegendSelected = ref<Record<string, boolean>>({
  'NR 2026': true,
  'Pérdida Operativa': false,
  'Falta de Personal': false,
});
let scrollButtonTimer: ReturnType<typeof setTimeout> | null = null;

const normalizeAreaKey = (area: string) => String(area || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const defaultEtapaKey = normalizeAreaKey(defaultEtapa);

const hoursPerOrderByArea: Record<string, number> = {
  'COSECHA AGRICOLA': 2,
  'COSECHA MECANIZADA': 4,
  'ENGRASE': 8,
  'EQUIPO PESADO': 5,
};

const weeklyAreaSummaryAreaKeys = new Set([
  ...Object.keys(hoursPerOrderByArea),
  'MECANICA DE TRANSPORTE',
]);

const weeklyAreaShortNames: Record<string, string> = {
  'EQUIPO PESADO': 'E. Pesado',
  'COSECHA MECANIZADA': 'C. Mecanizada',
  'COSECHA AGRICOLA': 'C. Agrícola',
  'MECANICA DE TRANSPORTE': 'M. Transporte',
  'ENGRASE': 'Engrase',
};

const horasPerdidasAreaMotivoInitialDate = '2026-04-06';

interface PersonalLossBreakdown {
  totalHours: number;
  totalEquivalent: number;
  vacaciones: number;
  incapacidad: number;
  inactivo: number;
  plazaNoCubierta: number;
}

const getWeeklyAreaShortName = (area: string) => (
  weeklyAreaShortNames[normalizeAreaKey(area)] || area
);

const isEquipmentSerieFilterActive = (orders: OrdenMantenimiento[]) => {
  const serie = activeFilters.value.serie;

  if (!serie) return false;

  return orders.some((order) => String(order["ID_#EQUIPO"] || '') === serie);
};

const getDistinctWorkedEquipmentCount = (
  orders: OrdenMantenimiento[],
  areaKey: string,
  week: string
) => {
  const equipmentIds = orders
    .filter((order) => (
      normalizeAreaKey(order.Área || '') === areaKey &&
      String(getMaintenanceWeek(order)) === String(week)
    ))
    .map((order) => String(order["ID_#EQUIPO"] || '').trim())
    .filter(Boolean);

  return new Set(equipmentIds).size;
};

const getPersonalEquivalentHours = (
  hours: number,
  areaKey: string,
  week: string,
  ordersForProration: OrdenMantenimiento[],
  shouldProrate: boolean
) => {
  const hoursPerOrder = hoursPerOrderByArea[areaKey] || 0;

  if (hoursPerOrder <= 0 || hours <= 0) return 0;

  if (!shouldProrate) {
    return hours / hoursPerOrder;
  }

  const workedEquipments = getDistinctWorkedEquipmentCount(ordersForProration, areaKey, week);

  if (workedEquipments <= 0) return 0;

  return Math.round(hours / (workedEquipments * hoursPerOrder));
};

const buildPersonalLossBreakdown = (
  personalRows: HorasPerdidasPersonalRow[],
  areaKey: string,
  ordersForProration: OrdenMantenimiento[],
  shouldProrate: boolean
): PersonalLossBreakdown => {
  return personalRows.reduce<PersonalLossBreakdown>((acc, row) => {
    const equivalent = getPersonalEquivalentHours(
      Number(row.horas_perdidas_totales || 0),
      areaKey,
      row.semana,
      ordersForProration,
      shouldProrate
    );

    acc.totalHours += Number(row.horas_perdidas_totales || 0);
    acc.totalEquivalent += equivalent;
    acc.vacaciones += Number(row.horas_vacaciones || 0);
    acc.incapacidad += Number(row.horas_incapacidad || 0);
    acc.inactivo += Number(row.horas_inactivo || 0);
    acc.plazaNoCubierta += Number(row.horas_plaza_no_cubierta || 0);

    return acc;
  }, {
    totalHours: 0,
    totalEquivalent: 0,
    vacaciones: 0,
    incapacidad: 0,
    inactivo: 0,
    plazaNoCubierta: 0,
  });
};

const hasEquipmentScopedPersonalLoss = computed(() => (
  Boolean(filters.value.idEquipo) || isEquipmentSerieFilterActive(allOrders.value)
));

const progress2025StartWeek = 15;
const progress2025NormalizedComparisonBaseWeek = 20;

const progress2025General: Record<string, number> = {
  '20': 0.20, '21': 1.20, '22': 1.10, '23': 0.60, '24': 1.10,
  '25': 0.80, '26': 1.60, '27': 1.10, '28': 1.20, '29': 1.10,
  '30': 0.70, '31': 0.90, '32': 1.80, '33': 2.20, '34': 2.00,
  '35': 1.90, '36': 2.40, '37': 2.10, '38': 2.50, '39': 2.40,
  '40': 2.20, '41': 2.30, '42': 3.30, '43': 3.10, '44': 2.70,
  '45': 0.60, '46': 2.40, '47': 2.50, '48': 1.70, '49': 2.50,
  '50': 2.10, '51': 3.80, '52': 0.70
};

const progress2025ByArea: Record<string, Record<string, number>> = {
  'COSECHA AGRICOLA': {
    '20': 0.00, '21': 0.00, '22': 0.10, '23': 0.20, '24': 0.20,
    '25': 0.60, '26': 0.50, '27': 0.30, '28': 0.30, '29': 0.20,
    '30': 0.30, '31': 0.10, '32': 0.10, '33': 0.40, '34': 0.20,
    '35': 0.40, '36': 0.50, '37': 0.30, '38': 0.40, '39': 0.40,
    '40': 0.60, '41': 0.50, '42': 0.80, '43': 0.70, '44': 0.70,
    '45': 0.20, '46': 0.40, '47': 0.30, '48': 0.40, '49': 0.40
  },
  'MECANICA DE TRANSPORTE': {
    '21': 0.60, '22': 0.20, '24': 0.30, '26': 0.10, '32': 0.10,
    '33': 0.30, '36': 0.20, '37': 0.20, '38': 0.40, '39': 0.10,
    '40': 0.10, '41': 0.40, '42': 0.20, '43': 0.10, '44': 0.20,
    '46': 0.10
  },
  'ENGRASE': {
    '24': 0.10, '25': 0.10, '26': 0.10, '27': 0.10, '28': 0.00,
    '29': 0.00, '30': 0.10, '31': 0.10, '32': 0.10, '33': 0.30,
    '34': 0.10, '35': 0.20, '36': 0.20, '37': 0.10, '38': 0.00,
    '39': 0.10, '40': 0.10, '41': 0.10, '42': 0.00, '43': 0.00,
    '44': 0.00
  },
  'COSECHA MECANIZADA': {
    '20': 0.20, '21': 0.50, '22': 0.40, '23': 0.10, '24': 0.30,
    '25': 0.10, '26': 0.30, '27': 0.50, '28': 0.30, '29': 0.40,
    '30': 0.40, '31': 0.20, '32': 0.50, '33': 0.80, '34': 1.10,
    '35': 0.70, '36': 0.80, '37': 1.00, '38': 0.90, '39': 0.80,
    '40': 0.90, '41': 0.90, '42': 0.90, '43': 1.00, '44': 1.20,
    '45': 0.30, '46': 0.90, '47': 0.80, '48': 0.40, '49': 1.00
  },
  'EQUIPO PESADO': {
    '21': 0.60, '22': 0.20, '24': 0.30, '26': 0.10, '32': 0.10,
    '33': 0.30, '36': 0.20, '37': 0.20, '38': 0.40, '39': 0.10,
    '40': 0.10, '41': 0.40, '42': 0.20, '43': 0.10, '44': 0.20,
    '46': 0.10
  }
};

const progress2025AreaWeightByArea = computed<Record<string, number>>(() => (
  Object.entries(zafraOrderTotalsByArea.value).reduce<Record<string, number>>((acc, [areaKey, total]) => {
    acc[areaKey] = zafraOrderTotalsGeneral.value > 0
      ? total / zafraOrderTotalsGeneral.value
      : 0;
    return acc;
  }, {})
));

const delayedAbsenceHours2025ByArea: Record<string, Record<string, number>> = {
  'COSECHA AGRICOLA': {
    '15': 16.0, '16': 66.0, '17': 34.5, '18': 46.0, '19': 25.0,
    '20': 6.0, '21': 52.0, '22': 7.0, '23': 4.0, '24': 4.0,
    '25': 20.0, '26': 22.0, '27': 16.0, '28': 18.0, '29': 14.0,
    '30': 5.0, '31': 0.0, '32': 4.9, '33': 8.0, '34': 5.0,
    '35': 4.0, '36': 10.0, '37': 3.5, '38': 0.0, '39': 0.0,
    '40': 0.0, '41': 0.0, '42': 0.0, '43': 6.0, '44': 0.0,
    '45': 0.0, '46': 0.0
  },
  'COSECHA MECANIZADA': {
    '15': 100.0, '16': 59.0, '17': 74.0, '18': 74.0, '19': 56.0,
    '20': 60.0, '21': 85.0, '22': 50.0, '23': 60.0, '24': 40.0,
    '25': 76.0, '26': 40.0, '27': 50.0, '28': 68.0, '29': 66.0,
    '30': 32.0, '31': 8.0, '32': 4.0, '33': 9.0, '34': 22.0,
    '35': 8.0, '36': 12.0, '37': 9.0, '38': 4.0, '39': 8.0,
    '40': 0.0, '41': 0.0, '42': 0.0, '43': 0.0, '44': 24.0,
    '45': 0.0, '46': 0.0
  },
  'ENGRASE': {
    '15': 32.0, '16': 40.0, '17': 40.0, '18': 20.0, '19': 0.0,
    '20': 0.0, '21': 4.0, '22': 0.0, '23': 4.0, '24': 6.0,
    '25': 24.0, '26': 24.0, '27': 8.0, '28': 0.0, '29': 0.0,
    '30': 0.0, '31': 0.0, '32': 5.0, '33': 0.0, '34': 0.0,
    '35': 0.0, '36': 0.0, '37': 4.0, '38': 6.0, '39': 0.0,
    '40': 0.0, '41': 0.0, '42': 0.0
  },
  'EQUIPO PESADO': {
    '15': 8.0, '16': 12.0, '17': 0.0, '18': 11.0, '19': 0.0,
    '20': 4.0, '21': 16.0, '22': 12.0, '23': 24.0, '24': 16.0,
    '25': 87.0, '26': 32.0, '27': 16.0, '28': 8.0, '29': 0.0,
    '30': 4.0, '31': 10.0, '32': 21.0, '33': 25.0, '34': 0.0,
    '35': 2.0, '36': 26.0, '37': 26.0, '38': 0.0, '39': 0.0,
    '40': 9.0, '41': 4.0, '42': 0.0, '43': 0.0, '44': 6.0,
    '45': 8.0, '46': 0.0, '47': 0.0
  },
  'MECANICA DE TRANSPORTE': {}
};

const delayedAbsenceHours2025Total: Record<string, number> = {
  '15': 156.0, '16': 177.0, '17': 148.5, '18': 151.0, '19': 81.0,
  '20': 70.0, '21': 157.0, '22': 69.0, '23': 92.0, '24': 66.0,
  '25': 207.0, '26': 118.0, '27': 90.0, '28': 94.0, '29': 80.0,
  '30': 41.0, '31': 18.0, '32': 34.9, '33': 42.0, '34': 27.0,
  '35': 14.0, '36': 48.0, '37': 42.5, '38': 10.0, '39': 8.0,
  '40': 9.0, '41': 4.0, '42': 0.0, '43': 6.0, '44': 30.0,
  '45': 8.0, '46': 0.0, '47': 0.0
};

const delayedAbsence2025AreaNameMismatches = Object.keys(delayedAbsenceHours2025ByArea)
  .filter(areaKey => !progress2025ByArea[areaKey]);

if (delayedAbsence2025AreaNameMismatches.length > 0) {
  console.warn('Áreas 2025 sin coincidencia en progress2025ByArea:', delayedAbsence2025AreaNameMismatches);
}

const getProgress2025AreaKey = () => {
  const areaFixed = userArea.value?.toUpperCase();

  if (areaFixed && areaFixed !== 'ALL') {
    const userAreaKey = normalizeAreaKey(userArea.value);
    return progress2025ByArea[userAreaKey] ? userAreaKey : null;
  }

  if (filters.value.area) {
    const selectedAreaKey = normalizeAreaKey(filters.value.area);
    return progress2025ByArea[selectedAreaKey] ? selectedAreaKey : null;
  }

  if (activeFilters.value.serie) {
    const serieAreaKey = normalizeAreaKey(activeFilters.value.serie);
    return progress2025ByArea[serieAreaKey] ? serieAreaKey : null;
  }

  return null;
};

const getProgress2025Dataset = () => {
  const areaKey = getProgress2025AreaKey();
  return areaKey ? progress2025ByArea[areaKey] : progress2025General;
};

const getDatasetFirstWeek = (dataset: Record<string, number>) => {
  const sourceWeeks = Object.keys(dataset).map(Number).filter(Number.isFinite);
  return sourceWeeks.length > 0 ? Math.min(...sourceWeeks) : progress2025StartWeek;
};

const getProgress2025NormalizedValue = (week: string) => {
  const dataset = getProgress2025Dataset();
  const firstSourceWeek = getDatasetFirstWeek(dataset);
  const normalizedWeek = Number(week);

  if (!Number.isFinite(normalizedWeek)) return 0;

  const sourceWeek = firstSourceWeek + (normalizedWeek - progress2025StartWeek);
  return dataset[String(sourceWeek)] || 0;
};

const getProgress2025ActualValue = (week: string | number) => {
  const dataset = getProgress2025Dataset();
  return Number(dataset[String(week)] || 0);
};

const getProgress2025ComparisonWeekFrom2026Week = (week: string | number) => {
  const numericWeek = Number(week);

  if (!Number.isFinite(numericWeek)) return null;

  return progress2025NormalizedComparisonBaseWeek + (numericWeek - progress2025StartWeek);
};

const getProgress2025TableNormalizedValue = (week: string | number) => {
  const dataset = getProgress2025Dataset();
  const sourceWeek = getProgress2025ComparisonWeekFrom2026Week(week);

  if (sourceWeek === null) return 0;

  return Number(dataset[String(sourceWeek)] || 0);
};

const getProgress2025NormalizedSourceWeek = (
  dataset: Record<string, number>,
  week: string | number
) => {
  const firstSourceWeek = getDatasetFirstWeek(dataset);
  const normalizedWeek = Number(week);

  if (!Number.isFinite(normalizedWeek)) return null;

  return firstSourceWeek + (normalizedWeek - progress2025StartWeek);
};

const getProgress2025AreaGeneralContributionValue = (
  areaKey: string,
  week: string | number,
  comparisonMode: 'normalized' | 'actual'
) => {
  const dataset = progress2025ByArea[areaKey];

  if (!dataset) return 0;

  if (comparisonMode === 'actual') {
    return Number(dataset[String(week)] || 0);
  }

  const sourceWeek = getProgress2025ComparisonWeekFrom2026Week(week);
  return sourceWeek === null ? 0 : Number(dataset[String(sourceWeek)] || 0);
};

const getProgress2025AreaRelativeValue = (
  areaKey: string,
  week: string | number,
  comparisonMode: 'normalized' | 'actual'
) => {
  const generalContribution = getProgress2025AreaGeneralContributionValue(areaKey, week, comparisonMode);
  const areaWeight = progress2025AreaWeightByArea.value[areaKey] || 0;

  if (areaWeight <= 0) return 0;

  return generalContribution / areaWeight;
};

const scrollToTable = () => {
  const el = document.getElementById('equipment-details-table');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showScrollButton.value = false;
  if (scrollButtonTimer) clearTimeout(scrollButtonTimer);
};

const selectedEquipmentDetails = computed(() => {
  if (!selectedEquipmentId.value) return [];
  return crossFilteredData.value.filter(o =>
    String(o["ID_#EQUIPO"]) === selectedEquipmentId.value &&
    (o["N° solicitud"] || o["N° Orden de compra"])
  );
});

// Options for filters
const options = computed(() => {
  const areaFixed = userArea.value?.toUpperCase();
  const baseDataLoad = allOrders.value;
  const baseData = areaFixed === 'ALL'
    ? baseDataLoad
    : baseDataLoad.filter(d => d.Área?.toUpperCase() === areaFixed);

  const etapas = Array.from(new Set(baseData.map(d => d.Etapa).filter(Boolean))).sort();

  let areaData = baseData;
  if (filters.value.etapa) {
    areaData = areaData.filter(d => normalizeAreaKey(String(d.Etapa || '')) === normalizeAreaKey(filters.value.etapa));
  }
  const areas = Array.from(new Set(areaData.map(d => d.Área).filter(Boolean))).sort();

  let itemData = areaData;
  if (filters.value.area) itemData = itemData.filter(d => d.Área === filters.value.area);
  const items = Array.from(new Set(itemData.map(d => d.ITEM).filter(Boolean))).sort();

  let idData = itemData;
  if (filters.value.item) idData = idData.filter(d => d.ITEM === filters.value.item);
  const ids = Array.from(new Set(idData.map(d => d["ID_#EQUIPO"]).filter(Boolean))).sort();

  return { etapas, areas, items, ids };
});

const filteredData = computed(() => {
  const areaFixed = userArea.value?.toUpperCase();
  let result = allOrders.value;

  if (areaFixed !== 'ALL') {
    result = result.filter(d => d.Área?.toUpperCase() === areaFixed);
  }

  if (filters.value.etapa) {
    result = result.filter(d => normalizeAreaKey(String(d.Etapa || '')) === normalizeAreaKey(filters.value.etapa));
  }
  if (filters.value.area) result = result.filter(d => d.Área === filters.value.area);
  if (filters.value.item) result = result.filter(d => d.ITEM === filters.value.item);
  if (filters.value.idEquipo) result = result.filter(d => d["ID_#EQUIPO"] === filters.value.idEquipo);

  return result;
});

const getRawStatus = (order: OrdenMantenimiento): string => String(order.Estatus || '').trim();

const hasConclusionDate = (order: OrdenMantenimiento): boolean => {
  return String(order["Fecha conclusion"] || '').trim() !== '';
};

const isNrOrder = (order: OrdenMantenimiento): boolean => {
  return getRawStatus(order).toUpperCase() === 'NR';
};

const isConcludedOrder = (order: OrdenMantenimiento): boolean => {
  const status = getRawStatus(order).toLowerCase();
  return hasConclusionDate(order) || status.includes('concluida') || isNrOrder(order);
};

const getStatusBucket = (order: OrdenMantenimiento): string => {
  if (isConcludedOrder(order)) return 'Concluida';
  const rawStatus = getRawStatus(order);
  const normalizedStatus = rawStatus.toLowerCase();

  if (normalizedStatus === 'detenido' || normalizedStatus === 'espera_repuesto') {
    return 'Detenido';
  }

  return rawStatus || 'Sin Estatus';
};

const getDetainedStatusType = (order: OrdenMantenimiento): 'detenido' | 'espera_repuesto' | null => {
  const normalizedStatus = getRawStatus(order).toLowerCase();

  if (normalizedStatus === 'detenido') return 'detenido';
  if (normalizedStatus === 'espera_repuesto') return 'espera_repuesto';

  return null;
};

const formatBucketPercent = (count: number, total: number) => {
  if (total <= 0) return '0%';

  const value = Number(((count / total) * 100).toFixed(1));
  return `${Number.isInteger(value) ? value.toFixed(0) : value}%`;
};

const getGroupedStatusTooltipDetail = (status: string, data: any, multiline = true) => {
  const lineBreak = multiline ? '<br/>' : ', ';

  if (status === 'Concluida') {
    return `${lineBreak}Concluida: ${data.concludedCount || 0} (${formatBucketPercent(data.concludedCount || 0, data.count || 0)})${lineBreak}NR: ${data.nrCount || 0} (${formatBucketPercent(data.nrCount || 0, data.count || 0)})`;
  }

  if (status === 'Detenido') {
    return `${lineBreak}Detenido: ${data.detenidoCount || 0} (${formatBucketPercent(data.detenidoCount || 0, data.count || 0)})${lineBreak}Esp. Repuesto: ${data.esperaRepuestoCount || 0} (${formatBucketPercent(data.esperaRepuestoCount || 0, data.count || 0)})`;
  }

  return '';
};

const getConcludedBreakdown = (orders: OrdenMantenimiento[]) => {
  return orders.reduce((acc, order) => {
    if (!isConcludedOrder(order)) return acc;

    acc.total += 1;
    if (isNrOrder(order)) {
      acc.nr += 1;
    } else {
      acc.concluida += 1;
    }

    return acc;
  }, { total: 0, concluida: 0, nr: 0 });
};

const getMaintenanceWeek = (order: OrdenMantenimiento): string => {
  if (order.semana_conclusion !== null && order.semana_conclusion !== undefined) {
    return String(order.semana_conclusion);
  }

  return String(order.Semana || '');
};

const progressMetrics = computed(() => {
  // Configured period
  const startDateRaw = horasPerdidasAreaMotivoInitialDate;
  const endDateRaw = '2026-11-30';

  const createDate = (str: string) => {
    const [y, m, d] = str.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const startDate = createDate(startDateRaw);
  const endDate = createDate(endDateRaw);
  const today = new Date();

  const actualEndDate = today > endDate ? endDate : today;

  // Panamanian holidays in 2026 to ignore
  const holidays = [
    '2026-05-01',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-10',
    '2026-11-28',
  ];

  const isHoliday = (d: Date) => {
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    return holidays.includes(`${yStr}-${mStr}-${dStr}`);
  };

  const getWorkingDays = (start: Date, end: Date) => {
    if (start > end) return 0;
    let count = 0;
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endZero = new Date(end);
    endZero.setHours(0, 0, 0, 0);

    while (current <= endZero) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const totalWorkingDays = getWorkingDays(startDate, endDate);
  const elapsedWorkingDays = getWorkingDays(startDate, actualEndDate);

  const globalIdealProgress = totalWorkingDays > 0 ? (elapsedWorkingDays / totalWorkingDays) * 100 : 0;

  // Format dates for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  const getDisplayLabel = (areaName: string) => {
    return getWeeklyAreaShortName(areaName);
  };

  const calculateRowDetails = (oms: OrdenMantenimiento[], label: string, displayLabel?: string) => {
    const totalCount = oms.length;
    const actualCount = oms.filter(isConcludedOrder).length;
    const actualProgress = totalCount > 0 ? (actualCount / totalCount) * 100 : 0;

    const idealProgress = globalIdealProgress;
    const idealCount = Math.round(totalCount * (idealProgress / 100));
    const difference = actualProgress - idealProgress;

    return {
      label,
      displayLabel: displayLabel || getDisplayLabel(label),
      idealProgress,
      actualProgress,
      difference,
      idealCount,
      actualCount,
      totalCount
    };
  };

  // Group by Area
  const ignoredAreas = ['TEST', 'SERVICIOS GENERALES'];
  const metricsUniverse = filteredData.value.filter(d =>
    d.Área && !ignoredAreas.includes(d.Área.toUpperCase())
  );

  const areas = Array.from(new Set(metricsUniverse.map(d => d.Área).filter(Boolean)));
  const rows = areas
    .map(area => {
      const areaOMs = metricsUniverse.filter(d => d.Área === area);
      return calculateRowDetails(areaOMs, String(area));
    })
    .sort((a, b) => b.actualProgress - a.actualProgress);

  const totalRow = calculateRowDetails(metricsUniverse, 'TOTAL', 'TOTAL');

  return {
    startDateStr,
    endDateStr,
    totalWorkingDays,
    rows,
    totalRow
  };
});

// Interactive Cross-Filtering
const crossFilteredData = computed(() => {
  let result = filteredData.value;

  if (activeFilters.value.semana) {
    result = result.filter(d => getMaintenanceWeek(d) === activeFilters.value.semana);
  }

  if (activeFilters.value.serie) {
    const s = activeFilters.value.serie;
    result = result.filter(d =>
      d.Área === s ||
      d.Sistema === s ||
      d.ITEM === s ||
      d["ID_#EQUIPO"] === s
    );
  }

  if (activeFilters.value.estado) {
    result = result.filter(d => getStatusBucket(d) === activeFilters.value.estado);
  }

  return result;
});

const clearFilters = () => {
  filters.value = {
    etapa: defaultEtapa,
    area: '',
    item: '',
    idEquipo: ''
  };
  searchQueries.value = { etapa: '', area: '', item: '', idEquipo: '' };
  maintenanceStore.clearInteractiveFilters();
  selectedEquipmentId.value = null;
};

const toggleDropdown = (id: string) => {
  if (activeDropdown.value === id) {
    activeDropdown.value = null;
  } else {
    activeDropdown.value = id;
    searchQueries.value[id as keyof typeof searchQueries.value] = '';
  }
};

const selectOption = (filterKey: 'etapa' | 'area' | 'item' | 'idEquipo', value: string) => {
  filters.value[filterKey] = value;
  activeDropdown.value = null;
};

const getFilteredOptionsList = (key: 'etapas' | 'areas' | 'items' | 'ids', searchKey: 'etapa' | 'area' | 'item' | 'idEquipo') => {
  const query = searchQueries.value[searchKey].toLowerCase();
  return (options.value[key] || []).filter(opt => String(opt).toLowerCase().includes(query));
};

const fetchData = async (forceRefresh = false) => {
  if (forceRefresh) isRefreshing.value = true;

  try {
    if (!userArea.value) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        const { data: profile } = await supabase.from('PROFILE').select('area').eq('email', user.email).maybeSingle();
        userArea.value = profile?.area || 'ALL';
      }
    }

    await maintenanceStore.fetchAllOrders(forceRefresh);

    const zafraEtapa = Array.from(new Set(allOrders.value.map(d => d.Etapa).filter(Boolean)))
      .find(etapa => normalizeAreaKey(String(etapa)) === defaultEtapaKey);
    if (zafraEtapa && normalizeAreaKey(filters.value.etapa) === defaultEtapaKey) {
      filters.value.etapa = String(zafraEtapa);
    }
  } catch (e) {
    console.error("Error fetching maintenance data:", e);
  } finally {
    isRefreshing.value = false;
  }
};

watch(() => filters.value.etapa, () => {
  filters.value.area = '';
  filters.value.item = '';
  filters.value.idEquipo = '';
  weeklyLossVisible.value = false;
});
watch(() => filters.value.area, () => { filters.value.item = ''; filters.value.idEquipo = ''; });
watch(() => filters.value.item, () => { filters.value.idEquipo = ''; });

const handleWindowClick = (e: MouseEvent) => {
  const filtersEl = document.getElementById('slide-maintenance-filters');
  if (filtersEl && !filtersEl.contains(e.target as Node)) {
    activeDropdown.value = null;
  }
};

onMounted(() => {
  fetchData();
  horasTrabajoStore.fetchData();
  window.addEventListener('click', handleWindowClick);
  window.addEventListener('resize', handleWindowResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', handleWindowClick);
  window.removeEventListener('resize', handleWindowResize);
  if (scrollButtonTimer) clearTimeout(scrollButtonTimer);
});

const statusStats = computed(() => {
  const total = baseChartData.value.length;
  if (total === 0) return [];

  const counts: Record<string, {
    total: number;
    concluida: number;
    nr: number;
    detenido: number;
    esperaRepuesto: number;
  }> = {};
  baseChartData.value.forEach(row => {
    const s = getStatusBucket(row);
    if (!counts[s]) {
      counts[s] = { total: 0, concluida: 0, nr: 0, detenido: 0, esperaRepuesto: 0 };
    }

    counts[s].total += 1;
    if (s === 'Concluida') {
      if (isNrOrder(row)) {
        counts[s].nr += 1;
      } else {
        counts[s].concluida += 1;
      }
    }
    if (s === 'Detenido') {
      const detainedStatusType = getDetainedStatusType(row);

      if (detainedStatusType === 'detenido') {
        counts[s].detenido += 1;
      } else if (detainedStatusType === 'espera_repuesto') {
        counts[s].esperaRepuesto += 1;
      }
    }
  });

  const colorMap: Record<string, { bar: string, dot: string }> = {
    'Programado': { bar: 'bg-[#1A6A96]', dot: 'bg-[#1A6A96]' },
    'Concluida': { bar: 'bg-[#2d8a54]', dot: 'bg-[#2d8a54]' },
    'En Proceso': { bar: 'bg-[#d4a94d]', dot: 'bg-[#d4a94d]' },
    'Detenido': { bar: 'bg-danger', dot: 'bg-danger' },
  };

  const defaultColors = { bar: 'bg-gray-300', dot: 'bg-gray-400' };

  return ['Programado', 'Concluida', 'En Proceso', 'Detenido'].map(label => {
    const detail = counts[label] || { total: 0, concluida: 0, nr: 0, detenido: 0, esperaRepuesto: 0 };
    const mappingKey = Object.keys(colorMap).find(k => k.toLowerCase() === label.toLowerCase());
    const colors = mappingKey ? colorMap[mappingKey] : defaultColors;

    return {
      label,
      count: detail.total,
      concludedCount: detail.concluida,
      nrCount: detail.nr,
      detenidoCount: detail.detenido,
      esperaRepuestoCount: detail.esperaRepuesto,
      percentage: total > 0 ? (detail.total / total) * 100 : 0,
      color: colors.bar,
      dotColor: colors.dot
    };
  });
});

const getStatusClass = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('cerrada') || s.includes('concluido')) return 'bg-success/10 text-success border-success/20';
  if (s.includes('proceso') || s.includes('curso')) return 'bg-main/10 text-main border-main/20';
  if (s.includes('programado')) return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-gray-100 text-gray-500 border-gray-200';
};

const echartBarOption = computed(() => {
  const stats = statusStats.value;
  const orderedLabels = ['Programado', 'Concluida', 'En Proceso', 'Detenido'];
  const colorMap: Record<string, string> = {
    'Programado': '#1A6A96',
    'Concluida': '#2D8A54',
    'En Proceso': '#D4A94D',
    'Detenido': '#dc2626'
  };

  const labels: string[] = [];
  const data: any[] = [];

  orderedLabels.forEach(label => {
    const item = stats.find(s => s.label.toLowerCase() === label.toLowerCase());
    labels.push(label);
    const count = item ? item.count : 0;
    const concludedCount = item ? item.concludedCount : 0;
    const nrCount = item ? item.nrCount : 0;
    const detenidoCount = item ? item.detenidoCount : 0;
    const esperaRepuestoCount = item ? item.esperaRepuestoCount : 0;
    const value = item ? Number(item.percentage.toFixed(1)) : 0;
    data.push({
      value,
      count,
      concludedCount,
      nrCount,
      detenidoCount,
      esperaRepuestoCount,
      itemStyle: { color: colorMap[label] || '#cbd5e1' }
    });
  });

  return {
    grid: { left: '2%', right: '2%', top: 24, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'white',
      borderColor: '#e2e8f0',
      textStyle: { color: '#475569' },
      formatter: (params: any[]) => {
        const p = params[0];
        const detail = ['Concluida', 'Detenido'].includes(p.axisValue)
          ? getGroupedStatusTooltipDetail(p.axisValue, p.data, true)
          : '';
        return `<span style="font-weight:bold;color:#1e293b">${p.axisValue}</span><br/>Total: ${p.data.count} (${p.data.value}%)${detail}`;
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: true, lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 11, margin: 8 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      interval: 20,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' }
    },
    series: [
      {
        type: 'bar',
        data,
        barWidth: 44,
        barMaxWidth: 44,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: (p: any) => {
            const label = p.name;
            const baseColor = colorMap[label] || '#cbd5e1';
            const hasStatusFilter = !!activeFilters.value.estado;
            const matchesStatus = !hasStatusFilter || activeFilters.value.estado === label;
            return matchesStatus ? baseColor : applyAlpha(baseColor, 0.25);
          }
        },
        label: {
          show: true,
          position: 'top',
          color: (p: any) => {
            const hasStatusFilter = !!activeFilters.value.estado;
            const matchesStatus = !hasStatusFilter || activeFilters.value.estado === p.name;
            return matchesStatus ? '#64748b' : 'transparent';
          },
          fontWeight: 'bold',
          fontSize: 11,
          formatter: (p: any) => `${p.value}%`
        }
      }
    ]
  };
});

const applyAlpha = (hex: string, alpha: number) => {
  if (!hex || !hex.startsWith('#')) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildEChartStackedOption = (data: OrdenMantenimiento[], groupKey: keyof OrdenMantenimiento) => {
  const colorMap: Record<string, string> = {
    'Programado': '#1A6A96',
    'Concluida': '#2D8A54',
    'En Proceso': '#D4A94D',
    'Detenido': '#dc2626',
  };
  const fallbackColors = ['#94a3b8', '#64748b', '#475569', '#cbd5e1'];

  const uniqueStatuses = ['Programado', 'Concluida', 'En Proceso', 'Detenido'];

  const groups: Record<string, {
    total: number;
    counts: Record<string, number>;
    concludedDetail: { concluida: number; nr: number };
    detenidoDetail: { detenido: number; esperaRepuesto: number };
  }> = {};

  data.forEach(order => {
    let key = String(order[groupKey] || 'N/A').trim();
    if (!key || key === 'null') key = 'Desconocido';

    if (!groups[key]) {
      groups[key] = {
        total: 0,
        counts: {},
        concludedDetail: { concluida: 0, nr: 0 },
        detenidoDetail: { detenido: 0, esperaRepuesto: 0 }
      };
      uniqueStatuses.forEach(s => groups[key].counts[s] = 0);
    }

    const status = getStatusBucket(order);
    groups[key].total += 1;
    if (groups[key].counts[status] !== undefined) {
      groups[key].counts[status] += 1;
    }
    if (status === 'Concluida') {
      if (isNrOrder(order)) {
        groups[key].concludedDetail.nr += 1;
      } else {
        groups[key].concludedDetail.concluida += 1;
      }
    }
    if (status === 'Detenido') {
      const detainedStatusType = getDetainedStatusType(order);

      if (detainedStatusType === 'detenido') {
        groups[key].detenidoDetail.detenido += 1;
      } else if (detainedStatusType === 'espera_repuesto') {
        groups[key].detenidoDetail.esperaRepuesto += 1;
      }
    }
  });

  const sortedKeys = Object.keys(groups)
    .filter(k => k !== 'Desconocido' && k !== 'N/A')
    .sort((a, b) => groups[a].total - groups[b].total);

  const categoryTotals = sortedKeys.map(k => groups[k].total);

  const needsScroll = sortedKeys.length > MAX_VISIBLE_BARS.value;
  const visibleCount = Math.min(sortedKeys.length, MAX_VISIBLE_BARS.value);
  const barWidth = Math.min(32, Math.max(16, Math.floor(240 / Math.max(1, visibleCount))));

  const series = uniqueStatuses.map((status, idx) => {
    const mappingKey = Object.keys(colorMap).find(k => k.toLowerCase() === status.toLowerCase());
    const baseColor = mappingKey ? colorMap[mappingKey] : fallbackColors[idx % fallbackColors.length];

    // Pre-calculate which categories match the global filters
    const matchingCategories = new Set<string>();
    const hasSerieFilter = !!activeFilters.value.serie;
    const hasStatusFilter = !!activeFilters.value.estado;

    if (hasSerieFilter || hasStatusFilter) {
      data.forEach(d => {
        const dSerie = activeFilters.value.serie;
        const dEstado = activeFilters.value.estado;

        const matchesSerie = !hasSerieFilter ||
          d.Área === dSerie ||
          d.Sistema === dSerie ||
          d.ITEM === dSerie ||
          d["ID_#EQUIPO"] === dSerie;

        const matchesStatus = !hasStatusFilter || getStatusBucket(d) === dEstado;

        if (matchesSerie && matchesStatus) {
          matchingCategories.add(String(d[groupKey] || 'N/A').trim());
        }
      });
    }

    return {
      name: status,
      type: 'bar',
      color: baseColor,
      stack: 'total',
      barWidth,
      barMaxWidth: 32,
      barGap: '0%',
      barCategoryGap: '30%',
      itemStyle: {
        color: (p: any) => {
          const category = p.name;
          const hasGlobalFilter = hasSerieFilter || hasStatusFilter;

          let isHighlighted = true;
          if (hasGlobalFilter) {
            const matchesSelectedStatus = !hasStatusFilter || status === activeFilters.value.estado;
            const matchesCat = matchingCategories.has(String(category).trim());
            isHighlighted = matchesSelectedStatus && matchesCat;
          }

          return isHighlighted ? baseColor : applyAlpha(baseColor, 0.25);
        },
        borderRadius: [2, 2, 2, 2]
      },
      data: sortedKeys.map((cat, i) => {
        const count = groups[cat].counts[status] || 0;
        const total = categoryTotals[i] || 0;
        const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
        return {
          value: pct,
          count,
          total,
          status,
          concludedCount: groups[cat].concludedDetail.concluida,
          nrCount: groups[cat].concludedDetail.nr,
          detenidoCount: groups[cat].detenidoDetail.detenido,
          esperaRepuestoCount: groups[cat].detenidoDetail.esperaRepuesto,
        };
      }),
      label: {
        show: true,
        formatter: (p: any) => {
          const category = p.name;
          const hasGlobalFilter = hasSerieFilter || hasStatusFilter;
          let isHighlighted = true;
          if (hasGlobalFilter) {
            const matchesSelectedStatus = !hasStatusFilter || status === activeFilters.value.estado;
            const matchesCat = matchingCategories.has(String(category).trim());
            isHighlighted = matchesSelectedStatus && matchesCat;
          }

          if (!isHighlighted) return '';
          if (p.data?.count === 0) return '';
          if (p.value < 8) return '';
          return `${p.value}%`;
        },
        position: 'inside',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff'
      }
    };
  });

  return {
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 10, color: '#64748b', fontWeight: 'bold' }
    },
    grid: { containLabel: true, left: 8, right: needsScroll ? 36 : 16, top: 32, bottom: 42 },
    dataZoom: needsScroll ? [
      {
        type: 'slider',
        yAxisIndex: 0,
        width: 12,
        right: 4,
        startValue: sortedKeys.length > MAX_VISIBLE_BARS.value ? sortedKeys.length - MAX_VISIBLE_BARS.value : 0,
        endValue: sortedKeys.length - 1,
        showDetail: false,
        borderColor: 'transparent',
        fillerColor: 'rgba(143, 138, 127, 0.2)',
        handleSize: '100%',
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: true
      }
    ] : [],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'white',
      borderColor: '#e2e8f0',
      textStyle: { color: '#475569' },
      formatter: (params: any[]) => {
        const total = params?.[0]?.data?.total ?? 0;
        const lines = params
          .filter(p => (p.data?.count || 0) > 0)
          .map(p => {
            const detail = ['Concluida', 'Detenido'].includes(p.seriesName)
              ? ` <span style="color:#64748b">(${getGroupedStatusTooltipDetail(p.seriesName, p.data, false)})</span>`
              : '';
            return `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${p.data.count}</b> (${p.value}%)${detail}`;
          })
          .join('<br/>');
        return `<b style="color:#1e293b;font-size:13px">${params[0]?.axisValue ?? ''} (${total})</b><br/>${lines}`;
      }
    },
    xAxis: {
      type: 'value',
      max: 100,
      position: 'top',
      axisLabel: { color: '#64748b', fontSize: 10, formatter: '{value}%' },
      splitLine: { show: false },
      axisLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: sortedKeys,
      triggerEvent: true,
      axisLabel: {
        color: '#475569',
        fontSize: 11,
        width: 140,
        overflow: 'truncate',
        ellipsis: '…'
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series
  };
};

const activeFilterGroupKey = ref<string | null>(null);

watch(() => activeFilters.value.serie, (newVal) => {
  if (!newVal) {
    activeFilterGroupKey.value = null;
  }
});

const baseChartData = computed(() => {
  let res = filteredData.value;
  if (activeFilters.value.semana) {
    res = res.filter(d => getMaintenanceWeek(d) === String(activeFilters.value.semana));
  }
  return res;
});

const chartDataFor = (groupKey: string) => {
  let res = baseChartData.value;

  if (activeFilters.value.serie && activeFilterGroupKey.value !== groupKey) {
    res = res.filter(d =>
      d.Área === activeFilters.value.serie ||
      d.Sistema === activeFilters.value.serie ||
      d.ITEM === activeFilters.value.serie ||
      d["ID_#EQUIPO"] === activeFilters.value.serie
    );
  }

  if (activeFilters.value.estado && activeFilterGroupKey.value !== groupKey) {
    const validCategories = new Set(
      res.filter(d => getStatusBucket(d) === activeFilters.value.estado).map(d => String(d[groupKey as keyof OrdenMantenimiento] || 'N/A').trim())
    );
    res = res.filter(d => validCategories.has(String(d[groupKey as keyof OrdenMantenimiento] || 'N/A').trim()));
  }

  return res;
};

const statusByAreaEChartOption = computed(() => buildEChartStackedOption(chartDataFor('Área'), 'Área'));
const statusBySystemEChartOption = computed(() => buildEChartStackedOption(chartDataFor('Sistema'), 'Sistema'));
const statusByEquipmentEChartOption = computed(() => buildEChartStackedOption(chartDataFor('ITEM'), 'ITEM'));
const statusByIDEquipoEChartOption = computed(() => buildEChartStackedOption(chartDataFor('ID_#EQUIPO'), 'ID_#EQUIPO'));

const handleEChartClick = (dimensionKey: string, params: any) => {
  let category = null;
  let status = null;

  if (params.componentType === 'series') {
    category = params.name;
    status = params.seriesName || null;
  }
  if (params.componentType === 'yAxis') {
    category = params.value;
    status = null;
  }

  if (category) {
    if (dimensionKey === 'ID_#EQUIPO') {
      const isNewEquipment = selectedEquipmentId.value !== String(category);
      selectedEquipmentId.value = String(category);
      setStatusFilter(String(category), status);

      if (isNewEquipment) {
        showScrollButton.value = true;
        if (scrollButtonTimer) clearTimeout(scrollButtonTimer);
        scrollButtonTimer = setTimeout(() => {
          showScrollButton.value = false;
        }, 15000);
      }
    } else {
      setStatusFilter(String(category), status);
    }

    if (activeFilters.value.serie) {
      activeFilterGroupKey.value = dimensionKey;
    } else {
      activeFilterGroupKey.value = null;
    }
  }
};

const comparisonIsZafra = computed(() => (
  Boolean(filters.value.etapa && normalizeAreaKey(filters.value.etapa) === defaultEtapaKey)
));

const buildComparisonAreaRows = (comparisonMode: 'normalized' | 'actual') => {
  const isZafra = filters.value.etapa && normalizeAreaKey(filters.value.etapa) === defaultEtapaKey;
  const weeks = new Set(allWeeklyProgress.value.map(d => String(d.semana)));
  const areaFixed = userArea.value?.toUpperCase();
  const areaFixedKey = normalizeAreaKey(userArea.value || '');

  let orderList = areaFixed === 'ALL'
    ? allOrders.value
    : allOrders.value.filter(d => normalizeAreaKey(d.Área || '') === areaFixedKey);

  if (filters.value.etapa) {
    orderList = orderList.filter(d => normalizeAreaKey(String(d.Etapa || '')) === normalizeAreaKey(filters.value.etapa));
  }

  if (areaFixed === 'ALL' && filters.value.area) {
    const selectedAreaKey = normalizeAreaKey(filters.value.area);
    orderList = orderList.filter(d => normalizeAreaKey(d.Área || '') === selectedAreaKey);
  }

  if (activeFilters.value.serie) {
    orderList = orderList.filter(d =>
      d.Área === activeFilters.value.serie ||
      d.Sistema === activeFilters.value.serie ||
      d.ITEM === activeFilters.value.serie ||
      d["ID_#EQUIPO"] === activeFilters.value.serie
    );
  }

  if (activeFilters.value.estado) {
    orderList = orderList.filter(d => getStatusBucket(d) === activeFilters.value.estado);
  }

  const generalTotal = orderList.length;
  const areaKeys = Array.from(new Set(
    orderList
      .map(d => normalizeAreaKey(d.Área || ''))
      .filter(areaKey => areaKey && progress2025ByArea[areaKey])
  ));

  const rows = areaKeys.map(areaKey => {
    const areaOrders = orderList.filter(d => normalizeAreaKey(d.Área || '') === areaKey);
    const concluded = areaOrders.filter(o => weeks.has(getMaintenanceWeek(o)) && isConcludedOrder(o)).length;
    const total = areaOrders.length;
    const avance2026 = total > 0 ? Number(((concluded / total) * 100).toFixed(2)) : 0;
    const avance2025 = isZafra
      ? allWeeklyProgress.value.reduce((sum, week) => {
        return sum + getProgress2025AreaRelativeValue(areaKey, week.semana, comparisonMode);
      }, 0)
      : 0;

    return {
      area: areaOrders[0]?.Área || areaKey,
      total,
      concluded,
      avance2026,
      avance2025: Math.min(avance2025, 100),
      difference: Number((avance2026 - Math.min(avance2025, 100)).toFixed(2))
    };
  }).sort((a, b) => b.avance2026 - a.avance2026);

  const totalRow = {
    area: 'TOTAL',
    total: rows.reduce((sum, row) => sum + row.total, 0),
    concluded: rows.reduce((sum, row) => sum + row.concluded, 0),
    avance2026: generalTotal > 0
      ? Number(((rows.reduce((sum, row) => sum + row.concluded, 0) / generalTotal) * 100).toFixed(2))
      : 0,
    avance2025: isZafra
      ? Math.min(allWeeklyProgress.value.reduce((sum, week) => {
        const value = comparisonMode === 'actual'
          ? getProgress2025ActualValue(week.semana)
          : getProgress2025TableNormalizedValue(week.semana);
        return sum + value;
      }, 0), 100)
      : 0,
    difference: 0
  };
  totalRow.difference = Number((totalRow.avance2026 - totalRow.avance2025).toFixed(2));

  return { rows, totalRow, isZafra };
};

const normalizedComparisonAreaRows = computed(() => buildComparisonAreaRows('normalized'));
const actualWeekComparisonAreaRows = computed(() => buildComparisonAreaRows('actual'));

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const currentWeek = computed(() => getWeekNumber(new Date()));

const weeklyConcludedComparison = computed(() => {
  const areaFixed = userArea.value?.toUpperCase();
  const areaFixedKey = normalizeAreaKey(userArea.value || '');
  const currentWeekValue = currentWeek.value;
  const previousWeekValue = currentWeekValue - 1;

  let orderList = areaFixed === 'ALL'
    ? filteredData.value
    : filteredData.value.filter(d => normalizeAreaKey(d.Área || '') === areaFixedKey);

  if (activeFilters.value.serie) {
    orderList = orderList.filter(d =>
      d.Área === activeFilters.value.serie ||
      d.Sistema === activeFilters.value.serie ||
      d.ITEM === activeFilters.value.serie ||
      d["ID_#EQUIPO"] === activeFilters.value.serie
    );
  }

  const denominator = orderList.length;
  const areaKeys = Array.from(new Set(
    orderList
      .map(d => normalizeAreaKey(d.Área || ''))
      .filter(Boolean)
  ));

  const buildRow = (areaOrders: OrdenMantenimiento[], area: string) => {
    const concludedOrders = areaOrders.filter(isConcludedOrder);
    const previousConcluded = concludedOrders.filter(order => {
      const week = Number(getMaintenanceWeek(order));
      return Number.isFinite(week) && week <= previousWeekValue;
    }).length;
    const currentConcluded = concludedOrders.length;
    const thisWeekConcluded = Math.max(currentConcluded - previousConcluded, 0);
    const toPercent = (count: number) => denominator > 0
      ? Number(((count / denominator) * 100).toFixed(2))
      : 0;

    return {
      area,
      previousProgress: toPercent(previousConcluded),
      thisWeekProgress: toPercent(thisWeekConcluded),
      currentProgress: toPercent(currentConcluded),
      previousConcluded,
      thisWeekConcluded,
      currentConcluded
    };
  };

  const rows = areaKeys.map(areaKey => {
    const areaOrders = orderList.filter(d => normalizeAreaKey(d.Área || '') === areaKey);
    return buildRow(areaOrders, areaOrders[0]?.Área || areaKey);
  }).sort((a, b) => b.currentProgress - a.currentProgress);

  return {
    previousWeek: previousWeekValue,
    currentWeek: currentWeekValue,
    rows,
    totalRow: buildRow(orderList, 'TOTAL')
  };
});

const buildWeeklyProgress = (limitToLastFive: boolean) => {
  const areaFixed = userArea.value?.toUpperCase();
  const areaFixedKey = normalizeAreaKey(userArea.value || '');

  let globalList = areaFixed === 'ALL'
    ? allOrders.value
    : allOrders.value.filter(d => d.Área?.toUpperCase() === areaFixed);

  if (filters.value.etapa) {
    globalList = globalList.filter(d => normalizeAreaKey(String(d.Etapa || '')) === normalizeAreaKey(filters.value.etapa));
  }

  if (areaFixed === 'ALL' && filters.value.area) {
    globalList = globalList.filter(d => d.Área === filters.value.area);
  }

  let prorationOrderUniverse = globalList;
  const equipmentSerieFilterActive = isEquipmentSerieFilterActive(prorationOrderUniverse);

  if (activeFilters.value.serie && !equipmentSerieFilterActive) {
    prorationOrderUniverse = prorationOrderUniverse.filter(d =>
      d.Área === activeFilters.value.serie ||
      d.Sistema === activeFilters.value.serie ||
      d.ITEM === activeFilters.value.serie ||
      d["ID_#EQUIPO"] === activeFilters.value.serie
    );
  }

  let areaFilteredList = globalList;
  if (filters.value.idEquipo) {
    areaFilteredList = areaFilteredList.filter(d => d["ID_#EQUIPO"] === filters.value.idEquipo);
  }

  if (activeFilters.value.serie) {
    areaFilteredList = areaFilteredList.filter(d =>
      d.Área === activeFilters.value.serie ||
      d.Sistema === activeFilters.value.serie ||
      d.ITEM === activeFilters.value.serie ||
      d["ID_#EQUIPO"] === activeFilters.value.serie
    );
  }

  if (activeFilters.value.estado) {
    areaFilteredList = areaFilteredList.filter(d => getStatusBucket(d) === activeFilters.value.estado);
  }

  const now = new Date();
  const currentWeekNumber = getWeekNumber(now);
  let weeks: string[] = [];

  if (limitToLastFive) {
    for (let i = 0; i < 5; i++) {
      const temp = new Date(now);
      temp.setDate(now.getDate() - (i * 7));
      weeks.push(String(getWeekNumber(temp)));
    }
    weeks = weeks.reverse();
  } else {
    const minWeek = progress2025StartWeek;
    const maxWeek = currentWeekNumber;
    for (let week = minWeek; week <= maxWeek; week++) {
      weeks.push(String(week));
    }
  }

  const results = weeks.map(sem => {
    const semRows = areaFilteredList.filter(o => getMaintenanceWeek(o) === sem);
    const total = semRows.length;
    const concludedBreakdown = getConcludedBreakdown(semRows);
    const concluidas = concludedBreakdown.total;
    const relevantAreaKeys = Array.from(new Set(
      areaFilteredList
        .map(order => normalizeAreaKey(order.Área || ''))
        .filter(areaKey => areaKey && weeklyAreaSummaryAreaKeys.has(areaKey))
    ));

    const horasRows = horasTrabajoData.value.filter(row => {
      const status = String(row.estatus || '').trim().toLowerCase();
      const areaKey = normalizeAreaKey(row.area);

      if (String(row.semana_inicio) !== String(sem)) return false;
      if (status !== 'retrasada' && status !== 'ausencia') return false;
      if (!hoursPerOrderByArea[areaKey]) return false;
      if (!relevantAreaKeys.includes(areaKey)) return false;

      if (areaFixed !== 'ALL' && normalizeAreaKey(row.area) !== areaFixedKey) return false;
      if (areaFixed === 'ALL' && filters.value.area && areaKey !== normalizeAreaKey(filters.value.area)) return false;

      if (activeFilters.value.serie) {
        return areaKey === normalizeAreaKey(activeFilters.value.serie) || row.equipo === activeFilters.value.serie;
      }

      return true;
    });

    const operationalBreakdown = horasRows.reduce((acc, row) => {
      const areaKey = normalizeAreaKey(row.area);
      const hoursPerOrder = hoursPerOrderByArea[areaKey];
      const equivalentOrders = hoursPerOrder > 0 ? (Number(row.horas_calculadas || 0) / hoursPerOrder) : 0;

      acc.retrasada += equivalentOrders;
      acc.horasRetrasada += Number(row.horas_calculadas || 0);

      return acc;
    }, {
      retrasada: 0,
      horasRetrasada: 0,
    });

    const shouldProratePersonalLoss = Boolean(filters.value.idEquipo) || equipmentSerieFilterActive;
    const personalBreakdown = relevantAreaKeys.reduce<PersonalLossBreakdown>((acc, areaKey) => {
      const areaRows = horasPerdidasPersonal.value.filter((row) => (
        normalizeAreaKey(row.area) === areaKey &&
        String(row.semana) === String(sem)
      ));
      const areaBreakdown = buildPersonalLossBreakdown(
        areaRows,
        areaKey,
        prorationOrderUniverse,
        shouldProratePersonalLoss
      );

      acc.totalHours += areaBreakdown.totalHours;
      acc.totalEquivalent += areaBreakdown.totalEquivalent;
      acc.vacaciones += areaBreakdown.vacaciones;
      acc.incapacidad += areaBreakdown.incapacidad;
      acc.inactivo += areaBreakdown.inactivo;
      acc.plazaNoCubierta += areaBreakdown.plazaNoCubierta;

      return acc;
    }, {
      totalHours: 0,
      totalEquivalent: 0,
      vacaciones: 0,
      incapacidad: 0,
      inactivo: 0,
      plazaNoCubierta: 0,
    });

    const toGlobalPercent = (value: number) => globalList.length > 0
      ? Number(((value / globalList.length) * 100).toFixed(2))
      : 0;

    return {
      semana: sem,
      total,
      concluidas,
      concluidasSinNr: concludedBreakdown.concluida,
      nrConcluidas: concludedBreakdown.nr,
      globalTotal: globalList.length,
      avance: globalList.length > 0
        ? Number(((concluidas / globalList.length) * 100).toFixed(2))
        : 0,
      concluidaAvance: toGlobalPercent(concludedBreakdown.concluida),
      nrAvance: toGlobalPercent(concludedBreakdown.nr),
      retrasadaEquivalente: Number(operationalBreakdown.retrasada.toFixed(2)),
      personalEquivalente: Number(personalBreakdown.totalEquivalent.toFixed(2)),
      horasRetrasada: Number(operationalBreakdown.horasRetrasada.toFixed(2)),
      horasPersonal: Number(personalBreakdown.totalHours.toFixed(2)),
      horasVacaciones: Number(personalBreakdown.vacaciones.toFixed(2)),
      horasIncapacidad: Number(personalBreakdown.incapacidad.toFixed(2)),
      horasInactivo: Number(personalBreakdown.inactivo.toFixed(2)),
      horasPlazaNoCubierta: Number(personalBreakdown.plazaNoCubierta.toFixed(2)),
      retrasadaAvance: toGlobalPercent(operationalBreakdown.retrasada),
      personalAvance: toGlobalPercent(personalBreakdown.totalEquivalent)
    };
  });

  return results;
};

const allWeeklyProgress = computed(() => buildWeeklyProgress(false));
const weeklyProgress = computed(() => buildWeeklyProgress(true));

const hasWeeklyAreaProgress = (week: typeof allWeeklyProgress.value[number]) => (
  week.concluidas > 0 ||
  week.horasRetrasada > 0 ||
  week.horasPersonal > 0
);

const weeklyAreaSelectedWeeks = computed(() => {
  if (!weeklyAreaCurrentWeekOnly.value) {
    return allWeeklyProgress.value.map(d => String(d.semana));
  }

  const currentWeekValue = String(currentWeek.value);
  const currentWeekData = allWeeklyProgress.value.find(d => String(d.semana) === currentWeekValue);
  const currentHasData = !!currentWeekData && hasWeeklyAreaProgress(currentWeekData);

  if (currentHasData) return [currentWeekValue];

  const latestWeekWithData = allWeeklyProgress.value
    .filter(d => Number(d.semana) <= Number(currentWeek.value))
    .filter(hasWeeklyAreaProgress)
    .sort((a, b) => Number(b.semana) - Number(a.semana))[0]?.semana;

  return [String(latestWeekWithData || currentWeekValue)];
});

const weeklyAreaPeriodLabel = computed(() => {
  if (!weeklyAreaCurrentWeekOnly.value) return `Acumulado (${allWeeklyProgress.value.length} sem)`;
  return `Semana ${weeklyAreaSelectedWeeks.value[0] || currentWeek.value}`;
});

const sumRoundedProgress = (realProgress: number, lostProgress: number) => {
  const roundedRealProgress = Number(realProgress.toFixed(1));
  const roundedLostProgress = Number(lostProgress.toFixed(1));

  return Number((roundedRealProgress + roundedLostProgress).toFixed(1));
};

const sumDisplayedLossProgress = (operationalLostProgress: number, personalLostProgress: number) => (
  Number((
    Number(operationalLostProgress.toFixed(1)) +
    Number(personalLostProgress.toFixed(1))
  ).toFixed(1))
);

const weeklyAreaSummary = computed(() => {
  const areaFixed = userArea.value?.toUpperCase();
  const areaFixedKey = normalizeAreaKey(userArea.value || '');
  const weeks = new Set(weeklyAreaSelectedWeeks.value);

  let orderList = areaFixed === 'ALL'
    ? allOrders.value
    : allOrders.value.filter(d => normalizeAreaKey(d.Área || '') === areaFixedKey);

  if (filters.value.etapa) {
    orderList = orderList.filter(d => normalizeAreaKey(String(d.Etapa || '')) === normalizeAreaKey(filters.value.etapa));
  }

  if (areaFixed === 'ALL' && filters.value.area) {
    const selectedAreaKey = normalizeAreaKey(filters.value.area);
    orderList = orderList.filter(d => normalizeAreaKey(d.Área || '') === selectedAreaKey);
  }

  const prorationOrderUniverse = orderList;
  const equipmentSerieFilterActive = isEquipmentSerieFilterActive(prorationOrderUniverse);

  if (filters.value.idEquipo) {
    orderList = orderList.filter(d => d["ID_#EQUIPO"] === filters.value.idEquipo);
  }

  if (activeFilters.value.serie) {
    orderList = orderList.filter(d =>
      d.Área === activeFilters.value.serie ||
      d.Sistema === activeFilters.value.serie ||
      d.ITEM === activeFilters.value.serie ||
      d["ID_#EQUIPO"] === activeFilters.value.serie
    );
  }

  if (activeFilters.value.estado) {
    orderList = orderList.filter(d => getStatusBucket(d) === activeFilters.value.estado);
  }

  const areaKeys = Array.from(new Set(
    orderList
      .map(d => normalizeAreaKey(d.Área || ''))
      .filter(areaKey => areaKey && weeklyAreaSummaryAreaKeys.has(areaKey))
  ));

  return areaKeys.map(areaKey => {
    const areaOrders = orderList.filter(d => normalizeAreaKey(d.Área || '') === areaKey);
    const concludedInVisibleWeeks = areaOrders.filter(o => (
      weeks.has(getMaintenanceWeek(o)) && isConcludedOrder(o)
    )).length;

    const operationalRows = horasTrabajoData.value.filter(row => {
      const rowAreaKey = normalizeAreaKey(row.area);
      const status = String(row.estatus || '').trim().toLowerCase();

      if (rowAreaKey !== areaKey) return false;
      if (!weeks.has(String(row.semana_inicio))) return false;
      if (status !== 'retrasada' && status !== 'ausencia') return false;

      if (activeFilters.value.serie) {
        return rowAreaKey === normalizeAreaKey(activeFilters.value.serie) || row.equipo === activeFilters.value.serie;
      }

      return true;
    });

    const operationalEquivalent = operationalRows.reduce((sum, row) => {
      const hoursPerOrder = hoursPerOrderByArea[normalizeAreaKey(row.area)] || 0;
      return hoursPerOrder > 0 ? sum + (Number(row.horas_calculadas || 0) / hoursPerOrder) : sum;
    }, 0);
    const operationalHours = operationalRows.reduce((sum, row) => sum + Number(row.horas_calculadas || 0), 0);

    const personalRows = horasPerdidasPersonal.value.filter((row) => (
      normalizeAreaKey(row.area) === areaKey &&
      weeks.has(String(row.semana))
    ));
    const personalBreakdown = buildPersonalLossBreakdown(
      personalRows,
      areaKey,
      prorationOrderUniverse,
      Boolean(filters.value.idEquipo) || equipmentSerieFilterActive
    );

    const denominator = areaOrders.length;
    const realProgress = denominator > 0 ? Number(((concludedInVisibleWeeks / denominator) * 100).toFixed(2)) : 0;
    const operationalLostProgress = denominator > 0
      ? Number(((operationalEquivalent / denominator) * 100).toFixed(2))
      : 0;
    const personalLostProgress = denominator > 0
      ? Number(((personalBreakdown.totalEquivalent / denominator) * 100).toFixed(2))
      : 0;
    const lostProgress = sumDisplayedLossProgress(operationalLostProgress, personalLostProgress);

    return {
      area: areaOrders[0]?.Área || areaKey,
      areaShort: getWeeklyAreaShortName(areaOrders[0]?.Área || areaKey),
      denominator,
      concluded: concludedInVisibleWeeks,
      operationalLostEquivalent: operationalEquivalent,
      operationalLostHours: Number(operationalHours.toFixed(2)),
      personalLostEquivalent: Number(personalBreakdown.totalEquivalent.toFixed(2)),
      personalLostHours: Number(personalBreakdown.totalHours.toFixed(2)),
      lostHours: Number((operationalHours + personalBreakdown.totalHours).toFixed(2)),
      personalBreakdown,
      realProgress,
      operationalLostProgress,
      personalLostProgress,
      lostProgress,
      optimalProgress: sumRoundedProgress(realProgress, lostProgress)
    };
  }).sort((a, b) => (
    (b.operationalLostProgress + b.personalLostProgress) -
    (a.operationalLostProgress + a.personalLostProgress)
  ));
});

const weeklyAreaSummaryTotal = computed(() => {
  const denominator = weeklyAreaSummary.value.reduce((sum, row) => sum + row.denominator, 0);
  const concluded = weeklyAreaSummary.value.reduce((sum, row) => sum + row.concluded, 0);
  const operationalLostEquivalent = weeklyAreaSummary.value
    .reduce((sum, row) => sum + row.operationalLostEquivalent, 0);
  const personalLostEquivalent = weeklyAreaSummary.value
    .reduce((sum, row) => sum + row.personalLostEquivalent, 0);
  const operationalLostHours = weeklyAreaSummary.value
    .reduce((sum, row) => sum + Number(row.operationalLostHours || 0), 0);
  const personalLostHours = weeklyAreaSummary.value
    .reduce((sum, row) => sum + Number(row.personalLostHours || 0), 0);
  const realProgress = denominator > 0 ? Number(((concluded / denominator) * 100).toFixed(2)) : 0;
  const operationalLostProgress = denominator > 0
    ? Number(((operationalLostEquivalent / denominator) * 100).toFixed(2))
    : 0;
  const personalLostProgress = denominator > 0
    ? Number(((personalLostEquivalent / denominator) * 100).toFixed(2))
    : 0;
  const lostProgress = sumDisplayedLossProgress(operationalLostProgress, personalLostProgress);

  return {
    operationalLostHours: Number(operationalLostHours.toFixed(2)),
    personalLostHours: Number(personalLostHours.toFixed(2)),
    lostHours: Number((operationalLostHours + personalLostHours).toFixed(2)),
    realProgress,
    operationalLostProgress,
    personalLostProgress,
    lostProgress,
    optimalProgress: sumRoundedProgress(realProgress, lostProgress)
  };
});

const currentOrderTotalsByAreaForHorasPerdidas = computed<Record<string, number>>(() => (
  weeklyAreaSummary.value.reduce<Record<string, number>>((acc, row) => {
    acc[normalizeAreaKey(row.area)] = row.denominator;
    return acc;
  }, {})
));

const currentOrderTotalsGeneralForHorasPerdidas = computed<number>(() => (
  weeklyAreaSummary.value.reduce((sum, row) => sum + row.denominator, 0)
));

const getLostProgressOrderList = () => {
  const areaFixed = userArea.value?.toUpperCase();
  const areaFixedKey = normalizeAreaKey(userArea.value || '');

  let orderList = areaFixed === 'ALL'
    ? allOrders.value
    : allOrders.value.filter(d => normalizeAreaKey(d.Área || '') === areaFixedKey);

  if (filters.value.etapa) {
    orderList = orderList.filter(d => normalizeAreaKey(String(d.Etapa || '')) === normalizeAreaKey(filters.value.etapa));
  }

  if (areaFixed === 'ALL' && filters.value.area) {
    const selectedAreaKey = normalizeAreaKey(filters.value.area);
    orderList = orderList.filter(d => normalizeAreaKey(d.Área || '') === selectedAreaKey);
  }

  if (activeFilters.value.serie) {
    orderList = orderList.filter(d =>
      d.Área === activeFilters.value.serie ||
      d.Sistema === activeFilters.value.serie ||
      d.ITEM === activeFilters.value.serie ||
      d["ID_#EQUIPO"] === activeFilters.value.serie
    );
  }

  return orderList;
};

const getLostProgressAreaKeys = (orderList: OrdenMantenimiento[]) => {
  const selectedAreaKey = filters.value.area ? normalizeAreaKey(filters.value.area) : '';
  const areaFixed = userArea.value?.toUpperCase();
  const userAreaKey = normalizeAreaKey(userArea.value || '');
  const includeStatic2025Areas = !activeFilters.value.serie;

  let areaKeys = Array.from(new Set([
    ...orderList.map(d => normalizeAreaKey(d.Área || '')),
    ...(includeStatic2025Areas ? Object.keys(delayedAbsenceHours2025ByArea) : [])
  ])).filter(areaKey => areaKey && weeklyAreaSummaryAreaKeys.has(areaKey));

  if (areaFixed && areaFixed !== 'ALL') {
    areaKeys = areaKeys.filter(areaKey => areaKey === userAreaKey);
  }

  if (selectedAreaKey) {
    areaKeys = areaKeys.filter(areaKey => areaKey === selectedAreaKey);
  }

  return areaKeys;
};

const lostProgressWeeks = computed(() => {
  const maxWeek = Number(currentWeek.value);
  const weeks: string[] = [];
  for (let week = progress2025StartWeek; week <= maxWeek; week++) {
    weeks.push(String(week));
  }
  return weeks;
});

const lostProgressSelectedWeeks = computed(() => (
  lostProgressCurrentWeekOnly.value
    ? [String(currentWeek.value)]
    : lostProgressWeeks.value
));

const lostProgressPeriodLabel = computed(() => (
  lostProgressCurrentWeekOnly.value
    ? `Semana ${currentWeek.value}`
    : `Acumulado (${lostProgressWeeks.value.length} sem)`
));

const lostProgressAreaRows = computed(() => {
  const orderList = getLostProgressOrderList();
  const weeks = new Set(lostProgressSelectedWeeks.value);
  const areaKeys = getLostProgressAreaKeys(orderList);

  const rows = areaKeys.map(areaKey => {
    const areaOrders = orderList.filter(d => normalizeAreaKey(d.Área || '') === areaKey);
    const denominator = areaOrders.length;
    const hoursPerOrder = hoursPerOrderByArea[areaKey] || 0;

    const hours2026 = horasTrabajoData.value.reduce((sum, row) => {
      const status = String(row.estatus || '').trim().toLowerCase();
      const rowAreaKey = normalizeAreaKey(row.area);

      if (rowAreaKey !== areaKey) return sum;
      if (!weeks.has(String(row.semana_inicio))) return sum;
      if (status !== 'retrasada' && status !== 'ausencia') return sum;

      if (activeFilters.value.serie) {
        const serieKey = normalizeAreaKey(activeFilters.value.serie);
        if (rowAreaKey !== serieKey && row.equipo !== activeFilters.value.serie) return sum;
      }

      return sum + Number(row.horas_calculadas || 0);
    }, 0);

    const hours2025 = Object.entries(delayedAbsenceHours2025ByArea[areaKey] || {})
      .filter(([week]) => weeks.has(String(week)) && Number(week) <= Number(currentWeek.value))
      .reduce((sum, [, hours]) => sum + Number(hours || 0), 0);

    const equivalent2026 = hoursPerOrder > 0 ? hours2026 / hoursPerOrder : 0;
    const equivalent2025 = hoursPerOrder > 0 ? hours2025 / hoursPerOrder : 0;
    const lostProgress2026 = denominator > 0 ? Number(((equivalent2026 / denominator) * 100).toFixed(2)) : 0;
    const lostProgress2025 = denominator > 0 ? Number(((equivalent2025 / denominator) * 100).toFixed(2)) : 0;

    return {
      area: areaOrders[0]?.Área || areaKey,
      denominator,
      hours2026: Number(hours2026.toFixed(2)),
      hours2025: Number(hours2025.toFixed(2)),
      lostProgress2026,
      lostProgress2025,
      difference: Number((lostProgress2025 - lostProgress2026).toFixed(2)),
      differenceHours: Number((hours2025 - hours2026).toFixed(2))
    };
  });

  return rows.sort((a, b) => b.lostProgress2026 - a.lostProgress2026);
});

const lostProgressAreaTotal = computed(() => {
  const denominator = lostProgressAreaRows.value.reduce((sum, row) => sum + row.denominator, 0);
  const equivalent2026 = lostProgressAreaRows.value.reduce((sum, row) => {
    const hoursPerOrder = hoursPerOrderByArea[normalizeAreaKey(row.area)] || 0;
    return hoursPerOrder > 0 ? sum + (row.hours2026 / hoursPerOrder) : sum;
  }, 0);
  const equivalent2025 = lostProgressAreaRows.value.reduce((sum, row) => {
    const hoursPerOrder = hoursPerOrderByArea[normalizeAreaKey(row.area)] || 0;
    return hoursPerOrder > 0 ? sum + (row.hours2025 / hoursPerOrder) : sum;
  }, 0);
  const hours2026 = lostProgressAreaRows.value.reduce((sum, row) => sum + row.hours2026, 0);
  const useGeneral2025Hours = !lostProgressCurrentWeekOnly.value
    && userArea.value?.toUpperCase() === 'ALL'
    && !filters.value.area
    && !activeFilters.value.serie;
  const hours2025 = useGeneral2025Hours
    ? lostProgressWeeks.value
      .filter(week => Number(week) <= Number(currentWeek.value))
      .reduce((sum, week) => sum + Number(delayedAbsenceHours2025Total[week] || 0), 0)
    : lostProgressAreaRows.value.reduce((sum, row) => sum + row.hours2025, 0);
  const lostProgress2026 = denominator > 0 ? Number(((equivalent2026 / denominator) * 100).toFixed(2)) : 0;
  const lostProgress2025 = denominator > 0 ? Number(((equivalent2025 / denominator) * 100).toFixed(2)) : 0;

  return {
    hours2026: Number(hours2026.toFixed(2)),
    hours2025: Number(hours2025.toFixed(2)),
    lostProgress2026,
    lostProgress2025,
    difference: Number((lostProgress2025 - lostProgress2026).toFixed(2)),
    differenceHours: Number((hours2025 - hours2026).toFixed(2))
  };
});

const formatEquivalentOrders = (value: number, roundValue: boolean) => (
  roundValue ? String(Math.round(value)) : Number(value.toFixed(2)).toString()
);

const buildPersonalTooltipDetails = (weekData: typeof weeklyProgress.value[number]) => {
  const detailRows = [
    ['Vacaciones', weekData.horasVacaciones],
    ['Incapacidad', weekData.horasIncapacidad],
    ['Inactivo', weekData.horasInactivo],
    ['Plaza no cubierta', weekData.horasPlazaNoCubierta],
  ].filter(([, value]) => Number(value) > 0);

  return detailRows
    .map(([label, value]) => (
      `<div style="font-size: 0.9em; color: #7f1d1d; margin-left: 12px">${label}: ${Number(value).toFixed(1)} hrs</div>`
    ))
    .join('');
};

const lostProgressEChartOption = computed(() => {
  const currentYearColor = '#2563eb';
  const lastYearColor = '#64748b';
  const labels = lostProgressWeeks.value;
  const orderList = getLostProgressOrderList();
  const areaKeys = getLostProgressAreaKeys(orderList);
  const denominator = orderList.filter(d => areaKeys.includes(normalizeAreaKey(d.Área || ''))).length;

  const build2026Week = (week: string) => {
    const equivalent = horasTrabajoData.value.reduce((sum, row) => {
      const status = String(row.estatus || '').trim().toLowerCase();
      const areaKey = normalizeAreaKey(row.area);
      const hoursPerOrder = hoursPerOrderByArea[areaKey] || 0;

      if (!areaKeys.includes(areaKey)) return sum;
      if (!hoursPerOrder) return sum;
      if (String(row.semana_inicio) !== String(week)) return sum;
      if (status !== 'retrasada' && status !== 'ausencia') return sum;

      if (activeFilters.value.serie) {
        const serieKey = normalizeAreaKey(activeFilters.value.serie);
        if (areaKey !== serieKey && row.equipo !== activeFilters.value.serie) return sum;
      }

      return sum + (Number(row.horas_calculadas || 0) / hoursPerOrder);
    }, 0);

    return denominator > 0 ? Number(((equivalent / denominator) * 100).toFixed(2)) : 0;
  };

  const build2025Week = (week: string) => {
    const equivalent = areaKeys.reduce((sum, areaKey) => {
      const hoursPerOrder = hoursPerOrderByArea[areaKey] || 0;
      const hours = Number(delayedAbsenceHours2025ByArea[areaKey]?.[week] || 0);
      return hoursPerOrder > 0 ? sum + (hours / hoursPerOrder) : sum;
    }, 0);

    return denominator > 0 ? Number(((equivalent / denominator) * 100).toFixed(2)) : 0;
  };

  const data2026 = labels.map(build2026Week);
  const data2025 = labels.map(build2025Week);
  const maxValue = Math.max(...data2026, ...data2025, 0);
  const chartMax = maxValue > 0 ? Number((maxValue * 1.3).toFixed(2)) : 1;

  return {
    grid: { left: '8%', right: '5%', top: '15%', bottom: '10%' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'white',
      borderColor: '#f1f5f9',
      borderWidth: 1,
      textStyle: { color: '#475569' },
      formatter: (params: any[]) => {
        const week = String(params[0]?.axisValue || '');
        const value2026 = params.find(p => p.seriesName === 'Avance perdido 2026')?.value || 0;
        const value2025 = params.find(p => p.seriesName === 'Avance perdido 2025')?.value || 0;
        const hours2026 = horasTrabajoData.value.reduce((sum, row) => {
          const status = String(row.estatus || '').trim().toLowerCase();
          const areaKey = normalizeAreaKey(row.area);
          if (!areaKeys.includes(areaKey)) return sum;
          if (String(row.semana_inicio) !== week) return sum;
          if (status !== 'retrasada' && status !== 'ausencia') return sum;
          if (activeFilters.value.serie) {
            const serieKey = normalizeAreaKey(activeFilters.value.serie);
            if (areaKey !== serieKey && row.equipo !== activeFilters.value.serie) return sum;
          }
          return sum + Number(row.horas_calculadas || 0);
        }, 0);
        const hours2025 = areaKeys.length === Object.keys(delayedAbsenceHours2025ByArea).length
          ? Number(delayedAbsenceHours2025Total[week] || 0)
          : areaKeys.reduce((sum, areaKey) => sum + Number(delayedAbsenceHours2025ByArea[areaKey]?.[week] || 0), 0);

        return `
          <div style="color:#1e293b;font-weight:bold;margin-bottom:4px">Semana ${week}</div>
          <div style="color:${currentYearColor}">Avance perdido 2026: ${value2026}% (${hours2026.toFixed(1)} hrs)</div>
          <div style="color:${lastYearColor}">Avance perdido 2025: ${value2025}% (${hours2025.toFixed(1)} hrs)</div>
        `;
      }
    },
    legend: {
      data: ['Avance perdido 2026', 'Avance perdido 2025'],
      top: 0,
      icon: 'circle',
      textStyle: { fontSize: 10, fontWeight: 'bold' }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: chartMax,
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' }
    },
    series: [
      {
        name: 'Avance perdido 2026',
        type: 'line',
        smooth: true,
        color: currentYearColor,
        data: data2026,
        symbolSize: 6,
        lineStyle: { width: 3 },
        itemStyle: { color: currentYearColor },
      },
      {
        name: 'Avance perdido 2025',
        type: 'line',
        smooth: true,
        color: lastYearColor,
        data: data2025,
        symbolSize: 6,
        lineStyle: { width: 3 },
        itemStyle: { color: lastYearColor },
      }
    ]
  };
});

const weeklyEChartOption = computed(() => {
  const data = weeklyProgress.value;
  const labels = data.map(d => d.semana);
  const concluidaValues = data.map(d => d.concluidaAvance);
  const nrValues = data.map(d => d.nrAvance);
  const perdidaOperativaValues = data.map(d => Number(d.retrasadaAvance.toFixed(2)));
  const perdidaPersonalValues = data.map(d => Number(d.personalAvance.toFixed(2)));
  const targetValue = 2.94;
  const targetPerc = 0.0294;
  const targetValues = labels.map(() => targetValue);
  const formatWeeklyValue = (value: number | string | null | undefined) => `${Number(value || 0).toFixed(1)}%`;
  const isNrVisible = weeklyLegendSelected.value['NR 2026'] !== false;
  const getDisplayedAdvance = (weekData: typeof data[number] | undefined) => {
    if (!weekData) return 0;
    return isNrVisible ? weekData.avance : weekData.concluidaAvance;
  };

  const isZafra = filters.value.etapa && normalizeAreaKey(filters.value.etapa) === defaultEtapaKey;
  const showLoss = isZafra && weeklyLossVisible.value;
  const avanceValues2025 = isZafra ? labels.map(sem => getProgress2025NormalizedValue(sem)) : [];

  const stacked2026Values = data.map(d => getDisplayedAdvance(d) + (showLoss ? d.retrasadaAvance + d.personalAvance : 0));
  const maxAvance = stacked2026Values.length > 0 ? Math.max(...stacked2026Values) : 0;
  const maxAvance2025 = isZafra && avanceValues2025.length > 0 ? Math.max(...avanceValues2025) : 0;
  const overallMax = Math.max(maxAvance, maxAvance2025);
  const chartMax = overallMax > 5 ? Math.ceil(overallMax) + 1 : 5;

  const seriesTemplate = [];

  if (isZafra) {
    seriesTemplate.push({
        name: 'Avance 2025',
        type: 'bar',
        color: '#4b9b7a',
        data: avanceValues2025,
        barMaxWidth: 18,
        barGap: '45%',
        barCategoryGap: '38%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (p: any) => {
            const hasSemanaFilter = !!activeFilters.value.semana;
            const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
            return matchesSemana ? '#4b9b7a' : applyAlpha('#4b9b7a', 0.25);
          }
        },
        label: {
          show: true,
          position: 'top',
          color: (p: any) => {
            const hasSemanaFilter = !!activeFilters.value.semana;
            const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
            return matchesSemana ? '#4b9b7a' : 'transparent';
          },
          fontWeight: 'bold',
          fontSize: 10,
          formatter: (p: any) => Number(p.value || 0) > 0 ? formatWeeklyValue(p.value) : ''
        }
      });
  }

  seriesTemplate.push({
        name: 'Concluida 2026',
        type: 'bar',
        stack: 'avance2026',
        color: '#004236',
        data: concluidaValues,
        barMaxWidth: 18,
        barGap: '45%',
        barCategoryGap: '38%',
        itemStyle: {
          borderRadius: [0, 0, 4, 4],
          color: (p: any) => {
            const hasSemanaFilter = !!activeFilters.value.semana;
            const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
            return matchesSemana ? '#004236' : applyAlpha('#004236', 0.25);
          }
        },
        label: {
          show: true,
          position: 'top',
          color: (p: any) => {
            const hasSemanaFilter = !!activeFilters.value.semana;
            const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
            return matchesSemana ? '#004236' : 'transparent';
          },
          fontWeight: 'bold',
          fontSize: 10,
          formatter: (p: any) => {
            if ((isZafra && showLoss) || p.value <= 0) return '';
            const weekData = data.find(d => String(d.semana) === String(p.name));
            if (!weekData) return '';
            if (isNrVisible && weekData.nrAvance > 0) return '';
            return formatWeeklyValue(getDisplayedAdvance(weekData));
          }
        }
      });

  seriesTemplate.push({
        name: 'NR 2026',
        type: 'bar',
        stack: 'avance2026',
        color: '#b45309',
        data: nrValues,
        barMaxWidth: 18,
        barGap: '45%',
        barCategoryGap: '38%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (p: any) => {
            const hasSemanaFilter = !!activeFilters.value.semana;
            const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
            return matchesSemana ? '#b45309' : applyAlpha('#0f766e', 0.25);
          }
        },
        label: {
          show: true,
          position: 'top',
          color: (p: any) => {
            const hasSemanaFilter = !!activeFilters.value.semana;
            const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
            return matchesSemana ? '#004236' : 'transparent';
          },
          fontWeight: 'bold',
          fontSize: 10,
          formatter: (p: any) => {
            if ((isZafra && showLoss) || p.value <= 0) return '';
            const weekData = data.find(d => String(d.semana) === String(p.name));
            if (!isNrVisible || !weekData) return '';
            return weekData.avance > 0 ? formatWeeklyValue(weekData.avance) : '';
          }
        }
      });

  if (isZafra) {
    seriesTemplate.push({
          name: 'Pérdida Operativa',
          type: 'bar',
          stack: 'avance2026',
          color: '#C0392B',
          data: perdidaOperativaValues,
          barMaxWidth: 18,
          barGap: '45%',
          barCategoryGap: '38%',
          itemStyle: {
            borderRadius: [0, 0, 0, 0],
            color: (p: any) => {
              const hasSemanaFilter = !!activeFilters.value.semana;
              const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
              return matchesSemana ? '#C0392B' : applyAlpha('#C0392B', 0.25);
            }
          },
          label: {
            show: true,
            position: 'top',
            distance: 4,
            fontWeight: 'bold',
            formatter: (p: any) => {
              const hasSemanaFilter = !!activeFilters.value.semana;
              const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
              const weekData = data.find(d => String(d.semana) === String(p.name));
              if (!showLoss || !matchesSemana || !weekData) return '';

              const perdida = Number((weekData.retrasadaAvance + weekData.personalAvance).toFixed(2));
              const hasOperationalLoss = weekData.retrasadaAvance > 0;
              const hasPersonalLoss = weekData.personalAvance > 0;
              const displayedAdvance = getDisplayedAdvance(weekData);

              if (!hasOperationalLoss || hasPersonalLoss) return '';
              if (displayedAdvance <= 0 && perdida <= 0) return '';

              return `{real|${formatWeeklyValue(displayedAdvance)}}{sep| | }{lost|${formatWeeklyValue(displayedAdvance + perdida)}}`;
            },
            rich: {
              real: { color: '#004236', fontWeight: 'bold' },
              sep: { color: '#64748b', fontWeight: 'bold' },
              lost: { color: '#C0392B', fontWeight: 'bold' }
            }
          }
        });

    seriesTemplate.push({
          name: 'Falta de Personal',
          type: 'bar',
          stack: 'avance2026',
          color: '#E74C3C',
          data: perdidaPersonalValues,
          barMaxWidth: 18,
          barGap: '45%',
          barCategoryGap: '38%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (p: any) => {
              const hasSemanaFilter = !!activeFilters.value.semana;
              const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
              return matchesSemana ? '#E74C3C' : applyAlpha('#E74C3C', 0.25);
            }
          },
          label: {
            show: true,
            position: 'top',
            distance: 4,
            fontWeight: 'bold',
            formatter: (p: any) => {
              const hasSemanaFilter = !!activeFilters.value.semana;
              const matchesSemana = !hasSemanaFilter || String(activeFilters.value.semana) === String(p.name);
              const weekData = data.find(d => String(d.semana) === String(p.name));
              if (!showLoss || !matchesSemana || !weekData) return '';

              const perdida = Number((weekData.retrasadaAvance + weekData.personalAvance).toFixed(2));
              const displayedAdvance = getDisplayedAdvance(weekData);
              if (weekData.personalAvance <= 0) return '';
              if (displayedAdvance <= 0 && perdida <= 0) return '';

              return `{real|${formatWeeklyValue(displayedAdvance)}}{sep| | }{lost|${formatWeeklyValue(displayedAdvance + perdida)}}`;
            },
            rich: {
              real: { color: '#004236', fontWeight: 'bold' },
              sep: { color: '#64748b', fontWeight: 'bold' },
              lost: { color: '#C0392B', fontWeight: 'bold' }
            }
          }
        });
  }

  seriesTemplate.push({
        name: 'Objetivo',
        type: 'line',
        color: '#d4a94d',
        data: targetValues,
        itemStyle: { color: '#d4a94d' },
        lineStyle: { type: 'dashed', width: 2 },
        symbol: 'none',
      });

  return {
    grid: { left: '8%', right: '5%', top: '15%', bottom: '10%' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'white',
      borderColor: '#f1f5f9',
      borderWidth: 1,
      textStyle: { color: '#475569' },
      formatter: (params: any[]) => {
        const barConcluida = params.find(p => p.seriesName === 'Concluida 2026');
        const barNr = params.find(p => p.seriesName === 'NR 2026');
        const barP2025 = params.find(p => p.seriesName === 'Avance 2025');
        const weekStr = (barConcluida || barNr || barP2025 || params[0])?.axisValue || '';
        const weekData = data.find(d => String(d.semana) === weekStr);
        const targetQty = weekData ? Math.round(weekData.globalTotal * targetPerc) : 0;

        let res = `<div style="color:#1e293b;font-weight:bold;margin-bottom:4px">Semana ${weekStr}</div>`;
        if (barP2025 && isZafra) {
          res += `<div>Avance 2025: ${formatWeeklyValue(barP2025.value)}</div>`;
        }
        if (barConcluida || barNr) {
          res += `<div>Avance 2026: ${formatWeeklyValue(getDisplayedAdvance(weekData))} (<span style="font-size: 0.9em">Concluida: ${weekData?.concluidasSinNr || 0}, NR: ${weekData?.nrConcluidas || 0} / ${weekData?.total || 0}</span>)</div>`;
        }
        if (weekData && showLoss) {
          const perdidaTotal = Number((weekData.retrasadaAvance + weekData.personalAvance).toFixed(2));
          if (perdidaTotal > 0) {
            res += `<div>Retrasada: ${formatWeeklyValue(weekData.retrasadaAvance)} <span style="font-size: 0.9em">(${Math.round(weekData.retrasadaEquivalente)} órdenes eq. / ${weekData.horasRetrasada} hrs)</span></div>`;
            if (weekData.horasPersonal > 0) {
              res += `<div>Falta de personal: ${formatWeeklyValue(weekData.personalAvance)} <span style="font-size: 0.9em">(${formatEquivalentOrders(weekData.personalEquivalente, hasEquipmentScopedPersonalLoss.value)} órdenes eq. / ${weekData.horasPersonal} hrs)</span></div>`;
              res += buildPersonalTooltipDetails(weekData);
            }
            res += `<div style="color:#C0392B;font-weight:bold">Pérdida total: ${formatWeeklyValue(perdidaTotal)}</div>`;
          }
        }
        res += `<div>Objetivo: ${formatWeeklyValue(targetValue)} (${targetQty})</div>`;
        return res;
      }
    },
    legend: {
      data: isZafra
        ? ['Objetivo', 'Avance 2025', 'Concluida 2026', 'NR 2026', 'Pérdida Operativa', 'Falta de Personal']
        : ['Objetivo', 'Concluida 2026', 'NR 2026'],
      selected: isZafra
        ? {
          'NR 2026': weeklyLegendSelected.value['NR 2026'] !== false,
          'Pérdida Operativa': weeklyLossVisible.value,
          'Falta de Personal': weeklyLossVisible.value
        }
        : {
          'NR 2026': weeklyLegendSelected.value['NR 2026'] !== false,
        },
      top: 0,
      icon: 'circle',
      textStyle: { fontSize: 10, fontWeight: 'bold' }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: chartMax,
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' }
    },
    series: seriesTemplate
  };
});

const handleWeeklyChartClick = (params: any) => {
  if ((params.componentType === 'series' && params.seriesType === 'bar') || params.componentType === 'xAxis') {
    const label = params.name || params.value;
    if (label) setWeekFilter(String(label));
  }
};

const handleWeeklyLegendSelectChanged = (params: any) => {
  if (!params?.selected) return;

  weeklyLegendSelected.value = {
    ...weeklyLegendSelected.value,
    ...params.selected,
  };

  const toggledLossSeries = params.name === 'Pérdida Operativa' || params.name === 'Falta de Personal';

  if (toggledLossSeries) {
    weeklyLossVisible.value = !!params.selected[params.name];
  }
};

const toggleLostProgressDisplay = (type: 'percent' | 'time') => {
  if (type === 'percent') {
    if (showLostProgressPercent.value && !showLostProgressTime.value) return;
    showLostProgressPercent.value = !showLostProgressPercent.value;
    return;
  }

  if (showLostProgressTime.value && !showLostProgressPercent.value) return;
  showLostProgressTime.value = !showLostProgressTime.value;
};

</script>

<template>
  <div id="slide-maintenance-container" class="flex flex-col bg-second pt-0 mt-0">
    <div id="slide-maintenance-filters"
      class="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-2 md:px-6 shadow-sm mt-0 overflow-visible">
      <div
        class="flex items-center gap-3 py-1 overflow-x-auto no-scrollbar overflow-y-visible pb-[300px] -mb-[300px] pointer-events-none">
        <div class="flex items-center gap-2 flex-nowrap shrink-0 pointer-events-auto">

          <div class="relative min-w-[140px]">
            <div @click.stop="toggleDropdown('etapa')"
              class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              id="filter-trigger-etapa">
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-[11px] font-bold text-gray-900 whitespace-nowrap">Etapa</span>
                <span class="text-[11px] font-medium text-gray-400 truncate">{{ filters.etapa || 'Todas' }}</span>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </div>
            <div v-if="activeDropdown === 'etapa'" @click.stop
              class="absolute top-full left-0 mt-1 w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl z-50">
              <div class="p-2 border-b border-gray-50">
                <div class="relative">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input v-model="searchQueries.etapa" type="text" placeholder="Buscar..."
                    class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-main" />
                </div>
              </div>
              <div class="max-h-[250px] overflow-y-auto p-1 no-scrollbar">
                <button @click.stop="selectOption('etapa', '')"
                  class="w-full text-center py-1.5 text-[10px] font-bold text-main hover:bg-main/5 rounded-md mb-1">
                  Limpiar
                </button>
                <div v-for="opt in getFilteredOptionsList('etapas', 'etapa')" :key="opt"
                  @click.stop="selectOption('etapa', String(opt))"
                  class="flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span :class="{ 'font-bold text-main': filters.etapa === String(opt) }">{{ opt }}</span>
                  <Check v-if="filters.etapa === String(opt)" class="w-3.5 h-3.5 text-main" />
                </div>
              </div>
            </div>
          </div>

          <div class="relative min-w-[140px]" v-if="userArea.toUpperCase() === 'ALL'">
            <div @click.stop="toggleDropdown('area')"
              class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              id="filter-trigger-area">
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-[11px] font-bold text-gray-900 whitespace-nowrap">Área</span>
                <span class="text-[11px] font-medium text-gray-400 truncate">{{ filters.area || 'Todas' }}</span>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </div>
            <div v-if="activeDropdown === 'area'" @click.stop
              class="absolute top-full left-0 mt-1 w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl z-50">
              <div class="p-2 border-b border-gray-50">
                <div class="relative">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input v-model="searchQueries.area" type="text" placeholder="Buscar..."
                    class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-main" />
                </div>
              </div>
              <div class="max-h-[250px] overflow-y-auto p-1 no-scrollbar">
                <button @click.stop="selectOption('area', '')"
                  class="w-full text-center py-1.5 text-[10px] font-bold text-main hover:bg-main/5 rounded-md mb-1">
                  Limpiar
                </button>
                <div v-for="opt in getFilteredOptionsList('areas', 'area')" :key="opt"
                  @click.stop="selectOption('area', String(opt))"
                  class="flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span :class="{ 'font-bold text-main': filters.area === String(opt) }">{{ opt }}</span>
                  <Check v-if="filters.area === String(opt)" class="w-3.5 h-3.5 text-main" />
                </div>
              </div>
            </div>
          </div>

          <div class="relative min-w-[150px]">
            <div @click.stop="toggleDropdown('item')"
              class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              id="filter-trigger-item">
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-[11px] font-bold text-gray-900 whitespace-nowrap">Tipo Equipo</span>
                <span class="text-[11px] font-medium text-gray-400 truncate">{{ filters.item || 'Cualquiera' }}</span>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </div>
            <div v-if="activeDropdown === 'item'" @click.stop
              class="absolute top-full left-0 mt-1 w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl z-50">
              <div class="p-2 border-b border-gray-50">
                <div class="relative">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input v-model="searchQueries.item" type="text" placeholder="Buscar..."
                    class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-main" />
                </div>
              </div>
              <div class="max-h-[250px] overflow-y-auto p-1 no-scrollbar">
                <button @click.stop="selectOption('item', '')"
                  class="w-full text-center py-1.5 text-[10px] font-bold text-main hover:bg-main/5 rounded-md mb-1">
                  Limpiar
                </button>
                <div v-for="opt in getFilteredOptionsList('items', 'item')" :key="opt"
                  @click.stop="selectOption('item', String(opt))"
                  class="flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span :class="{ 'font-bold text-main': filters.item === String(opt) }">{{ opt }}</span>
                  <Check v-if="filters.item === String(opt)" class="w-3.5 h-3.5 text-main" />
                </div>
              </div>
            </div>
          </div>

          <div class="relative min-w-[140px]">
            <div @click.stop="toggleDropdown('idEquipo')"
              class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              id="filter-trigger-id-equipo">
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-[11px] font-bold text-gray-900 whitespace-nowrap">ID Equipo</span>
                <span class="text-[11px] font-medium text-gray-400 truncate">{{ filters.idEquipo || 'Todos' }}</span>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </div>
            <div v-if="activeDropdown === 'idEquipo'" @click.stop
              class="absolute top-full left-0 mt-1 w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl z-50">
              <div class="p-2 border-b border-gray-50">
                <div class="relative">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input v-model="searchQueries.idEquipo" type="text" placeholder="Buscar..."
                    class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-main" />
                </div>
              </div>
              <div class="max-h-[250px] overflow-y-auto p-1 no-scrollbar">
                <button @click.stop="selectOption('idEquipo', '')"
                  class="w-full text-center py-1.5 text-[10px] font-bold text-main hover:bg-main/5 rounded-md mb-1">
                  Limpiar
                </button>
                <div v-for="opt in getFilteredOptionsList('ids', 'idEquipo')" :key="opt"
                  @click.stop="selectOption('idEquipo', String(opt))"
                  class="flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span :class="{ 'font-bold text-main': filters.idEquipo === String(opt) }">{{ opt }}</span>
                  <Check v-if="filters.idEquipo === String(opt)" class="w-3.5 h-3.5 text-main" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 min-w-[20px] pointer-events-auto"></div>

        <div class="flex items-center gap-1 border-l border-gray-100 pl-3 pointer-events-auto pr-1">
          <button type="button" @click="showStatusCharts = !showStatusCharts"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex-shrink-0"
            :class="showStatusCharts ? 'border-main bg-main text-white' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'">
            <span class="relative inline-flex h-4 w-7 rounded-full transition-colors"
              :class="showStatusCharts ? 'bg-white/25' : 'bg-gray-200'">
              <span class="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
                :class="showStatusCharts ? 'translate-x-3.5' : 'translate-x-0.5'"></span>
            </span>
            Gráficas estatus
          </button>
          <button @click="clearFilters"
            class="p-2 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors flex-shrink-0"
            title="Limpiar filtros">
            <X class="w-4 h-4" />
          </button>
          <button @click="fetchData(true)"
            class="p-2 text-gray-400 hover:text-main hover:bg-main/5 rounded-lg transition-colors flex-shrink-0"
            :disabled="isRefreshing">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
          </button>
        </div>
      </div>
    </div>

    <div id="slide-maintenance-content" class="flex-1 p-4 md:p-6">
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-main animate-spin mb-4" />
        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizando Plan...</p>
        <div class="mt-4 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-main transition-all duration-300" :style="{ width: `${loadingProgress}%` }"></div>
        </div>
        <p class="mt-2 text-[10px] font-bold text-main">{{ loadingProgress }}%</p>
      </div>

      <div v-else-if="filteredData.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center opacity-40">
        <ClipboardList class="w-12 h-12 text-gray-300 mb-2" />
        <p class="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Sin órdenes registradas</p>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-start">
          <div id="slide-maint-status-chart"
            class="hidden p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 self-start">
            <div class="mb-6">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-4">ESTATUS DE TALLER</h2>
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-lg font-bold text-gray-800">Estatus de Órdenes</h3>
                <div class="bg-[#004236] px-3 py-1 rounded-full border border-[#015e4d] shadow-sm shrink-0">
                  <span class="text-white text-xs font-bold">{{ filteredData.length }} total</span>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <div class="hidden sm:grid grid-cols-[1fr_100px_1fr] px-4 py-2 border-b border-gray-100 italic">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ESTATUS</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">CANT.</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right px-4">%</span>
              </div>

              <div class="divide-y divide-gray-50">
                <div v-for="item in statusStats" :key="item.label"
                  class="px-4 py-3 hover:bg-gray-50/50 transition-all duration-300"
                  :class="{ 'opacity-30 grayscale-[30%]': activeFilters.estado && activeFilters.estado !== item.label }">

                  <div class="flex flex-col gap-3 sm:hidden">
                    <div class="flex items-center gap-3 min-w-0">
                      <div :class="[item.dotColor, 'w-2.5 h-2.5 rounded-full shadow-sm shrink-0']"></div>
                      <span class="text-sm font-medium text-gray-600 truncate">{{ item.label }}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div class="min-w-0">
                        <span
                          class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">CANT.</span>
                        <span class="text-sm font-bold text-gray-800 font-mono">{{ item.count }}</span>
                      </div>

                      <div class="min-w-0">
                        <span
                          class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-right">%</span>
                        <div class="flex items-center gap-3">
                          <div class="h-1.5 flex-1 bg-[#f5f5f0] rounded-full overflow-hidden">
                            <div :class="[item.color, 'h-full transition-all duration-1000 ease-out']"
                              :style="{ width: `${item.percentage}%` }"></div>
                          </div>
                          <span class="text-[11px] font-bold text-gray-400 w-12 text-right">
                            {{ item.percentage.toFixed(1) }}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="hidden sm:grid grid-cols-[1fr_100px_1fr] items-center">
                    <div class="flex items-center gap-3 min-w-0">
                      <div :class="[item.dotColor, 'w-2.5 h-2.5 rounded-full shadow-sm shrink-0']"></div>
                      <span class="text-sm font-medium text-gray-600 truncate">{{ item.label }}</span>
                    </div>

                    <div class="text-right pr-2">
                      <span class="text-sm font-bold text-gray-800 font-mono">{{ item.count }}</span>
                    </div>

                    <div class="flex items-center gap-4 pl-4 min-w-0">
                      <div class="h-1.5 flex-1 bg-[#f5f5f0] rounded-full overflow-hidden">
                        <div :class="[item.color, 'h-full transition-all duration-1000 ease-out']"
                          :style="{ width: `${item.percentage}%` }"></div>
                      </div>
                      <span class="text-[11px] font-bold text-gray-400 w-12 text-right">
                        {{ item.percentage.toFixed(1) }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="px-4 py-5 border-t border-gray-200 mt-2">
                <div class="flex flex-col gap-3 sm:hidden">
                  <span class="text-sm font-bold text-gray-800 uppercase tracking-widest">Total</span>
                  <div class="grid grid-cols-2 gap-3 items-center">
                    <span class="text-sm font-bold text-gray-800 font-mono">{{ filteredData.length }}</span>
                    <span class="text-[11px] font-bold text-gray-400 text-right">100%</span>
                  </div>
                </div>

                <div class="hidden sm:grid grid-cols-[1fr_100px_1fr] items-center">
                  <span class="text-sm font-bold text-gray-800 uppercase tracking-widest px-2">Total</span>
                  <span class="text-sm font-bold text-gray-800 text-right pr-2 font-mono">{{ filteredData.length
                    }}</span>
                  <div class="flex items-center gap-4 pl-4 opacity-50">
                    <div class="h-0.5 flex-1 bg-gray-100"></div>
                    <span class="text-[11px] font-bold text-gray-400 w-12 text-right">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="slide-maint-dist-chart"
            class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 self-stretch flex flex-col">
            <div class="mb-6">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-4">DISTRIBUCIÓN POR ESTATUS
                GLOBAL</h2>
            </div>

            <div class="h-[240px] xl:h-[300px] mt-2 w-full">
              <EChart :key="JSON.stringify(activeFilters)" :option="echartBarOption" />
            </div>
          </div>

          <div id="slide-maint-progress-chart"
            class="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 self-stretch flex flex-col">
            <div class="mb-1">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-4">AVANCE IDEAL VS REAL</h2>
              <div
                class="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                <div class="flex flex-col gap-0.5">
                  <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">FECHA INICIAL</span>
                  <span class="text-gray-800 font-bold">{{ progressMetrics.startDateStr }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">FECHA FINAL</span>
                  <span class="text-gray-800 font-bold">{{ progressMetrics.endDateStr }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">DÍAS HÁBILES</span>
                  <span class="text-gray-800 font-bold">{{ progressMetrics.totalWorkingDays }}</span>
                </div>
              </div>
            </div>

            <div class="mt-4 overflow-x-auto flex-1">
              <div class="grid grid-cols-[28%_24%_24%_24%] border-b border-gray-100 italic">
                <div class="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ÁREA</div>
                <div class="px-2 py-1 text-[10px] font-bold  text-gray-400 uppercase tracking-widest text-right">% AVANCE
                  IDEAL A HOY</div>
                <div class="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">AVANCE
                  ACTUAL</div>
                <div class="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                  DIFERENCIA</div>
              </div>
              <div v-for="row in progressMetrics.rows" :key="row.label"
                class="grid grid-cols-[28%_24%_24%_24%] items-center border-b border-gray-50 font-bold text-sm hover:bg-gray-50/50 transition-all duration-300">
                <div class="px-2 py-2  text-gray-700 truncate">
                  {{ row.displayLabel }}
                </div>

                <div class="px-2 py-2 text-right text-main whitespace-nowrap">
                  {{ row.idealProgress.toFixed(1) }}%
                </div>

                <div class="px-2 py-2 text-right whitespace-nowrap">
                  {{ row.actualProgress.toFixed(1) }}%
                </div>

                <div class="px-2 py-2 text-right whitespace-nowrap"
                  :class="row.difference >= 0 ? 'text-success' : 'text-danger'">
                  {{ row.difference.toFixed(1) }}%
                </div>
              </div>
              <div class="grid grid-cols-[28%_24%_24%_24%] items-center bg-gray-50 font-bold border-t border-gray-200">
                <div class="px-2 py-2 text-gray-800">
                  TOTAL
                </div>

                <div class="px-2 py-2 text-right whitespace-nowrap text-main">
                  {{ progressMetrics.totalRow.idealProgress.toFixed(1) }}%
                </div>

                <div class="px-2 py-2 text-right whitespace-nowra text-gray-800">
                  {{ progressMetrics.totalRow.actualProgress.toFixed(1) }}%
                </div>

                <div class="px-2 py-2 text-right whitespace-nowrap"
                  :class="progressMetrics.totalRow.difference >= 0 ? 'text-success' : 'text-danger'">
                  {{ progressMetrics.totalRow.difference.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 mb-8 items-start">
          <div id="slide-maint-weekly-chart"
            class="min-w-0 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 self-start overflow-hidden">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">AVANCE SEMANAL (ÚLTIMAS 5
                SEMANAS)</h2>
              <div class="bg-main/5 px-2 py-1 rounded-md border border-main/10 flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-[#d4a94d]"></div>
                <span class="text-[9px] font-bold text-gray-500 tracking-wider">{{ targetLabel }}</span>
              </div>
            </div>

            <div class="h-[250px] xl:h-[320px] w-full min-w-0 block overflow-hidden">
              <EChart :key="JSON.stringify(activeFilters)" :option="weeklyEChartOption" @click="handleWeeklyChartClick"
                @legendselectchanged="handleWeeklyLegendSelectChanged" />
            </div>
          </div>

          <div
            class="min-w-0 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 self-start overflow-hidden">
            <div class="mb-6">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">AVANCE CONCLUIDO SEMANAL</h2>
            </div>
            <div class="overflow-x-auto border border-gray-100 rounded-xl">
              <table class="w-full min-w-[420px] table-fixed text-left">
                <thead class="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th class="w-[30%] px-3 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">ÁREA</th>
                    <th class="w-[23%] px-3 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">
                      SEMANA {{ weeklyConcludedComparison.previousWeek }}
                    </th>
                    <th class="w-[23%] px-3 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">
                     ESTA SEMANA
                    </th>
                    <th class="w-[24%] px-3 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">
                      AVANCE ACTUAL
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="row in weeklyConcludedComparison.rows" :key="row.area"
                    class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-3 py-3 text-xs font-bold text-gray-700 truncate">{{ getWeeklyAreaShortName(row.area) }}</td>
                    <td class="px-3 py-3 text-xs font-bold text-right text-[#64748b]">
                      {{ row.previousProgress.toFixed(1) }}%
                    </td>
                    <td class="px-3 py-3 text-xs font-bold text-right text-[#2d8a54]">
                      {{ row.thisWeekProgress.toFixed(1) }}%
                    </td>
                    <td class="px-3 py-3 text-xs font-bold text-right text-[#004236]">
                      {{ row.currentProgress.toFixed(1) }}%
                    </td>
                  </tr>
                  <tr v-if="weeklyConcludedComparison.rows.length > 0" class="bg-gray-50 border-t border-gray-200">
                    <td class="px-3 py-3 text-xs font-black text-gray-700 uppercase tracking-widest">Total</td>
                    <td class="px-3 py-3 text-xs font-black text-right text-[#64748b]">
                      {{ weeklyConcludedComparison.totalRow.previousProgress.toFixed(1) }}%
                    </td>
                    <td class="px-3 py-3 text-xs font-black text-right text-[#2d8a54]">
                      {{ weeklyConcludedComparison.totalRow.thisWeekProgress.toFixed(1) }}%
                    </td>
                    <td class="px-3 py-3 text-xs font-black text-right text-[#004236]">
                      {{ weeklyConcludedComparison.totalRow.currentProgress.toFixed(1) }}%
                    </td>
                  </tr>
                  <tr v-if="weeklyConcludedComparison.rows.length === 0">
                    <td colspan="4" class="px-4 py-8 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">
                      Sin concluidas por área
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 items-start">
          <div
            class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 self-start">
            <div class="mb-6">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">AVANCE EQUIVALENTE</h2>
              <p class="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Misma semanas transcurridas desde el inicio</p>
            </div>

            <div class="overflow-hidden border border-gray-100 rounded-xl">
              <table class="w-full text-left">
                <thead class="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ÁREA</th>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">2026</th>
                    <th v-if="normalizedComparisonAreaRows.isZafra" class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">2025</th>
                    <th v-if="normalizedComparisonAreaRows.isZafra" class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">DIF.</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="row in normalizedComparisonAreaRows.rows" :key="`normalized-${row.area}`" class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-4 py-3 text-sm font-bold text-gray-700">{{ getWeeklyAreaShortName(row.area) }}</td>
                    <td class="px-4 py-3 text-sm font-bold text-right text-[#004236]">{{ row.avance2026.toFixed(1) }}%</td>
                    <td v-if="normalizedComparisonAreaRows.isZafra" class="px-4 py-3 text-sm font-bold text-right text-[#3455E3]">{{ row.avance2025.toFixed(1) }}%</td>
                    <td v-if="normalizedComparisonAreaRows.isZafra" class="px-4 py-3 text-sm font-bold text-right" :class="row.difference >= 0 ? 'text-success' : 'text-danger'">
                      {{ row.difference > 0 ? '+' : '' }}{{ row.difference.toFixed(1) }}%
                    </td>
                  </tr>
                  <tr v-if="normalizedComparisonAreaRows.rows.length > 0" class="bg-gray-50 border-t border-gray-200">
                    <td class="px-4 py-3 text-xs font-black text-gray-700 uppercase tracking-widest">Total</td>
                    <td class="px-4 py-3 text-sm font-black text-right text-[#004236]">{{ normalizedComparisonAreaRows.totalRow.avance2026.toFixed(1) }}%</td>
                    <td v-if="normalizedComparisonAreaRows.isZafra" class="px-4 py-3 text-sm font-black text-right text-[#3455E3]">{{ normalizedComparisonAreaRows.totalRow.avance2025.toFixed(1) }}%</td>
                    <td v-if="normalizedComparisonAreaRows.isZafra" class="px-4 py-3 text-sm font-black text-right" :class="normalizedComparisonAreaRows.totalRow.difference >= 0 ? 'text-success' : 'text-danger'">
                      {{ normalizedComparisonAreaRows.totalRow.difference > 0 ? '+' : '' }}{{ normalizedComparisonAreaRows.totalRow.difference.toFixed(1) }}%
                    </td>
                  </tr>
                  <tr v-if="normalizedComparisonAreaRows.rows.length === 0">
                    <td :colspan="normalizedComparisonAreaRows.isZafra ? 4 : 2" class="px-4 py-8 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">
                      Sin datos por área
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 self-start">
            <div class="mb-6">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">AVANCE CALENDARIO</h2>
              <p class="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Semana {{ currentWeek }} -  2026 vs 2025</p>
            </div>

            <div class="overflow-hidden border border-gray-100 rounded-xl">
              <table class="w-full text-left">
                <thead class="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ÁREA</th>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">2026</th>
                    <th v-if="actualWeekComparisonAreaRows.isZafra" class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">2025</th>
                    <th v-if="actualWeekComparisonAreaRows.isZafra" class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">DIF.</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="row in actualWeekComparisonAreaRows.rows" :key="`actual-${row.area}`" class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-4 py-3 text-sm font-bold text-gray-700">{{ getWeeklyAreaShortName(row.area) }}</td>
                    <td class="px-4 py-3 text-sm font-bold text-right text-[#004236]">{{ row.avance2026.toFixed(1) }}%</td>
                    <td v-if="actualWeekComparisonAreaRows.isZafra" class="px-4 py-3 text-sm font-bold text-right text-[#3455E3]">{{ row.avance2025.toFixed(1) }}%</td>
                    <td v-if="actualWeekComparisonAreaRows.isZafra" class="px-4 py-3 text-sm font-bold text-right" :class="row.difference >= 0 ? 'text-success' : 'text-danger'">
                      {{ row.difference > 0 ? '+' : '' }}{{ row.difference.toFixed(1) }}%
                    </td>
                  </tr>
                  <tr v-if="actualWeekComparisonAreaRows.rows.length > 0" class="bg-gray-50 border-t border-gray-200">
                    <td class="px-4 py-3 text-xs font-black text-gray-700 uppercase tracking-widest">Total</td>
                    <td class="px-4 py-3 text-sm font-black text-right text-[#004236]">{{ actualWeekComparisonAreaRows.totalRow.avance2026.toFixed(1) }}%</td>
                    <td v-if="actualWeekComparisonAreaRows.isZafra" class="px-4 py-3 text-sm font-black text-right text-[#3455E3]">{{ actualWeekComparisonAreaRows.totalRow.avance2025.toFixed(1) }}%</td>
                    <td v-if="actualWeekComparisonAreaRows.isZafra" class="px-4 py-3 text-sm font-black text-right" :class="actualWeekComparisonAreaRows.totalRow.difference >= 0 ? 'text-success' : 'text-danger'">
                      {{ actualWeekComparisonAreaRows.totalRow.difference > 0 ? '+' : '' }}{{ actualWeekComparisonAreaRows.totalRow.difference.toFixed(1) }}%
                    </td>
                  </tr>
                  <tr v-if="actualWeekComparisonAreaRows.rows.length === 0">
                    <td :colspan="actualWeekComparisonAreaRows.isZafra ? 4 : 2" class="px-4 py-8 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">
                      Sin datos por área
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p v-if="!comparisonIsZafra" class="text-xs text-gray-400 mt-4 mb-8 italic">
          * Datos comparativos 2025 solo disponibles en la etapa ZAFRA.
        </p>

        <div class="grid grid-cols-1 gap-6 mb-8 items-start">
          <div
            class="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 self-start">
            <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center md:items-start sm:justify-between">
              <div>
                <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">AVANCE REAL VS AVANCE APROXIMADO SIN RETRASOS</h2>
                <p class="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ weeklyAreaPeriodLabel }}</p>
              </div>
              <div class="flex flex-wrap  gap-1 self-start sm:self-auto">
                <div class="inline-flex overflow-hidden rounded-full border border-gray-200 bg-gray-50 p-0.5">
                  <button type="button" @click="weeklyAreaDetailMode = 'general'"
                    class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors"
                    :class="weeklyAreaDetailMode === 'general' ? 'bg-main text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'">
                    Gen.
                  </button>
                  <button type="button" @click="weeklyAreaDetailMode = 'detailed'"
                    class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors"
                    :class="weeklyAreaDetailMode === 'detailed' ? 'bg-main text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'">
                    Det.
                  </button>
                </div>
                <button type="button" @click="weeklyAreaCurrentWeekOnly = !weeklyAreaCurrentWeekOnly"
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
                  :class="weeklyAreaCurrentWeekOnly ? 'border-main bg-main text-white' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'">
                  <span class="relative inline-flex h-4 w-7 rounded-full transition-colors"
                    :class="weeklyAreaCurrentWeekOnly ? 'bg-white/25' : 'bg-gray-200'">
                    <span class="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
                      :class="weeklyAreaCurrentWeekOnly ? 'translate-x-3.5' : 'translate-x-0.5'"></span>
                  </span>
                  Esta sem.
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-100"
                  :aria-pressed="showWeeklyAreaLostTime"
                  :title="showWeeklyAreaLostTime ? 'Ocultar tiempo perdido' : 'Mostrar tiempo perdido'"
                  @click="showWeeklyAreaLostTime = !showWeeklyAreaLostTime"
                >
                  <component :is="showWeeklyAreaLostTime ? EyeOff : Eye" class="h-3.5 w-3.5" />
                  <span>{{ showWeeklyAreaLostTime ? 'Ocultar hrs' : 'Ver hrs' }}</span>
                </button>
              </div>
            </div>

            <div class="overflow-hidden border border-gray-100 rounded-xl">
              <table class="w-full text-left">
                <thead class="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ÁREA</th>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">AVANCE REAL</th>
                    <th v-if="weeklyAreaDetailMode === 'general'" class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">AVANCE PERDIDO</th>
                    <th v-else class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">PÉRDIDA OP.</th>
                    <th v-if="weeklyAreaDetailMode === 'detailed'" class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">PÉRDIDA PERS.</th>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">AVANCE SIN RETRASOS</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="row in weeklyAreaSummary" :key="row.area" class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-4 py-3 text-sm font-bold text-gray-700">{{ row.areaShort }}</td>
                    <td class="px-4 py-3 text-sm font-bold text-right text-[#004236]">{{ row.realProgress.toFixed(1) }}%</td>
                    <td v-if="weeklyAreaDetailMode === 'general'" class="px-4 py-3 text-sm font-bold text-right text-[#C0392B]">
                      {{ row.lostProgress.toFixed(1) }}% <span v-if="showWeeklyAreaLostTime" class="opacity-80">{{ formatWorkDaysFromHours(row.lostHours) }}</span>
                    </td>
                    <td v-else class="px-4 py-3 text-sm font-bold text-right text-[#C0392B]">
                      {{ row.operationalLostProgress.toFixed(1) }}% <span v-if="showWeeklyAreaLostTime" class="opacity-80">{{ formatWorkDaysFromHours(row.operationalLostHours) }}</span>
                    </td>
                    <td v-if="weeklyAreaDetailMode === 'detailed'" class="px-4 py-3 text-sm font-bold text-right text-[#E74C3C]">
                      {{ row.personalLostProgress.toFixed(1) }}% <span v-if="showWeeklyAreaLostTime" class="opacity-80">{{ formatWorkDaysFromHours(row.personalLostHours) }}</span>
                    </td>
                    <td class="px-4 py-3 text-sm font-bold text-right text-gray-800">{{ row.optimalProgress.toFixed(1) }}%</td>
                  </tr>
                  <tr v-if="weeklyAreaSummary.length > 0" class="bg-gray-50 border-t border-gray-200">
                    <td class="px-4 py-3 text-xs font-black text-gray-700 uppercase tracking-widest">Total</td>
                    <td class="px-4 py-3 text-sm font-black text-right text-[#004236]">{{ weeklyAreaSummaryTotal.realProgress.toFixed(1) }}%</td>
                    <td v-if="weeklyAreaDetailMode === 'general'" class="px-4 py-3 text-sm font-black text-right text-[#C0392B]">
                      {{ weeklyAreaSummaryTotal.lostProgress.toFixed(1) }}% <span v-if="showWeeklyAreaLostTime" class="opacity-80">{{ formatWorkDaysFromHours(weeklyAreaSummaryTotal.lostHours) }}</span>
                    </td>
                    <td v-else class="px-4 py-3 text-sm font-black text-right text-[#C0392B]">
                      {{ weeklyAreaSummaryTotal.operationalLostProgress.toFixed(1) }}% <span v-if="showWeeklyAreaLostTime" class="opacity-80">{{ formatWorkDaysFromHours(weeklyAreaSummaryTotal.operationalLostHours) }}</span>
                    </td>
                    <td v-if="weeklyAreaDetailMode === 'detailed'" class="px-4 py-3 text-sm font-black text-right text-[#E74C3C]">
                      {{ weeklyAreaSummaryTotal.personalLostProgress.toFixed(1) }}% <span v-if="showWeeklyAreaLostTime" class="opacity-80">{{ formatWorkDaysFromHours(weeklyAreaSummaryTotal.personalLostHours) }}</span>
                    </td>
                    <td class="px-4 py-3 text-sm font-black text-right text-gray-900">{{ weeklyAreaSummaryTotal.optimalProgress.toFixed(1) }}%</td>
                  </tr>
                  <tr v-if="weeklyAreaSummary.length === 0">
                    <td :colspan="weeklyAreaDetailMode === 'detailed' ? 5 : 4" class="px-4 py-8 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">
                      Sin datos por área
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="mb-8">
            <TablaHorasPerdidasMotivo
              :weekly-area-short-names="weeklyAreaShortNames"
              :hours-per-order-by-area="hoursPerOrderByArea"
              :current-order-totals-by-area="currentOrderTotalsByAreaForHorasPerdidas"
              :current-order-totals-general="currentOrderTotalsGeneralForHorasPerdidas"
              :initial-date="horasPerdidasAreaMotivoInitialDate"
            />
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-[45fr_55fr] gap-6 mb-8 items-start">
          <div
            class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 self-start">
            <div class="mb-6">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">AVANCE PERDIDO POR SEMANA 2026 vs 2025</h2>
            </div>

            <div class="h-[250px] xl:h-[320px] w-full block overflow-hidden">
              <EChart :key="JSON.stringify(activeFilters) + lostProgressCurrentWeekOnly" :option="lostProgressEChartOption" />
            </div>
          </div>

          <div
            class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 self-start">
            <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">AVANCE PERDIDO 2026 VS 2025</h2>
                <p class="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ lostProgressPeriodLabel }}</p>
              </div>
              <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <div class="inline-flex overflow-hidden rounded-full border border-gray-200 bg-gray-50 p-0.5">
                  <button type="button" @click="toggleLostProgressDisplay('percent')"
                    class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors"
                    :class="showLostProgressPercent ? 'bg-main text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'">
                    %
                  </button>
                  <button type="button" @click="toggleLostProgressDisplay('time')"
                    class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors"
                    :class="showLostProgressTime ? 'bg-main text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'">
                    Días/hrs
                  </button>
                </div>
                <button type="button" @click="lostProgressCurrentWeekOnly = !lostProgressCurrentWeekOnly"
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
                  :class="lostProgressCurrentWeekOnly ? 'border-main bg-main text-white' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'">
                  <span class="relative inline-flex h-4 w-7 rounded-full transition-colors"
                    :class="lostProgressCurrentWeekOnly ? 'bg-white/25' : 'bg-gray-200'">
                    <span class="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform"
                      :class="lostProgressCurrentWeekOnly ? 'translate-x-3.5' : 'translate-x-0.5'"></span>
                  </span>
                  Esta semana
                </button>
              </div>
            </div>

            <div class="overflow-hidden border border-gray-100 rounded-xl">
              <table class="w-full text-left">
                <thead class="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ÁREA</th>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">AVANCE PERDIDO 2025</th>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">AVANCE PERDIDO 2026</th>
                    <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">DIF.</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="row in lostProgressAreaRows" :key="row.area" class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-4 py-3 text-sm font-bold text-gray-700">{{ row.area }}</td>
                    <td class="px-4 py-3 text-sm font-bold text-right text-[#64748b]">
                      <span v-if="showLostProgressPercent">{{ row.lostProgress2025.toFixed(1) }}%</span>
                      <span v-if="showLostProgressPercent && showLostProgressTime"> </span>
                      <span v-if="showLostProgressTime" class="opacity-80">{{ formatWorkDaysFromHours(row.hours2025, showLostProgressPercent) }}</span>
                    </td>
                    <td class="px-4 py-3 text-sm font-bold text-right text-[#2563eb]">
                      <span v-if="showLostProgressPercent">{{ row.lostProgress2026.toFixed(1) }}%</span>
                      <span v-if="showLostProgressPercent && showLostProgressTime"> </span>
                      <span v-if="showLostProgressTime" class="opacity-80">{{ formatWorkDaysFromHours(row.hours2026, showLostProgressPercent) }}</span>
                    </td>
                    <td class="px-4 py-3 text-sm font-bold text-right" :class="row.difference >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'">
                      <span v-if="showLostProgressPercent">{{ row.difference > 0 ? '+' : '' }}{{ row.difference.toFixed(1) }}%</span>
                      <span v-if="showLostProgressPercent && showLostProgressTime"> </span>
                      <span v-if="showLostProgressTime" class="opacity-80">{{ formatWorkDaysFromHours(Math.abs(row.differenceHours), showLostProgressPercent) }}</span>
                    </td>
                  </tr>
                  <tr v-if="lostProgressAreaRows.length > 0" class="bg-gray-50 border-t border-gray-200">
                    <td class="px-4 py-3 text-xs font-black text-gray-700 uppercase tracking-widest">Total</td>
                    <td class="px-4 py-3 text-sm font-black text-right text-[#64748b]">
                      <span v-if="showLostProgressPercent">{{ lostProgressAreaTotal.lostProgress2025.toFixed(1) }}%</span>
                      <span v-if="showLostProgressPercent && showLostProgressTime"> </span>
                      <span v-if="showLostProgressTime" class="opacity-80">{{ formatWorkDaysFromHours(lostProgressAreaTotal.hours2025, showLostProgressPercent) }}</span>
                    </td>
                    <td class="px-4 py-3 text-sm font-black text-right text-[#2563eb]">
                      <span v-if="showLostProgressPercent">{{ lostProgressAreaTotal.lostProgress2026.toFixed(1) }}%</span>
                      <span v-if="showLostProgressPercent && showLostProgressTime"> </span>
                      <span v-if="showLostProgressTime" class="opacity-80">{{ formatWorkDaysFromHours(lostProgressAreaTotal.hours2026, showLostProgressPercent) }}</span>
                    </td>
                    <td class="px-4 py-3 text-sm font-black text-right" :class="lostProgressAreaTotal.difference >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'">
                      <span v-if="showLostProgressPercent">{{ lostProgressAreaTotal.difference > 0 ? '+' : '' }}{{ lostProgressAreaTotal.difference.toFixed(1) }}%</span>
                      <span v-if="showLostProgressPercent && showLostProgressTime"> </span>
                      <span v-if="showLostProgressTime" class="opacity-80">{{ formatWorkDaysFromHours(Math.abs(lostProgressAreaTotal.differenceHours), showLostProgressPercent) }}</span>
                    </td>
                  </tr>
                  <tr v-if="lostProgressAreaRows.length === 0">
                    <td colspan="4" class="px-4 py-8 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">
                      Sin datos por área
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="showStatusCharts" class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-start">
          <div
            class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 self-start">
            <div class="mb-4">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">ESTATUS POR ÁREA</h2>
            </div>

            <div class="h-[320px] xl:h-[360px] w-full relative">
              <EChart :key="JSON.stringify(activeFilters)" :option="statusByAreaEChartOption"
                @click="handleEChartClick('Área', $event)" />
            </div>
          </div>

          <div
            class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 self-start">
            <div class="mb-4">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">ESTATUS POR SISTEMA</h2>
            </div>

            <div class="h-[320px] xl:h-[360px] w-full relative">
              <EChart :key="JSON.stringify(activeFilters)" :option="statusBySystemEChartOption"
                @click="handleEChartClick('Sistema', $event)" />
            </div>
          </div>
        </div>

        <div v-if="showStatusCharts" class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-start">
          <div
            class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400 self-start">
            <div class="mb-2 flex justify-between items-center">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">ESTATUS POR TIPO DE EQUIPO</h2>
            </div>

            <div class="h-[320px] xl:h-[360px] w-full relative">
              <EChart :key="JSON.stringify(activeFilters)" :option="statusByEquipmentEChartOption"
                @click="handleEChartClick('ITEM', $event)" />
            </div>
          </div>

          <div
            class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500 relative self-start">
            <div class="mb-2 flex justify-between items-center">
              <div class="flex flex-col">
                <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">ESTATUS POR EQUIPO (ID)</h2>
              </div>
            </div>

            <div class="h-[320px] xl:h-[360px] w-full relative">
              <EChart :key="JSON.stringify(activeFilters)" :option="statusByIDEquipoEChartOption"
                @click="handleEChartClick('ID_#EQUIPO', $event)" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedEquipmentId" id="equipment-details-table"
        class="mt-8 p-6 bg-white rounded-3xl border border-gray-100 shadow-lg animate-in zoom-in-95 duration-300">
        <div class="flex items-center justify-between mb-6 gap-4">
          <div>
            <h2 class="text-[12px] font-bold text-main uppercase tracking-widest mb-1">DETALLES DE SOLICITUDES</h2>
            <h3 class="text-lg font-bold text-gray-800">Equipo: <span class="text-main">{{ selectedEquipmentId }}</span>
            </h3>
          </div>
          <button @click="selectedEquipmentId = null"
            class="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div v-if="selectedEquipmentDetails.length === 0"
          class="py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <ClipboardList class="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p class="text-sm font-bold text-gray-400 uppercase tracking-widest italic">No tiene solicitud registrada</p>
        </div>

        <div v-else>
          <!-- Desktop Table View -->
          <div v-if="windowWidth >= 768" class="overflow-x-auto rounded-xl border border-gray-100">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID Equipo</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">N° Requisición</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">N° Orden Compra
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="(item, idx) in selectedEquipmentDetails" :key="idx" class="hover:bg-gray-50/50">
                  <td class="px-4 py-3 text-sm font-medium text-gray-700">{{ item['ID_#EQUIPO'] }}</td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-600">
                    <span v-if="item['N° solicitud']"
                      class="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-100">
                      {{ item['N° solicitud'] }}
                    </span>
                    <span v-else class="text-gray-300 italic text-xs">N/A</span>
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-600">
                    <span v-if="item['N° Orden de compra']"
                      class="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-100">
                      {{ item['N° Orden de compra'] }}
                    </span>
                    <span v-else class="text-gray-300 italic text-xs">N/A</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Card View -->
          <div v-else class="flex flex-col gap-4">
            <div v-for="(item, idx) in selectedEquipmentDetails" :key="idx"
              class="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <div class="flex flex-col gap-1">
                  <span class="text-[9px] font-black text-gray-400 uppercase tracking-wider">ID Equipo</span>
                  <span class="text-sm font-black text-gray-900 tracking-tight">{{ item['ID_#EQUIPO'] }}</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div class="flex flex-col gap-1">
                  <span class="text-[9px] font-black text-gray-400 uppercase tracking-wider">Requisición</span>
                  <span v-if="item['N° solicitud']" class="text-[11px] font-black text-blue-600">
                    {{ item['N° solicitud'] }}
                  </span>
                  <span v-else class="text-[11px] font-bold text-gray-300 italic">N/A</span>
                </div>
                <div class="flex flex-col gap-1 text-right">
                  <span class="text-[9px] font-black text-gray-400 uppercase tracking-wider">Orden Compra</span>
                  <span v-if="item['N° Orden de compra']" class="text-[11px] font-black text-green-600">
                    {{ item['N° Orden de compra'] }}
                  </span>
                  <span v-else class="text-[11px] font-bold text-gray-300 italic">N/A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="h-20 md:h-8"></div>
    </div>

    <Transition enter-active-class="animate-in fade-in slide-in-from-bottom-4 duration-300"
      leave-active-class="animate-out fade-out slide-out-to-bottom-4 duration-300">
      <div v-if="showScrollButton"
        class="fixed bottom-[84px] md:bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none">
        <button v-if="selectedEquipmentDetails.length > 0" @click="scrollToTable"
          class="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 bg-main/20 backdrop-blur-xl backdrop-saturate-150 backdrop-contrast-125 text-main font-black rounded-full text-xs uppercase tracking-wider hover:bg-main/30 transition-all shadow-2xl active:scale-95 border border-main/20 whitespace-nowrap ring-1 ring-white/20">
          Ver solicitudes
          <ChevronRight class="w-4 h-4" />
        </button>
        <div v-else
          class="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 bg-black/10 backdrop-blur-xl backdrop-saturate-150 backdrop-contrast-125 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider border border-black/10 shadow-xl shadow-black/5 whitespace-nowrap ring-1 ring-white/10">
          <ClipboardList class="w-4 h-4 text-gray-500" /> No tiene solicitudes
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
