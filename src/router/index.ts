import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized,
} from "vue-router";
import { supabase } from "@/lib/supabase";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import {
  SEGUIMIENTO_FEATURES,
  SEGUIMIENTO_TASK_ROUTE_FEATURES,
} from "@/seguimiento/shared/seguimiento.permissions";

const EmptyRouteComponent = { template: "<div></div>" };

type ModuleHomeRoute = {
  path: string;
  requiredFeatures?: readonly string[];
  requiredAnyFeatures?: readonly string[];
};

const moduleHomeRoutes: readonly ModuleHomeRoute[] = [
  { path: "/dashboard", requiredFeatures: ["module_dashboard"] },
  {
    path: "/calificaciones",
    requiredAnyFeatures: [
      "module_calificaciones",
      "ver_dashboard_calificaciones",
    ],
  },
  { path: "/reparaciones", requiredFeatures: ["module_reparaciones"] },
  { path: "/mantenimiento", requiredFeatures: ["module_mantenimiento"] },
  { path: "/compras", requiredFeatures: ["module_compras"] },
  { path: "/catalogo", requiredFeatures: ["module_catalog"] },
  {
    path: "/seguimiento/tareas",
    requiredFeatures: SEGUIMIENTO_TASK_ROUTE_FEATURES,
  },
  {
    path: "/engrase/filtros",
    requiredFeatures: ["module_engrase", "ver_filtros_engrase"],
  },
  { path: "/panel-admin", requiredFeatures: ["panel_admin"] },
];

const getRequiredFeatures = (to: RouteLocationNormalized): string[] => {
  const features = to.matched.flatMap((record) => {
    const requiredFeature = record.meta.requiredFeature;
    const requiredFeatures = record.meta.requiredFeatures;

    return [
      ...(typeof requiredFeature === "string" ? [requiredFeature] : []),
      ...(Array.isArray(requiredFeatures)
        ? requiredFeatures.filter(
            (feature): feature is string => typeof feature === "string",
          )
        : []),
    ];
  });

  return [...new Set(features)];
};

const getRequiredAnyFeatures = (to: RouteLocationNormalized): string[] => {
  const features = to.matched.flatMap((record) => {
    const requiredAnyFeatures = record.meta.requiredAnyFeatures;

    return Array.isArray(requiredAnyFeatures)
      ? requiredAnyFeatures.filter(
          (feature): feature is string => typeof feature === "string",
        )
      : [];
  });

  return [...new Set(features)];
};

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/LoginView.vue"),
    },
    {
      path: "/",
      name: "DefaultLayout",
      component: () => import("@/layouts/DefaultLayout.vue"),
      children: [
        {
          path: "",
          name: "HomeRedirect",
          component: EmptyRouteComponent,
        },
        {
          path: "dashboard",
          name: "Dashboard",
          component: () => import("@/views/DashboardView.vue"),
          meta: { requiredFeature: "module_dashboard" },
        },
        {
          path: "calificaciones",
          name: "SupervisorRatings",
          component: () => import("@/views/SupervisorRatingsView.vue"),
          meta: {
            requiredAnyFeatures: [
              "module_calificaciones",
              "ver_dashboard_calificaciones",
            ],
          },
        },
        {
          path: "reparaciones",
          name: "RepairHistory",
          component: () => import("@/views/RepairHistoryView.vue"),
          meta: { requiredFeature: "module_reparaciones" },
        },
        {
          path: "mantenimiento",
          name: "MaintenancePlan",
          component: () => import("@/views/MaintenancePlanView.vue"),
          meta: { requiredFeature: "module_mantenimiento" },
        },
        {
          path: "compras",
          name: "Compras",
          component: () => import("@/views/compras/SolicitudesCompraView.vue"),
          meta: { requiredFeature: "module_compras" },
          children: [
            {
              path: "nueva",
              name: "SolicitudCompraCrear",
              component: () =>
                import("@/views/compras/SolicitudCompraCrearView.vue"),
              meta: {
                requiredFeature: "crear_solicitud_compra",
                layout: "fullscreen",
              },
            },
          ],
        },
        {
          path: "seguimiento/tareas",
          name: "SeguimientoTareas",
          component: () =>
            import("@/views/seguimiento/SeguimientoTareasView.vue"),
          meta: { requiredFeatures: SEGUIMIENTO_TASK_ROUTE_FEATURES },
        },
        {
          path: "seguimiento/actividad-equipo",
          name: "SeguimientoActividadEquipo",
          component: () =>
            import("@/views/seguimiento/ActividadEquipoView.vue"),
          meta: {
            requiredFeatures: [
              SEGUIMIENTO_FEATURES.module,
              "ver_dashboard_actividad_equipo",
            ],
          },
        },
        {
          path: "catalogo",
          name: "Catalogo",
          component: () => import("@/views/CatalogoView.vue"),
          meta: { requiredFeature: "module_catalog" },
        },
        {
          path: "engrase/catalogo",
          name: "CatalogoEngrase",
          component: () =>
            import("@/views/engrase/catalogo/CatalogoEngraseView.vue"),
          redirect: { name: "CatalogoEngraseTiposFiltro" },
          meta: {
            requiredFeatures: ["module_engrase", "ver_catalogo_engrase"],
          },
          children: [
            {
              path: "tipos-filtro",
              name: "CatalogoEngraseTiposFiltro",
              component: EmptyRouteComponent,
            },
            {
              path: "filtros",
              name: "CatalogoEngraseFiltros",
              component: EmptyRouteComponent,
            },
            {
              path: "aceites",
              name: "CatalogoEngraseAceites",
              component: EmptyRouteComponent,
            },
            {
              path: "sistemas",
              name: "CatalogoEngraseSistemas",
              component: EmptyRouteComponent,
            },
          ],
        },
        {
          path: "engrase/filtros/catalogo",
          name: "CatalogoEngraseLegacy",
          redirect: { name: "CatalogoEngraseTiposFiltro" },
          children: [
            {
              path: "tipos-filtro",
              redirect: { name: "CatalogoEngraseTiposFiltro" },
            },
            {
              path: "filtros",
              redirect: { name: "CatalogoEngraseFiltros" },
            },
            {
              path: "aceites",
              redirect: { name: "CatalogoEngraseAceites" },
            },
            {
              path: "sistemas",
              redirect: { name: "CatalogoEngraseSistemas" },
            },
          ],
        },
        {
          path: "engrase/filtros/equipos/crear",
          name: "EquipoEngraseCrear",
          component: () => import("@/views/engrase/EquipoEngraseCrearView.vue"),
          meta: {
            requiredFeatures: [
              "module_engrase",
              "ver_filtros_engrase",
              "editar_filtros_engrase",
            ],
            layout: "fullscreen",
          },
        },
        {
          path: "engrase/filtros/equipos/:codigo/editar",
          name: "EquipoEngraseEditar",
          component: () =>
            import("@/views/engrase/EquipoEngraseEditarView.vue"),
          meta: {
            requiredFeatures: [
              "module_engrase",
              "ver_filtros_engrase",
              "editar_filtros_engrase",
            ],
            layout: "fullscreen",
          },
        },
        {
          path: "engrase/filtros",
          name: "FiltrosEngrase",
          component: () => import("@/views/engrase/FiltrosEngraseView.vue"),
          meta: { requiredFeatures: ["module_engrase", "ver_filtros_engrase"] },
        },
        {
          path: "panel-admin",
          name: "PanelAdmin",
          component: () => import("@/views/PanelAdminView.vue"),
          meta: { requiredFeature: "panel_admin" },
        },
        {
          path: "perfil",
          name: "Profile",
          component: () => import("@/views/ProfileView.vue"),
          meta: { requiredFeature: "ver_datos_perfil" },
        },
      ],
    },
  ],
});

// Navigation guard for Supabase auth and feature-based module access.
router.beforeEach(async (to) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  if (to.name !== "Login" && !isAuthenticated) {
    return { name: "Login" };
  }

  if (to.name === "Login" && isAuthenticated) {
    return { name: "HomeRedirect" };
  }

  if (!isAuthenticated) {
    return true;
  }

  const featureAccessStore = useFeatureAccessStore();

  try {
    await featureAccessStore.cargarFuncionalidadesPermitidas();
  } catch {
    return to.name === "Profile" ? true : { name: "Profile" };
  }

  const firstAllowedModule = moduleHomeRoutes.find((route) => {
    const hasRequiredFeatures = (route.requiredFeatures ?? []).every(
      (feature) => featureAccessStore.tieneFuncionalidad(feature),
    );
    const requiredAnyFeatures = route.requiredAnyFeatures ?? [];
    const hasAnyRequiredFeature =
      requiredAnyFeatures.length === 0 ||
      requiredAnyFeatures.some((feature) =>
        featureAccessStore.tieneFuncionalidad(feature),
      );

    return hasRequiredFeatures && hasAnyRequiredFeature;
  });

  if (to.name === "HomeRedirect") {
    return firstAllowedModule?.path ?? { name: "Profile" };
  }

  const requiredFeatures = getRequiredFeatures(to);
  const requiredAnyFeatures = getRequiredAnyFeatures(to);
  const hasAccess =
    requiredFeatures.every((feature) =>
      featureAccessStore.tieneFuncionalidad(feature),
    ) &&
    (requiredAnyFeatures.length === 0 ||
      requiredAnyFeatures.some((feature) =>
        featureAccessStore.tieneFuncionalidad(feature),
      ));

  if (!hasAccess) {
    return firstAllowedModule?.path ?? { name: "Profile" };
  }

  return true;
});

export default router;
