<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { supabase } from '@/lib/supabase';
import { useMaintenanceStore } from '@/stores/maintenanceStore';
import { storeToRefs } from 'pinia';
import EChart from '@/components/ui/EChart.vue';
import { 
  Search, 
  RefreshCw, 
  X, 
  Loader2, 
  ChevronRight,
  ChevronDown,
  Check,
  ClipboardList
} from 'lucide-vue-next';

interface OrdenMantenimiento {
  "ID_Orden mantenimiento": string;
  Área: string;
  "ID_#EQUIPO": string;
  "ITEM": string;
  "Sistema": string;
  "Descripcion": string;
  "Tipo de Proceso": string;
  "Estatus": string;
  "Fecha inicio": string;
  "Fecha conclusion": string;
  "Tiene solicitud de compra?": boolean;
  "N° solicitud": string;
  "N° Orden de compra": string;
  "Fecha Entrega": string;
  "Observaciones": string;
  "Semana": string;
  "Etapa": string;
  "IS_SG": boolean;
  "total_ots": number | null;
  "ots_concluidas": number | null;
  "ots_pendientes": number | null;
}

const maintenanceStore = useMaintenanceStore();
const { allOrders, isLoading: isStoreLoading, loadingProgress, activeFilters } = storeToRefs(maintenanceStore);
const { setStatusFilter, setWeekFilter } = maintenanceStore;

const isRefreshing = ref(false);
const userArea = ref('');

const windowWidth = ref(window.innerWidth);
const MAX_VISIBLE_BARS = computed(() => {
  return windowWidth.value < 768 ? 6 : 7;
});

const isLoading = computed(() => isStoreLoading.value || !userArea.value);

// Filters
const filters = ref({
  etapa: '',
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
let scrollButtonTimer: ReturnType<typeof setTimeout> | null = null;

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
  if (filters.value.etapa) areaData = areaData.filter(d => d.Etapa === filters.value.etapa);
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

  if (filters.value.etapa) result = result.filter(d => d.Etapa === filters.value.etapa);
  if (filters.value.area) result = result.filter(d => d.Área === filters.value.area);
  if (filters.value.item) result = result.filter(d => d.ITEM === filters.value.item);
  if (filters.value.idEquipo) result = result.filter(d => d["ID_#EQUIPO"] === filters.value.idEquipo);

  return result;
});

// Interactive Cross-Filtering
const crossFilteredData = computed(() => {
  let result = filteredData.value;

  if (activeFilters.value.semana) {
    result = result.filter(d => d.Semana === activeFilters.value.semana);
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
    result = result.filter(d => d.Estatus === activeFilters.value.estado);
  }

  return result;
});

const clearFilters = () => {
  filters.value = {
    etapa: '',
    area: '',
    item: '',
    idEquipo: ''
  };
  searchQueries.value = { etapa: '', area: '', item: '', idEquipo: '' };
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
  } catch (e) {
    console.error("Error fetching maintenance data:", e);
  } finally {
    isRefreshing.value = false;
  }
};

watch(() => filters.value.etapa, () => { filters.value.area = ''; filters.value.item = ''; filters.value.idEquipo = ''; });
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
  window.addEventListener('click', handleWindowClick);
  window.addEventListener('resize', () => { windowWidth.value = window.innerWidth; });
});

onBeforeUnmount(() => {
  window.removeEventListener('click', handleWindowClick);
  window.removeEventListener('resize', () => { windowWidth.value = window.innerWidth; });
  if (scrollButtonTimer) clearTimeout(scrollButtonTimer);
});

const statusStats = computed(() => {
  const total = crossFilteredData.value.length;
  if (total === 0) return [];

  const counts: Record<string, number> = {};
  crossFilteredData.value.forEach(row => {
    const s = row.Estatus || 'Sin Estatus';
    counts[s] = (counts[s] || 0) + 1;
  });

  const colorMap: Record<string, { bar: string, dot: string }> = {
    'Programado': { bar: 'bg-[#9ca09c]', dot: 'bg-[#9ca09c]' },
    'Concluida': { bar: 'bg-[#2d8a54]', dot: 'bg-[#2d8a54]' },
    'En Proceso': { bar: 'bg-[#d4a94d]', dot: 'bg-[#d4a94d]' },
  };

  const defaultColors = { bar: 'bg-gray-300', dot: 'bg-gray-400' };

  return Object.entries(counts)
    .map(([label, count]) => {
      const mappingKey = Object.keys(colorMap).find(k => k.toLowerCase() === label.toLowerCase());
      const colors = mappingKey ? colorMap[mappingKey] : defaultColors;

      return {
        label,
        count,
        percentage: (count / total) * 100,
        color: colors.bar,
        dotColor: colors.dot
      };
    })
    .sort((a, b) => b.count - a.count);
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
  const orderedLabels = ['Programado', 'Concluida', 'En Proceso'];
  const colorMap: Record<string, string> = {
    'Programado': '#1A6A96',
    'Concluida': '#2D8A54',
    'En Proceso': '#D4A94D'
  };

  const labels: string[] = [];
  const data: any[] = [];

  orderedLabels.forEach(label => {
    const item = stats.find(s => s.label.toLowerCase() === label.toLowerCase());
    labels.push(label);
    const count = item ? item.count : 0;
    const value = item ? Number(item.percentage.toFixed(1)) : 0;
    data.push({
      value,
      count,
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
        return `<span style="font-weight:bold;color:#1e293b">${p.axisValue}</span><br/>Total: ${p.data.count} (${p.data.value}%)`;
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
        itemStyle: { borderRadius: [6, 6, 0, 0] },
        label: {
          show: true,
          position: 'top',
          color: '#64748b',
          fontWeight: 'bold',
          fontSize: 11,
          formatter: (p: any) => `${p.value}%`
        }
      }
    ]
  };
});

const buildEChartStackedOption = (data: OrdenMantenimiento[], groupKey: keyof OrdenMantenimiento) => {
  const colorMap: Record<string, string> = {
    'Programado': '#1A6A96',
    'Concluida': '#2D8A54',
    'En Proceso': '#D4A94D',
  };
  const fallbackColors = ['#94a3b8', '#64748b', '#475569', '#cbd5e1'];

  const uniqueStatuses = Array.from(new Set(data.map(d => {
    const s = String(d.Estatus || '').trim();
    return s || 'Sin Estatus';
  })));

  const groups: Record<string, { total: number; counts: Record<string, number> }> = {};

  data.forEach(order => {
    let key = String(order[groupKey] || 'N/A').trim();
    if (!key || key === 'null') key = 'Desconocido';

    if (!groups[key]) {
      groups[key] = { total: 0, counts: {} };
      uniqueStatuses.forEach(s => groups[key].counts[s] = 0);
    }

    const status = String(order.Estatus || '').trim() || 'Sin Estatus';
    groups[key].total += 1;
    groups[key].counts[status] += 1;
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
    let color = mappingKey ? colorMap[mappingKey] : fallbackColors[idx % fallbackColors.length];

    if (activeFilters.value.estado && activeFilters.value.estado !== status) {
      color = color.length === 7 ? color + '40' : color;
    }

    return {
      name: status,
      type: 'bar',
      stack: 'total',
      barWidth,
      barMaxWidth: 32,
      barGap: '0%',
      barCategoryGap: '30%',
      itemStyle: { color },
      data: sortedKeys.map((cat, i) => {
        const count = groups[cat].counts[status] || 0;
        const total = categoryTotals[i] || 0;
        const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
        return { value: pct, count, total, status };
      }),
      label: {
        show: true,
        formatter: (p: any) => {
          if (p.data?.count === 0) return '';
          if (p.value < 7) return '';
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
          .map(p => `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${p.data.count}</b> (${p.value}%)`)
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

const statusByAreaEChartOption = computed(() => buildEChartStackedOption(crossFilteredData.value, 'Área'));
const statusBySystemEChartOption = computed(() => buildEChartStackedOption(crossFilteredData.value, 'Sistema'));
const statusByEquipmentEChartOption = computed(() => buildEChartStackedOption(crossFilteredData.value, 'ITEM'));
const statusByIDEquipoEChartOption = computed(() => buildEChartStackedOption(crossFilteredData.value, 'ID_#EQUIPO'));

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
  }
};

const weeklyProgress = computed(() => {
  const areaFixed = userArea.value?.toUpperCase();

  let globalList = areaFixed === 'ALL'
    ? allOrders.value
    : allOrders.value.filter(d => d.Área?.toUpperCase() === areaFixed);

  if (filters.value.etapa) {
    globalList = globalList.filter(d => d.Etapa === filters.value.etapa);
  }

  let areaFilteredList = globalList;
  if (areaFixed === 'ALL' && filters.value.area) {
     areaFilteredList = areaFilteredList.filter(d => d.Área === filters.value.area);
  }

  const now = new Date();
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  let weeks: string[] = [];
  for (let i = 0; i < 5; i++) {
    const temp = new Date(now);
    temp.setDate(now.getDate() - (i * 7));
    weeks.push(String(getWeekNumber(temp)));
  }
  weeks = weeks.reverse();

  const results = weeks.map(sem => {
    const semRows = areaFilteredList.filter(o => String(o['Semana']) === sem);
    const total = semRows.length;
      const concluidas = semRows.filter(o => {
        const s = o.Estatus?.toLowerCase() || '';
        return s.includes('concluida');
      }).length;

    return {
      semana: sem,
      total,
      concluidas,
      globalTotal: globalList.length,
      avance: globalList.length > 0
        ? Number(((concluidas / globalList.length) * 100).toFixed(2))
        : 0
    };
  });

  return results;
});

const weeklyEChartOption = computed(() => {
  const data = weeklyProgress.value;
  const labels = data.map(d => d.semana);
  const avanceValues = data.map(d => d.avance);
  const targetValue = 2.63;
  const targetValues = labels.map(() => targetValue);

  const maxAvance = data.length > 0 ? Math.max(...data.map(d => d.avance)) : 0;
  const chartMax = maxAvance > 5 ? Math.ceil(maxAvance) + 1 : 5;

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
        const barP = params.find(p => p.seriesType === 'bar');
        const weekData = data.find(d => String(d.semana) === barP?.axisValue);
        const targetQty = weekData ? Math.round(weekData.globalTotal * 0.0263) : 0;

        return `
          <div style="color:#1e293b;font-weight:bold;margin-bottom:4px">Semana ${barP?.axisValue || ''}</div>
          <div>Avance: ${barP?.value || 0}% (${weekData?.concluidas || 0})</div>
          <div>Concluidas: ${weekData?.concluidas || 0} / ${weekData?.total || 0}</div>
          <div>Objetivo: 2.63% (${targetQty})</div>
        `;
      }
    },
    legend: {
      data: ['Objetivo', 'Avance %'],
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
        name: 'Avance %',
        type: 'bar',
        data: avanceValues,
        barWidth: 40,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#004236' },
        label: {
          show: true,
          position: 'top',
          color: '#004236',
          fontWeight: 'bold',
          formatter: (p: any) => `${p.value}%`
        }
      },
      {
        name: 'Objetivo',
        type: 'line',
        data: targetValues,
        itemStyle: { color: '#d4a94d' },
        lineStyle: { type: 'dashed', width: 2 },
        symbol: 'none',
      }
    ]
  };
});

const handleWeeklyChartClick = (params: any) => {
   if ((params.componentType === 'series' && params.seriesType === 'bar') || params.componentType === 'xAxis') {
     const label = params.name || params.value;
     if(label) setWeekFilter(String(label));
   }
};
</script>

<template>
  <div id="slide-maintenance-container" class="flex flex-col bg-second pt-0 mt-0">
    <div 
      id="slide-maintenance-filters" 
      class="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-2 md:px-6 shadow-sm mt-0 overflow-visible"
    >
      <div class="flex items-center gap-3 py-1 overflow-x-auto no-scrollbar overflow-y-visible pb-[300px] -mb-[300px] pointer-events-none">
        <div class="flex items-center gap-2 flex-nowrap shrink-0 pointer-events-auto">

          <div class="relative min-w-[140px]">
             <div 
               @click.stop="toggleDropdown('etapa')"
               class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
               id="filter-trigger-etapa"
             >
                <div class="flex items-center gap-1.5 truncate">
                  <span class="text-[11px] font-bold text-gray-900 whitespace-nowrap">Etapa</span>
                  <span class="text-[11px] font-medium text-gray-400 truncate">{{ filters.etapa || 'Todas' }}</span>
                </div>
                <ChevronDown class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
             </div>
             <div v-if="activeDropdown === 'etapa'" @click.stop class="absolute top-full left-0 mt-1 w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl z-50">
                <div class="p-2 border-b border-gray-50">
                  <div class="relative">
                    <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input 
                      v-model="searchQueries.etapa"
                      type="text" 
                      placeholder="Buscar..."
                      class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-main"
                    />
                  </div>
                </div>
                <div class="max-h-[250px] overflow-y-auto p-1 no-scrollbar">
                  <button 
                    @click.stop="selectOption('etapa', '')"
                    class="w-full text-center py-1.5 text-[10px] font-bold text-main hover:bg-main/5 rounded-md mb-1"
                  >
                    Limpiar
                  </button>
                  <div 
                    v-for="opt in getFilteredOptionsList('etapas', 'etapa')" 
                    :key="opt"
                    @click.stop="selectOption('etapa', String(opt))"
                    class="flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <span :class="{ 'font-bold text-main': filters.etapa === String(opt) }">{{ opt }}</span>
                    <Check v-if="filters.etapa === String(opt)" class="w-3.5 h-3.5 text-main" />
                  </div>
                </div>
             </div>
          </div>

          <div class="relative min-w-[140px]" v-if="userArea.toUpperCase() === 'ALL'">
             <div 
               @click.stop="toggleDropdown('area')"
               class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
               id="filter-trigger-area"
             >
                <div class="flex items-center gap-1.5 truncate">
                  <span class="text-[11px] font-bold text-gray-900 whitespace-nowrap">Área</span>
                  <span class="text-[11px] font-medium text-gray-400 truncate">{{ filters.area || 'Todas' }}</span>
                </div>
                <ChevronDown class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
             </div>
             <div v-if="activeDropdown === 'area'" @click.stop class="absolute top-full left-0 mt-1 w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl z-50">
                <div class="p-2 border-b border-gray-50">
                  <div class="relative">
                    <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input 
                      v-model="searchQueries.area"
                      type="text" 
                      placeholder="Buscar..."
                      class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-main"
                    />
                  </div>
                </div>
                <div class="max-h-[250px] overflow-y-auto p-1 no-scrollbar">
                  <button 
                    @click.stop="selectOption('area', '')"
                    class="w-full text-center py-1.5 text-[10px] font-bold text-main hover:bg-main/5 rounded-md mb-1"
                  >
                    Limpiar
                  </button>
                  <div 
                    v-for="opt in getFilteredOptionsList('areas', 'area')" 
                    :key="opt"
                    @click.stop="selectOption('area', String(opt))"
                    class="flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <span :class="{ 'font-bold text-main': filters.area === String(opt) }">{{ opt }}</span>
                    <Check v-if="filters.area === String(opt)" class="w-3.5 h-3.5 text-main" />
                  </div>
                </div>
             </div>
          </div>

          <div class="relative min-w-[150px]">
             <div 
               @click.stop="toggleDropdown('item')"
               class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
               id="filter-trigger-item"
             >
                <div class="flex items-center gap-1.5 truncate">
                  <span class="text-[11px] font-bold text-gray-900 whitespace-nowrap">Tipo Equipo</span>
                  <span class="text-[11px] font-medium text-gray-400 truncate">{{ filters.item || 'Cualquiera' }}</span>
                </div>
                <ChevronDown class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
             </div>
             <div v-if="activeDropdown === 'item'" @click.stop class="absolute top-full left-0 mt-1 w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl z-50">
                <div class="p-2 border-b border-gray-50">
                  <div class="relative">
                    <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input 
                      v-model="searchQueries.item"
                      type="text" 
                      placeholder="Buscar..."
                      class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-main"
                    />
                  </div>
                </div>
                <div class="max-h-[250px] overflow-y-auto p-1 no-scrollbar">
                  <button 
                    @click.stop="selectOption('item', '')"
                    class="w-full text-center py-1.5 text-[10px] font-bold text-main hover:bg-main/5 rounded-md mb-1"
                  >
                    Limpiar
                  </button>
                  <div 
                    v-for="opt in getFilteredOptionsList('items', 'item')" 
                    :key="opt"
                    @click.stop="selectOption('item', String(opt))"
                    class="flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <span :class="{ 'font-bold text-main': filters.item === String(opt) }">{{ opt }}</span>
                    <Check v-if="filters.item === String(opt)" class="w-3.5 h-3.5 text-main" />
                  </div>
                </div>
             </div>
          </div>

          <div class="relative min-w-[140px]">
             <div 
               @click.stop="toggleDropdown('idEquipo')"
               class="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
               id="filter-trigger-id-equipo"
             >
                <div class="flex items-center gap-1.5 truncate">
                  <span class="text-[11px] font-bold text-gray-900 whitespace-nowrap">ID Equipo</span>
                  <span class="text-[11px] font-medium text-gray-400 truncate">{{ filters.idEquipo || 'Todos' }}</span>
                </div>
                <ChevronDown class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
             </div>
             <div v-if="activeDropdown === 'idEquipo'" @click.stop class="absolute top-full left-0 mt-1 w-[220px] bg-white border border-gray-100 rounded-xl shadow-xl z-50">
                <div class="p-2 border-b border-gray-50">
                  <div class="relative">
                    <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input 
                      v-model="searchQueries.idEquipo"
                      type="text" 
                      placeholder="Buscar..."
                      class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-main"
                    />
                  </div>
                </div>
                <div class="max-h-[250px] overflow-y-auto p-1 no-scrollbar">
                  <button 
                    @click.stop="selectOption('idEquipo', '')"
                    class="w-full text-center py-1.5 text-[10px] font-bold text-main hover:bg-main/5 rounded-md mb-1"
                  >
                    Limpiar
                  </button>
                  <div 
                    v-for="opt in getFilteredOptionsList('ids', 'idEquipo')" 
                    :key="opt"
                    @click.stop="selectOption('idEquipo', String(opt))"
                    class="flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <span :class="{ 'font-bold text-main': filters.idEquipo === String(opt) }">{{ opt }}</span>
                    <Check v-if="filters.idEquipo === String(opt)" class="w-3.5 h-3.5 text-main" />
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div class="flex-1 min-w-[20px] pointer-events-auto"></div>

        <div class="flex items-center gap-1 border-l border-gray-100 pl-3 pointer-events-auto pr-1">
          <button 
            @click="clearFilters"
            class="p-2 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors flex-shrink-0"
            title="Limpiar filtros"
          >
            <X class="w-4 h-4" />
          </button>
          <button 
            @click="fetchData(true)"
            class="p-2 text-gray-400 hover:text-main hover:bg-main/5 rounded-lg transition-colors flex-shrink-0"
            :disabled="isRefreshing"
          >
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
          <div 
            class="h-full bg-main transition-all duration-300"
            :style="{ width: `${loadingProgress}%` }"
          ></div>
        </div>
        <p class="mt-2 text-[10px] font-bold text-main">{{ loadingProgress }}%</p>
      </div>

      <div v-else-if="filteredData.length === 0" class="flex flex-col items-center justify-center py-20 text-center opacity-40">
        <ClipboardList class="w-12 h-12 text-gray-300 mb-2" />
        <p class="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Sin órdenes registradas</p>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-start">
          <div id="slide-maint-status-chart" class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 self-start">
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
                <div v-for="item in statusStats" :key="item.label" class="px-4 py-3 hover:bg-gray-50/50 transition-colors">

                  <div class="flex flex-col gap-3 sm:hidden">
                    <div class="flex items-center gap-3 min-w-0">
                      <div :class="[item.dotColor, 'w-2.5 h-2.5 rounded-full shadow-sm shrink-0']"></div>
                      <span class="text-sm font-medium text-gray-600 truncate">{{ item.label }}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div class="min-w-0">
                        <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">CANT.</span>
                        <span class="text-sm font-bold text-gray-800 font-mono">{{ item.count }}</span>
                      </div>

                      <div class="min-w-0">
                        <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-right">%</span>
                        <div class="flex items-center gap-3">
                          <div class="h-1.5 flex-1 bg-[#f5f5f0] rounded-full overflow-hidden">
                            <div 
                              :class="[item.color, 'h-full transition-all duration-1000 ease-out']"
                              :style="{ width: `${item.percentage}%` }"
                            ></div>
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
                        <div 
                          :class="[item.color, 'h-full transition-all duration-1000 ease-out']"
                          :style="{ width: `${item.percentage}%` }"
                        ></div>
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
                  <span class="text-sm font-bold text-gray-800 text-right pr-2 font-mono">{{ filteredData.length }}</span>
                  <div class="flex items-center gap-4 pl-4 opacity-50">
                    <div class="h-0.5 flex-1 bg-gray-100"></div>
                    <span class="text-[11px] font-bold text-gray-400 w-12 text-right">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="slide-maint-dist-chart" class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 self-start">
            <div class="mb-6">
              <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-4">DISTRIBUCIÓN POR ESTATUS GLOBAL</h2>
            </div>

            <div class="h-[240px] xl:h-[300px] mt-2 w-full">
              <EChart 
                :key="JSON.stringify(activeFilters)" 
                :option="echartBarOption"
              />
            </div>
          </div>
        </div>

        <div id="slide-maint-weekly-chart" class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 mb-8 self-start">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">AVANCE SEMANAL (ÚLTIMAS 5 SEMANAS)</h2>
            <div class="bg-main/5 px-2 py-1 rounded-md border border-main/10 flex items-center gap-2">
               <div class="w-2 h-2 rounded-full bg-[#d4a94d]"></div>
               <span class="text-[9px] font-bold text-gray-500 tracking-wider">META 2.63% MIN</span>
            </div>
          </div>

          <div class="h-[250px] xl:h-[320px] w-full">
            <EChart 
              :key="JSON.stringify(activeFilters)" 
              :option="weeklyEChartOption"
              @click="handleWeeklyChartClick"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-start">
           <div class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 self-start">
             <div class="mb-4">
               <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">ESTATUS POR ÁREA</h2>
             </div>

             <div class="h-[320px] xl:h-[360px] w-full relative">
                 <EChart 
                  :key="JSON.stringify(activeFilters)" 
                  :option="statusByAreaEChartOption"
                  @click="handleEChartClick('Área', $event)"
                />
             </div>
           </div>

           <div class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 self-start">
             <div class="mb-4">
               <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">ESTATUS POR SISTEMA</h2>
             </div>

             <div class="h-[320px] xl:h-[360px] w-full relative">
                 <EChart 
                  :key="JSON.stringify(activeFilters)" 
                  :option="statusBySystemEChartOption"
                  @click="handleEChartClick('Sistema', $event)"
                />
             </div>
           </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-start">
           <div class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400 self-start">
             <div class="mb-2 flex justify-between items-center">
               <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">ESTATUS POR TIPO DE EQUIPO</h2>
             </div>

             <div class="h-[320px] xl:h-[360px] w-full relative">
                 <EChart 
                  :key="JSON.stringify(activeFilters)" 
                  :option="statusByEquipmentEChartOption"
                  @click="handleEChartClick('ITEM', $event)"
                />
             </div>
           </div>

           <div class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500 relative self-start">
             <div class="mb-2 flex justify-between items-center">
               <div class="flex flex-col">
                 <h2 class="text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">ESTATUS POR EQUIPO (ID)</h2>
               </div>
             </div>

             <div class="h-[320px] xl:h-[360px] w-full relative">
                 <EChart 
                  :key="JSON.stringify(activeFilters)" 
                  :option="statusByIDEquipoEChartOption"
                  @click="handleEChartClick('ID_#EQUIPO', $event)"
                />
             </div>
           </div>
        </div>
      </div>

      <div v-if="selectedEquipmentId" id="equipment-details-table" class="mt-8 p-6 bg-white rounded-3xl border border-gray-100 shadow-lg animate-in zoom-in-95 duration-300">
        <div class="flex items-center justify-between mb-6 gap-4">
          <div>
            <h2 class="text-[12px] font-bold text-main uppercase tracking-widest mb-1">DETALLES DE SOLICITUDES</h2>
            <h3 class="text-lg font-bold text-gray-800">Equipo: <span class="text-main">{{ selectedEquipmentId }}</span></h3>
          </div>
          <button @click="selectedEquipmentId = null" class="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div v-if="selectedEquipmentDetails.length === 0" class="py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
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
                  <th class="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">N° Orden Compra</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="(item, idx) in selectedEquipmentDetails" :key="idx" class="hover:bg-gray-50/50">
                  <td class="px-4 py-3 text-sm font-medium text-gray-700">{{ item['ID_#EQUIPO'] }}</td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-600">
                    <span v-if="item['N° solicitud']" class="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-100">
                      {{ item['N° solicitud'] }}
                    </span>
                    <span v-else class="text-gray-300 italic text-xs">N/A</span>
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-600">
                    <span v-if="item['N° Orden de compra']" class="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-100">
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
            <div 
              v-for="(item, idx) in selectedEquipmentDetails" 
              :key="idx"
              class="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col gap-4"
            >
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

    <Transition
      enter-active-class="animate-in fade-in slide-in-from-bottom-4 duration-300"
      leave-active-class="animate-out fade-out slide-out-to-bottom-4 duration-300"
    >
      <div v-if="showScrollButton" class="fixed bottom-[84px] md:bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none">
        <button 
          v-if="selectedEquipmentDetails.length > 0"
          @click="scrollToTable"
          class="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 bg-main/20 backdrop-blur-xl backdrop-saturate-150 backdrop-contrast-125 text-main font-black rounded-full text-xs uppercase tracking-wider hover:bg-main/30 transition-all shadow-2xl active:scale-95 border border-main/20 whitespace-nowrap ring-1 ring-white/20"
        >
          Ver solicitudes <ChevronRight class="w-4 h-4" />
        </button>
        <div 
          v-else
          class="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 bg-black/10 backdrop-blur-xl backdrop-saturate-150 backdrop-contrast-125 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider border border-black/10 shadow-xl shadow-black/5 whitespace-nowrap ring-1 ring-white/10"
        >
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