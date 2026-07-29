import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import './types'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { semNav: true, publica: true },
    },
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    {
      path: '/representantes',
      name: 'representantes',
      component: () => import('@/views/RepresentantesView.vue'),
    },
    { path: '/clientes', name: 'clientes', component: () => import('@/views/ClientesView.vue') },
    { path: '/leads', name: 'leads', component: () => import('@/views/LeadsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Every screen requires a logged-in session (see docs/SPECS.md's Login
// section) — /login is the one public route. The session check only runs
// once per app load (restaurarSessao flips `carregando` to false), not on
// every navigation.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.carregando) {
    await auth.restaurarSessao()
  }

  if (!to.meta.publica && !auth.logado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && auth.logado) {
    return { name: 'home' }
  }

  return true
})

export default router
