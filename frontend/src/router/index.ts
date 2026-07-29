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
    {
      path: '/representantes/resultados',
      name: 'representantes-lista',
      component: () => import('@/views/RepresentantesListView.vue'),
    },
    {
      path: '/representantes/:id',
      name: 'representante-detalhe',
      component: () => import('@/views/RepresentanteDetailView.vue'),
    },
    { path: '/clientes', name: 'clientes', component: () => import('@/views/ClientesView.vue') },
    {
      path: '/clientes/resultados',
      name: 'clientes-lista',
      component: () => import('@/views/ClientesListView.vue'),
    },
    {
      path: '/clientes/:id',
      name: 'cliente-detalhe',
      component: () => import('@/views/ClienteDetailView.vue'),
    },
    { path: '/leads', name: 'leads', component: () => import('@/views/LeadsView.vue') },
    {
      path: '/leads/cadastrados',
      name: 'leads-lista',
      component: () => import('@/views/LeadsListView.vue'),
    },
    { path: '/produtos', name: 'produtos', component: () => import('@/views/ProdutosView.vue') },
    {
      path: '/produtos/categorias',
      name: 'produtos-categorias',
      component: () => import('@/views/ProdutosCategoriasView.vue'),
    },
    {
      path: '/produtos/categorias/:id',
      name: 'categoria-detalhe',
      component: () => import('@/views/CategoriaDetailView.vue'),
    },
    {
      path: '/produtos/grupos/:id',
      name: 'grupo-detalhe',
      component: () => import('@/views/GrupoDetailView.vue'),
    },
    {
      path: '/produtos/tipos/:id',
      name: 'tipo-detalhe',
      component: () => import('@/views/TipoDetailView.vue'),
    },
    {
      path: '/produtos/item/:id',
      name: 'produto-detalhe',
      component: () => import('@/views/ProdutoDetailView.vue'),
    },
    { path: '/programacao', name: 'programacao', component: () => import('@/views/ProgramacaoView.vue') },
    { path: '/mapa', name: 'mapa', component: () => import('@/views/MapaView.vue') },
    { path: '/indicacoes', name: 'indicacoes', component: () => import('@/views/IndicacoesView.vue') },
    {
      path: '/indicacoes/restaurantes',
      name: 'indicacoes-restaurantes',
      component: () => import('@/views/RestaurantesListView.vue'),
    },
    {
      path: '/indicacoes/restaurantes/:id',
      name: 'restaurante-detalhe',
      component: () => import('@/views/RestauranteDetailView.vue'),
    },
    { path: '/orientacoes', name: 'orientacoes', component: () => import('@/views/OrientacoesView.vue') },
    {
      path: '/orientacoes/:id',
      name: 'orientacao-detalhe',
      component: () => import('@/views/OrientacaoDetailView.vue'),
    },
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
