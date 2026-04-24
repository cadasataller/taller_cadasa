<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, 
  Wrench, 
  Calendar, 
  LogOut, 
  Menu, 
  Plus,
  LayoutDashboard
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const isSidebarOpen = ref(true);

const userProfile = ref<{ nombre?: string; role?: string; area?: string } | null>(null);
const userEmail = ref('');

const allMenuItems = [
  { name: 'Calificaciones', path: '/calificaciones', icon: BarChart3 },
  { name: 'Reparaciones', path: '/reparaciones', icon: Wrench },
  { name: 'Mantenimiento', path: '/mantenimiento', icon: Calendar },
];

const menuItems = computed(() => {
  const area = userProfile.value?.area?.toUpperCase() || '';
  if (area === 'EVALUADOR') {
    return allMenuItems.filter(i => i.name === 'Calificaciones');
  }
  if (area === 'ALL') {
    return [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ...allMenuItems
    ];
  }
  return allMenuItems;
});

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    userEmail.value = user.email || '';
    const { data } = await supabase
      .from('PROFILE')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (data) {
      userProfile.value = data;
    }
  }

  // Handle Home Route redirection based on auth
  if (route.path === '/') {
    const area = userProfile.value?.area?.toUpperCase() || '';
    if (area === 'ALL') {
      router.push('/dashboard');
    } else {
      router.push('/calificaciones');
    }
  }
});

const logout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};

const triggerNew = () => {
  window.dispatchEvent(new CustomEvent('open-new-record'));
};

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/');
</script>

<template>
  <div class="flex h-screen bg-second overflow-hidden">
    <!-- Desktop Sidebar -->
    <aside 
      id="desktop-sidebar-container"
      class="hidden md:flex flex-col w-64 bg-main-dark text-white p-6 transition-all duration-300 relative z-20"
      :class="{ '-ml-64': !isSidebarOpen }"
    >
      <div class="mb-10">
        <h1 class="font-display text-2xl text-accent tracking-widest">CADASA</h1>
        <p class="text-[10px] text-second-deep tracking-[0.2em] uppercase">Gestión Operativa</p>
      </div>

      <nav class="flex-1 space-y-2">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path" 
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
          :class="[
            isActive(item.path) 
              ? 'bg-main text-accent' 
              : 'text-gray-400 hover:bg-main hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span class="font-medium text-sm">{{ item.name }}</span>
        </router-link>
      </nav>

      <button 
        @click="logout"
        class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-danger hover:text-white transition-all mt-auto"
      >
        <LogOut class="w-5 h-5" />
        <span class="font-medium text-sm">Cerrar Sesión</span>
      </button>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 bg-second overflow-hidden relative">
      <!-- Top Header (Desktop) -->
      <header class="hidden md:flex items-center justify-between px-8 h-16 bg-white border-b border-gray-200 shadow-md relative z-10">
        <div class="flex items-center gap-4">
          <button @click="isSidebarOpen = !isSidebarOpen" class="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
            <Menu class="w-5 h-5" />
          </button>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Módulo / </span>
            <h2 class="font-bold text-sm text-gray-700 uppercase tracking-wide">
              {{ menuItems.find(i => isActive(i.path))?.name || 'Dashboard' }}
            </h2>
          </div>
        </div>
        
        <div class="flex items-center gap-6">
          <div class="flex gap-3">
             <button class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md border border-main text-main transition-all hover:bg-main/5">Exportar</button>
             <button @click="triggerNew" class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md bg-main text-white transition-all shadow-sm hover:bg-main-light">+ Nuevo Registro</button>
          </div>
          <div class="h-8 w-px bg-gray-100 italic"></div>
          <div class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100" @click="router.push('/perfil')">
            <div class="text-right">
              <p class="text-[10px] font-bold text-gray-700 uppercase tracking-tight">{{ userProfile?.nombre || userEmail.split('@')[0] }}</p>
              <p class="text-[9px] text-gray-400 uppercase font-medium">{{ userProfile?.role || 'Configurar Perfil' }} <span v-if="userProfile?.area">• {{ userProfile.area }}</span></p>
            </div>
            <div class="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-bold text-xs text-main-dark">
              {{ (userProfile?.nombre || userEmail).substring(0,2).toUpperCase() }}
            </div>
          </div>
        </div>
      </header>

      <!-- Mobile Top Bar -->
      <div class="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 absolute top-0 left-0 w-full z-[30] shadow-sm">
        <h1 class="font-display text-xl text-main tracking-widest">CADASA</h1>
        <div class="flex items-center gap-4">
          <button @click="logout" class="text-gray-400 hover:text-danger transition-colors p-2">
            <LogOut class="w-5 h-5" />
          </button>
          <div class="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center font-display text-xs text-main cursor-pointer" @click="router.push('/perfil')">
            {{ (userProfile?.nombre || userEmail).substring(0,2).toUpperCase() }}
          </div>
        </div>
      </div>

      <!-- Mobile Spacer for Top Bar -->
      <div class="md:hidden flex-shrink-0 h-[68px] w-full"></div>

      <!-- Content Area -->
      <div id="app-main-content-area" class="flex-1 overflow-y-auto w-full">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>

      <!-- Mobile Bottom Nav -->
      <nav id="mobile-bottom-nav" class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-around items-center z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-t-3xl">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path" 
          :to="item.path"
          class="flex flex-col items-center gap-1 p-2 transition-all"
          :class="[isActive(item.path) ? 'text-main' : 'text-gray-300']"
        >
          <component :is="item.icon" class="w-6 h-6" />
          <span class="text-[10px] font-medium">{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- FAB Mobile -->
      <button 
        v-if="route.path !== '/dashboard'"
        @click="triggerNew" 
        class="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-accent text-gray-900 rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Plus class="w-8 h-8" />
      </button>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
