<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Loader2, ChevronDown, Check } from 'lucide-vue-next';
import { supabase } from '@/lib/supabase';

// Maintenance Slides
import MaintSlideOrders from '@/components/maintenance/MaintSlideOrders.vue';
import MaintSlideSG from '@/components/maintenance/MaintSlideSG.vue';
import MaintSlideHours from '@/components/maintenance/MaintSlideHours.vue';
import MaintSlideStages from '@/components/maintenance/MaintSlideStages.vue';
import MaintSlideMetrics from '@/components/maintenance/MaintSlideMetrics.vue';
import MaintSlideUpdates from '@/components/maintenance/MaintSlideUpdates.vue';

const route = useRoute();
const router = useRouter();

const allSlides = [
  { id: 'ordenes', label: 'Ordenes De Mantenimiento', mobileLabel: 'Orden', component: MaintSlideOrders },
  { id: 'servicios_generales', label: 'Servicios Generales', mobileLabel: 'Servicios', component: MaintSlideSG },
  { id: 'horas_asignadas', label: 'Horas Asignadas', mobileLabel: 'Horas', component: MaintSlideHours },
  { id: 'definiciones_etapas', label: 'Definiciones de Etapas', component: MaintSlideStages },
  { id: 'metricas', label: 'Métricas', component: MaintSlideMetrics, adminOnly: true },
  { id: 'actualizaciones', label: 'Actualizaciones', component: MaintSlideUpdates, adminOnly: true },
];

const isLoading = ref(true);
const userArea = ref('');
const showDropdown = ref(false);

const openDashboard = () => {
  if (userArea.value === 'SERVICIOS GENERALES') {
    router.push('/dashboard?slide=servicios_generales&back=/mantenimiento');
  } else {
    router.push('/dashboard?slide=mantenimiento&back=/mantenimiento');
  }
};

const filteredSlides = computed(() => {
  const area = userArea.value;
  let list = [...allSlides];

  // Restricción: Ordenes no disponible para Servicios Generales
  if (area === 'SERVICIOS GENERALES') {
    list = list.filter(s => s.id !== 'ordenes');
  }

  // Restricción: Métricas y Actualizaciones solo para ALL
  if (area !== 'ALL') {
    list = list.filter(s => !s.adminOnly);
  }

  return list;
});

const primarySlides = computed(() => filteredSlides.value.slice(0, 3)); 
const overflowSlides = computed(() => filteredSlides.value.slice(3));

const containerRef = ref<HTMLElement | null>(null);
const currentSlideIndex = ref(0);

const scrollToSlideIndex = (index: number) => {
  if (containerRef.value) {
    const slideEl = containerRef.value.children[index] as HTMLElement;
    if (slideEl) {
      containerRef.value.scrollTo({ left: slideEl.offsetLeft, behavior: 'smooth' });
    }
  }
  currentSlideIndex.value = index;
  showDropdown.value = false;
};

const handleScroll = () => {
  if (!containerRef.value) return;
  const scrollLeft = containerRef.value.scrollLeft;
  const slideWidth = containerRef.value.clientWidth;
  const index = Math.round(scrollLeft / slideWidth);
  if (currentSlideIndex.value !== index) {
    currentSlideIndex.value = index;
  }
};

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.email) {
    const { data } = await supabase.from('PROFILE').select('area').eq('email', user.email).maybeSingle();
    userArea.value = data?.area?.toUpperCase() || '';
  }
  
  isLoading.value = false;

  nextTick(() => {
    const initialSlide = route.query.maint_slide as string;
    if (initialSlide) {
      const idx = filteredSlides.value.findIndex(s => s.id === initialSlide);
      if (idx !== -1) {
        currentSlideIndex.value = idx;
        nextTick(() => {
          scrollToSlideIndex(idx);
        });
      }
    }
  });

  // Close dropdown on click outside
  window.addEventListener('click', (e) => {
     const target = e.target as HTMLElement;
     if (!target.closest('#maint-dropdown-container')) {
       showDropdown.value = false;
     }
  });
});

watch(() => route.query.maint_slide, (newSlide) => {
  if (newSlide) {
    const idx = filteredSlides.value.findIndex(s => s.id === newSlide);
    if (idx !== -1 && idx !== currentSlideIndex.value) {
      scrollToSlideIndex(idx);
    }
  }
});
</script>

<template>
  <div class="h-full flex flex-col relative bg-white">
    <div v-if="isLoading" id="maint-loading-spinner" class="flex items-center justify-center h-full">
      <Loader2 class="w-8 h-8 text-main animate-spin" />
    </div>

    <!-- Header / Pill Navigation -->
    <div v-if="!isLoading" id="maint-header-container" class="sticky top-0 bg-white/90 backdrop-blur-sm z-30 border-b border-gray-100">
      <div class="px-2 py-2 md:px-4 md:py-3 flex items-center justify-center relative">
        <!-- Main Navigation Pills -->
        <div class="flex items-center gap-1 bg-gray-100 p-0.5 md:p-1 rounded-xl shadow-inner border border-gray-200/20">
          <!-- Static Dashboard Pill -->
          <button 
            @click="openDashboard"
            class="px-2.5 py-1.5 md:px-4 md:py-2 text-[10px] md:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none text-gray-400 hover:text-gray-600"
          >
            <span class="sm:hidden">Dashboard</span>
            <span class="hidden sm:inline">Dashboard</span>
          </button>

          <!-- Dynamic Slides -->
          <button 
            v-for="(slide, index) in primarySlides" 
            :key="slide.id"
            @click="scrollToSlideIndex(index)"
            class="px-2.5 py-1.5 md:px-4 md:py-2 text-[10px] md:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap outline-none"
            :class="index === currentSlideIndex ? 'bg-white text-main shadow-sm' : 'text-gray-400 hover:text-gray-600'"
          >
            <span class="sm:hidden">{{ slide.mobileLabel || slide.label }}</span>
            <span class="hidden sm:inline">{{ slide.label }}</span>
          </button>

          <!-- Dropdown for overflow slides -->
          <div v-if="overflowSlides.length > 0" id="maint-dropdown-container" class="relative">
            <button 
              @click.stop="showDropdown = !showDropdown"
              class="px-2.5 py-1.5 md:px-3 md:py-2 text-[10px] md:text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 outline-none"
              :class="currentSlideIndex >= 3 ? 'bg-white text-main shadow-sm' : 'text-gray-400 hover:text-gray-600'"
            >
              Más <ChevronDown class="w-3 h-3 transition-transform" :class="showDropdown ? 'rotate-180' : ''" />
            </button>

            <!-- Dropdown Menu -->
            <div 
              v-if="showDropdown"
              class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                v-for="(slide, index) in overflowSlides"
                :key="slide.id"
                @click="scrollToSlideIndex(index + 3)"
                class="w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between"
                :class="(index + 3) === currentSlideIndex ? 'bg-main/5 text-main' : 'text-gray-500 hover:bg-gray-50'"
              >
                {{ slide.label }}
                <Check v-if="(index + 3) === currentSlideIndex" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slider Content -->
    <div 
      v-if="!isLoading"
      id="maint-slider-container"
      ref="containerRef"
      @scroll.passive="handleScroll"
      class="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-gray-50/50"
      style="scroll-behavior: smooth;"
    >
      <div 
        v-for="slide in filteredSlides" 
        :key="slide.id"
        :id="'maint-slide-' + slide.id"
        class="min-w-full w-full flex-shrink-0 snap-center pb-[120px] md:pb-8 lg:pb-10 overflow-y-auto"
      >
        <div class="px-4 py-4 md:px-8 md:py-8 lg:px-10 lg:py-10">
          <component :is="slide.component" />
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
