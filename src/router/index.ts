import { createRouter, createWebHashHistory } from 'vue-router';
import { supabase } from '@/lib/supabase';

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
  
  if (to.name !== 'Login' && !isAuthenticated) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && isAuthenticated) {
    next({ path: '/' });
  } else {
    next();
  }
});

export default router;
