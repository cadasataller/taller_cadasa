<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  shallowRef,
  useTemplateRef,
} from "vue";
import { storeToRefs } from "pinia";
import { useRouter, useRoute } from "vue-router";
import {
  supabase,
  supabaseRatings,
  supabaseCompras,
  supabaseCapturaOperador,
  supabaseEquipos,
  supabaseRastreoTareas,
} from "@/lib/supabase";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { useFiltrosCatalogoStore } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.store";
import { useAceitesCatalogoStore } from "@/stores/dbequipos/engrase/catalogo/aceitesCatalogo.store";
import { useSistemasCatalogoStore } from "@/stores/dbequipos/engrase/catalogo/sistemasCatalogo.store";
import { useDashboardHeaderNav } from "@/composables/useDashboardHeaderNav";
import { useCatalogoEngrasePermissions } from "@/composables/engrase/catalogo/useCatalogoEngrasePermissions";
import { SEGUIMIENTO_FEATURES } from "@/seguimiento/shared/seguimiento.permissions";
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
  Book, // Agregado el icono para Catálogo
  Droplets,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MapPinned,
  MoreHorizontal,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const featureAccessStore = useFeatureAccessStore();
const filtrosCatalogoStore = useFiltrosCatalogoStore();
const aceitesCatalogoStore = useAceitesCatalogoStore();
const sistemasCatalogoStore = useSistemasCatalogoStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const isSidebarOpen = shallowRef(false);
const sidebarNav = useTemplateRef<HTMLElement>("sidebarNav");
const isSidebarNavAtTop = shallowRef(true);
const isSidebarNavAtBottom = shallowRef(true);
const desktopFloatingGroup = shallowRef<"engrase" | "seguimiento" | null>(null);
const desktopFloatingPanelTop = shallowRef(0);
const sidebarTooltipLabel = shallowRef<string | null>(null);
const sidebarTooltipTop = shallowRef(0);
const isPreparingSolicitudCompraCreate = ref(false);
const isDashboardOverflowMenuOpen = shallowRef(false);
const { dashboardHeaderNavState, selectDashboardHeaderSlide } =
  useDashboardHeaderNav();

const userProfile = ref<{
  nombre?: string;
  role?: string;
  area?: string;
} | null>(null);
const userEmail = ref("");
const MODULE_DASHBOARD_FEATURE = "module_dashboard";
const MODULE_CALIFICACIONES_FEATURE = "module_calificaciones";
const VIEW_CALIFICACIONES_DASHBOARD_FEATURE = "ver_dashboard_calificaciones";
const MODULE_REPARACIONES_FEATURE = "module_reparaciones";
const MODULE_MANTENIMIENTO_FEATURE = "module_mantenimiento";
const MODULE_COMPRAS_FEATURE = "module_compras";
const PANEL_ADMIN_FEATURE = "panel_admin";
const MODULE_CATALOG_FEATURE = "module_catalog";
const CREATE_SOLICITUD_FEATURE = "crear_solicitud_compra";
const VIEW_PROFILE_FEATURE = "ver_datos_perfil";
const MODULE_ENGRASE_FEATURE = "module_engrase";
const VIEW_FILTROS_ENGRASE_FEATURE = "ver_filtros_engrase";
const VIEW_ACTIVIDAD_EQUIPO_FEATURE = "ver_dashboard_actividad_equipo";
const engraseDesktopOpen = ref(false);
const mobileMoreOpen = ref(false);
const mobileEngraseOpen = ref(false);
const mobileSeguimientoOpen = ref(false);
const seguimientoDesktopOpen = ref(false);

const allMenuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    requiredFeature: MODULE_DASHBOARD_FEATURE,
  },
  {
    name: "Calificaciones",
    path: "/calificaciones",
    icon: BarChart3,
    requiredFeature: MODULE_CALIFICACIONES_FEATURE,
    requiredAnyFeature: VIEW_CALIFICACIONES_DASHBOARD_FEATURE,
  },
  {
    name: "Reparaciones",
    path: "/reparaciones",
    icon: Wrench,
    requiredFeature: MODULE_REPARACIONES_FEATURE,
  },
  {
    name: "Mantenimiento",
    path: "/mantenimiento",
    icon: Calendar,
    requiredFeature: MODULE_MANTENIMIENTO_FEATURE,
  },
  {
    name: "Compras",
    path: "/compras",
    icon: ShoppingCart,
    requiredFeature: MODULE_COMPRAS_FEATURE,
  },
  {
    name: "Catálogo",
    path: "/catalogo",
    icon: Book,
    requiredFeature: MODULE_CATALOG_FEATURE,
  },
  {
    name: "Panel Admin",
    path: "/panel-admin",
    icon: ShieldCheck,
    requiredFeature: PANEL_ADMIN_FEATURE,
  },
];

const canSeeEngrase = computed(
  () =>
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad(MODULE_ENGRASE_FEATURE),
);
const canSeeFiltrosEngrase = computed(
  () =>
    canSeeEngrase.value &&
    featureAccessStore.tieneFuncionalidad(VIEW_FILTROS_ENGRASE_FEATURE),
);
const { canViewCatalog } = useCatalogoEngrasePermissions();
const canSeeCatalogoEngrase = computed(
  () => canSeeEngrase.value && canViewCatalog.value,
);
const canSeeSeguimiento = computed(
  () =>
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad(SEGUIMIENTO_FEATURES.module),
);
const canSeeSeguimientoTareas = computed(
  () =>
    canSeeSeguimiento.value &&
    featureAccessStore.tieneFuncionalidad(SEGUIMIENTO_FEATURES.viewTasks),
);
const canSeeSeguimientoActividadEquipo = computed(
  () =>
    canSeeSeguimiento.value &&
    featureAccessStore.tieneFuncionalidad(VIEW_ACTIVIDAD_EQUIPO_FEATURE),
);
const canSeeSeguimientoResumenActividadEquipos = computed(
  () =>
    canSeeSeguimiento.value &&
    featureAccessStore.tieneFuncionalidad(
      SEGUIMIENTO_FEATURES.viewActivityTeamsSummary,
    ),
);
const canViewProfile = computed(
  () =>
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad(VIEW_PROFILE_FEATURE),
);
const isSeguimientoRoute = computed(() =>
  route.path.startsWith("/seguimiento"),
);
const isEngraseRoute = computed(() => route.path.startsWith("/engrase"));
const isCatalogoEngraseRoute = computed(
  () =>
    route.path.startsWith("/engrase/catalogo") ||
    route.path.startsWith("/engrase/filtros/catalogo"),
);
const isFiltrosEngraseRoute = computed(
  () =>
    route.path.startsWith("/engrase/filtros") && !isCatalogoEngraseRoute.value,
);
const updateSidebarNavScrollState = (): void => {
  const nav = sidebarNav.value;
  if (!nav) return;

  isSidebarNavAtTop.value = nav.scrollTop <= 1;
  isSidebarNavAtBottom.value =
    nav.scrollTop + nav.clientHeight >= nav.scrollHeight - 1;
};

const toggleDesktopNavigationGroup = (
  group: "engrase" | "seguimiento",
  event: MouseEvent,
): void => {
  sidebarTooltipLabel.value = null;

  if (!isSidebarOpen.value) {
    const trigger = event.currentTarget as HTMLElement;
    const sidebar = document.getElementById("desktop-sidebar-container");

    if (sidebar) {
      desktopFloatingPanelTop.value =
        trigger.getBoundingClientRect().top -
        sidebar.getBoundingClientRect().top;
    }

    desktopFloatingGroup.value =
      desktopFloatingGroup.value === group ? null : group;
    return;
  }

  if (group === "engrase") {
    engraseDesktopOpen.value = !engraseDesktopOpen.value;
    seguimientoDesktopOpen.value = false;
    return;
  }

  seguimientoDesktopOpen.value = !seguimientoDesktopOpen.value;
  engraseDesktopOpen.value = false;
};

const closeDesktopFloatingGroup = (): void => {
  desktopFloatingGroup.value = null;
};

const closeDesktopFloatingGroupOnOutsideClick = (event: Event): void => {
  if (!(event.target instanceof Element)) return;

  if (!event.target.closest(".desktop-navigation-group")) {
    closeDesktopFloatingGroup();
  }
};

const showSidebarTooltip = (label: string, event: Event): void => {
  if (isSidebarOpen.value) return;

  const trigger = event.currentTarget as HTMLElement;
  const sidebar = document.getElementById("desktop-sidebar-container");
  if (!sidebar) return;

  sidebarTooltipLabel.value = label;
  sidebarTooltipTop.value =
    trigger.getBoundingClientRect().top -
    sidebar.getBoundingClientRect().top +
    trigger.getBoundingClientRect().height / 2;
};

const hideSidebarTooltip = (): void => {
  sidebarTooltipLabel.value = null;
};

const menuItems = computed(() =>
  allMenuItems.filter(
    (item) =>
      isFeatureAccessLoaded.value &&
      (featureAccessStore.tieneFuncionalidad(item.requiredFeature) ||
        ("requiredAnyFeature" in item &&
          featureAccessStore.tieneFuncionalidad(item.requiredAnyFeature))),
  ),
);

const dashboardMenuItems = computed(() =>
  menuItems.value.filter((item) => item.path === "/dashboard"),
);
const operationMenuItems = computed(() =>
  menuItems.value.filter((item) =>
    ["/mantenimiento", "/reparaciones", "/calificaciones"].includes(item.path),
  ),
);
const managementMenuItems = computed(() =>
  menuItems.value.filter((item) =>
    ["/compras", "/catalogo"].includes(item.path),
  ),
);
const systemMenuItems = computed(() =>
  menuItems.value.filter((item) => item.path === "/panel-admin"),
);
const mobilePrimaryItems = computed(() => {
  const primaryPaths = ["/dashboard", "/mantenimiento", "/compras"];
  const primaryItems = menuItems.value.filter((item) =>
    primaryPaths.includes(item.path),
  );

  if (
    canSeeSeguimientoTareas.value ||
    canSeeSeguimientoActividadEquipo.value ||
    canSeeSeguimientoResumenActividadEquipos.value
  ) {
    primaryItems.splice(2, 0, {
      name: "Seguimiento",
      path: canSeeSeguimientoTareas.value
        ? "/seguimiento/tareas"
        : canSeeSeguimientoActividadEquipo.value
          ? "/seguimiento/actividad-equipo"
          : "/seguimiento/resumen-actividad-equipos",
      icon: MapPinned,
      requiredFeature: SEGUIMIENTO_FEATURES.module,
    });
  }

  return primaryItems;
});
const mobileMoreItems = computed(() => {
  return menuItems.value.filter(
    (item) => !["/dashboard", "/mantenimiento", "/compras"].includes(item.path),
  );
});

const mobileSeguimientoItems = computed(() => [
  ...(canSeeSeguimientoTareas.value
    ? [
        {
          name: "Tareas",
          path: "/seguimiento/tareas",
          icon: MapPinned,
        },
      ]
    : []),
  ...(canSeeSeguimientoActividadEquipo.value
    ? [
        {
          name: "Actividad equipo",
          path: "/seguimiento/actividad-equipo",
          icon: MapPinned,
        },
      ]
    : []),
  ...(canSeeSeguimientoResumenActividadEquipos.value
    ? [
        {
          name: "Resumen equipos",
          path: "/seguimiento/resumen-actividad-equipos",
          icon: BarChart3,
        },
      ]
    : []),
]);

const mobilePrimaryEmptySlots = computed(() =>
  Math.max(0, 3 - mobilePrimaryItems.value.length),
);
const isMobileMoreActive = computed(
  () =>
    isEngraseRoute.value ||
    mobileMoreItems.value.some((item) => isActive(item.path)),
);

const viewTitle = computed(() => {
  if (route.path.startsWith("/compras")) return "COMPRAS";
  if (route.path.startsWith("/panel-admin")) return "PANEL ADMINISTRADOR";
  if (route.path.startsWith("/catalogo")) return "CATÁLOGO";
  if (route.path.startsWith("/engrase")) return "ENGRASE";
  if (route.path.startsWith("/seguimiento")) return "SEGUIMIENTO";
  return menuItems.value.find((i) => isActive(i.path))?.name || "Dashboard";
});
const currentUserName = computed(
  () => userProfile.value?.nombre || userEmail.value.split("@")[0] || "Usuario",
);
const todayLabel = computed(() =>
  new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(new Date())
    .replaceAll(".", "")
    .replace("ago", "agos"),
);

const isSolicitudCompraCreateRoute = computed(
  () => route.name === "SolicitudCompraCrear",
);
const isDashboardRoute = computed(() => route.path.startsWith("/dashboard"));
const isCalificacionesRoute = computed(() =>
  route.path.startsWith("/calificaciones"),
);
const showDashboardHeaderNav = computed(
  () =>
    (isDashboardRoute.value || isCalificacionesRoute.value) &&
    dashboardHeaderNavState.isVisible,
);
const dashboardPrimarySlides = computed(() => {
  const { slides } = dashboardHeaderNavState;

  return slides.length >= 8 ? slides.slice(0, 6) : slides;
});
const dashboardOverflowSlides = computed(() =>
  dashboardHeaderNavState.slides.length >= 8
    ? dashboardHeaderNavState.slides.slice(6)
    : [],
);
const isDashboardOverflowSlideActive = computed(
  () =>
    dashboardHeaderNavState.currentSlideIndex >=
    dashboardPrimarySlides.value.length,
);
const mobileTopBarSpacerClass = computed(() =>
  showDashboardHeaderNav.value ? "h-[124px]" : "h-[68px]",
);
const hideDefaultLayout = computed(
  () =>
    isPreparingSolicitudCompraCreate.value ||
    route.matched.some((record) => record.meta.layout === "fullscreen"),
);
const isComprasFabLoading = computed(
  () =>
    route.path.startsWith("/compras") &&
    isPreparingSolicitudCompraCreate.value &&
    !isSolicitudCompraCreateRoute.value,
);
const canCreateSolicitudCompra = computed(
  () =>
    isFeatureAccessLoaded.value &&
    featureAccessStore.tieneFuncionalidad(CREATE_SOLICITUD_FEATURE),
);
const canShowMobileFab = computed(() => {
  if (route.path === "/dashboard" || isSeguimientoRoute.value) {
    return false;
  }

  if (route.path.startsWith("/compras")) {
    return canCreateSolicitudCompra.value;
  }

  return ["ALL", "EVALUADOR"].includes(
    userProfile.value?.area?.toUpperCase() || "",
  );
});

const handlePrepareSolicitudCompraCreate = (): void => {
  if (
    !route.path.startsWith("/compras") ||
    route.name === "SolicitudCompraCrear"
  ) {
    return;
  }

  isPreparingSolicitudCompraCreate.value = true;
};

const handleCancelSolicitudCompraCreate = (): void => {
  isPreparingSolicitudCompraCreate.value = false;
};

const selectDashboardSlide = (index: number): void => {
  isDashboardOverflowMenuOpen.value = false;
  selectDashboardHeaderSlide(index);
};

const closeDashboardOverflowMenu = (event: MouseEvent): void => {
  const target = event.target;

  if (
    target instanceof Element &&
    !target.closest(".dashboard-overflow-menu")
  ) {
    isDashboardOverflowMenuOpen.value = false;
  }
};

const mobileFabVisibilityClass = computed(() => {
  if (route.path.startsWith("/compras")) {
    return isSolicitudCompraCreateRoute.value
      ? "-translate-x-6 opacity-0 pointer-events-none"
      : "translate-x-0 opacity-100";
  }

  return hideDefaultLayout.value
    ? "-translate-x-6 opacity-0 pointer-events-none"
    : "translate-x-0 opacity-100";
});

watch(
  () => route.name,
  (name) => {
    if (name === "SolicitudCompraCrear") {
      isPreparingSolicitudCompraCreate.value = false;
      return;
    }

    if (name === "Compras") {
      isPreparingSolicitudCompraCreate.value = false;
    }
  },
);

onMounted(async () => {
  window.addEventListener("resize", updateSidebarNavScrollState);
  window.addEventListener("click", closeDashboardOverflowMenu);
  window.addEventListener("click", closeDesktopFloatingGroupOnOutsideClick);
  window.addEventListener(
    "prepare-open-solicitud-compra",
    handlePrepareSolicitudCompraCreate,
  );
  window.addEventListener(
    "cancel-open-solicitud-compra",
    handleCancelSolicitudCompraCreate,
  );

  featureAccessStore.cargarFuncionalidadesPermitidas().catch((error) => {
    console.error("Error cargando funcionalidades permitidas:", error);
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    userEmail.value = user.email || "";
    const { data } = await supabase
      .from("PROFILE")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (data) {
      userProfile.value = data;
    }
  }

  requestAnimationFrame(updateSidebarNavScrollState);
});

watch(menuItems, () => requestAnimationFrame(updateSidebarNavScrollState), {
  flush: "post",
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateSidebarNavScrollState);
  window.removeEventListener("click", closeDashboardOverflowMenu);
  window.removeEventListener("click", closeDesktopFloatingGroupOnOutsideClick);
  window.removeEventListener(
    "prepare-open-solicitud-compra",
    handlePrepareSolicitudCompraCreate,
  );
  window.removeEventListener(
    "cancel-open-solicitud-compra",
    handleCancelSolicitudCompraCreate,
  );
});

const logout = async () => {
  await Promise.all([
    supabase.auth.signOut(),
    supabaseRatings.auth.signOut(),
    supabaseCompras.auth.signOut(),
    supabaseCapturaOperador.auth.signOut(),
    supabaseEquipos.auth.signOut(),
    supabaseRastreoTareas.auth.signOut(),
  ]);
  filtrosCatalogoStore.reset();
  aceitesCatalogoStore.reset();
  sistemasCatalogoStore.reset();
  featureAccessStore.reset();
  router.push("/login");
};

const triggerNew = () => {
  if (route.path.startsWith("/compras")) {
    if (
      !canCreateSolicitudCompra.value ||
      isPreparingSolicitudCompraCreate.value
    ) {
      return;
    }

    isPreparingSolicitudCompraCreate.value = true;
    window.dispatchEvent(new CustomEvent("open-new-solicitud-compra"));
    return;
  } else {
    window.dispatchEvent(new CustomEvent("open-new-record"));
  }
};

const isActive = (path: string) =>
  route.path === path || route.path.startsWith(path + "/");
</script>

<template>
  <div class="flex h-screen bg-second overflow-hidden">
    <!-- Desktop Sidebar -->
    <aside
      v-if="!hideDefaultLayout"
      id="desktop-sidebar-container"
      class="hidden lg:flex flex-col bg-main-dark text-white transition-[width,padding] duration-300 relative z-20 overflow-visible"
      :class="isSidebarOpen ? 'w-56 p-5' : 'w-14 p-2'"
    >
      <div
        class="mb-4 flex items-center"
        :class="isSidebarOpen ? 'justify-between' : 'justify-center'"
      >
        <span
          v-if="isSidebarOpen"
          class="font-display text-xl tracking-[0.16em] text-accent"
          >CADASA</span
        >
        <button
          type="button"
          class="rounded-lg p-2 text-accent transition-colors hover:bg-white/10 hover:text-white"
          :aria-label="isSidebarOpen ? 'Contraer sidebar' : 'Expandir sidebar'"
          @click="
            isSidebarOpen = !isSidebarOpen;
            closeDesktopFloatingGroup();
            hideSidebarTooltip();
          "
        >
          <Menu class="h-5 w-5" />
        </button>
      </div>

      <div class="relative min-h-0 flex-1">
        <div
          v-show="!isSidebarNavAtTop"
          class="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-10 justify-center bg-gradient-to-b from-main-dark via-main-dark/90 to-transparent pt-1 text-accent shadow-[0_8px_14px_rgba(0,0,0,0.22)]"
          aria-hidden="true"
        >
          <ChevronUp class="h-4 w-4" />
        </div>
        <nav
          ref="sidebarNav"
          class="sidebar-nav-scroll h-full space-y-5 overflow-y-auto overscroll-contain pr-1"
          @scroll="updateSidebarNavScrollState"
        >
          <div class="space-y-2">
            <router-link
              v-for="item in dashboardMenuItems"
              :key="item.path"
              :to="item.path"
              class="group relative flex items-center rounded-xl transition-all"
              @mouseenter="showSidebarTooltip(item.name, $event)"
              @mouseleave="hideSidebarTooltip"
              :class="[
                isSidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center p-3',
                isActive(item.path)
                  ? 'bg-main text-accent'
                  : 'text-gray-400 hover:bg-main hover:text-white',
              ]"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="isSidebarOpen" class="font-medium text-sm">{{
                item.name
              }}</span>
              <span v-else class="sidebar-tooltip">{{ item.name }}</span>
            </router-link>
          </div>

          <div
            v-if="
              operationMenuItems.length || canSeeEngrase || canSeeSeguimiento
            "
            class="space-y-2"
          >
            <p
              v-if="isSidebarOpen"
              class="px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-second-deep"
            >
              Operación
            </p>
            <router-link
              v-for="item in operationMenuItems"
              :key="item.path"
              :to="item.path"
              class="group relative flex items-center rounded-xl transition-all"
              @mouseenter="showSidebarTooltip(item.name, $event)"
              @mouseleave="hideSidebarTooltip"
              :class="[
                isSidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center p-3',
                isActive(item.path)
                  ? 'bg-main text-accent'
                  : 'text-gray-400 hover:bg-main hover:text-white',
              ]"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="isSidebarOpen" class="font-medium text-sm">{{
                item.name
              }}</span>
              <span v-else class="sidebar-tooltip">{{ item.name }}</span>
            </router-link>
            <div
              v-if="canSeeEngrase"
              class="desktop-navigation-group relative space-y-1"
            >
              <button
                type="button"
                class="group relative flex w-full items-center rounded-xl transition-all"
                @mouseenter="showSidebarTooltip('Engrase', $event)"
                @mouseleave="hideSidebarTooltip"
                :class="[
                  isSidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center p-3',
                  isEngraseRoute
                    ? 'bg-main text-accent'
                    : 'text-gray-400 hover:bg-main hover:text-white',
                ]"
                @click="toggleDesktopNavigationGroup('engrase', $event)"
                :aria-expanded="engraseDesktopOpen"
              >
                <Droplets class="w-5 h-5 flex-shrink-0" /><span
                  v-if="isSidebarOpen"
                  class="font-medium text-sm flex-1 text-left"
                  >Engrase</span
                ><ChevronDown
                  v-if="isSidebarOpen"
                  class="w-4 h-4 transition-transform"
                  :class="{ 'rotate-180': engraseDesktopOpen }"
                />
                <span v-if="!isSidebarOpen" class="sidebar-tooltip"
                  >Engrase</span
                >
              </button>
              <div
                v-if="isSidebarOpen && engraseDesktopOpen"
                class="ml-5 space-y-1"
              >
                <router-link
                  v-if="canSeeFiltrosEngrase"
                  to="/engrase/filtros"
                  class="flex items-center rounded-lg px-4 py-2.5 text-sm"
                  :class="
                    isFiltrosEngraseRoute
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  "
                  @click="engraseDesktopOpen = false"
                  >Filtros</router-link
                >
                <router-link
                  v-if="canSeeCatalogoEngrase"
                  to="/engrase/catalogo"
                  class="flex items-center rounded-lg px-4 py-2.5 text-sm"
                  :class="
                    isCatalogoEngraseRoute
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  "
                  @click="engraseDesktopOpen = false"
                  >Catálogo</router-link
                >
              </div>
            </div>
            <div
              v-if="canSeeSeguimiento"
              class="desktop-navigation-group relative space-y-1"
            >
              <button
                type="button"
                class="group relative flex w-full items-center rounded-xl transition-all"
                @mouseenter="showSidebarTooltip('Seguimiento', $event)"
                @mouseleave="hideSidebarTooltip"
                :class="[
                  isSidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center p-3',
                  isSeguimientoRoute
                    ? 'bg-main text-accent'
                    : 'text-gray-400 hover:bg-main hover:text-white',
                ]"
                @click="toggleDesktopNavigationGroup('seguimiento', $event)"
                :aria-expanded="seguimientoDesktopOpen"
              >
                <MapPinned class="w-5 h-5 flex-shrink-0" /><span
                  v-if="isSidebarOpen"
                  class="font-medium text-sm flex-1 text-left"
                  >Seguimiento</span
                ><ChevronDown
                  v-if="isSidebarOpen"
                  class="w-4 h-4 transition-transform"
                  :class="{ 'rotate-180': seguimientoDesktopOpen }"
                />
                <span v-if="!isSidebarOpen" class="sidebar-tooltip"
                  >Seguimiento</span
                >
              </button>
              <div
                v-if="isSidebarOpen && seguimientoDesktopOpen"
                class="ml-5 space-y-1"
              >
                <router-link
                  v-if="canSeeSeguimientoTareas"
                  to="/seguimiento/tareas"
                  class="flex items-center rounded-lg px-4 py-2.5 text-sm"
                  :class="
                    isSeguimientoRoute
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  "
                  @click="seguimientoDesktopOpen = false"
                  >Tareas</router-link
                >
                <router-link
                  v-if="canSeeSeguimientoActividadEquipo"
                  to="/seguimiento/actividad-equipo"
                  class="flex items-center rounded-lg px-4 py-2.5 text-sm"
                  :class="
                    isActive('/seguimiento/actividad-equipo')
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  "
                  @click="seguimientoDesktopOpen = false"
                  >Actividad equipo</router-link
                >
                <router-link
                  v-if="canSeeSeguimientoResumenActividadEquipos"
                  to="/seguimiento/resumen-actividad-equipos"
                  class="flex items-center rounded-lg px-4 py-2.5 text-sm"
                  :class="
                    isActive('/seguimiento/resumen-actividad-equipos')
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  "
                  @click="seguimientoDesktopOpen = false"
                  >Resumen equipos</router-link
                >
              </div>
            </div>
          </div>

          <div v-if="managementMenuItems.length" class="space-y-2">
            <p
              v-if="isSidebarOpen"
              class="px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-second-deep"
            >
              Gestión
            </p>
            <router-link
              v-for="item in managementMenuItems"
              :key="item.path"
              :to="item.path"
              class="group relative flex items-center rounded-xl transition-all"
              @mouseenter="showSidebarTooltip(item.name, $event)"
              @mouseleave="hideSidebarTooltip"
              :class="[
                isSidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center p-3',
                isActive(item.path)
                  ? 'bg-main text-accent'
                  : 'text-gray-400 hover:bg-main hover:text-white',
              ]"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="isSidebarOpen" class="font-medium text-sm">{{
                item.name
              }}</span>
              <span v-else class="sidebar-tooltip">{{ item.name }}</span>
            </router-link>
          </div>

          <div v-if="systemMenuItems.length" class="space-y-2">
            <p
              v-if="isSidebarOpen"
              class="px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-second-deep"
            >
              Sistema
            </p>
            <router-link
              v-for="item in systemMenuItems"
              :key="item.path"
              :to="item.path"
              class="group relative flex items-center rounded-xl transition-all"
              @mouseenter="showSidebarTooltip(item.name, $event)"
              @mouseleave="hideSidebarTooltip"
              :class="[
                isSidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center p-3',
                isActive(item.path)
                  ? 'bg-main text-accent'
                  : 'text-gray-400 hover:bg-main hover:text-white',
              ]"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="isSidebarOpen" class="font-medium text-sm">{{
                item.name
              }}</span>
              <span v-else class="sidebar-tooltip">{{ item.name }}</span>
            </router-link>
          </div>
        </nav>
        <div
          v-show="!isSidebarNavAtBottom"
          class="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-12 items-end justify-center bg-gradient-to-t from-main-dark via-main-dark/90 to-transparent pb-1 text-accent shadow-[0_-8px_14px_rgba(0,0,0,0.22)]"
          aria-hidden="true"
        >
          <ChevronDown class="h-4 w-4" />
        </div>
      </div>

      <div
        v-if="sidebarTooltipLabel"
        class="pointer-events-none absolute left-full z-[100000] ml-3 -translate-y-1/2 rounded-lg border border-accent/30 bg-main-dark px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-second shadow-xl"
        :style="{ top: `${sidebarTooltipTop}px` }"
        role="tooltip"
      >
        {{ sidebarTooltipLabel }}
      </div>

      <div
        v-if="!isSidebarOpen && desktopFloatingGroup"
        class="desktop-navigation-group absolute left-full z-50 ml-3 w-52 rounded-xl border border-white/10 bg-main-dark p-2 shadow-2xl"
        :style="{ top: `${desktopFloatingPanelTop}px` }"
      >
        <p
          class="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-second-deep"
        >
          {{ desktopFloatingGroup === "engrase" ? "Engrase" : "Seguimiento" }}
        </p>
        <div v-if="desktopFloatingGroup === 'engrase'" class="space-y-1">
          <router-link
            v-if="canSeeFiltrosEngrase"
            to="/engrase/filtros"
            class="flex rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
            :class="isFiltrosEngraseRoute ? 'bg-white/10 text-white' : ''"
            @click="closeDesktopFloatingGroup"
            >Filtros</router-link
          >
          <router-link
            v-if="canSeeCatalogoEngrase"
            to="/engrase/catalogo"
            class="flex rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
            :class="isCatalogoEngraseRoute ? 'bg-white/10 text-white' : ''"
            @click="closeDesktopFloatingGroup"
            >Catálogo</router-link
          >
        </div>
        <div v-else class="space-y-1">
          <router-link
            v-if="canSeeSeguimientoTareas"
            to="/seguimiento/tareas"
            class="flex rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
            :class="isSeguimientoRoute ? 'bg-white/10 text-white' : ''"
            @click="closeDesktopFloatingGroup"
            >Tareas</router-link
          >
          <router-link
            v-if="canSeeSeguimientoActividadEquipo"
            to="/seguimiento/actividad-equipo"
            class="flex rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
            :class="
              isActive('/seguimiento/actividad-equipo')
                ? 'bg-white/10 text-white'
                : ''
            "
            @click="closeDesktopFloatingGroup"
            >Actividad equipo</router-link
          >
          <router-link
            v-if="canSeeSeguimientoResumenActividadEquipos"
            to="/seguimiento/resumen-actividad-equipos"
            class="flex rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
            :class="
              isActive('/seguimiento/resumen-actividad-equipos')
                ? 'bg-white/10 text-white'
                : ''
            "
            @click="closeDesktopFloatingGroup"
            >Resumen equipos</router-link
          >
        </div>
      </div>

      <button
        @click="logout"
        class="group relative mt-3 flex shrink-0 items-center rounded-xl text-gray-400 hover:bg-danger hover:text-white transition-all"
        :class="isSidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center p-3'"
      >
        <LogOut
          class="w-5 h-5 text-danger transition-colors group-hover:text-white"
        />
        <span v-if="isSidebarOpen" class="font-medium text-sm"
          >Cerrar Sesión</span
        >
        <span v-else class="sidebar-tooltip">Cerrar sesión</span>
      </button>
    </aside>

    <!-- Main Content -->
    <main
      class="flex-1 flex flex-col min-w-0 bg-second overflow-hidden relative"
    >
      <!-- Top Header (Desktop) -->
      <header
        v-if="!hideDefaultLayout"
        class="relative z-10 hidden h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b border-gray-200 bg-white px-6 shadow-sm lg:grid"
      >
        <div
          class="flex min-w-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500"
        >
          <Calendar class="h-3.5 w-3.5 text-main" />
          <time :datetime="new Date().toISOString().slice(0, 10)">{{
            todayLabel
          }}</time>
        </div>

        <div
          v-if="showDashboardHeaderNav"
          class="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-gray-200/20 bg-gray-100 p-1 shadow-inner hide-scrollbar"
        >
          <button
            v-for="(slide, index) in dashboardPrimarySlides"
            :key="slide.id"
            type="button"
            class="flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-center text-[11px] font-bold transition-all"
            :class="
              index === dashboardHeaderNavState.currentSlideIndex
                ? 'bg-white text-main shadow-md'
                : 'text-gray-400 hover:text-gray-600'
            "
            @click="selectDashboardSlide(index)"
          >
            {{ slide.label }}
          </button>
          <div
            v-if="dashboardOverflowSlides.length > 0"
            class="dashboard-overflow-menu relative"
          >
            <button
              type="button"
              class="flex items-center gap-1 whitespace-nowrap rounded-lg px-4 py-1.5 text-center text-[11px] font-bold transition-all"
              :class="
                isDashboardOverflowSlideActive
                  ? 'bg-white text-main shadow-md'
                  : 'text-gray-400 hover:text-gray-600'
              "
              :aria-expanded="isDashboardOverflowMenuOpen"
              aria-haspopup="menu"
              @click.stop="
                isDashboardOverflowMenuOpen = !isDashboardOverflowMenuOpen
              "
            >
              Ver más
              <ChevronDown
                class="size-3 transition-transform"
                :class="isDashboardOverflowMenuOpen ? 'rotate-180' : ''"
              />
            </button>
            <div
              v-if="isDashboardOverflowMenuOpen"
              role="menu"
              class="fixed right-38 top-11 z-50 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                v-for="(slide, index) in dashboardOverflowSlides"
                :key="slide.id"
                type="button"
                role="menuitem"
                class="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold transition-colors"
                :class="
                  index + dashboardPrimarySlides.length ===
                  dashboardHeaderNavState.currentSlideIndex
                    ? 'bg-main/5 text-main'
                    : 'text-gray-500 hover:bg-gray-50'
                "
                @click="
                  selectDashboardSlide(index + dashboardPrimarySlides.length)
                "
              >
                {{ slide.label }}
                <Check
                  v-if="
                    index + dashboardPrimarySlides.length ===
                    dashboardHeaderNavState.currentSlideIndex
                  "
                  class="size-3.5"
                />
              </button>
            </div>
          </div>
        </div>

        <p v-else class="text-xs font-normal text-gray-500">
          <template v-if="canViewProfile">
            Bienvenido
            <span class="font-medium text-main">{{ currentUserName }}</span>
          </template>
          <template v-else>Bienvenido</template>
        </p>

        <div
          v-if="canViewProfile"
          class="flex items-center justify-self-end gap-2"
        >
          <span
            class="text-[9px] font-medium uppercase tracking-[0.1em] text-gray-500"
            >{{ userProfile?.area || "Sin área" }}</span
          >
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-main-dark transition-transform hover:scale-105"
            aria-label="Ir al perfil"
            @click="router.push('/perfil')"
          >
            {{ currentUserName.substring(0, 2).toUpperCase() }}
          </button>
        </div>
      </header>

      <!-- Mobile Top Bar -->
      <div
        v-if="!hideDefaultLayout"
        class="lg:hidden bg-white border-b border-gray-100 absolute top-0 left-0 w-full z-[30] shadow-sm transition-all duration-300"
      >
        <div class="flex items-center justify-between px-6 py-4">
          <div class="flex items-center gap-2 min-w-0">
            <h1
              class="font-display text-xl text-main tracking-widest leading-none"
            >
              CADASA
            </h1>
            <span
              v-if="route.path !== '/dashboard'"
              class="text-[14px] font-bold text-gray-700 leading-none pl-2 border-l border-gray-300 uppercase truncate"
              >{{ viewTitle }}</span
            >
          </div>
          <div class="flex items-center gap-4">
            <button
              @click="logout"
              class="text-gray-400 hover:text-danger transition-colors p-2"
            >
              <LogOut class="w-5 h-5 text-danger" />
            </button>
            <button
              v-if="canViewProfile"
              type="button"
              class="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center font-display text-xs text-main cursor-pointer"
              aria-label="Ir al perfil"
              @click="router.push('/perfil')"
            >
              {{
                (userProfile?.nombre || userEmail).substring(0, 2).toUpperCase()
              }}
            </button>
          </div>
        </div>

        <div v-if="showDashboardHeaderNav" class="px-4 pb-3">
          <div
            class="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200/20 overflow-x-auto hide-scrollbar"
          >
            <button
              v-for="(slide, index) in dashboardPrimarySlides"
              :key="slide.id"
              @click="selectDashboardSlide(index)"
              class="px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center text-center whitespace-nowrap flex-shrink-0"
              :class="
                index === dashboardHeaderNavState.currentSlideIndex
                  ? 'bg-white text-main shadow-md'
                  : 'text-gray-400 hover:text-gray-600'
              "
            >
              {{ slide.label }}
            </button>
            <div
              v-if="dashboardOverflowSlides.length > 0"
              class="dashboard-overflow-menu relative flex-shrink-0"
            >
              <button
                type="button"
                class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all"
                :class="
                  isDashboardOverflowSlideActive
                    ? 'bg-white text-main shadow-md'
                    : 'text-gray-400 hover:text-gray-600'
                "
                :aria-expanded="isDashboardOverflowMenuOpen"
                aria-haspopup="menu"
                @click.stop="
                  isDashboardOverflowMenuOpen = !isDashboardOverflowMenuOpen
                "
              >
                Ver más
                <ChevronDown
                  class="size-3 transition-transform"
                  :class="isDashboardOverflowMenuOpen ? 'rotate-180' : ''"
                />
              </button>
              <div
                v-if="isDashboardOverflowMenuOpen"
                role="menu"
                class="fixed right-4 top-[112px] z-50 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  v-for="(slide, index) in dashboardOverflowSlides"
                  :key="slide.id"
                  type="button"
                  role="menuitem"
                  class="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold transition-colors"
                  :class="
                    index + dashboardPrimarySlides.length ===
                    dashboardHeaderNavState.currentSlideIndex
                      ? 'bg-main/5 text-main'
                      : 'text-gray-500 hover:bg-gray-50'
                  "
                  @click="
                    selectDashboardSlide(index + dashboardPrimarySlides.length)
                  "
                >
                  {{ slide.label }}
                  <Check
                    v-if="
                      index + dashboardPrimarySlides.length ===
                      dashboardHeaderNavState.currentSlideIndex
                    "
                    class="size-3.5"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Spacer for Top Bar -->
      <div
        v-if="!hideDefaultLayout"
        :class="mobileTopBarSpacerClass"
        class="lg:hidden flex-shrink-0 w-full"
      ></div>

      <!-- Content Area -->
      <div
        id="app-main-content-area"
        class="flex-1 overflow-y-auto w-full pb-[76px] lg:pb-0"
      >
        <router-view v-slot="{ Component, route: childRoute }">
          <transition name="fade" mode="out-in">
            <component
              :is="Component"
              :key="childRoute.matched[1]?.path ?? childRoute.path"
            />
          </transition>
        </router-view>
      </div>

      <!-- Tablet and mobile bottom navigation -->
      <nav
        v-if="!hideDefaultLayout"
        id="mobile-bottom-nav"
        class="lg:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-gray-100 bg-white px-2 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"
      >
        <template v-for="item in mobilePrimaryItems" :key="item.path">
          <button
            v-if="item.path.startsWith('/seguimiento')"
            type="button"
            class="flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors"
            :class="isSeguimientoRoute ? 'text-main' : 'text-gray-400'"
            :aria-expanded="mobileMoreOpen && mobileSeguimientoOpen"
            aria-controls="mobile-more-sheet"
            @click="
              mobileMoreOpen = true;
              mobileSeguimientoOpen = true;
              mobileEngraseOpen = false;
            "
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            <span class="truncate text-[10px] font-semibold">{{
              item.name
            }}</span>
          </button>
          <router-link
            v-else
            :to="item.path"
            class="flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors"
            :class="isActive(item.path) ? 'text-main' : 'text-gray-400'"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            <span class="truncate text-[10px] font-semibold">{{
              item.name
            }}</span>
          </router-link>
        </template>
        <span
          v-for="emptySlot in mobilePrimaryEmptySlots"
          :key="`mobile-primary-empty-${emptySlot}`"
          aria-hidden="true"
        />
        <button
          type="button"
          class="flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors"
          :class="isMobileMoreActive ? 'text-main' : 'text-gray-400'"
          :aria-expanded="mobileMoreOpen"
          aria-controls="mobile-more-sheet"
          @click="
            mobileMoreOpen = true;
            mobileEngraseOpen = false;
            mobileSeguimientoOpen = false;
          "
        >
          <MoreHorizontal class="h-5 w-5" />
          <span class="text-[10px] font-semibold">Más</span>
        </button>
      </nav>

      <div
        v-if="!hideDefaultLayout && mobileMoreOpen"
        class="lg:hidden fixed inset-0 z-40 bg-main-dark/40"
        @click.self="
          mobileMoreOpen = false;
          mobileEngraseOpen = false;
          mobileSeguimientoOpen = false;
        "
      >
        <section
          id="mobile-more-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Más módulos"
          class="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-2xl"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <p
                class="text-xs font-bold uppercase tracking-[0.18em] text-main"
              >
                Navegación
              </p>
              <h3 class="text-lg font-bold text-gray-800">
                {{
                  mobileSeguimientoOpen
                    ? "Seguimiento"
                    : mobileEngraseOpen
                      ? "Engrase"
                      : "Más módulos"
                }}
              </h3>
            </div>
            <button
              type="button"
              class="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Cerrar más módulos"
              @click="
                mobileMoreOpen = false;
                mobileEngraseOpen = false;
                mobileSeguimientoOpen = false;
              "
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div v-if="mobileSeguimientoOpen" class="space-y-2">
            <button
              type="button"
              class="mb-1 flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-500"
              @click="
                mobileMoreOpen = false;
                mobileSeguimientoOpen = false;
              "
            >
              <ChevronDown class="h-4 w-4 rotate-90" /> Volver a módulos
            </button>
            <router-link
              v-for="item in mobileSeguimientoItems"
              :key="item.path"
              :to="item.path"
              class="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700"
              :class="isActive(item.path) ? 'bg-main/10 text-main' : ''"
              @click="
                mobileMoreOpen = false;
                mobileSeguimientoOpen = false;
              "
            >
              <component :is="item.icon" class="h-5 w-5" /> {{ item.name }}
            </router-link>
          </div>

          <div v-else-if="mobileEngraseOpen" class="space-y-2">
            <button
              type="button"
              class="mb-1 flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-500"
              @click="mobileEngraseOpen = false"
            >
              <ChevronDown class="h-4 w-4 rotate-90" /> Volver a módulos
            </button>
            <router-link
              v-if="canSeeFiltrosEngrase"
              to="/engrase/filtros"
              class="block cursor-pointer rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700"
              :class="isFiltrosEngraseRoute ? 'bg-main/10 text-main' : ''"
              @click="
                mobileMoreOpen = false;
                mobileEngraseOpen = false;
                mobileSeguimientoOpen = false;
              "
              >Filtros</router-link
            >
            <router-link
              v-if="canSeeCatalogoEngrase"
              to="/engrase/catalogo"
              class="block cursor-pointer rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700"
              :class="isCatalogoEngraseRoute ? 'bg-main/10 text-main' : ''"
              @click="
                mobileMoreOpen = false;
                mobileEngraseOpen = false;
                mobileSeguimientoOpen = false;
              "
              >Catálogo</router-link
            >
          </div>

          <div v-else class="grid grid-cols-2 gap-3">
            <router-link
              v-for="item in mobileMoreItems"
              :key="item.path"
              :to="item.path"
              class="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700"
              :class="isActive(item.path) ? 'bg-main/10 text-main' : ''"
              @click="mobileMoreOpen = false"
            >
              <component :is="item.icon" class="h-5 w-5" /> {{ item.name }}
            </router-link>
            <button
              v-if="canSeeEngrase"
              type="button"
              class="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700"
              :class="isEngraseRoute ? 'bg-main/10 text-main' : ''"
              @click="
                mobileEngraseOpen = true;
                mobileSeguimientoOpen = false;
              "
            >
              <Droplets class="h-5 w-5" /> Engrase
            </button>
          </div>
        </section>
      </div>

      <!-- FAB Mobile -->
      <button
        v-if="!hideDefaultLayout && canShowMobileFab"
        @click="triggerNew"
        class="lg:hidden fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-gray-900 shadow-lg transition-all duration-300 active:scale-90"
        :class="[
          mobileFabVisibilityClass,
          isComprasFabLoading ? 'cursor-wait' : 'cursor-pointer',
        ]"
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
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.sidebar-nav-scroll::-webkit-scrollbar {
  display: none;
}

.sidebar-nav-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.sidebar-tooltip {
  pointer-events: none;
  position: absolute;
  left: calc(100% + 0.75rem);
  z-index: 100000;
  white-space: nowrap;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 0.5rem;
  background: #002e2c;
  padding: 0.45rem 0.65rem;
  color: #f0ede5;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0;
  transform: translateX(-0.25rem);
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.group:hover .sidebar-tooltip,
.group:focus-visible .sidebar-tooltip {
  opacity: 1;
  transform: translateX(0);
}
</style>
