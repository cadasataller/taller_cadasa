<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useRatingsStore } from '@/stores/ratingsStore';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { X, Image as ImageIcon, Star, TrendingUp, Users } from 'lucide-vue-next';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels);

const store = useRatingsStore();
const route = useRoute();

const isNestedView = computed(() => !!route.query.back);

const isLoading = computed(() => store.isLoading);
const allInspections = computed(() => store.normalizedInspections);
const allSupervisors = computed(() => store.validSupervisors);

const timeFilter = ref('Esta semana'); // Todas, Esta semana, La semana pasada, El último mes
const timeFilters = ['Todas', 'Esta semana', 'La semana pasada', 'El último mes'];

const supervisorFilter = ref<string | number>('Todos');

const tzOffset = new Date().getTimezoneOffset() * 60000;
const today = new Date(Date.now() - tzOffset);
const todayStr = today.toISOString().split('T')[0];

const day = today.getDay();
const diff = today.getDate() - day + (day === 0 ? -6 : 1);
const startOfThisWeek = new Date(new Date(today).setDate(diff)).toISOString().split('T')[0];

const startOfLastWeek = new Date(new Date(today).setDate(diff - 7)).toISOString().split('T')[0];
const endOfLastWeek = new Date(new Date(today).setDate(diff - 1)).toISOString().split('T')[0];

const lastMonth = new Date(new Date(today).setDate(today.getDate() - 30)).toISOString().split('T')[0];

onMounted(async () => {
  await store.fetchAll();
});

const filteredInspections = computed(() => {
  return allInspections.value.filter(i => {
    // Check Supervisor filter
    if (supervisorFilter.value !== 'Todos' && i.final_supervisor_id !== supervisorFilter.value) {
      return false;
    }
    
    // Check Time filter
    if (timeFilter.value === 'Esta semana') {
      return i.fecha >= startOfThisWeek && i.fecha <= todayStr;
    } else if (timeFilter.value === 'La semana pasada') {
      return i.fecha >= startOfLastWeek && i.fecha <= endOfLastWeek;
    } else if (timeFilter.value === 'El último mes') {
      return i.fecha >= lastMonth && i.fecha <= todayStr;
    }
    return true; // "Todas"
  });
});

const chartData = computed(() => {
  // Group by date
  const grouped: Record<string, { total: number, count: number }> = {};
  
  // Sort inspections by date ascending to show chronological order
  const sorted = [...filteredInspections.value].sort((a,b) => a.fecha.localeCompare(b.fecha));

  sorted.forEach(i => {
    const f = i.fecha;
    if (!grouped[f]) grouped[f] = { total: 0, count: 0 };
    grouped[f].total += i.puntuacion_promedio || 0;
    grouped[f].count++;
  });

  const labels = Object.keys(grouped);
  const data = labels.map(l => {
    const avg = grouped[l].total / grouped[l].count;
    const perc = (avg / 5) * 100;
    return Number(perc.toFixed(1)); // Rounded single decimal percentage
  });

  // Highlight color if selectedDate is active
  const backgroundColors = labels.map(l => {
    if (selectedDate.value && selectedDate.value === l) {
      return '#FACC15'; // Yellow-400 for focused/filtered bar
    }
    return '#1E293B'; // Default Slate-800
  });

  return {
    labels,
    datasets: [
      {
        label: 'Calificación Promedio (%)',
        backgroundColor: backgroundColors,
        borderRadius: 4,
        data
      }
    ]
  };
});

const selectedDate = ref<string>('');

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false }, // Explicitly disable tooltip to only show percentage above bar
    datalabels: {
      anchor: 'end' as const,
      align: 'bottom' as const,
      color: '#fff',
      font: {
        weight: 'bold',
        size: 11
      },
      formatter: (value: any) => {
        return `${value}%`;
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      grid: {
        drawBorder: false,
      } as any,
      ticks: {
        display: false
      }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false
      } as any
    }
  },
  onClick: (event: any, elements: any[]) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      const clickedDate = chartData.value.labels[idx];
      if (selectedDate.value === clickedDate) {
        selectedDate.value = '';
      } else {
        selectedDate.value = clickedDate;
      }
    } else {
      selectedDate.value = '';
    }
  }
} as const;

const displayedInspections = computed(() => {
  if (selectedDate.value) {
    return filteredInspections.value.filter(i => i.fecha === selectedDate.value).sort((a,b) => b.fecha.localeCompare(a.fecha));
  }
  return [...filteredInspections.value].sort((a,b) => b.fecha.localeCompare(a.fecha));
});

const getSupName = (id: number) => {
  const sup = allSupervisors.value.find(s => s.id_empleado === id);
  return sup ? sup.nombre_completo || sup.correo : 'Desconocido';
};

const showPhotosModal = ref(false);
const currentPhotos = ref<string[]>([]);
const openPhotos = (urlStr: string) => {
  if (!urlStr) return;
  currentPhotos.value = urlStr.split(',').filter(u => u.trim() !== '');
  if (currentPhotos.value.length > 0) showPhotosModal.value = true;
};

// Auto close table when filter changes instead of leaving stale clicking cache state
watch([timeFilter, supervisorFilter], () => {
  selectedDate.value = '';
});

// Calculate global metrics for the header
const globalMetrics = computed(() => {
  const insps = filteredInspections.value;
  if(insps.length === 0) return { avg: '--', count: 0 };
  const avg = insps.reduce((acc, i) => acc + (i.puntuacion_promedio || 0), 0) / insps.length;
  return {
    avg: Number(avg.toFixed(1)),
    count: insps.length
  }
});
</script>

<template>
  <div class="h-full flex flex-col pt-0 max-w-7xl mx-auto w-full">
    <!-- Header -->
    <div v-if="!isNestedView" class="mb-6 flex flex-col gap-2">
      <h3 class="text-xl font-bold tracking-tight text-gray-900">Métricas de Calificaciones</h3>
    </div>

    <!-- Filters Nivel 1: Tiempo -->
    <div id="filter-time-container" class="mb-4">
      <div class="flex overflow-x-auto gap-2 no-scrollbar pb-2">
        <button 
          v-for="f in timeFilters" 
          :key="f"
          @click="timeFilter = f"
          class="px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-colors border"
          :class="timeFilter === f ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'"
        >
          {{ f }}
        </button>
      </div>
    </div>

    <!-- Filters Nivel 2: Supervisores -->
    <div id="filter-supervisor-container" class="mb-6">
      <div class="flex overflow-x-auto gap-2 no-scrollbar pb-2">
        <button 
          @click="supervisorFilter = 'Todos'"
          class="px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-colors border"
          :class="supervisorFilter === 'Todos' ? 'bg-main text-white border-main shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'"
        >
          Todos los Supervisores
        </button>
        <button 
          v-for="sup in allSupervisors" 
          :key="sup.id_empleado"
          @click="supervisorFilter = sup.id_empleado"
          class="px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-colors border"
          :class="supervisorFilter === sup.id_empleado ? 'bg-main text-white border-main shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'"
        >
          {{ sup.nombre_completo || sup.correo }}
        </button>
      </div>
    </div>

    <!-- Contenido -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Cargando...
    </div>
    
    <div v-else id="content-container-dashboard" class="flex-1 flex flex-col min-h-0">
      <!-- Gráfico -->
      <div 
        id="chart-card-container"
        class="w-full h-64 bg-white border rounded-xl p-4 shadow-sm mb-6 flex-shrink-0 transition-all duration-300"
        :class="selectedDate ? 'border-accent ring-1 ring-accent/20' : 'border-gray-100'"
      >
        <Bar v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
        <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm italic">
          No hay datos para estos filtros.
        </div>
      </div>

      <!-- Tabla de detalles -->
      <div id="inspection-details-card" class="bg-white border text-left border-gray-100 rounded-xl shadow-sm flex-none flex flex-col min-h-[200px] mb-8 transition-all duration-500">
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h4 class="font-bold text-gray-800 text-sm">Detalle de Inspecciones{{ selectedDate ? `: ${selectedDate}` : '' }}</h4>
          <button v-if="selectedDate" @click="selectedDate = ''" class="text-gray-400 hover:text-gray-600">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-4 overflow-y-auto flex-1 no-scrollbar">
          <!-- Desktop Table -->
          <table class="hidden lg:table w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th class="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Supervisor</th>
                <th class="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Calificación</th>
                <th class="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Observación</th>
                <th class="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Fotos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="insp in displayedInspections" :key="insp.id_inspeccion" class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td class="py-3 text-sm text-gray-500">
                  {{ insp.fecha }}
                </td>
                <td class="py-3 text-sm text-gray-800 font-medium">
                  {{ getSupName(insp.final_supervisor_id) }}
                </td>
                <td class="py-3 text-center">
                  <span class="px-2 py-1 bg-green-50 text-success text-xs font-bold rounded">
                    {{ Number(((insp.puntuacion_promedio / 5) * 100).toFixed(1)) }}%
                  </span>
                </td>
                <td class="py-3 text-[11px] text-gray-500 line-clamp-2 max-w-[200px]" :title="insp.observacion">
                  {{ insp.observacion || '---' }}
                </td>
                <td class="py-3 text-right">
                  <button 
                    v-if="insp.foto_url" 
                    @click="openPhotos(insp.foto_url)"
                    class="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg inline-flex"
                    title="Ver Fotos"
                  >
                    <ImageIcon class="w-4 h-4" />
                  </button>
                  <span v-else class="text-xs text-gray-400 italic">Sin fotos</span>
                </td>
              </tr>
              <tr v-if="displayedInspections.length === 0">
                <td colspan="5" class="py-4 text-center text-sm text-gray-400 italic">No se encontraron registros.</td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile/Tablet Card View -->
          <div class="lg:hidden flex flex-col gap-4">
            <div v-for="insp in displayedInspections" :key="insp.id_inspeccion" class="p-4 bg-gray-50/50 border border-gray-100 rounded-xl flex flex-col gap-3 relative">
               <!-- Fecha y Fotos Float -->
               <div class="flex justify-between items-start">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha</span>
                    <span class="text-xs font-medium text-gray-600">{{ insp.fecha }}</span>
                  </div>
                  
                  <button 
                    v-if="insp.foto_url" 
                    @click="openPhotos(insp.foto_url)"
                    class="p-2.5 bg-white border border-gray-200 text-main rounded-xl shadow-sm active:scale-95 transition-transform"
                  >
                    <ImageIcon class="w-5 h-5" />
                  </button>
                  <div v-else class="text-[10px] text-gray-300 italic">Sin fotos</div>
               </div>

               <!-- Supervisor y Rating -->
               <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-main/5 flex items-center justify-center border border-main/10">
                     <Users class="w-5 h-5 text-main-light" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span class="text-sm font-bold text-gray-800 leading-tight">{{ getSupName(insp.final_supervisor_id) }}</span>
                    <span class="text-[10px] text-gray-500 font-medium">Supervisor de Área</span>
                  </div>
                  <div class="px-3 py-1.5 bg-main text-white text-xs font-bold rounded-lg shadow-sm">
                    {{ Number(((insp.puntuacion_promedio / 5) * 100).toFixed(1)) }}%
                  </div>
               </div>

               <!-- Observación -->
               <div class="mt-1 pt-3 border-t border-gray-100">
                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Observación</span>
                  <p class="text-[11px] text-gray-600 leading-relaxed italic">
                    {{ insp.observacion || 'Sin observaciones detalladas.' }}
                  </p>
               </div>
            </div>

            <div v-if="displayedInspections.length === 0" class="py-10 text-center flex flex-col items-center gap-2 opacity-50">
               <TrendingUp class="w-8 h-8 text-gray-300" />
               <span class="text-sm text-gray-400 font-medium italic">No se encontraron registros.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal de Fotos -->
    <div v-if="showPhotosModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" @click.self="showPhotosModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 class="font-bold text-gray-900">Evidencia Fotográfica</h3>
          <button @click="showPhotosModal = false" class="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
            <X class="w-5 h-5"/>
          </button>
        </div>
        <div class="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <img v-for="(photo, idx) in currentPhotos" :key="idx" :src="photo" class="w-full h-auto rounded-xl border border-gray-200" referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
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
