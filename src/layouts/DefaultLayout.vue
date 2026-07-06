<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { supabase, supabaseRatings, supabaseCompras, supabaseEquipos } from '@/lib/supabase';
import { useFeatureAccessStore } from '@/stores/db_mantenimiento/app_feature_access/featureAccess.store';
import { useDashboardHeaderNav } from '@/composables/useDashboardHeaderNav';
import { 
  BarChart3, 
  Wrench, 
  Calendar, 
  LogOut, 
  Menu, 
  Plus,
  LayoutDashboard,
  ShoppingCart,
  ShieldCheck,
  Book // Agregado el icono para Catálogo
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const isSidebarOpen = ref(true);
const isPreparingSolicitudCompraCreate = ref(false);
const { dashboardHeaderNavState, selectDashboardHeaderSlide } = useDashboardHeaderNav();

const userProfile = ref<{ nombre?: string; role?: string; area?: string } | null>(null);
const userEmail = ref('');
const PANEL_ADMIN_FEATURE = 'panel_admin';
const MODULE_CATALOG_FEATURE = 'module_catalog'; // Nueva constante para el feature de catálogo
const CREATE_SOLICITUD_FEATURE = 'crear_solicitud_compra';

const allMenuItems = [
  { name: 'Calificaciones', path: '/calificaciones', icon: BarChart3 },
  { name: 'Reparaciones', path: '/reparaciones', icon: Wrench },
  { name: 'Mantenimiento', path: '/mantenimiento', icon: Calendar },
  { name: 'Compras', path: '/compras', icon: ShoppingCart },
  { name: 'Catálogo', path: '/catalogo', icon: Book, requiredFeature: MODULE_CATALOG_FEATURE }, // Nueva pestaña
  { name: 'Panel Admin', path: '/panel-admin', icon: ShieldCheck, requiredFeature: PANEL_ADMIN_FEATURE },
];

const menuItems = computed(() => {
  const area = userProfile.value?.area?.toUpperCase() || '';
  let items = allMenuItems;

  if (area === 'EVALUADOR') {
    items = allMenuItems.filter(i => i.name === 'Calificaciones');
  } else if (area === 'ALMACEN') {
    items = allMenuItems.filter(i => i.name === 'Compras');
  } else if (area === 'ALL') {
    items = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ...allMenuItems
    ];
  }

  return items.filter((item) => {
    const requiredFeature = 'requiredFeature' in item ? item.requiredFeature : undefined;

    if (!requiredFeature) {
      return true;
    }

    return isFeatureAccessLoaded.value && featureAccessStore.tieneFuncionalidad(requiredFeature);
  });
});

const viewTitle = computed(() => {
  if (route.path.startsWith('/compras')) return 'COMPRAS';
  if (route.path.startsWith('/panel-admin')) return 'PANEL ADMINISTRADOR';
  if (route.path.startsWith('/catalogo')) return 'CATÁLOGO';
  return menuItems.value.find(i => isActive(i.path))?.name || 'Dashboard';
});

const isSolicitudCompraCreateRoute = computed(() => route.name === 'SolicitudCompraCrear');
const isDashboardRoute = computed(() => route.path.startsWith('/dashboard'));
const showDashboardHeaderNav = computed(() => isDashboardRoute.value && dashboardHeaderNavState.isVisible);
const mobileTopBarSpacerClass = computed(() => showDashboardHeaderNav.value ? 'h-[124px]' : 'h-[68px]');
const hideShellForSolicitudCompraCreate = computed(() =>
  isPreparingSolicitudCompraCreate.value || isSolicitudCompraCreateRoute.value
);
const isComprasFabLoading = computed(() =>
  route.path.startsWith('/compras')
  && isPreparingSolicitudCompraCreate.value
  && !isSolicitudCompraCreateRoute.value
);
const canCreateSolicitudCompra = computed(() =>
  isFeatureAccessLoaded.value
  && featureAccessStore.tieneFuncionalidad(CREATE_SOLICITUD_FEATURE)
);
const canShowMobileFab = computed(() => {
  if (route.path === '/dashboard') {
    return false;
  }

  if (route.path.startsWith('/compras')) {
    return canCreateSolicitudCompra.value;
  }

  return ['ALL', 'EVALUADOR'].includes(userProfile.value?.area?.toUpperCase() || '');
});

const handlePrepareSolicitudCompraCreate = (): void => {
  if (!route.path.startsWith('/compras') || route.name === 'SolicitudCompraCrear') {
    return;
  }

  isPreparingSolicitudCompraCreate.value = true;
};

const handleCancelSolicitudCompraCreate = (): void => {
  isPreparingSolicitudCompraCreate.value = false;
};

const mobileFabVisibilityClass = computed(() => {
  if (route.path.startsWith('/compras')) {
    return isSolicitudCompraCreateRoute.value
      ? '-translate-x-6 opacity-0 pointer-events-none'
      : 'translate-x-0 opacity-100';
  }

  return hideShellForSolicitudCompraCreate.value
    ? '-translate-x-6 opacity-0 pointer-events-none'
    : 'translate-x-0 opacity-100';
});

watch(
  () => route.name,
  (name) => {
    if (name === 'SolicitudCompraCrear') {
      isPreparingSolicitudCompraCreate.value = false;
      return;
    }

    if (name === 'Compras') {
      isPreparingSolicitudCompraCreate.value = false;
    }
  }
);

onMounted(async () => {
  window.addEventListener('prepare-open-solicitud-compra', handlePrepareSolicitudCompraCreate);
  window.addEventListener('cancel-open-solicitud-compra', handleCancelSolicitudCompraCreate);

  featureAccessStore.cargarFuncionalidadesPermitidas().catch((error) => {
    console.error('Error cargando funcionalidades permitidas:', error);
  });

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
    } else if (area === 'ALMACEN') {
      router.push('/compras');
    } else {
      router.push('/calificaciones');
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('prepare-open-solicitud-compra', handlePrepareSolicitudCompraCreate);
  window.removeEventListener('cancel-open-solicitud-compra', handleCancelSolicitudCompraCreate);
});

const logout = async () => {
  await Promise.all([
    supabase.auth.signOut(),
    supabaseRatings.auth.signOut(),
    supabaseCompras.auth.signOut(),
    supabaseEquipos.auth.signOut()
  ]);
  router.push('/login');
};

const triggerNew = () => {
  if (route.path.startsWith('/compras')) {
    if (!canCreateSolicitudCompra.value || isPreparingSolicitudCompraCreate.value) {
      return;
    }

    isPreparingSolicitudCompraCreate.value = true;
    window.dispatchEvent(new CustomEvent('open-new-solicitud-compra'));
    return;
  } else {
    window.dispatchEvent(new CustomEvent('open-new-record'));
  }
};

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/');
</script>

<template>
  <div class="flex h-screen bg-second overflow-hidden">
    <!-- Desktop Sidebar -->
    <aside 
      id="desktop-sidebar-container"
      class="hidden md:flex flex-col w-64 bg-main-dark text-white p-6 transition-all duration-300 relative z-20"
      :class="[
        { '-ml-64': !isSidebarOpen },
        hideShellForSolicitudCompraCreate ? '-translate-x-8 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
      ]"
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
      <header
        class="hidden md:flex items-center gap-6 px-8 h-16 bg-white border-b border-gray-200 shadow-md relative z-10 transition-all duration-300"
        :class="hideShellForSolicitudCompraCreate ? '-translate-x-8 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'"
      >
        <div class="flex items-center gap-4 min-w-0">
          <button @click="isSidebarOpen = !isSidebarOpen" class="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
            <Menu class="w-5 h-5" />
          </button>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Módulo / </span>
            <h2 class="font-bold text-sm text-gray-700 uppercase tracking-wide">
              {{ viewTitle }}
            </h2>
          </div>
        </div>

        <div v-if="showDashboardHeaderNav" class="flex-1 min-w-0 flex justify-center">
          <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200/20 overflow-x-auto hide-scrollbar max-w-full">
            <button
              v-for="(slide, index) in dashboardHeaderNavState.slides"
              :key="slide.id"
              @click="selectDashboardHeaderSlide(index)"
              class="px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center text-center whitespace-nowrap"
              :class="index === dashboardHeaderNavState.currentSlideIndex ? 'bg-white text-main shadow-md' : 'text-gray-400 hover:text-gray-600'"
            >
              {{ slide.label }}
            </button>
          </div>
        </div>

        <div v-else class="flex-1"></div>
        
        <div class="flex items-center gap-6">
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
      <div
        class="md:hidden bg-white border-b border-gray-100 absolute top-0 left-0 w-full z-[30] shadow-sm transition-all duration-300"
        :class="hideShellForSolicitudCompraCreate ? '-translate-x-6 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'"
      >
        <div class="flex items-center justify-between px-6 py-4">
          <div class="flex items-center gap-2 min-w-0">
            <h1 class="font-display text-xl text-main tracking-widest leading-none">CADASA</h1>
            <span v-if="route.path !== '/dashboard'" class="text-[14px] font-bold text-gray-700 leading-none pl-2 border-l border-gray-300 uppercase truncate">{{ viewTitle }}</span>
          </div>
          <div class="flex items-center gap-4">
            <button @click="logout" class="text-gray-400 hover:text-danger transition-colors p-2">
              <LogOut class="w-5 h-5" />
            </button>
            <div class="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center font-display text-xs text-main cursor-pointer" @click="router.push('/perfil')">
              {{ (userProfile?.nombre || userEmail).substring(0,2).toUpperCase() }}
            </div>
          </div>
        </div>

        <div v-if="showDashboardHeaderNav" class="px-4 pb-3">
          <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200/20 overflow-x-auto hide-scrollbar">
            <button
              v-for="(slide, index) in dashboardHeaderNavState.slides"
              :key="slide.id"
              @click="selectDashboardHeaderSlide(index)"
              class="px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center text-center whitespace-nowrap flex-shrink-0"
              :class="index === dashboardHeaderNavState.currentSlideIndex ? 'bg-white text-main shadow-md' : 'text-gray-400 hover:text-gray-600'"
            >
              {{ slide.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Spacer for Top Bar -->
      <div :class="mobileTopBarSpacerClass" class="md:hidden flex-shrink-0 w-full"></div>

      <!-- Content Area -->
      <div id="app-main-content-area" class="flex-1 overflow-y-auto w-full">
        <router-view v-slot="{ Component, route: childRoute }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="childRoute.matched[1]?.path ?? childRoute.path" />
          </transition>
        </router-view>
      </div>

      <!-- Mobile Bottom Nav - SCROLLABLE -->
      <nav 
        id="mobile-bottom-nav" 
        class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-around gap-2 overflow-x-auto z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-t-3xl hide-scrollbar transition-all duration-300"
        :class="hideShellForSolicitudCompraCreate ? '-translate-x-6 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'"
      >
        <router-link 
          v-for="item in menuItems" 
          :key="item.path" 
          :to="item.path"
          class="flex flex-col items-center gap-1 p-2 transition-all flex-shrink-0 min-w-[56px]"
          :class="[isActive(item.path) ? 'text-main' : 'text-gray-300']"
        >
          <component :is="item.icon" class="w-6 h-6 shrink-0" />
          <span class="text-[10px] font-medium whitespace-nowrap">{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- FAB Mobile -->
      <button 
        v-if="canShowMobileFab"
        @click="triggerNew" 
        class="lg:hidden fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-gray-900 shadow-lg transition-all duration-300 active:scale-90"
        :class="[mobileFabVisibilityClass, isComprasFabLoading ? 'cursor-wait' : 'cursor-pointer']"
        :disabled="isComprasFabLoading"
        :aria-busy="isComprasFabLoading"
      >
        <span
          v-if="isComprasFabLoading"
          class="h-6 w-6 animate-spin rounded-full border-[3px] border-main-dark/30 border-t-main-dark"
          aria-hidden="true"
        />
        <Plus v-else class="w-8 h-8" />
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

/* Ocultar barra de desplazamiento manteniendo funcionalidad */
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}
</style>
