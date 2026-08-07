import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import './types'

const router = createRouter({
  history: createWebHistory(),
  // Sem isto o navegador mantém a rolagem ao trocar de tela, e a aba nova
  // abria no meio da página — passa a incomodar de verdade agora que a troca
  // é animada, porque a tela entra deslizando já rolada. `savedPosition`
  // preserva o comportamento esperado do voltar/avançar.
  scrollBehavior(_para, _de, posicaoSalva) {
    return posicaoSalva ?? { top: 0 }
  },
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
    { path: '/perfil', name: 'perfil', component: () => import('@/views/PerfilView.vue') },
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
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { admin: true },
      children: [
        { path: '', redirect: { name: 'admin-usuarios' } },
        { path: 'usuarios', name: 'admin-usuarios', component: () => import('@/views/admin/AdminUsuariosView.vue') },
        { path: 'clientes', name: 'admin-clientes', component: () => import('@/views/admin/AdminClientesView.vue') },
        { path: 'indicacoes', name: 'admin-indicacoes', component: () => import('@/views/admin/AdminIndicacoesView.vue') },
        { path: 'programacao', name: 'admin-programacao', component: () => import('@/views/admin/AdminProgramacaoView.vue') },
        { path: 'produtos', name: 'admin-produtos', component: () => import('@/views/admin/AdminCategoriasView.vue') },
        {
          path: 'produtos/categorias/:categoriaId',
          name: 'admin-produtos-categoria',
          component: () => import('@/views/admin/AdminCategoriaView.vue'),
        },
        { path: 'produtos/grupos/:grupoId', name: 'admin-produtos-grupo', component: () => import('@/views/admin/AdminGrupoView.vue') },
        { path: 'produtos/tipos/:tipoId', name: 'admin-produtos-tipo', component: () => import('@/views/admin/AdminTipoView.vue') },
        { path: 'orientacoes', name: 'admin-orientacoes', component: () => import('@/views/admin/AdminOrientacoesView.vue') },
        { path: 'leads', name: 'admin-leads', component: () => import('@/views/admin/AdminLeadsView.vue') },
        { path: 'importar', name: 'admin-importar', component: () => import('@/views/admin/AdminImportacaoView.vue') },
      ],
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

  if (to.meta.admin && !auth.usuario?.isAdmin) {
    return { name: 'home' }
  }

  return true
})

export default router
