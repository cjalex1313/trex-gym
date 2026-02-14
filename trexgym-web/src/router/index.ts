import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/layouts/AppLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import SettingsView from '@/views/SettingsView.vue'
import ClientsListView from '@/views/clients/ClientsListView.vue'
import ClientDetailView from '@/views/clients/ClientDetailView.vue'
import ClientFormView from '@/views/clients/ClientFormView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'clients',
          name: 'clients-list',
          component: ClientsListView,
        },
        {
          path: 'clients/new',
          name: 'clients-create',
          component: ClientFormView,
        },
        {
          path: 'clients/:id',
          name: 'clients-detail',
          component: ClientDetailView,
        },
        {
          path: 'clients/:id/edit',
          name: 'clients-edit',
          component: ClientFormView,
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsView,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  authStore.hydrate()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'clients-list' }
  }

  return true
})

export default router
