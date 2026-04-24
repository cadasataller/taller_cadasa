<template>
  <div 
    v-if="isVisible && isDev" 
    class="fixed z-[99999] bg-[#1e1e1e]/95 backdrop-blur border border-gray-600 text-gray-200 text-xs p-3 rounded-lg shadow-2xl pointer-events-auto select-text max-w-sm font-mono break-all font-medium transition-opacity duration-200" 
    :style="{ left: x + 'px', top: y + 'px' }" 
    @mouseleave="hideTooltip" 
    @mouseenter="clearHideTimer"
  >
    <div class="mb-2 font-bold text-accent px-1 border-b border-gray-700 pb-1 flex justify-between items-center gap-4">
       <span><span class="w-2 h-2 rounded-full animate-pulse bg-success inline-block mr-1"></span> Dev Inspector</span>
       <button @click="isVisible = false" class="text-gray-400 hover:text-white cursor-pointer hover:bg-gray-700 rounded w-5 h-5 flex items-center justify-center">&times;</button>
    </div>
    <div class="space-y-1.5 flex flex-col px-1">
       <div><strong class="text-purple-400">Etiqueta:</strong> <span class="text-yellow-200">{{ info.tag }}</span></div>
       <div v-if="info.id"><strong class="text-blue-400">ID:</strong> <span class="text-blue-200">{{ info.id }}</span></div>
       <div v-if="info.classes"><strong class="text-green-400">Clases:</strong> <span class="text-green-200">{{ info.classes }}</span></div>
       <div v-if="info.file"><strong class="text-orange-400">Archivo:</strong> <span class="text-orange-200">{{ info.file }}</span></div>
       <div v-if="info.component"><strong class="text-pink-400">Componente:</strong> <span class="text-pink-200">{{ info.component }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const mode_dev = ref(false); // Propiedad pedida por el usuario para deshabilitar el inspector
const isDev = computed(() => import.meta.env.DEV && mode_dev.value);

const isVisible = ref(false);
const x = ref(0);
const y = ref(0);
const info = ref<any>({});

let hoverTimer: any = null;
let currentTarget: HTMLElement | null = null;
let hideTimer: any = null;

// Traverse up the DOM tree to find the Vue Component that rendered this element
const checkVueComponent = (el: any) => {
  let depth = 0;
  let current = el;
  while (current && depth < 10) {
     // Direct Vue parent component reference usually set by standard Vue
     if (current.__vueParentComponent) {
        const comp = current.__vueParentComponent;
        if (comp && comp.type && comp.type.__file) {
           return {
              file: comp.type.__file,
              name: comp.type.__name || comp.type.name || 'Anónimo'
           }
        }
     }
     
     // Virtual Node traverse
     const keys = Object.keys(current);
     const vnodeKey = keys.find(k => k.startsWith('__vnode'));
     if (vnodeKey && current[vnodeKey]) {
        const vnode = current[vnodeKey];
        if (vnode.type && vnode.type.__file) {
           return {
              file: vnode.type.__file,
              name: vnode.type.__name || vnode.type.name || 'Anónimo'
           };
        }
     }
     
     current = current.parentElement;
     depth++;
  }
  return { file: '', name: '' };
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDev) return;
  const target = e.target as HTMLElement;
  
  // Si estamos dentro del tooltip mismo, ignoramos
  if (isVisible.value && target.closest && target.closest('.z-\\[99999\\]')) return;

  if (target === currentTarget) {
     return;
  }
  
  currentTarget = target;
  
  if (hoverTimer) clearTimeout(hoverTimer);
  if (hideTimer) clearTimeout(hideTimer);
  
  if (isVisible.value) {
     // Dar una ventana de gracia para que desaparezca al mover el raton lentamente
     hideTimer = setTimeout(() => {
        if (!target.closest('.z-\\[99999\\]')) isVisible.value = false;
     }, 100);
  }
  
  // Activar tras 3 segundos encima del elemento
  hoverTimer = setTimeout(() => {
     const tag = target.tagName.toLowerCase();
     const id = target.id;
     
     // Handle SVG clases that might be objects
     let classes = (target as any).className;
     if (typeof classes === 'object' && classes.baseVal !== undefined) {
         classes = (classes as any).baseVal;
     }

     const compInfo = checkVueComponent(target);
     
     info.value = {
        tag,
        id,
        classes: typeof classes === 'string' ? classes : '',
        file: compInfo.file?.replace('/src/', '') || 'N/A (Elemento nativo sin contexto de Archivo Vue)',
        component: compInfo.name || 'N/A'
     };
     
     let nx = e.clientX + 15;
     let ny = e.clientY + 15;
     
     // Screen bounds
     if (nx + 280 > window.innerWidth) nx = e.clientX - 290;
     if (ny + 150 > window.innerHeight) ny = e.clientY - 160;

     x.value = nx;
     y.value = ny;

     isVisible.value = true;
     if (hideTimer) clearTimeout(hideTimer);
  }, 3000);
};

const hideTooltip = () => {
   hideTimer = setTimeout(() => {
      isVisible.value = false;
      currentTarget = null;
   }, 300); // 300ms window to re-enter
};

const clearHideTimer = () => {
  if (hideTimer) clearTimeout(hideTimer);
  if (hoverTimer) clearTimeout(hoverTimer); // stop popping up underneath us
};

onMounted(() => {
  if (isDev) {
     window.addEventListener('mousemove', onMouseMove);
  }
});

onUnmounted(() => {
  if (isDev) {
     window.removeEventListener('mousemove', onMouseMove);
  }
});
</script>
