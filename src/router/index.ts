import { createRouter, createWebHashHistory } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useFeatureAccessStore } from '@/stores/db_mantenimiento/app_feature_access/featureAccess.store';

const EmptyRouteComponent = { template: '<div></div>' };

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/',
      name: 'DefaultLayout',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        {
          path: '',
          name: 'HomeRedirect',
          component: { template: '<div></div>' } // Empty component because Layout redirects
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'calificaciones',
          name: 'SupervisorRatings',
          component: () => import('@/views/SupervisorRatingsView.vue'),
        },
        {
          path: 'reparaciones',
          name: 'RepairHistory',
          component: () => import('@/views/RepairHistoryView.vue'),
        },
        {
          path: 'mantenimiento',
          name: 'MaintenancePlan',
          component: () => import('@/views/MaintenancePlanView.vue'),
        },
        {
          path: 'compras',
          name: 'Compras',
          component: () => import('@/views/compras/SolicitudesCompraView.vue'),
          children: [
            {
              path: 'nueva',
              name: 'SolicitudCompraCrear',
              component: () => import('@/views/compras/SolicitudCompraCrearView.vue'),
              meta: {
                requiredFeature: 'crear_solicitud_compra',
              },
            },
          ],
        },
        {
          path: 'catalogo',
          name: 'Catalogo',
          component: () => import('@/views/CatalogoView.vue'),
        },
        {
          path: 'panel-admin',
          name: 'PanelAdmin',
          component: () => import('@/views/PanelAdminView.vue'),
        },
        {
          path: 'perfil',
          name: 'Profile',
          component: () => import('@/views/ProfileView.vue'),
        },
      ],
    },
  ],
});

// Navigation guard for Supabase auth
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;
  const requiredFeature = typeof to.meta.requiredFeature === 'string'
    ? to.meta.requiredFeature
    : null;
  
  if (to.name !== 'Login' && !isAuthenticated) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && isAuthenticated) {
    next({ path: '/' });
  } else if (requiredFeature) {
    const featureAccessStore = useFeatureAccessStore();

    try {
      await featureAccessStore.cargarFuncionalidadesPermitidas();
    } catch (error) {
      next({ name: 'Compras' });
      return;
    }

    if (!featureAccessStore.tieneFuncionalidad(requiredFeature)) {
      next({ name: 'Compras' });
      return;
    }

    next();
  } else {
    next();
  }
});

export default router;
