import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/clients',
      name: 'clients',
      component: () => import('../views/ClientsView.vue'),
    },
    {
      path: '/clients/:id',
      name: 'client-detail',
      component: () => import('../views/ClientDetailView.vue'),
    },
    {
      path: '/invoices',
      name: 'invoices',
      component: () => import('../views/InvoicesView.vue'),
    },
    {
      path: '/invoices/new',
      name: 'invoice-create',
      component: () => import('../views/InvoiceCreateView.vue'),
    },
    {
      path: '/invoices/:id',
      name: 'invoice-detail',
      component: () => import('../views/InvoiceDetailView.vue'),
    },
    {
      path: '/invoices/:id/edit',
      name: 'invoice-edit',
      component: () => import('../views/InvoiceEditView.vue'),
    },
    {
      path: '/payments',
      name: 'payments',
      component: () => import('../views/PaymentsView.vue'),
    },
    {
      path: '/statements/:clientId',
      name: 'statement',
      component: () => import('../views/StatementView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const isAuthenticated = sessionStorage.getItem('authenticated') === 'true'

  if (!to.meta.public && !isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
