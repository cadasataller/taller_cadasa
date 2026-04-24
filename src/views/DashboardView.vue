<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Loader2 } from 'lucide-vue-next';
import { supabase } from '@/lib/supabase';
import SlideGeneral from '@/components/dashboard/SlideGeneral.vue';
import SlideReparaciones from '@/components/dashboard/SlideReparaciones.vue';
import SlideMantenimiento from '@/components/dashboard/SlideMantenimiento.vue';
import SlideServiciosGenerales from '@/components/dashboard/SlideServiciosGenerales.vue';
import SlideCalificaciones from '@/components/dashboard/SlideCalificaciones.vue';

const route = useRoute();
const router = useRouter();

const allSlides = [
  { id: 'general', label: 'General', component: SlideGeneral },
  { id: 'calificaciones', label: 'Calificaciones', component: SlideCalificaciones },
  { id: 'mantenimiento', label: 'Mantenimiento', component: SlideMantenimiento },
  { id: 'servicios_generales', label: 'Servicios G.', component: SlideServiciosGenerales },
  { id: 'reparaciones', label: 'Reparaciones', component: SlideReparaciones },
];

const isLoading = ref(true);
const userArea = ref('');

const slides = computed(() => {
  const area = userArea.value;
  if (area === 'ALL') {
    return allSlides;
  }
  if (area === 'EVALUADOR') {
    return allSlides.filter(s => s.id === 'calificaciones');
  }
  // Others: do not show calificaciones
  return allSlides.filter(s => s.id === 'reparaciones' || s.id === 'mantenimiento' || s.id === 'servicios_generales');
});

const containerRef = ref<HTMLElement | null>(null);
const currentSlideIndex = ref(0);

const isBackable = computed(() => !!route.query.back);
const backPath = computed(() => route.query.back as string || '/');

const scrollToSlideIndex = (index: number) => {
  if (containerRef.value) {
    const slideEl = containerRef.value.children[index] as HTMLElement;
    if (slideEl) {
      containerRef.value.scrollTo({ left: slideEl.offsetLeft, behavior: 'smooth' });
    }
  }
  currentSlideIndex.value = index;
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

const goBack = () => {
  if (isBackable.value) {
    router.push(backPath.value);
  } else {
    // Mobile strict fallback where 'back' wasn't passed via query string
    const area = userArea.value;
    if (area === 'EVALUADOR' || area === 'ALL') {
      router.push('/calificaciones');
    } else {
       router.go(-1);
    }
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
    const initialSlide = route.query.slide as string;
    if (initialSlide) {
      const idx = slides.value.findIndex(s => s.id === initialSlide);
      if (idx !== -1) {
        currentSlideIndex.value = idx;
        nextTick(() => {
          scrollToSlideIndex(idx);
        });
      }
    }
  });
});

watch(() => route.query.slide, (newSlide) => {
  if (newSlide) {
    const idx = slides.value.findIndex(s => s.id === newSlide);
    if (idx !== -1 && idx !== currentSlideIndex.value) {
      scrollToSlideIndex(idx);
    }
  }
});
</script>

<template>
  <div class="h-full flex flex-col relative bg-white">
    <div v-if="isLoading" id="dashboard-loading-spinner" class="flex items-center justify-center h-full">
      <Loader2 class="w-8 h-8 text-main animate-spin" />
    </div>

    <!-- Header with conditional back button -->
    <div v-if="!isLoading" id="dashboard-header-container" class="sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-gray-100">
      <div class="px-4 py-3 md:px-6 md:py-4 flex items-center justify-center relative">
        <!-- Back button & Title (Conditional) - Positioned absolute to not break centering -->
        <div v-if="isBackable" id="dashboard-back-header" class="flex items-center gap-2 md:gap-4 absolute left-4 md:left-6">
          <button @click="goBack" class="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors block">
            <ArrowLeft class="w-5 h-5 md:w-5 md:h-5" />
          </button>
          <h2 class="text-xs md:text-sm font-bold text-gray-800 hidden sm:block">Métricas</h2>
        </div>
        <!-- Unified Pill Navigation -->
        <div class="flex bg-gray-100 p-0.5 md:p-1 rounded-xl shadow-inner border border-gray-200/20 max-w-full" v-if="slides.length > 1">
          <button 
            v-for="(slide, index) in slides" 
            :key="slide.id"
            @click="scrollToSlideIndex(index)"
            class="px-3 py-1 md:px-5 md:py-1.5 text-[10px] md:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap"
            :class="index === currentSlideIndex ? 'bg-white text-main shadow-md' : 'text-gray-400 hover:text-gray-600'"
          >
            {{ slide.label }}
          </button>
        </div>
        
        <!-- Mobile Title if no nav -->
        <div v-if="slides.length <= 1" class="md:hidden font-bold text-sm text-gray-800">
          Métricas de Calificaciones
        </div>
      </div>
    </div>
    <div 
      v-if="!isLoading"
      id="dashboard-slider-container"
      ref="containerRef"
      @scroll.passive="handleScroll"
      class="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-gray-50/50"
      style="scroll-behavior: smooth;"
    >
      <div 
        v-for="slide in slides" 
        :key="slide.id"
        :id="'dashboard-slide-' + slide.id"
        class="min-w-full w-full flex-shrink-0 snap-center px-4 pb-6 md:px-6 md:pb-6 md:pt-0 lg:px-10 lg:pb-10 lg:pt-0 pb-[120px] md:pb-8 lg:pb-10 overflow-y-auto"
      >
        <div class="flex flex-col gap-0">
          <component :is="slide.component" />
          <!-- End of scroll spacer to separate from bottom nav -->
          <div class="h-10 w-full flex-shrink-0 lg:hidden"></div>
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
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
